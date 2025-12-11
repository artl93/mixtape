# Google OAuth Setup Guide for Mixtape

This guide will help you set up Google OAuth authentication for the Mixtape application.

## Prerequisites

- A Google account
- Access to the [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Mixtape") and click "Create"
5. Wait for the project to be created and select it

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and then click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" for user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - **App name**: Mixtape
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the "Scopes" page, you don't need to add any scopes (we'll request them in code)
7. Click "Save and Continue"
8. On the "Test users" page, add your email address if you want to test before publishing
9. Click "Save and Continue"
10. Review and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Give it a name (e.g., "Mixtape Web Client")
5. Add authorized JavaScript origins:
   - For local development: `http://localhost:3000`
   - For production: Your frontend URL (e.g., `https://yourdomain.com`)
6. Add authorized redirect URIs:
   - For local development: `http://localhost:4000/auth/google/callback`
   - For production: Your backend URL + `/auth/google/callback` (e.g., `https://api.yourdomain.com/auth/google/callback`)
7. Click "Create"
8. A dialog will appear with your **Client ID** and **Client Secret**
9. **IMPORTANT**: Copy these values - you'll need them for your environment variables

## Step 5: Configure Environment Variables

### Backend Configuration

Create a `.env` file in the `src/backend` directory (or set environment variables in your deployment platform):

```bash
# Required: Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-from-google-console
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-console

# Required: Callback URL (must match the redirect URI in Google Console)
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# Required: Session Secret (generate a random string for production)
# You can generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your-random-secret-key-change-in-production

# Required: Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:3000

# Required: PostgreSQL connection string
POSTGRES_CONNECTION_STRING=postgresql://user:password@localhost:5432/mixtape

# Optional: Server port (defaults to 4000)
PORT=4000

# Optional: Node environment
NODE_ENV=development
```

### Frontend Configuration

Create or update `.env` in the `src/web` directory:

```bash
# Backend API URL
REACT_APP_API_BASE=http://localhost:4000
```

## Step 6: Security Best Practices

⚠️ **NEVER commit your `.env` file or secrets to version control!**

1. Make sure `.env` is listed in your `.gitignore` file
2. Use different credentials for development and production
3. In production:
   - Use environment variables from your hosting platform
   - Generate a strong, random `SESSION_SECRET` (minimum 32 characters)
   - Use HTTPS for both frontend and backend
   - Set `NODE_ENV=production`
4. Regularly rotate your secrets
5. Limit access to your Google Cloud Console project

## Step 7: Update Database Schema

Run the database migration to add Google OAuth support:

```bash
# If using the provided scripts:
./eng/mixtape-db-setup.sh

# Or manually with psql:
psql -U postgres -d mixtape -f src/backend/init.sql
```

## Step 8: Test the Authentication Flow

1. Start the backend server:
   ```bash
   cd src/backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd src/web
   npm start
   ```

3. Open your browser to `http://localhost:3000`
4. Click "Login with Google"
5. You should be redirected to Google's OAuth consent screen
6. After granting permissions, you should be redirected back to the app

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in your Google Console exactly matches `GOOGLE_CALLBACK_URL` in your `.env` file
- Check for trailing slashes - they must match exactly

### "Access blocked: This app's request is invalid"
- Make sure you've completed the OAuth consent screen configuration
- If testing, add your email to the test users list

### "Cannot read property 'id' of undefined"
- Check that your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set
- Verify the database connection is working and the users table exists

### CORS errors
- Ensure `FRONTEND_URL` in your backend `.env` matches where your frontend is running
- Check that credentials are enabled in CORS configuration

## Production Deployment

When deploying to production:

1. Create a new OAuth client ID for production in Google Console
2. Add production URLs to authorized origins and redirect URIs
3. Set all environment variables in your hosting platform (never commit them)
4. Use HTTPS for both frontend and backend
5. Generate a strong `SESSION_SECRET`
6. Set `NODE_ENV=production`
7. Consider publishing your OAuth consent screen (if you want public access)

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Passport.js Google OAuth 2.0 Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
