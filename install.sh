#!/usr/bin/env bash

# Strict bash error handling
set -e
set -u
set -o pipefail

# Matrix-Noir Theme Colors
NEON_GREEN='\033[38;2;0;255;65m' # #00ff41
CYAN='\033[38;2;0;212;255m'      # #00d4ff
RED='\033[38;2;255;0;60m'        # #ff003c
BOLD='\033[1m'
NC='\033[0m'                     # No Color

# Helper for logging
log_info() { echo -e "${CYAN}[*] $1${NC}"; }
log_success() { echo -e "${NEON_GREEN}[+] $1${NC}"; }
log_err() { echo -e "${RED}[!] $1${NC}" >&2; }

print_logo() {
    echo -e "${NEON_GREEN}"
    cat << "EOF"
  ___        ___  ____  
 / _ \      / _ \/ ___| 
| | | |____| | | \___ \ 
| |_| |____| |_| |___) |
 \__\_\     \___/|____/ 
 
EOF
    echo -e "${CYAN}/// Q-OS EDGE RUNTIME ///${NC}\n"
}

# Function to detect the host Operating System
detect_os() {
    local os
    os="$(uname -s)"
    case "${os}" in
        Linux*)     echo "linux" ;;
        Darwin*)    echo "darwin" ;;
        *)          log_err "Unsupported OS: ${os}"; exit 1 ;;
    esac
}

# Function to detect the CPU Architecture
detect_arch() {
    local arch
    arch="$(uname -m)"
    case "${arch}" in
        x86_64|amd64)   echo "x86_64" ;;
        aarch64|arm64)  echo "arm64" ;;
        *)              log_err "Unsupported Architecture: ${arch}"; exit 1 ;;
    esac
}

# Function to download using curl or wget with an animated spinner
download_binary() {
    local url="$1"
    local dest="$2"
    
    if command -v curl >/dev/null 2>&1; then
        curl -sSL -f "${url}" -o "${dest}" &
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "${dest}" "${url}" &
    else
        log_err "Either 'curl' or 'wget' is required to download the binary."
        exit 1
    fi

    local pid=$!
    local delay=0.1
    local spinstr='|/-\'
    
    echo -ne "${CYAN}[*] Downloading binary... ${NC}"
    
    # Hide cursor
    printf "\e[?25l"
    
    # Disable exit on error for the loop condition
    set +e
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf "${NEON_GREEN}[%c]${NC}" "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b"
    done
    set -e
    
    # Restore cursor
    printf "\e[?25h"
    
    wait $pid
    local status=$?
    
    # Clear the spinner
    printf "   \b\b\b\n"
    
    if [ $status -ne 0 ]; then
        return $status
    fi
}

main() {
    print_logo
    log_info "Initializing installation..."

    local os arch
    os="$(detect_os)"
    arch="$(detect_arch)"
    log_info "Detected System: OS=${os}, Architecture=${arch}"

    # Define the release URL (update placeholder with actual organization/repo when available)
    local repo="donwolfonline/QOS"
    local release_url="https://github.com/${repo}/releases/latest/download/qos-${os}-${arch}"

    # Create temporary directory for download
    local tmp_dir
    tmp_dir="$(mktemp -d)"
    # Ensure temporary directory is cleaned up on exit
    trap 'rm -rf "${tmp_dir}"' EXIT

    local tmp_bin="${tmp_dir}/qos"

    if ! download_binary "${release_url}" "${tmp_bin}"; then
        log_err "Download failed. Please check if the release exists for your architecture."
        exit 1
    fi

    log_info "Verifying binary integrity..."
    # 1. Verify file exists and is not empty
    if [ ! -s "${tmp_bin}" ]; then
        log_err "Downloaded file is empty or corrupted."
        exit 1
    fi

    # 2. Make it executable
    chmod +x "${tmp_bin}"

    # 3. Optional: Verify it runs successfully if dependencies allow
    if ! "${tmp_bin}" --version >/dev/null 2>&1 && ! "${tmp_bin}" --help >/dev/null 2>&1; then
         log_info "Warning: Executable integrity check returned non-zero. It may require specific arguments or environment variables."
    fi

    log_success "Binary integrity verified."

    local install_dir="/usr/local/bin"
    local final_dest="${install_dir}/qos"

    log_info "Installing to ${final_dest}..."

    # Securely move the binary to the installation directory, prompting for sudo only if necessary
    if [ -w "${install_dir}" ]; then
        mv "${tmp_bin}" "${final_dest}"
    else
        log_info "Sudo privileges are required to write to ${install_dir}."
        if command -v sudo >/dev/null 2>&1; then
            sudo mv "${tmp_bin}" "${final_dest}"
        else
            log_err "Sudo is not available, cannot move binary to ${install_dir}."
            exit 1
        fi
    fi

    # Verify the installation path is in PATH
    if ! command -v qos >/dev/null 2>&1; then
        log_info "Note: ${install_dir} might not be in your \$PATH."
    fi

    echo ""
    echo -ne "${CYAN}Would you like Q-OS to run automatically in the background on startup? (y/n): ${NC}"
    if read -r response < /dev/tty; then
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            log_info "Initializing background service..."
            if [ "$os" = "linux" ] && command -v sudo >/dev/null 2>&1; then
                sudo qos init-service
            else
                qos init-service
            fi
        fi
    else
        echo ""
    fi

    echo ""
    echo -e "${BOLD}${NEON_GREEN}[==================================================]${NC}"
    echo -e "${BOLD}${NEON_GREEN}              INSTALLATION COMPLETE                 ${NC}"
    echo -e "${BOLD}${NEON_GREEN}[==================================================]${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo -e "  1. Run ${BOLD}${NEON_GREEN}qos start${NC} to boot your edge node."
    echo -e "  2. Scan the generated QR code with your mobile controller."
    echo ""
    echo -e "${CYAN}Welcome to the Mesh.${NC}"
}

main "$@"
