#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_ENV=production node .next/standalone/server.js 2>&1
  echo "[$(date)] Server died, restarting in 3s..."
  sleep 3
done
