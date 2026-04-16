#!/bin/bash

# Trees Admin Repository Push Script
# Run this after creating the GitHub repository

echo "🌳 Pushing Trees Admin Panel to GitHub..."

# Add remote repository
echo "Adding remote repository..."
git remote add origin https://github.com/techsavvyanuj/trees-admin.git

# Push to GitHub
echo "Pushing code to GitHub..."
git branch -M main
git push -u origin main

echo "✅ Trees Admin Panel successfully pushed to GitHub!"
echo "🔗 Visit your repository at: https://github.com/YOUR_USERNAME/trees-admin"
echo ""
echo "Next steps:"
echo "1. Update the repository URL in this script"
echo "2. Set up your deployment (Vercel/Netlify)"
echo "3. Configure environment variables for production"