#!/bin/bash

echo "========================================"
echo "Trees Admin Panel Deployment Script"
echo "========================================"
echo

echo "Step 1: Checking package.json..."
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found"
    exit 1
fi

echo "Step 2: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo "Step 3: Building admin panel..."
npx vite build
if [ $? -ne 0 ]; then
    echo "Error: Failed to build admin panel"
    exit 1
fi

echo
echo "========================================"
echo "Admin Panel Build Complete!"
echo "========================================"
echo
echo "The admin panel has been built successfully."
echo "Build output is located in: dist/"
echo
echo "To deploy:"
echo "1. Upload the contents of dist/ to your hosting service"
echo "2. Configure your domain/subdomain"
echo "3. Set up environment variables"
echo
echo "For detailed instructions, see ADMIN_PANEL_DEPLOYMENT.md"
echo
