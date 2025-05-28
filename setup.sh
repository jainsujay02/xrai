set -euo pipefail

RUN_DIR=".run"
LOG_DIR="$RUN_DIR/logs"
VENV_DIR="$RUN_DIR/venv"
PID_FILE="$RUN_DIR/pids"

mkdir -p "$LOG_DIR"
echo "" > "$PID_FILE"

# ---------- Python virtual-env ------------------------------------
if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

echo "· Installing / updating Python deps …"
pip install --upgrade pip > "$LOG_DIR/pip.log" 2>&1
pip install flask flask_cors pandas requests pillow openai \
            > "$LOG_DIR/pip.log" 2>&1

# ---------- Flask backend ----------------------------------------
echo "· Starting Flask backend (port 5050)"
nohup python backend/server.py \
      > "$LOG_DIR/backend.out" 2>&1 &
echo $! >> "$PID_FILE"

# ---------- triage_runner ----------------------------------------
echo "· Starting triage_runner"
nohup python backend/triage_runner.py \
      > "$LOG_DIR/triage_runner.out" 2>&1 &
echo $! >> "$PID_FILE"

# ---------- React front-ends -------------------------------------
echo "· Installing React dependencies"
( cd frontend     && npm install --silent )
( cd data_entry   && npm install --silent )

echo "· Starting React main (3000)"
nohup npm start --prefix frontend \
      > "$LOG_DIR/frontend.out" 2>&1 &
echo $! >> "$PID_FILE"

echo "· Starting React data-entry (4000)"
nohup npm start --prefix data_entry \
      > "$LOG_DIR/data_entry.out" 2>&1 &
echo $! >> "$PID_FILE"

echo "✓ All services launched."
echo "  • Flask  : port 5050  (log → $LOG_DIR/backend.out)"
echo "  • Runner : watching data_entry.csv"
echo "  • React  : http://localhost:3000"
echo "  • Form   : http://localhost:4000"
