#!/bin/bash
# Self-healing Next.js daemon
LOCKFILE=/tmp/next-server.lock
PIDFILE=/tmp/next-server.pid

cd /home/z/my-project

cleanup() {
    rm -f "$LOCKFILE"
    exit 0
}
trap cleanup SIGTERM SIGINT SIGHUP

while true; do
    # Check if port 3000 is in use
    if ! ss -tlnp 2>/dev/null | grep -q ":3000 "; then
        echo "[$(date)] Starting Next.js server..." >> /tmp/next-daemon-status.log
        NODE_OPTIONS="--max-old-space-size=256" node .next/standalone/server.js >> /tmp/next-server.log 2>&1 &
        SERVER_PID=$!
        echo $SERVER_PID > "$PIDFILE"
        echo "[$(date)] Server started with PID $SERVER_PID" >> /tmp/next-daemon-status.log
    fi
    sleep 5
done
