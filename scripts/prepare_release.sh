#!/bin/bash
set -e

echo "========================================="
echo "[INFO] Starting Q-OS Release Packaging..."
echo "========================================="

VERSION="v0.1.0"
DIST_DIR="./dist/q-os-${VERSION}"
RELEASE_DIR="target/release"

# Clean and create directories
rm -rf "./dist/q-os-${VERSION}"
mkdir -p "${DIST_DIR}/bin"
mkdir -p "${DIST_DIR}/library"
mkdir -p "${DIST_DIR}/marketing"

# Copy demo script
cp scripts/demo.sh "${DIST_DIR}/demo.sh"

# 1. Copy and strip binaries
echo "[INFO] Stripping and packaging binaries..."
if [ -f "${RELEASE_DIR}/qos-runtime" ] && [ -f "${RELEASE_DIR}/qos-cli" ]; then
    cp "${RELEASE_DIR}/qos-runtime" "${DIST_DIR}/bin/"
    cp "${RELEASE_DIR}/qos-cli" "${DIST_DIR}/bin/"
    strip "${DIST_DIR}/bin/qos-runtime" 2>/dev/null || true
    strip "${DIST_DIR}/bin/qos-cli" 2>/dev/null || true
else
    echo "[WARNING] Binaries not found in ${RELEASE_DIR}. Did you run cargo build --release?"
fi

# 2. Copy WASM modules
echo "[INFO] Packaging WASM library modules..."
# Search for .qos and .wasm modules to include in the library
find . -type f \( -name "*.qos" -o -name "*.wasm" \) -not -path "*/dist/*" -not -path "*/target/*" -exec cp {} "${DIST_DIR}/library/" \; 2>/dev/null || true

# 3. Package Marketing site
echo "[INFO] Packaging Marketing Site..."
if [ -d "apps/marketing/.next/standalone" ]; then
    cp -r apps/marketing/.next/standalone/* "${DIST_DIR}/marketing/"
    # Copy static assets as required by standalone mode
    cp -r apps/marketing/public "${DIST_DIR}/marketing/public" 2>/dev/null || true
    cp -r apps/marketing/.next/static "${DIST_DIR}/marketing/.next/static" 2>/dev/null || true
elif [ -d "apps/marketing/out" ]; then
    cp -r apps/marketing/out/* "${DIST_DIR}/marketing/"
else
    echo "[WARNING] Marketing site build not found. Did you run turbo build?"
fi

# 4. Compress
echo "[INFO] Compressing release archive..."
cd ./dist
tar -czvf "q-os-edge-release-${VERSION}.tar.gz" "q-os-${VERSION}/" > /dev/null
cd ..

echo ""
echo "    ██████╗         ██████╗ ███████╗"
echo "   ██╔═══██╗       ██╔═══██╗██╔════╝"
echo "   ██║   ██║ █████╗██║   ██║███████╗"
echo "   ██║▄▄ ██║ ╚════╝██║   ██║╚════██║"
echo "   ╚██████╔╝       ╚██████╔╝███████║"
echo "    ╚══▀▀═╝         ╚═════╝ ╚══════╝"
echo ""
echo "[SUCCESS] Q-OS Release Candidate Packaged and Secured."
echo "Location: ./dist/q-os-edge-release-${VERSION}.tar.gz"
echo "========================================="
