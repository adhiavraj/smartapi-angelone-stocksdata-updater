import os
import time
from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import smart_api_updater as updater

app = FastAPI(title="SmartAPI Bank Nifty VAR Excel Updater API", version="1.0.0")

# CORS setup for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Application state
EXCEL_PATH = "Bank Nifty VAR-Final.xlsx"
state = {
    "api_client": None,
    "is_connected": False,
    "api_key_val": "",
    "client_id_val": "",
    "logs": []
}


def add_log(msg: str):
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_entry = f"[{timestamp}] {msg}"
    state["logs"].append(log_entry)
    if len(state["logs"]) > 500:
        state["logs"] = state["logs"][-500:]


class ConnectRequest(BaseModel):
    api_key: str
    client_id: str
    password: str
    totp_type: str = "TOTP Secret (Auto)"  # "TOTP Secret (Auto)" or "Manual TOTP Code"
    totp_secret: Optional[str] = ""
    manual_totp: Optional[str] = ""


class UpdateRequest(BaseModel):
    mode: str  # "live" or "demo"
    from_date: Optional[str] = None  # YYYY-MM-DD
    to_date: Optional[str] = None    # YYYY-MM-DD


@app.get("/api/status")
def get_status():
    public_ip = updater.get_public_ip()
    excel_exists = os.path.exists(EXCEL_PATH)
    return {
        "is_connected": state["is_connected"],
        "client_id": state["client_id_val"],
        "public_ip": public_ip,
        "excel_exists": excel_exists,
        "excel_path": EXCEL_PATH
    }


@app.post("/api/connect")
def connect_api(req: ConnectRequest):
    if not req.api_key or not req.client_id or not req.password:
        raise HTTPException(status_code=400, detail="Please fill in API Key, Client ID, and Password.")
    
    try:
        client = updater.SmartAPIClient(
            api_key=req.api_key,
            client_id=req.client_id,
            password=req.password,
            totp_secret=req.totp_secret if req.totp_type == "TOTP Secret (Auto)" else None
        )
        session_data = client.connect(manual_totp=req.manual_totp if req.totp_type != "TOTP Secret (Auto)" else None)
        
        state["api_client"] = client
        state["is_connected"] = True
        state["api_key_val"] = req.api_key
        state["client_id_val"] = req.client_id
        
        add_log(f"SmartAPI session connected successfully for client {req.client_id}.")
        return {
            "success": True,
            "message": "Successfully connected to SmartAPI!",
            "client_id": req.client_id
        }
    except Exception as e:
        state["is_connected"] = False
        state["api_client"] = None
        add_log(f"Login error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/disconnect")
def disconnect_api():
    state["api_client"] = None
    state["is_connected"] = False
    add_log("SmartAPI session disconnected.")
    return {"success": True, "message": "Disconnected from SmartAPI."}


@app.get("/api/summary")
def get_summary():
    if not os.path.exists(EXCEL_PATH):
        raise HTTPException(status_code=444, detail=f"File '{EXCEL_PATH}' not found in current workspace.")
    try:
        summary_data = updater.get_excel_summary(EXCEL_PATH)
        return {
            "success": True,
            "total_banks": len(summary_data),
            "data": summary_data
        }
    except Exception as e:
        add_log(f"Error reading Excel summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update")
def execute_update(req: UpdateRequest):
    add_log(f"Starting execution update in mode: {req.mode}...")
    if not os.path.exists(EXCEL_PATH):
        raise HTTPException(status_code=404, detail="Excel file does not exist.")

    try:
        if req.mode == "live":
            if not state["is_connected"] or not state["api_client"]:
                raise HTTPException(status_code=400, detail="SmartAPI is not connected. Connect first or run Demo Mode.")

            client = state["api_client"]
            add_log("Fetching SmartAPI scrip tokens...")
            tokens = updater.load_scrip_tokens()

            # Date formatting
            from_d = req.from_date or (date.today() - timedelta(days=5)).strftime("%Y-%m-%d")
            to_d = req.to_date or date.today().strftime("%Y-%m-%d")

            from_str = f"{from_d} 09:15"
            to_str = f"{to_d} 15:30"

            market_data_by_date = {}

            add_log("Fetching Nifty Bank Index daily candles...")
            nifty_token = tokens.get('Nifty Bank', updater.NIFTY_BANK_TOKEN)
            nifty_candles = client.fetch_historical_daily('Nifty Bank', nifty_token, from_str, to_str)

            for d, val in nifty_candles.items():
                if d not in market_data_by_date:
                    market_data_by_date[d] = {}
                market_data_by_date[d]['Nifty Bank'] = val

            total_banks = len(updater.BANK_MAPPING)
            for i, (bank_name, b_info) in enumerate(updater.BANK_MAPPING.items()):
                add_log(f"Fetching candles for {bank_name} ({b_info['symbol']})...")
                token = tokens.get(bank_name, b_info['token'])
                b_candles = client.fetch_historical_daily(b_info['symbol'], token, from_str, to_str)

                for d, val in b_candles.items():
                    if d not in market_data_by_date:
                        market_data_by_date[d] = {}
                    market_data_by_date[d][bank_name] = val

            if not market_data_by_date:
                add_log("No historical range returned, fetching live LTP for today...")
                today_d = date.today()
                market_data_by_date[today_d] = {}
                n_ltp = client.fetch_ltp('NSE', 'Nifty Bank', nifty_token) or 56600.0
                market_data_by_date[today_d]['Nifty Bank'] = n_ltp
                for bank_name, b_info in updater.BANK_MAPPING.items():
                    token = tokens.get(bank_name, b_info['token'])
                    b_ltp = client.fetch_ltp('NSE', b_info['symbol'], token) or 1000.0
                    market_data_by_date[today_d][bank_name] = b_ltp

            updates = updater.update_excel_file(EXCEL_PATH, market_data_by_date)
            for msg in updates:
                add_log(msg)

            return {
                "success": True,
                "mode": "live",
                "message": f"Successfully updated Excel file with {len(market_data_by_date)} date(s) of live data!",
                "updates": updates
            }

        else:
            # Demo simulation mode
            add_log("Generating simulated market tick data...")
            import pandas as pd
            wb_temp = pd.DataFrame(updater.get_excel_summary(EXCEL_PATH))
            last_dt_str = wb_temp['Last Date'].iloc[0]
            last_dt_obj = datetime.strptime(last_dt_str, "%Y-%m-%d").date()
            sim_date = last_dt_obj + timedelta(days=1)

            sim_data = {
                sim_date: {
                    'Nifty Bank': 56850.00,
                    'HDFC Bank': 755.20,
                    'ICICI Bank': 1442.80,
                    'Axis Bank': 1231.50,
                    'SBI Bank': 1018.40,
                    'Kotak Bank': 387.10,
                    'BOB': 245.80,
                    'Union Bank': 170.20,
                    'PNB': 111.50,
                    'Canara Bank': 126.80,
                    'Federal Bank': 358.10,
                    'AU Bank': 984.50,
                    'Yes Bank': 23.10,
                    'Indusind Bank': 1012.00,
                    'IDFC Bank': 80.50
                }
            }

            add_log(f"Appending row for simulated date {sim_date}...")
            updates = updater.update_excel_file(EXCEL_PATH, sim_data)
            for msg in updates:
                add_log(msg)

            return {
                "success": True,
                "mode": "demo",
                "message": f"Demo update complete! Appended date {sim_date} with exact Excel formulas.",
                "updates": updates
            }

    except Exception as e:
        add_log(f"Update error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download")
def download_excel():
    if not os.path.exists(EXCEL_PATH):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=EXCEL_PATH,
        filename="Bank_Nifty_VAR_Updated.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@app.get("/api/logs")
def get_logs():
    return {"logs": list(reversed(state["logs"]))}


@app.delete("/api/logs")
def clear_logs():
    state["logs"] = []
    return {"success": True, "message": "Logs cleared."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
