#!/bin/bash
# Double-fork to completely detach from parent session
(
  cd /home/z/my-project
  exec npx next dev -p 3000 > /home/z/my-project/dev.log 2>&1
) &
