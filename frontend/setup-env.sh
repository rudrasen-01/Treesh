#!/bin/bash

# Environment Setup Script for TreesSocialMedia
# This script helps you quickly switch between different environments

echo "🌳 TreesSocialMedia Environment Setup"
echo "======================================"
echo ""
echo "Choose your environment:"
echo "1) Local Development (localhost backend)"
echo "2) Production (deployed backend)"
echo "3) Create custom .env file"
echo ""

read -p "Select an option (1-3): " choice

case $choice in
    1)
        echo "Setting up LOCAL DEVELOPMENT environment..."
        cp .env.local .env
        echo "✅ Copied .env.local to .env"
        echo "🚀 Run 'npm run dev:local' to start with local backend"
        echo "📝 Make sure your local backend is running on http://51.20.41.208/api/"
        ;;
    2)
        echo "Setting up PRODUCTION environment..."
        cp .env.production .env
        echo "✅ Copied .env.production to .env"
        echo "🚀 Run 'npm run dev' or 'npm run dev:production' to start"
        echo "🌐 Using deployed backend: http://51.20.41.208/api/"
        ;;
    3)
        echo "Creating custom .env file..."
        cp .env.example .env
        echo "✅ Copied .env.example to .env"
        echo "📝 Please edit the .env file with your custom configuration"
        echo "🚀 Run 'npm run dev' when ready"
        ;;
    *)
        echo "❌ Invalid option. Please run the script again and choose 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
echo "🎉 Environment setup complete!"
echo "💡 Available scripts:"
echo "   npm run dev          - Development with current .env"
echo "   npm run dev:local    - Force local environment"
echo "   npm run dev:production - Force production environment"
echo "   npm run build        - Build for production"
