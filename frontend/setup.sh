#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Frontend Setup Script${NC}"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org/ or using your package manager:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  macOS: brew install node"
    echo "  Or use Node Version Manager (nvm): https://github.com/nvm-sh/nvm"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    echo "Please install npm:"
    echo "  Ubuntu/Debian: sudo apt install npm"
    echo "  macOS: npm is included with Node.js"
    exit 1
fi

# Display versions
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ Node.js version: ${NODE_VERSION}${NC}"
echo -e "${GREEN}✅ npm version: ${NPM_VERSION}${NC}"

# Check Node.js version (should be >= 18 for Vite + React 19)
NODE_MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js version should be >= 18 for optimal compatibility${NC}"
    echo "Current version: $NODE_VERSION"
    echo "Consider upgrading to a newer version"
fi

echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"

# Install dependencies
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Available commands:"
echo -e "  ${YELLOW}npm run dev${NC}     - Start development server"
echo -e "  ${YELLOW}npm run build${NC}   - Build for production"
echo -e "  ${YELLOW}npm run preview${NC} - Preview production build"
echo -e "  ${YELLOW}npm run lint${NC}    - Run ESLint"
echo ""

# Ask if user wants to start the dev server
read -p "Do you want to start the development server now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 Starting development server...${NC}"
    echo "Server will be available at http://localhost:5173"
    npm run dev
fi 