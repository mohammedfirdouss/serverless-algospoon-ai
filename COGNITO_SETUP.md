# AWS Cognito Authentication Setup

This guide explains how to set up AWS Cognito authentication for AlgoSpoon AI.

## What Was Added

### Backend (CDK Infrastructure)
- **Cognito User Pool**: Manages user authentication
  - Email and username sign-in enabled
  - Email verification required
  - Password policy: min 8 chars, requires uppercase, lowercase, and digits
  - Self-signup enabled

- **User Pool Client**: Web app client for frontend integration
  - USER_PASSWORD and USER_SRP auth flows enabled
  - Configured for Amplify integration

- **Cognito Authorizer**: API Gateway authorizer for protected endpoints

### Frontend Configuration
- **Amplify Integration**: Configured in `src/main.tsx`
- **Environment Variables**: Added to `.env` file
- **Authenticator UI**: AWS Amplify UI component for sign-in/sign-up

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

Run the deployment script from the project root:

```bash
cd /workspace/serverless-algospoon-ai
./scripts/deploy-and-configure.sh
```

This script will:
1. Deploy the CDK stack with Cognito User Pool
2. Extract Cognito configuration values
3. Automatically configure the frontend `.env` file
4. Display the configuration summary

### Option 2: Manual Deployment

1. **Deploy the CDK Stack**
   ```bash
   cd /workspace/serverless-algospoon-ai
   cdk deploy --outputs-file cdk-outputs.json
   ```

2. **Extract CDK Outputs**
   After deployment, check `cdk-outputs.json` for these values:
   - `UserPoolId`
   - `UserPoolClientId`
   - `Region`
   - `ApiEndpoint`

3. **Configure Frontend**
   Update `frontend/.env` with the values:
   ```bash
   VITE_API_BASE_URL=<ApiEndpoint from CDK outputs>
   VITE_COGNITO_USER_POOL_ID=<UserPoolId from CDK outputs>
   VITE_COGNITO_CLIENT_ID=<UserPoolClientId from CDK outputs>
   VITE_COGNITO_REGION=<Region from CDK outputs>
   ```

## Running the Frontend

After deployment and configuration:

```bash
cd frontend
npm run dev
```

The application will now require authentication before accessing any features.

## User Authentication Flow

1. **Sign Up**: New users can create an account with email and password
2. **Email Verification**: Users receive a verification code via email
3. **Sign In**: Users can sign in with email/username and password
4. **Access App**: Authenticated users can access all features

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Symbols are optional

## Troubleshooting

### "Auth UserPool not configured" Error
- Make sure you've deployed the CDK stack
- Verify the `.env` file in the frontend directory has the correct values
- Restart the Vite dev server after updating `.env`

### Email Verification Issues
- Check your spam folder for verification emails
- Ensure the email address is valid
- You can resend the verification code from the sign-up form

### Sign-In Issues
- Verify your email before signing in
- Check that password meets all requirements
- Clear browser cache and try again

## CDK Stack Outputs

After deployment, you'll see these outputs:

- **ApiEndpoint**: API Gateway URL
- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: Cognito User Pool Client ID
- **Region**: AWS Region
- **UserTableName**: DynamoDB Users table
- **RecipeTableName**: DynamoDB Recipes table

## Security Features

- ✅ Email verification required
- ✅ Secure password policy
- ✅ JWT token-based authentication
- ✅ API Gateway Cognito authorizer
- ✅ Encrypted user data
- ✅ Account recovery via email

## Next Steps

After successful deployment:
1. Create a test user account
2. Verify your email
3. Sign in and test the application
4. Configure additional security settings as needed
