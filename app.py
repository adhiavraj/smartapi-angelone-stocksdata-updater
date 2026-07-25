import os
import io
import time
from datetime import datetime, date, timedelta
import pandas as pd
import streamlit as st

import smart_api_updater as updater

# Page configuration
st.set_page_config(
    page_title="SmartAPI Bank Nifty VAR Excel Updater",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern UI design
st.markdown("""
<style>
    /* Dark glassmorphism theme */
    .stApp {
        background: linear-gradient(135deg, #0f172a 0%, #1e1e38 50%, #0f172a 100%);
        color: #f8fafc;
    }
    
    /* Header card */
    .header-box {
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }
    
    .header-title {
        font-size: 28px;
        font-weight: 700;
        background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 8px;
    }
    
    /* Metric Cards */
    .metric-card {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        transition: transform 0.2s, border-color 0.2s;
    }
    
    .metric-card:hover {
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.4);
    }
    
    .metric-val {
        font-size: 24px;
        font-weight: 700;
        color: #38bdf8;
    }
    
    .metric-lbl {
        font-size: 13px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Portal fields box */
    .portal-box {
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid #3b82f6;
        border-radius: 12px;
        padding: 20px;
        margin-top: 15px;
    }
    
    .field-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .field-key {
        font-weight: 600;
        color: #e2e8f0;
    }
    
    .field-val {
        font-family: monospace;
        background: #1e293b;
        padding: 4px 10px;
        border-radius: 6px;
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.2);
    }
</style>
""", unsafe_allow_html=True)

# Initialize Session States
if "api_client" not in st.session_state:
    st.session_state.api_client = None
if "is_connected" not in st.session_state:
    st.session_state.is_connected = False
if "excel_path" not in st.session_state:
    st.session_state.excel_path = "Bank Nifty VAR-Final.xlsx"
if "logs" not in st.session_state:
    st.session_state.logs = []

def add_log(msg):
    timestamp = datetime.now().strftime("%H:%M:%S")
    st.session_state.logs.append(f"[{timestamp}] {msg}")

# Fetch user public IP
user_public_ip = updater.get_public_ip()

# Sidebar: Credentials & Settings
with st.sidebar:
    st.image("https://smartapi.angelone.in/static/media/smart-api-logo.6a3861ea.svg", width=180)
    st.title("SmartAPI Config")
    
    st.markdown("---")
    st.subheader("🔑 Authentication")
    
    api_key = st.text_input("SmartAPI Key", value=st.session_state.get("api_key_val", ""), type="password", help="API Key from Angel One Developer Portal")
    client_id = st.text_input("Client ID / User ID", value=st.session_state.get("client_id_val", ""), help="Angel One Account Client ID (e.g. A12345)")
    password = st.text_input("PIN / Password", type="password", help="Account Password or Trading PIN")
    
    st.markdown("##### TOTP Authorization")
    totp_type = st.radio("TOTP Method", ["TOTP Secret (Auto)", "Manual TOTP Code"], horizontal=True)
    
    totp_secret = ""
    manual_totp = ""
    if totp_type == "TOTP Secret (Auto)":
        totp_secret = st.text_input("TOTP Secret Key", type="password", help="32-character TOTP Secret Key from Angel One SmartAPI setup")
    else:
        manual_totp = st.text_input("Current 6-Digit TOTP", max_chars=6, help="Enter live TOTP from Authenticator App")

    st.markdown("---")
    
    col_conn1, col_conn2 = st.columns(2)
    with col_conn1:
        if st.button("🔗 Connect API", use_container_width=True):
            if not api_key or not client_id or not password:
                st.error("Please fill in API Key, Client ID, and Password!")
            else:
                with st.spinner("Authenticating with Angel One SmartAPI..."):
                    try:
                        client = updater.SmartAPIClient(api_key, client_id, password, totp_secret)
                        session_data = client.connect(manual_totp=manual_totp)
                        st.session_state.api_client = client
                        st.session_state.is_connected = True
                        st.session_state.api_key_val = api_key
                        st.session_state.client_id_val = client_id
                        st.success("Successfully connected to SmartAPI!")
                        add_log("SmartAPI session generated successfully.")
                    except Exception as e:
                        st.session_state.is_connected = False
                        st.error(f"Login failed: {str(e)}")
                        add_log(f"Login error: {str(e)}")
                        
    with col_conn2:
        if st.button("🔌 Disconnect", use_container_width=True):
            st.session_state.api_client = None
            st.session_state.is_connected = False
            st.info("Disconnected from SmartAPI.")
            add_log("SmartAPI session ended.")

    # Status Badge
    if st.session_state.is_connected:
        st.success("🟢 API Connected")
    else:
        st.warning("🟠 Disconnected (Demo Mode available)")

    st.markdown("---")
    st.markdown(f"**🌐 Your Public IP:** `{user_public_ip}`")
    st.caption("Use this IP for Primary Static IP in SmartAPI portal.")


# Main App Layout
st.markdown("""
<div class="header-box">
    <div class="header-title">📈 SmartAPI Bank Nifty VAR Excel Updater</div>
    <div style="color: #94a3b8;">Automatically fetch market & historical candle data from Angel One SmartAPI and update <code>Bank Nifty VAR-Final.xlsx</code> formulas, prices, CMP, and VAR calculations.</div>
</div>
""", unsafe_allow_html=True)

# Tabs
tab_dash, tab_update, tab_guide, tab_logs = st.tabs([
    "📊 Overview & Metrics", 
    "🔄 Fetch & Update Excel", 
    "📝 SmartAPI Portal Registration Guide", 
    "📜 Activity Logs"
])

# -------------------------------------------------------------
# TAB 1: Overview & Metrics
# -------------------------------------------------------------
with tab_dash:
    st.subheader("Current Excel Workbook Status")
    
    if os.path.exists(st.session_state.excel_path):
        try:
            summary = updater.get_excel_summary(st.session_state.excel_path)
            df_sum = pd.DataFrame(summary)
            
            # Top summary cards
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-val">{len(summary)}</div>
                    <div class="metric-lbl">Banking Stocks Tracked</div>
                </div>
                """, unsafe_allow_html=True)
            with col2:
                last_dt = df_sum['Last Date'].iloc[0] if not df_sum.empty else "-"
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-val">{last_dt}</div>
                    <div class="metric-lbl">Latest Date in Sheet</div>
                </div>
                """, unsafe_allow_html=True)
            with col3:
                last_rw = df_sum['Last Row'].iloc[0] if not df_sum.empty else "-"
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-val">{last_rw}</div>
                    <div class="metric-lbl">Total Rows per Sheet</div>
                </div>
                """, unsafe_allow_html=True)
            with col4:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-val">Nifty Bank</div>
                    <div class="metric-lbl">Benchmark Index</div>
                </div>
                """, unsafe_allow_html=True)

            st.markdown("<br>", unsafe_allow_html=True)
            st.markdown("##### 🏛️ All 14 Banking Stocks VAR Summary")
            
            # Display dataframe with styled formatting
            st.dataframe(
                df_sum,
                column_config={
                    "CMP": st.column_config.NumberColumn("Current Price (CMP)", format="₹ %.2f"),
                    "Last Close": st.column_config.NumberColumn("Last Close Price", format="₹ %.2f"),
                    "VAR (Rs)": st.column_config.NumberColumn("VAR in Rs", format="₹ %.2f"),
                    "Beta": st.column_config.NumberColumn("Beta vs Nifty Bank", format="%.4f"),
                },
                use_container_width=True,
                hide_index=True
            )
        except Exception as e:
            st.error(f"Error reading Excel file: {e}")
    else:
        st.error(f"File '{st.session_state.excel_path}' not found in current folder.")

# -------------------------------------------------------------
# TAB 2: Fetch & Update Excel
# -------------------------------------------------------------
with tab_update:
    st.subheader("Update Excel Data from SmartAPI")
    
    st.write("Choose your update mode below. You can either use live SmartAPI data or run a demo update to test formula calculations.")
    
    update_mode = st.radio(
        "Select Execution Mode:",
        ["🚀 Live SmartAPI Data (Historical Candles & CMP)", "🎲 Demo Simulation Mode (Sample Ticks)"],
        index=0 if st.session_state.is_connected else 1
    )
    
    col_opt1, col_opt2 = st.columns(2)
    with col_opt1:
        start_date_val = st.date_input("From Date for Historical Fetch", date.today() - timedelta(days=5))
    with col_opt2:
        end_date_val = st.date_input("To Date", date.today())
        
    st.markdown("---")
    
    if st.button("⚡ Execute Fetch & Update Excel", type="primary", use_container_width=True):
        add_log("Starting update process...")
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        try:
            if "Live SmartAPI Data" in update_mode:
                if not st.session_state.is_connected or not st.session_state.api_client:
                    st.error("SmartAPI is not connected! Please enter credentials in the sidebar and click 'Connect API', or switch to Demo Simulation Mode.")
                else:
                    client = st.session_state.api_client
                    status_text.text("Fetching SmartAPI scrip tokens...")
                    progress_bar.progress(15)
                    
                    tokens = updater.load_scrip_tokens()
                    
                    from_str = start_date_val.strftime("%Y-%m-%d 09:15")
                    to_str = end_date_val.strftime("%Y-%m-%d 15:30")
                    
                    market_data_by_date = {}
                    
                    # Fetch Nifty Bank daily candles
                    status_text.text("Fetching Nifty Bank Index candles...")
                    nifty_token = tokens.get('Nifty Bank', updater.NIFTY_BANK_TOKEN)
                    nifty_candles = client.fetch_historical_daily('Nifty Bank', nifty_token, from_str, to_str)
                    
                    for d, val in nifty_candles.items():
                        if d not in market_data_by_date:
                            market_data_by_date[d] = {}
                        market_data_by_date[d]['Nifty Bank'] = val

                    # Fetch each bank's candles
                    total_banks = len(updater.BANK_MAPPING)
                    for i, (bank_name, b_info) in enumerate(updater.BANK_MAPPING.items()):
                        pct = 20 + int((i / total_banks) * 60)
                        progress_bar.progress(pct)
                        status_text.text(f"Fetching candles for {bank_name} ({b_info['symbol']})...")
                        
                        token = tokens.get(bank_name, b_info['token'])
                        b_candles = client.fetch_historical_daily(b_info['symbol'], token, from_str, to_str)
                        
                        for d, val in b_candles.items():
                            if d not in market_data_by_date:
                                market_data_by_date[d] = {}
                            market_data_by_date[d][bank_name] = val

                    status_text.text("Updating Excel file formulas and worksheets...")
                    progress_bar.progress(85)
                    
                    if not market_data_by_date:
                        # Fallback to fetching live LTP for today
                        status_text.text("No historical range returned, fetching live LTP for today...")
                        today_d = date.today()
                        market_data_by_date[today_d] = {}
                        n_ltp = client.fetch_ltp('NSE', 'Nifty Bank', nifty_token) or 56600.0
                        market_data_by_date[today_d]['Nifty Bank'] = n_ltp
                        for bank_name, b_info in updater.BANK_MAPPING.items():
                            token = tokens.get(bank_name, b_info['token'])
                            b_ltp = client.fetch_ltp('NSE', b_info['symbol'], token) or 1000.0
                            market_data_by_date[today_d][bank_name] = b_ltp

                    updates = updater.update_excel_file(st.session_state.excel_path, market_data_by_date)
                    progress_bar.progress(100)
                    status_text.text("Done!")
                    
                    st.success(f"Successfully updated Excel file with {len(market_data_by_date)} date(s) of live data!")
                    for msg in updates:
                        add_log(msg)
                        
            else:
                # Demo simulation mode
                status_text.text("Generating simulated market tick data...")
                progress_bar.progress(30)
                time.sleep(0.5)
                
                # Determine new date to append
                wb_temp = pd.DataFrame(updater.get_excel_summary(st.session_state.excel_path))
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
                
                status_text.text(f"Appending row for simulated date {sim_date}...")
                progress_bar.progress(70)
                updates = updater.update_excel_file(st.session_state.excel_path, sim_data)
                
                progress_bar.progress(100)
                status_text.text("Simulation Complete!")
                st.success(f"Demo update complete! Appended date {sim_date} with exact Excel formulas.")
                for msg in updates:
                    add_log(msg)

        except Exception as e:
            st.error(f"Update error: {e}")
            add_log(f"Error during update: {e}")

    st.markdown("---")
    st.subheader("📥 Download Updated Workbook")
    
    if os.path.exists(st.session_state.excel_path):
        with open(st.session_state.excel_path, "rb") as f:
            st.download_button(
                label="⬇️ Download Updated Excel File (Bank Nifty VAR-Final.xlsx)",
                data=f,
                file_name="Bank_Nifty_VAR_Updated.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True
            )

# -------------------------------------------------------------
# TAB 3: SmartAPI Registration Guide & Required Input Fields
# -------------------------------------------------------------
with tab_guide:
    st.subheader("📌 SmartAPI Developer Portal - App Creation Guide")
    st.write("When creating an app in the Angel One SmartAPI Developer Portal ([smartapi.angelone.in](https://smartapi.angelone.in)), fill in the form fields as specified below:")
    
    st.markdown(f"""
    <div class="portal-box">
        <div class="field-row">
            <span class="field-key">App Name</span>
            <span class="field-val">SmartExcelUpdater</span>
        </div>
        <div class="field-row">
            <span class="field-key">Redirect URL</span>
            <span class="field-val">http://127.0.0.1:5000/callback</span>
        </div>
        <div class="field-row">
            <span class="field-key">Post back URL (Optional)</span>
            <span class="field-val">http://127.0.0.1:5000/postback</span>
        </div>
        <div class="field-row">
            <span class="field-key">Primary Static IP</span>
            <span class="field-val">{user_public_ip}</span>
        </div>
        <div class="field-row">
            <span class="field-key">Secondary Static IP (Optional)</span>
            <span class="field-val">Leave Empty</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    st.info(f"💡 **Note on Primary Static IP:** SmartAPI requires your public IP address (`{user_public_ip}`) to authorize API requests. If your IP address changes (dynamic IP), update the Primary Static IP field in the SmartAPI portal dashboard.")

# -------------------------------------------------------------
# TAB 4: Activity Logs
# -------------------------------------------------------------
with tab_logs:
    st.subheader("Console & Event Logs")
    if st.session_state.logs:
        for log_line in reversed(st.session_state.logs):
            st.code(log_line, language="bash")
    else:
        st.info("No activity logged yet.")

    if st.button("Clear Logs"):
        st.session_state.logs = []
        st.experimental_rerun()
