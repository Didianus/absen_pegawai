#!/bin/bash
cd /home/z/my-project
trap 'echo "Received signal, ignoring..."' SIGTERM SIGINT SIGHUP
NODE_OPTIONS="--max-old-space-size=4096" exec node node_modules/.bin/next start -p 3000
