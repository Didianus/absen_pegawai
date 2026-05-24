#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS="--max-old-space-size=256 --expose-gc" node node_modules/.bin/next start -p 3000 2>/dev/null
  sleep 1
done
