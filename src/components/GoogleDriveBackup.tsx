import { useState, useEffect } from 'react';
import { FileManager } from './FileManager';
import GoogleDriveConfigChecker from './GoogleDriveConfigChecker';

interface GoogleDriveBackupProps {
  onStatusChange?: (connected: boolean) => void;
}

interface DriveBackupFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
}



export default function GoogleDriveBackup({ onStatusChange }: GoogleDriveBackupProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const fileManager = FileManager.getInstance();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    try {
      // Check if we're in a secure context (required for Google APIs)
      if (!window.isSecureContext && window.location.protocol !== 'http:') {
        setIsConfigured(false);
        setError('Google Drive requires a secure connection (HTTPS)');
        return;
      }
      
      // First check if Google Drive API is configured
      const hasCredentials = (
        (typeof import.meta !== 'undefined' && import.meta.env && 
         (import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID)) ||
        (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_CLIENT_ID) ||
        (typeof window !== 'undefined' && (window as any).APP_CONFIG?.GOOGLE_CLIENT_ID)
      );
      
      setIsConfigured(hasCredentials);
      
      if (hasCredentials) {
        const connected = fileManager.isConnectedToGoogleDrive();
        setIsConnected(connected);
        onStatusChange?.(connected);
      } else {
        setIsConnected(false);
        onStatusChange?.(false);
      }
    } catch (error) {
      console.warn('Google Drive not configured:', error);
      setIsConnected(false);
      setIsConfigured(false);
      onStatusChange?.(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await fileManager.connectToGoogleDrive();
      if (success) {
        setIsConnected(true);
        onStatusChange?.(true);
      } else {
        setError('Failed to connect to Google Drive');
      }
    } catch (error) {
      console.error('Connection error:', error);
      let errorMessage = 'Failed to connect to Google Drive';
      
      if (error instanceof Error) {
        if (error.message.includes('popup')) {
          errorMessage = 'Please allow popups for this site and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Connection timed out. Please check your internet connection.';
        } else if (error.message.includes('not configured')) {
          errorMessage = 'Google Drive API credentials are not configured.';
        } else if (error.message.includes('OAuth origin not authorized')) {
          errorMessage = `OAuth configuration error: Please add ${window.location.origin} to your Google Cloud Console OAuth 2.0 client authorized JavaScript origins.`;
        } else if (error.message.includes('idpiframe_initialization_failed')) {
          errorMessage = `Authorization failed: Please add ${window.location.origin} to your Google Cloud Console OAuth authorized origins.`;
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fileManager.disconnectFromGoogleDrive();
      setIsConnected(false);
      setDriveBackups([]);
      setShowBackups(false);
      onStatusChange?.(false);
    } catch (error) {
      console.error('Disconnect error:', error);
      setError('Failed to disconnect from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncBackup = async () => {
    setSyncLoading(true);
    setError(null);
    try {
      await fileManager.syncBackupToGoogleDrive();
      alert('Backup synced to Google Drive successfully!');
      if (showBackups) {
        await loadDriveBackups();
      }
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync backup';
      setError(errorMessage);
      alert(`Failed to sync backup: ${errorMessage}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const loadDriveBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      const backups = await fileManager.listGoogleDriveBackups();
      setDriveBackups(backups);
    } catch (error) {
      console.error('Error loading backups:', error);
      setError('Failed to load Google Drive backups');
    } finally {
      setLoading(false);
    }
  };

  const handleShowBackups = async () => {
    if (!showBackups) {
      await loadDriveBackups();
    }
    setShowBackups(!showBackups);
  };

  const handleRestoreFromDrive = async (fileId: string, fileName: string) => {
    if (!confirm(`Restore backup from "${fileName}"?\n\nThis will overwrite existing files with the same names.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await fileManager.restoreFromGoogleDriveBackup(fileId);
      
      let message = `Backup restored successfully!\n\nRestored: ${results.success} files`;
      if (results.failed > 0) {
        message += `\nFailed: ${results.failed} files`;
        if (results.errors.length > 0) {
          message += `\n\nErrors:\n${results.errors.slice(0, 3).join('\n')}`;
          if (results.errors.length > 3) {
            message += `\n... and ${results.errors.length - 3} more errors`;
          }
        }
      }
      
      alert(message);
    } catch (error) {
      console.error('Restore error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore backup';
      setError(errorMessage);
      alert(`Failed to restore backup: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFromDrive = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete backup "${fileName}" from Google Drive?\n\nThis action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const success = await fileManager.deleteGoogleDriveBackup(fileId);
      if (success) {
        setDriveBackups(prev => prev.filter(backup => backup.id !== fileId));
        alert('Backup deleted from Google Drive successfully!');
      } else {
        setError('Failed to delete backup from Google Drive');
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete backup';
      setError(errorMessage);
      alert(`Failed to delete backup: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {/* Configuration Checker - Show when there are errors */}
      {(error && (error.includes('OAuth') || error.includes('idpiframe') || error.includes('authorized'))) && (
        <GoogleDriveConfigChecker />
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">☁️</span>
          <h3 className="font-semibold text-gray-800">Google Drive Sync</h3>
          {isConnected && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Connected
            </span>
          )}
        </div>
        
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {loading ? '⏳ Connecting...' : '🔗 Connect'}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
          >
            {loading ? '⏳ Disconnecting...' : '🔗 Disconnect'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {isConnected && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={handleSyncBackup}
              disabled={syncLoading}
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
            >
              {syncLoading ? '⏳ Syncing...' : '☁️ Sync Backup'}
            </button>
            
            <button
              onClick={handleShowBackups}
              disabled={loading}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              {showBackups ? '👁️ Hide' : '👁️ Show'} Backups
            </button>
          </div>

          {showBackups && (
            <div className="border-t pt-3">
              <h4 className="font-medium text-gray-700 mb-2 text-sm">
                Google Drive Backups ({driveBackups.length})
              </h4>
              
              {loading ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  Loading backups...
                </div>
              ) : driveBackups.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No backups found in Google Drive
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {driveBackups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {backup.name}
                        </p>
                        <p className="text-gray-500">
                          {formatDate(backup.modifiedTime)} • {formatFileSize(backup.size)}
                        </p>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => handleRestoreFromDrive(backup.id, backup.name)}
                          disabled={loading}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded disabled:opacity-50"
                          title="Restore from this backup"
                        >
                          📥
                        </button>
                        <button
                          onClick={() => handleDeleteFromDrive(backup.id, backup.name)}
                          disabled={loading}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete from Google Drive"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isConfigured && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p className="mb-2">📋 Google Drive not configured</p>
          <p className="text-xs text-gray-400">
            Add Google Drive credentials to enable cloud backup sync.
          </p>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
              Setup instructions
            </summary>
            <div className="mt-2 text-left bg-gray-50 p-2 rounded">
              <p>1. Get credentials from Google Cloud Console</p>
              <p>2. Add to .env.local:</p>
              <code className="block mt-1 text-xs bg-gray-100 p-1 rounded">
                PUBLIC_GOOGLE_CLIENT_ID=your_id<br/>
                PUBLIC_GOOGLE_API_KEY=your_key
              </code>
              <p className="mt-1">3. Restart server</p>
            </div>
          </details>
        </div>
      )}

      {isConfigured && !isConnected && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>Connect to Google Drive to automatically sync your backups to the cloud.</p>
          <p className="mt-1 text-xs text-gray-400">
            Your data will be stored securely in your Google Drive.
          </p>
        </div>
      )}
    </div>
  );
}