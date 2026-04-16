@echo off
echo ========================================
echo Trees Admin Panel Deployment Script
echo ========================================
echo.

echo Step 1: Checking package.json...
if not exist "package.json" (
    echo Error: package.json not found
    pause
    exit /b 1
)

echo Step 2: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo Step 3: Building admin panel...
call npx vite build
if %errorlevel% neq 0 (
    echo Error: Failed to build admin panel
    pause
    exit /b 1
)

echo.
echo ========================================
echo Admin Panel Build Complete!
echo ========================================
echo.
echo The admin panel has been built successfully.
echo Build output is located in: dist/
echo.
echo To deploy:
echo 1. Upload the contents of dist/ to your hosting service
echo 2. Configure your domain/subdomain
echo 3. Set up environment variables
echo.
echo For detailed instructions, see ADMIN_PANEL_DEPLOYMENT.md
echo.
pause
