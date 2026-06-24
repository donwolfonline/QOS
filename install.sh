#!/usr/bin/env bash
set -e

# Matrix-Noir Theme Colors
NEON_GREEN='\033[38;2;0;255;65m' # #00ff41
CYAN='\033[38;2;0;212;255m'      # #00d4ff
RED='\033[38;2;255;0;60m'        # #ff003c
NC='\033[0m'                     # No Color

echo -e "${CYAN}[*] Initializing Q-OS Installer...${NC}"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_NAME="linux";;
    Darwin*)    OS_NAME="darwin";;
    *)          echo -e "${RED}[!] Unsupported OS: ${OS}${NC}"; exit 1;;
esac

# Detect Architecture
ARCH="$(uname -m)"
case "${ARCH}" in
    x86_64|amd64)   ARCH_NAME="x86_64";;
    aarch64|arm64)  ARCH_NAME="aarch64";;
    *)              echo -e "${RED}[!] Unsupported Architecture: ${ARCH}${NC}"; exit 1;;
esac

echo -e "${CYAN}[*] Detected System: ${OS_NAME} (${ARCH_NAME})${NC}"

# Define the repository and release URL
REPO="your-org/q-os"
RELEASE_URL="https://github.com/${REPO}/releases/latest/download/qos-runtime-${OS_NAME}-${ARCH_NAME}.tar.gz"

TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

echo -e "${CYAN}[*] Downloading optimized binary from GitHub...${NC}"

# Download the tarball and capture the HTTP status code
HTTP_CODE=$(curl -sL -w "%{http_code}" -o qos.tar.gz "$RELEASE_URL")

if [ "$HTTP_CODE" -eq 200 ]; then
    tar -xzf qos.tar.gz
    # The archive should contain the 'qos-runtime' or 'qos' binary
    if [ -f "qos-runtime" ]; then
        BIN_NAME="qos-runtime"
    elif [ -f "qos" ]; then
        BIN_NAME="qos"
    else
        echo -e "${RED}[!] Error: Could not find qos binary in the downloaded archive.${NC}"
        rm -rf "$TMP_DIR"
        exit 1
    fi
else
    echo -e "${RED}[!] Error: Failed to download release (HTTP $HTTP_CODE).${NC}"
    echo -e "${CYAN}[*] Release URL: ${RELEASE_URL}${NC}"
    echo -e "${CYAN}[*] Please ensure a pre-compiled binary exists for your architecture.${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

chmod +x "$BIN_NAME"

INSTALL_DIR="/usr/local/bin"
# Determine if we need sudo to write to the installation directory
if [ -w "$INSTALL_DIR" ]; then
    SUDO=""
elif command -v sudo >/dev/null; then
    echo -e "${CYAN}[*] Escalating privileges to install to ${INSTALL_DIR}...${NC}"
    SUDO="sudo"
else
    # Fallback to local user bin if sudo is not available
    INSTALL_DIR="$HOME/.local/bin"
    mkdir -p "$INSTALL_DIR"
    SUDO=""
fi

echo -e "${CYAN}[*] Installing qos to ${INSTALL_DIR}...${NC}"
$SUDO mv "$BIN_NAME" "${INSTALL_DIR}/qos"
cd - > /dev/null
rm -rf "$TMP_DIR"

# Success ASCII Art & Output
echo -e "${NEON_GREEN}"
cat << "EOF"
  ___        ___  ____  
 / _ \      / _ \/ ___| 
| | | |____| | | \___ \ 
| |_| |____| |_| |___) |
 \__\_\     \___/|____/ 

EOF
echo -e "${CYAN}/// EDGE NODE INITIALIZED ///${NC}\n"
echo -e "${NEON_GREEN}Installation Complete!${NC}"
echo -e "Run the following command to boot your edge node:"
echo -e "\n  ${NEON_GREEN}qos start${NC}\n"

# Verify path mapping
if ! command -v qos >/dev/null; then
    echo -e "${CYAN}[*] Note: You may need to add ${INSTALL_DIR} to your \$PATH.${NC}"
fi
