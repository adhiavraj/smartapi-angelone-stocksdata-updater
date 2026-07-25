import subprocess
import sys
import time
import os

def main():
    print("=" * 60)
    print(" 🚀 Launching SmartAPI Bank Nifty VAR Excel Updater App")
    print(" Backend:  Python FastAPI (http://127.0.0.1:8000)")
    print(" Frontend: Next.js + Tailwind v4 + shadcn/ui (http://localhost:3000)")
    print("=" * 60)

    # Start FastAPI server
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=os.getcwd()
    )

    # Start Next.js frontend server
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    frontend_process = subprocess.Popen(
        ["npx", "next", "dev"],
        cwd=frontend_dir,
        shell=True
    )

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping application servers...")
        server_process.terminate()
        frontend_process.terminate()
        server_process.wait()
        frontend_process.wait()
        print("Application stopped cleanly.")

if __name__ == "__main__":
    main()
