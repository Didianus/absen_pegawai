#!/bin/bash
cd /home/z/my-project
while true; do
  npx next dev -p 3000
  echo "Server died, restarting in 2 seconds..."
  sleep 2
done
