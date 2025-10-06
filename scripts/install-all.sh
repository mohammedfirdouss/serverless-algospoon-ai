#!/bin/bash

# Install all dependencies for AlgoSpoon AI project

set -e

echo "================================================"
echo "Installing AlgoSpoon AI Dependencies"
echo "================================================"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install auth service Lambda dependencies
echo ""
echo "🔐 Installing auth service dependencies..."

echo "  - Installing register function dependencies..."
cd services/auth/register && npm install && cd ../../..

echo "  - Installing update-profile function dependencies..."
cd services/auth/update-profile && npm install && cd ../../..

echo "  - Installing get-user function dependencies..."
cd services/auth/get-user && npm install && cd ../../..

# Install recipe service Lambda dependencies
echo ""
echo "🍳 Installing recipe service dependencies..."

echo "  - Installing save-recipe function dependencies..."
cd services/recipes/save-recipe && npm install && cd ../../..

echo "  - Installing get-recipes function dependencies..."
cd services/recipes/get-recipes && npm install && cd ../../..

echo "  - Installing delete-recipe function dependencies..."
cd services/recipes/delete-recipe && npm install && cd ../../..

echo ""
echo "================================================"
echo "✅ All dependencies installed successfully!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Configure AWS credentials: aws configure"
echo "  2. Build the project: npm run build"
echo "  3. Deploy to AWS: npm run deploy"
echo ""
