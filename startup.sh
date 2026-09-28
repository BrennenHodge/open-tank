#!/bin/sh
set -e
cd /workspace
if ! curl -sf -o /dev/null http://127.0.0.1:8080/; then
  npm run dev > /tmp/open-tank-dev.log 2>&1 &
fi
if ! pgrep -f "cloudflared tunnel --url http://127.0.0.1:8080" >/dev/null 2>&1; then
  if [ -x /tmp/cloudflared ]; then
    /tmp/cloudflared tunnel --url http://127.0.0.1:8080 --no-autoupdate > /tmp/open-tank-tunnel.log 2>&1 &
  fi
fi
exit 0
