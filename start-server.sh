#!/bin/bash
cd /home/z/my-project

# Kill any existing server
pkill -9 -f "next start" 2>/dev/null
sleep 2

# Start in a completely detached process
exec setsid bash -c '
  cd /home/z/my-project
  while true; do
    NODE_OPTIONS="--max-old-space-size=256" npx next start -p 3000 2>&1
    echo "Restart at $(date)" >> /tmp/next-restarts.log
    sleep 3
  done
' > /tmp/next-daemon.log 2>&1
