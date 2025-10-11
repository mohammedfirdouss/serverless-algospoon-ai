#!/bin/bash

# Update Frontend Environment Variables
# This script extracts CDK outputs and updates the frontend .env file

ENVIRONMENT=${1:-dev}
FRONTEND_DIR="./frontend"
ENV_FILE="$FRONTEND_DIR/.env"

echo "🔧 Updating frontend environment variables for $ENVIRONMENT environment..."

# Get CDK outputs
STACK_NAME="AlgoSpoonStack-$ENVIRONMENT"

# Extract values from CDK outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text 2>/dev/null)

USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text 2>/dev/null)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text 2>/dev/null)

REGION=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`Region`].OutputValue' \
  --output text 2>/dev/null)

# Check if we got the values
if [ -z "$API_ENDPOINT" ] || [ -z "$USER_POOL_ID" ] || [ -z "$CLIENT_ID" ] || [ -z "$REGION" ]; then
    echo "❌ Error: Could not retrieve all required values from CloudFormation stack '$STACK_NAME'"
    echo "Make sure the stack is deployed and you have the necessary AWS permissions."
    exit 1
fi

# Create the .env file
cat > "$ENV_FILE" << EOF
# AlgoSpoon AI Frontend Configuration
# Environment: $ENVIRONMENT
# Generated: $(date)

# API Configuration
VITE_API_BASE_URL=$API_ENDPOINT

# AWS Cognito Configuration
VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$CLIENT_ID
VITE_COGNITO_REGION=$REGION

# Environment
VITE_ENVIRONMENT=$ENVIRONMENT
EOF

echo "✅ Frontend environment file updated: $ENV_FILE"
echo ""
echo "📋 Configuration Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  API Endpoint: $API_ENDPOINT"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Client ID: $CLIENT_ID"
echo "  Region: $REGION"
echo ""
echo "🚀 You can now start the frontend with: cd frontend && npm run dev"