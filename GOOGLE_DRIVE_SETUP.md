# Google Drive Integration Setup Guide

## Overview
The Daily Takings app now supports automatic backup syncing to Google Drive. This allows you to:
- Automatically backup your sales data to your Google Drive
- Restore backups from Google Drive
- Access your backups from anywhere
- Keep your data secure in the cloud

## Setup Instructions

### 1. Create Google Cloud Project and Enable APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in the required app information
   - Add your email to test users
4. For application type, choose "Web application"
5. Add authorized origins:
   - `http://localhost:3000` (for development)
   - Your production domain (if deploying)
6. Copy the Client ID

### 3. Create API Key

1. Click "Create Credentials" > "API Key"
2. Restrict the API key (recommended):
   - Click "Restrict Key"
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Drive API"
3. Copy the API Key

### 4. Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id_here
   REACT_APP_GOOGLE_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server:
   ```bash
   npm start
   ```

### 5. Test the Integration

1. Open the Daily Takings app
2. Open the sidebar (📁 Sales Files)
3. Scroll down to see the "Google Drive Sync" section
4. Click "Connect" to authenticate with Google
5. Grant permissions when prompted
6. Try syncing a backup

## Features

### Automatic Sync
- When you click "Quick backup" or use the backup button, it will also sync to Google Drive if connected
- The page close prompt will suggest backing up to both local and Google Drive

### Manual Sync
- Use the "Sync Backup" button to create a backup and upload to Google Drive
- Use "Show Backups" to view, restore, or delete backups from Google Drive

### Backup Management
- View all your Google Drive backups with timestamps and file sizes
- Restore any backup directly from Google Drive
- Delete old backups to manage storage

## Security & Privacy

- Your data is stored in your own Google Drive account
- The app only requests access to files it creates
- No data is stored on external servers
- All communication with Google Drive is encrypted (HTTPS)

## Troubleshooting

### "Google Drive API not configured" Error
- Make sure your environment variables are set correctly
- Restart your development server after adding environment variables
- Check that both `REACT_APP_GOOGLE_CLIENT_ID` and `REACT_APP_GOOGLE_API_KEY` are set

### Authentication Issues
- Make sure localhost:3000 is added to authorized origins in Google Cloud Console
- Clear browser cache and cookies for localhost
- Check that the OAuth consent screen is configured properly

### API Quota Issues
- Google Drive API has daily quotas
- For development, the default quotas should be sufficient
- For production apps with many users, you may need to request quota increases

## Production Deployment

When deploying to production:

1. Add your production domain to authorized origins in Google Cloud Console
2. Update your environment variables in your hosting platform
3. Consider implementing additional security measures for API keys
4. Monitor API usage and quotas

## File Structure

The app creates a folder called "Daily Takings Backups" in your Google Drive root directory. All backup files are stored there with descriptive names including dates.

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Cloud Console configuration
3. Ensure all required APIs are enabled
4. Check that your environment variables are correctly set