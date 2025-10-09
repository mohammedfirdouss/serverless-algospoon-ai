#!/bin/bash

# Deploy and Configure AlgoSpoon AI
# This script deploys the CDK stack and configures the frontend with Cognito settings

set -e

# Default to dev environment
ENVIRONMENT=${1:-dev}

echo "🚀 Deploying AlgoSpoon AI Backend (${ENVIRONMENT})..."
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "❌ Error: Invalid environment '${ENVIRONMENT}'"
    echo "Usage: $0 [dev|staging|prod]"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Build frontend if deploying to staging or prod
if [[ "$ENVIRONMENT" != "dev" ]]; then
    echo "📦 Building frontend..."
    cd frontend
    npm run build
    cd ..
    echo "✅ Frontend build completed!"
    echo ""
fi

# Deploy CDK stack with environment context
echo "📦 Deploying CDK stack for ${ENVIRONMENT}..."
cdk deploy "AlgoSpoonStack-${ENVIRONMENT}" \
    --context environment=${ENVIRONMENT} \
    --require-approval never \
    --outputs-file "cdk-outputs-${ENVIRONMENT}.json"

echo ""
echo "✅ CDK deployment completed!"
echo ""

# Check if cdk-outputs.json exists
OUTPUT_FILE="cdk-outputs-${ENVIRONMENT}.json"
if [ ! -f "$OUTPUT_FILE" ]; then
    echo "❌ Error: ${OUTPUT_FILE} not found"
    exit 1
fi

# Get stack name
STACK_NAME="AlgoSpoonStack-${ENVIRONMENT}"

# Extract values from CDK outputs
USER_POOL_ID=$(node -pe "JSON.parse(require('fs').readFileSync('${OUTPUT_FILE}', 'utf8'))['${STACK_NAME}']['UserPoolId']")
USER_POOL_CLIENT_ID=$(node -pe "JSON.parse(require('fs').readFileSync('${OUTPUT_FILE}', 'utf8'))['${STACK_NAME}']['UserPoolClientId']")
REGION=$(node -pe "JSON.parse(require('fs').readFileSync('${OUTPUT_FILE}', 'utf8'))['${STACK_NAME}']['Region']")
API_ENDPOINT=$(node -pe "JSON.parse(require('fs').readFileSync('${OUTPUT_FILE}', 'utf8'))['${STACK_NAME}']['ApiEndpoint']")
EVENT_BUS=$(node -pe "JSON.parse(require('fs').readFileSync('${OUTPUT_FILE}', 'utf8'))['${STACK_NAME}']['EventBusName'] || 'N/A'")

# Optional outputs
WEBSITE_URL=$(node -pe "JSON.parse(require('fs').readFileSync('${OUTPUT_FILE}', 'utf8'))['${STACK_NAME}']['WebsiteURL'] || 'N/A'" 2>/dev/null || echo "N/A")
DASHBOARD_URL=$(node -pe "JSON.parse(require('fs').readFileSync('${OUTPUT_FILE}', 'utf8'))['${STACK_NAME}']['DashboardURL'] || 'N/A'" 2>/dev/null || echo "N/A")
WAF_ARN=$(node -pe "JSON.parse(require('fs').readFileSync('${OUTPUT_FILE}', 'utf8'))['${STACK_NAME}']['WebACLArn'] || 'N/A'" 2>/dev/null || echo "N/A")

echo "📝 Configuring frontend environment variables..."
echo ""

# Create/update frontend .env file
cat > frontend/.env << EOF
# API Configuration
VITE_API_BASE_URL=${API_ENDPOINT}

# AWS Cognito Configuration
VITE_COGNITO_USER_POOL_ID=${USER_POOL_ID}
VITE_COGNITO_CLIENT_ID=${USER_POOL_CLIENT_ID}
VITE_COGNITO_REGION=${REGION}

# Environment
VITE_ENVIRONMENT=${ENVIRONMENT}
EOF

echo "✅ Frontend configured successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 DEPLOYMENT SUMMARY - ${ENVIRONMENT}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 Core Services:"
echo "  API Endpoint:       ${API_ENDPOINT}"
echo "  Event Bus:          ${EVENT_BUS}"
echo ""
echo "🔐 Authentication:"
echo "  User Pool ID:       ${USER_POOL_ID}"
echo "  User Pool Client:   ${USER_POOL_CLIENT_ID}"
echo "  Region:             ${REGION}"
echo ""

if [[ "$WEBSITE_URL" != "N/A" ]]; then
    echo "🌐 Frontend:"
    echo "  Website URL:        ${WEBSITE_URL}"
    echo ""
fi

if [[ "$DASHBOARD_URL" != "N/A" ]]; then
    echo "📊 Monitoring:"
    echo "  Dashboard:          ${DASHBOARD_URL}"
    echo ""
fi

if [[ "$WAF_ARN" != "N/A" ]]; then
    echo "🛡️ Security:"
    echo "  WAF ARN:            ${WAF_ARN}"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📌 Next steps:"
if [[ "$ENVIRONMENT" == "dev" ]]; then
    echo "  1. cd frontend"
    echo "  2. npm run dev"
    echo "  3. Open http://localhost:3000"
elif [[ "$WEBSITE_URL" != "N/A" ]]; then
    echo "  1. Visit: ${WEBSITE_URL}"
    echo "  2. Sign up for a new account"
else
    echo "  1. cd frontend && npm run build"
    echo "  2. Deploy frontend manually"
fi
echo ""
echo "💡 To deploy to a different environment:"
echo "   ./scripts/deploy-and-configure.sh [dev|staging|prod]"
echo ""
