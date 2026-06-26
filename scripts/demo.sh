#!/bin/bash
set -e

# Neon green ANSI code
GREEN='\033[38;2;0;255;65m'
NC='\033[0m'

# Print massive Q-OS ASCII logo
echo -e "${GREEN}"
cat << "EOF"
    ██████╗         ██████╗ ███████╗
   ██╔═══██╗       ██╔═══██╗██╔════╝
   ██║   ██║ █████╗██║   ██║███████╗
   ██║▄▄ ██║ ╚════╝██║   ██║╚════██║
   ╚██████╔╝       ╚██████╔╝███████║
    ╚══▀▀═╝         ╚═════╝ ╚══════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}[SUCCESS] Q-OS Node initialized in DEMO MODE.${NC}"
echo ""
echo -e "${GREEN}Scan this payload with your Q-OS Mobile Controller App:${NC}"
echo '{"node":"127.0.0.1","port":3000,"auth":"demo_bypass","db":"in_memory"}'
echo ""
echo "[INFO] Opening Admin Command Center in your default browser..."

# Start qos-runtime in background
./bin/qos-runtime --demo-mode &
RUNTIME_PID=$!

# Wait briefly for server to bind
sleep 2

# Open browser (macOS / Linux support)
if command -v open > /dev/null; then
    open "http://127.0.0.1:3000/admin/dashboard"
elif command -v xdg-open > /dev/null; then
    xdg-open "http://127.0.0.1:3000/admin/dashboard"
else
    echo "Please manually open: http://127.0.0.1:3000/admin/dashboard"
fi

# Wait for runtime to exit
wait $RUNTIME_PID
