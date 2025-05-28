#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────
# shutdown.sh  –  stop everything started by the companion setup.sh
#  • PIDs are stored in .run/pids
#  • Each service was started in its own process-group (setsid),
#    so killing "-$pid" terminates React's child `react-scripts` too.
#  • Final sweep: kill any stragglers still on ports 3000/4000/5050
# ────────────────────────────────────────────────────────────────────
set -euo pipefail

PID_FILE=".run/pids"
PORTS=(3000 4000 5050)

echo "Shutting down services …"

# ── kill process-groups listed in PID file ──────────────────────────
if [[ -f "$PID_FILE" ]]; then
  while read -r pid; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -TERM -"$pid" 2>/dev/null || true
      echo "  • sent SIGTERM to PGID $pid"
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
else
  echo "  • No PID file found (nothing to stop?)"
fi

# ── fallback: ensure ports are free ─────────────────────────────────
for port in "${PORTS[@]}"; do
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "  • force-killing processes on port $port"
    kill -9 $pids 2>/dev/null || true
  fi
done

echo "✓ All background services stopped."
