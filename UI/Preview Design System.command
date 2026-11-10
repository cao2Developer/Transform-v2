#!/bin/zsh
set -euo pipefail

UI_DIR="$(cd "$(dirname "$0")" && pwd)"
STORYBOOK_BIN="$UI_DIR/node_modules/.bin/storybook"
LISTENER_PID="$(/usr/sbin/lsof -tiTCP:6007 -sTCP:LISTEN 2>/dev/null | /usr/bin/head -n 1 || true)"

if [[ ! -x "$STORYBOOK_BIN" ]]; then
    print -u2 "Storybook is not installed. Run 'npm install' from: $UI_DIR"
    exit 1
fi

if [[ -n "$LISTENER_PID" ]]; then
    LISTENER_COMMAND="$(ps -p "$LISTENER_PID" -o command= || true)"
    if [[ "$LISTENER_COMMAND" == *"storybook dev -c .storybook-ds"* ]]; then
        print "Design-system Storybook is already running. Opening http://localhost:6007"
        open "http://localhost:6007"
        exit 0
    fi

    print -u2 "Port 6007 is in use by PID $LISTENER_PID: $LISTENER_COMMAND"
    exit 1
fi

cd "$UI_DIR"
exec "$STORYBOOK_BIN" dev -c .storybook-ds -p 6007 --host localhost