# Development Notes

## Console Messages & Warnings

### Expected Console Messages

When developing with Google Drive integration, you may see these console messages which are normal:

#### 1. React DevTools
```
Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
```
**Solution:** This is just a helpful suggestion. You can:
- Install the React DevTools browser extension
- Or ignore this message - it doesn't affect functionality

#### 2. Google API Iframe Warnings
```
An iframe which has both allow-scripts and allow-same-origin for its sandbox attribute can escape its sandboxing.
```
**Solution:** This is a warning from Google's authentication iframe. It's normal and doesn't affect security in our use case.

#### 3. Content Security Policy (CSP) Reports
```
[Report Only] Refused to load the script '...' because it violates the following Content Security Policy directive
```
**Solution:** These are expected during Google API loading. The CSP is set to "Report Only" mode and won't block functionality.

### Troubleshooting Real Issues

#### Google Drive Connection Fails
- **Check environment variables** are set in `.env.local`
- **Verify Google Cloud Console** settings (OAuth origins, API keys)
- **Ensure HTTPS** is used in production (required for Google APIs)
- **Allow popups** in your browser for authentication

#### API Errors
- **Check browser network tab** for failed requests
- **Verify API quotas** in Google Cloud Console
- **Check credentials** are correctly copied from Google Cloud

### Development Tips

1. **Use browser DevTools** to inspect network requests
2. **Check console logs** for detailed error messages
3. **Test authentication** in incognito mode to verify fresh auth flow
4. **Monitor API usage** in Google Cloud Console

### Production Considerations

1. **Use HTTPS** - Required for Google APIs
2. **Set proper CSP** - Allow Google domains
3. **Monitor quotas** - Google APIs have usage limits
4. **Add proper error boundaries** - Handle API failures gracefully

## File Structure Impact

- `src/layouts/Layout.astro` - Contains CSP headers for Google APIs
- `src/utils/GoogleDriveAPI.ts` - Handles all Google API interactions
- `src/components/GoogleDriveBackup.tsx` - UI for Google Drive features
- `src/components/FileManager.tsx` - Integrates local and cloud storage