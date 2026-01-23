#!/bin/bash

# Git Worktree Extension - Quick Installation Script
# This script automates the installation of the Git Worktree Manager extension

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Print step header
print_step() {
    echo ""
    print_message "$BLUE" "=========================================="
    print_message "$BLUE" "$1"
    print_message "$BLUE" "=========================================="
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking Prerequisites"

    # Check VS Code
    if command_exists code; then
        VS_CODE_VERSION=$(code --version | head -n1)
        print_message "$GREEN" "✓ VS Code found: $VS_CODE_VERSION"
    else
        print_message "$RED" "✗ VS Code not found. Please install VS Code first."
        print_message "$YELLOW" "  Download from: https://code.visualstudio.com/"
        exit 1
    fi

    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version)
        print_message "$GREEN" "✓ Git found: $GIT_VERSION"
        
        # Check if git version supports worktrees
        GIT_MAJOR=$(git --version | awk '{print $3}' | cut -d. -f1)
        GIT_MINOR=$(git --version | awk '{print $3}' | cut -d. -f2)
        if [ "$GIT_MAJOR" -gt 2 ] || ([ "$GIT_MAJOR" -eq 2 ] && [ "$GIT_MINOR" -ge 5 ]); then
            print_message "$GREEN" "✓ Git version supports worktrees"
        else
            print_message "$YELLOW" "⚠ Git version may not fully support worktrees (requires 2.5.0+)"
        fi
    else
        print_message "$RED" "✗ Git not found. Please install Git first."
        exit 1
    fi

    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_message "$GREEN" "✓ Node.js found: $NODE_VERSION"
    else
        print_message "$RED" "✗ Node.js not found. Please install Node.js first."
        print_message "$YELLOW" "  Download from: https://nodejs.org/"
        exit 1
    fi

    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_message "$GREEN" "✓ npm found: $NPM_VERSION"
    else
        print_message "$RED" "✗ npm not found. Please install npm first."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing Dependencies"

    cd "$SCRIPT_DIR"

    if [ -d "node_modules" ]; then
        print_message "$YELLOW" "⚠ node_modules directory already exists"
        read -p "Do you want to reinstall dependencies? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "$GREEN" "Skipping dependency installation"
            return
        fi
        rm -rf node_modules package-lock.json
    fi

    print_message "$YELLOW" "Running npm install..."
    if npm install; then
        print_message "$GREEN" "✓ Dependencies installed successfully"
    else
        print_message "$RED" "✗ Failed to install dependencies"
        exit 1
    fi
}

# Compile extension
compile_extension() {
    print_step "Compiling Extension"

    cd "$SCRIPT_DIR"

    # Check if out directory exists and has compiled files
    if [ -d "out" ] && [ -f "out/extension.js" ]; then
        print_message "$YELLOW" "⚠ Compiled files already exist in out/"
        read -p "Do you want to recompile? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "$GREEN" "Skipping compilation"
            return
        fi
    fi

    print_message "$YELLOW" "Running npm run compile..."
    if npm run compile; then
        print_message "$GREEN" "✓ Extension compiled successfully"
    else
        print_message "$RED" "✗ Failed to compile extension"
        exit 1
    fi
}

# Convert SVG icons to PNG
convert_icons() {
    print_step "Converting Icons to PNG"

    cd "$SCRIPT_DIR"

    # Check if PNG icons already exist
    if [ -f "resources/icon.png" ] && [ -f "resources/worktree-icon.png" ]; then
        print_message "$YELLOW" "⚠ PNG icons already exist"
        read -p "Do you want to regenerate them? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "$GREEN" "Skipping icon conversion"
            return
        fi
    fi

    # Check if Python and PIL are available
    if ! command_exists python3; then
        print_message "$RED" "✗ Python3 not found. Cannot convert icons."
        print_message "$YELLOW" "  Please install Python3 and PIL/Pillow: pip install Pillow"
        exit 1
    fi

    # Try to import PIL
    if ! python3 -c "from PIL import Image, ImageDraw" 2>/dev/null; then
        print_message "$RED" "✗ PIL/Pillow not found. Cannot convert icons."
        print_message "$YELLOW" "  Please install: pip install Pillow"
        exit 1
    fi

    print_message "$YELLOW" "Converting SVG icons to PNG..."
    if python3 -c "from PIL import Image, ImageDraw; img = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); draw = ImageDraw.Draw(img); draw.rectangle([20, 20, 108, 108], fill=(66, 133, 244, 255), outline=(255, 255, 255, 255), width=4); img.save('resources/icon.png')" && \
       python3 -c "from PIL import Image, ImageDraw; img = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); draw = ImageDraw.Draw(img); draw.rectangle([10, 10, 118, 118], fill=(66, 133, 244, 255), outline=(255, 255, 255, 255), width=4); draw.rectangle([30, 30, 98, 98], fill=(255, 255, 255, 255), outline=(66, 133, 244, 255), width=3); img.save('resources/worktree-icon.png')"; then
        print_message "$GREEN" "✓ Icons converted successfully"
    else
        print_message "$RED" "✗ Failed to convert icons"
        exit 1
    fi

    # Update package.json to use PNG icons
    print_message "$YELLOW" "Updating package.json to use PNG icons..."
    if sed -i 's/"icon": "resources\/icon.svg"/"icon": "resources\/icon.png"/g' package.json && \
       sed -i 's/"icon": "resources\/worktree-icon.svg"/"icon": "resources\/worktree-icon.png"/g' package.json; then
        print_message "$GREEN" "✓ package.json updated"
    else
        print_message "$RED" "✗ Failed to update package.json"
        exit 1
    fi
}

# Package extension
package_extension() {
    print_step "Packaging Extension"

    cd "$SCRIPT_DIR"

    # Check if vsix file already exists
    VSIX_FILE=$(find . -maxdepth 1 -name "*.vsix" -type f | head -n1)
    if [ -n "$VSIX_FILE" ]; then
        print_message "$YELLOW" "⚠ VSIX file already exists: $VSIX_FILE"
        read -p "Do you want to repackage? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "$GREEN" "Using existing VSIX file: $VSIX_FILE"
            echo "$VSIX_FILE"
            return
        fi
        rm -f *.vsix
    fi

    print_message "$YELLOW" "Creating VSIX package..."
    if npx @vscode/vsce package; then
        VSIX_FILE=$(find . -maxdepth 1 -name "*.vsix" -type f | head -n1)
        print_message "$GREEN" "✓ Extension packaged successfully: $VSIX_FILE"
        echo "$VSIX_FILE"
    else
        print_message "$RED" "✗ Failed to package extension"
        exit 1
    fi
}

# Install extension
install_extension() {
    local vsix_file=$1

    print_step "Installing Extension in VS Code"

    print_message "$YELLOW" "Installing $vsix_file..."
    if code --install-extension "$vsix_file"; then
        print_message "$GREEN" "✓ Extension installed successfully"
    else
        print_message "$RED" "✗ Failed to install extension"
        print_message "$YELLOW" "  You may need to restart VS Code with elevated permissions"
        exit 1
    fi
}

# Verify installation
verify_installation() {
    print_step "Verifying Installation"

    print_message "$YELLOW" "Checking if extension is installed..."
    EXTENSION_LIST=$(code --list-extensions | grep -i worktree || true)

    if [ -n "$EXTENSION_LIST" ]; then
        print_message "$GREEN" "✓ Extension found in installed extensions:"
        echo "$EXTENSION_LIST"
    else
        print_message "$YELLOW" "⚠ Extension not found in list (may need to reload VS Code)"
    fi
}

# Print completion message
print_completion() {
    print_step "Installation Complete!"

    print_message "$GREEN" "The Git Worktree Manager extension has been installed successfully!"
    echo ""
    print_message "$YELLOW" "Next Steps:"
    echo "  1. Reload VS Code (Ctrl+Shift+P > 'Developer: Reload Window')"
    echo "  2. Look for the 'Git Worktrees' icon in the Activity Bar"
    echo "  3. Open a git repository to see your worktrees"
    echo ""
    print_message "$YELLOW" "To uninstall the extension:"
    echo "  code --uninstall-extension tryToDEv.git-worktree-manager"
    echo ""
    print_message "$BLUE" "For more information, see INSTALLATION_GUIDE.md"
}

# Main execution
main() {
    print_message "$BLUE" "Git Worktree Extension - Installation Script"
    echo ""

    check_prerequisites
    install_dependencies
    compile_extension
    convert_icons
    VSIX_FILE=$(package_extension)
    install_extension "$VSIX_FILE"
    verify_installation
    print_completion
}

# Run main function
main "$@"
