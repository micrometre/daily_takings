interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
}

interface DriveAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class GoogleDriveAPI {
  private accessToken: string | null = null;
  private clientId: string;
  private apiKey: string;
  private discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  private scope = 'https://www.googleapis.com/auth/drive.file';
  private backupFolderId: string | null = null;

  constructor(clientId: string, apiKey: string) {
    this.clientId = clientId;
    this.apiKey = apiKey;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi === 'undefined') {
        // Load Google API script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          gapi.load('auth2:client', async () => {
            try {
              await gapi.client.init({
                apiKey: this.apiKey,
                clientId: this.clientId,
                discoveryDocs: [this.discoveryDoc],
                scope: this.scope
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }

  async signIn(): Promise<boolean> {
    try {
      await this.initialize();
      const authInstance = gapi.auth2.getAuthInstance();
      
      if (authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        const authResponse = user.getAuthResponse();
        this.accessToken = authResponse.access_token;
        return true;
      } else {
        const user = await authInstance.signIn();
        const authResponse = user.getAuthResponse();
        this.accessToken = authResponse.access_token;
        return true;
      }
    } catch (error) {
      console.error('Google Drive sign-in error:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.accessToken = null;
      this.backupFolderId = null;
    } catch (error) {
      console.error('Google Drive sign-out error:', error);
    }
  }

  isSignedIn(): boolean {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      return authInstance && authInstance.isSignedIn.get();
    } catch {
      return false;
    }
  }

  async findOrCreateBackupFolder(): Promise<string> {
    if (this.backupFolderId) {
      return this.backupFolderId;
    }

    try {
      // Search for existing backup folder
      const response = await gapi.client.drive.files.list({
        q: "name='Daily Takings Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        spaces: 'drive'
      });

      if (response.result.files && response.result.files.length > 0) {
        this.backupFolderId = response.result.files[0].id!;
        return this.backupFolderId!;
      }

      // Create new backup folder
      const folderResponse = await gapi.client.drive.files.create({
        resource: {
          name: 'Daily Takings Backups',
          mimeType: 'application/vnd.google-apps.folder'
        }
      });

      this.backupFolderId = folderResponse.result.id!;
      return this.backupFolderId!;
    } catch (error) {
      console.error('Error creating backup folder:', error);
      throw new Error('Failed to create backup folder in Google Drive');
    }
  }

  async uploadBackup(backupData: string, fileName: string): Promise<string> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with Google Drive');
      }

      const folderId = await this.findOrCreateBackupFolder();
      
      // Check if file already exists
      const existingFiles = await this.listBackups();
      const existingFile = existingFiles.find(file => file.name === fileName);

      const metadata = {
        name: fileName,
        parents: [folderId],
        description: `Daily Takings backup created on ${new Date().toISOString()}`
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([backupData], { type: 'application/json' }));

      let url: string;
      let method: string;

      if (existingFile) {
        // Update existing file
        url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
        method = 'PATCH';
      } else {
        // Create new file
        url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        method = 'POST';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error uploading backup to Google Drive:', error);
      throw new Error('Failed to upload backup to Google Drive');
    }
  }

  async listBackups(): Promise<GoogleDriveFile[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with Google Drive');
      }

      const folderId = await this.findOrCreateBackupFolder();
      
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name contains 'daily-takings-backup' and trashed=false`,
        orderBy: 'modifiedTime desc',
        fields: 'files(id,name,modifiedTime,size)'
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error listing backups from Google Drive:', error);
      return [];
    }
  }

  async downloadBackup(fileId: string): Promise<string> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with Google Drive');
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error downloading backup from Google Drive:', error);
      throw new Error('Failed to download backup from Google Drive');
    }
  }

  async deleteBackup(fileId: string): Promise<boolean> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with Google Drive');
      }

      const response = await gapi.client.drive.files.delete({
        fileId: fileId
      });

      return response.status === 200;
    } catch (error) {
      console.error('Error deleting backup from Google Drive:', error);
      return false;
    }
  }

  async getBackupInfo(fileId: string): Promise<GoogleDriveFile | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with Google Drive');
      }

      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id,name,modifiedTime,size'
      });

      return response.result as GoogleDriveFile;
    } catch (error) {
      console.error('Error getting backup info from Google Drive:', error);
      return null;
    }
  }

  formatFileSize(bytes: string): string {
    const size = parseInt(bytes);
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Global type declarations for Google API
declare global {
  interface Window {
    gapi: any;
  }
  var gapi: any;
}