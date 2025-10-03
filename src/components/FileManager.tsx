import type { SalesFile, SalesSummary } from '../types/sales';
import { GoogleDriveAPI } from '../utils/GoogleDriveAPI';

// Re-export types for convenience
export type { SalesFile, SalesSummary } from '../types/sales';


async function exploreOPFS(dirHandle?: FileSystemDirectoryHandle) {
  dirHandle = dirHandle || await navigator.storage.getDirectory();
  for await (const entry of dirHandle.values()) {
    console.log(`${entry.kind}: ${entry.name}`);
    if (entry.kind === 'directory') {
      await exploreOPFS(entry as FileSystemDirectoryHandle); // Recursively explore subdirectories
    }
  }
}






export class FileManager {
  private static instance: FileManager;
  private root: FileSystemDirectoryHandle | null = null;
  private googleDriveAPI: GoogleDriveAPI | null = null;

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  private constructor() {
    // Google Drive API will be initialized lazily when needed
  }

  private initializeGoogleDriveAPI(): GoogleDriveAPI | null {
    if (this.googleDriveAPI) {
      return this.googleDriveAPI;
    }

    try {
      // Try different ways to access environment variables depending on the build system
      let clientId = '';
      let apiKey = '';

      // For Astro (PUBLIC_ prefix for client-side variables)
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        clientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || 
                  import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        apiKey = import.meta.env.PUBLIC_GOOGLE_API_KEY || 
                import.meta.env.VITE_GOOGLE_API_KEY || '';
      }

      // For Create React App (if process.env is available)
      if (!clientId && typeof process !== 'undefined' && process.env) {
        clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
        apiKey = process.env.REACT_APP_GOOGLE_API_KEY || '';
      }

      // For runtime configuration (you can also set these on window object)
      if (!clientId && typeof window !== 'undefined') {
        const config = (window as any).APP_CONFIG;
        if (config) {
          clientId = config.GOOGLE_CLIENT_ID || '';
          apiKey = config.GOOGLE_API_KEY || '';
        }
      }
      
      if (clientId && apiKey) {
        this.googleDriveAPI = new GoogleDriveAPI(clientId, apiKey);
        return this.googleDriveAPI;
      }
    } catch (error) {
      console.warn('Failed to initialize Google Drive API:', error);
    }

    return null;
  }

  private async getRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.root) {
      this.root = await navigator.storage.getDirectory();
    }
    return this.root;
  }

  async listSalesFiles(): Promise<SalesFile[]> {
    try {
      exploreOPFS(); // For debugging: log OPFS structure to console
      const root = await this.getRoot();
      const files: SalesFile[] = [];

      // TypeScript workaround for OPFS API
      const entries = (root as any).entries();
      for await (const [name, handle] of entries) {
        if (handle.kind === 'file' && name.startsWith('sales_') && name.endsWith('.json')) {
          const file = await handle.getFile();
          const dateMatch = name.match(/sales_(\d{4}-\d{2}-\d{2})\.json/);
          const date = dateMatch ? dateMatch[1] : 'Unknown';
          
          files.push({
            name,
            date,
            lastModified: new Date(file.lastModified)
          });
        }
      }

      // Sort by date descending (most recent first)
      return files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      console.error('Error listing sales files:', error);
      return [];
    }
  }

  async readSalesFile(fileName: string): Promise<SalesSummary | null> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      return JSON.parse(content) as SalesSummary;
    } catch (error) {
      console.error('Error reading sales file:', error);
      return null;
    }
  }

  async deleteSalesFile(fileName: string): Promise<boolean> {
    try {
      const root = await this.getRoot();
      await root.removeEntry(fileName);
      return true;
    } catch (error) {
      console.error('Error deleting sales file:', error);
      return false;
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  formatCurrency(amount: number): string {
    return `£${amount.toFixed(2)}`;
  }

  async createBackup(): Promise<string> {
    try {
      const files = await this.listSalesFiles();
      const backupData: any = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        fileCount: files.length,
        data: []
      };

      // Read all sales files and include their data
      for (const file of files) {
        const salesData = await this.readSalesFile(file.name);
        if (salesData) {
          backupData.data.push({
            fileName: file.name,
            date: file.date,
            lastModified: file.lastModified.toISOString(),
            salesData: salesData
          });
        }
      }

      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  async downloadBackup(): Promise<void> {
    try {
      const backupJson = await this.createBackup();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `daily-takings-backup-${timestamp}.json`;
      
      // Create and download the backup file
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('Failed to download backup');
    }
  }

  async restoreFromBackup(backupFile: File): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const fileContent = await backupFile.text();
      const backupData = JSON.parse(fileContent);
      
      // Validate backup structure
      if (!backupData.data || !Array.isArray(backupData.data)) {
        throw new Error('Invalid backup file format');
      }

      const results = { success: 0, failed: 0, errors: [] as string[] };
      
      // Restore each file
      for (const item of backupData.data) {
        try {
          if (!item.fileName || !item.salesData) {
            results.failed++;
            results.errors.push(`Invalid data structure for file: ${item.fileName || 'unknown'}`);
            continue;
          }

          // Write the sales data back to OPFS
          const root = await this.getRoot();
          const fileHandle = await root.getFileHandle(item.fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(JSON.stringify(item.salesData, null, 2));
          await writable.close();
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to restore ${item.fileName}: ${error}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error(`Failed to restore backup: ${error}`);
    }
  }

  async validateBackupFile(file: File): Promise<{ valid: boolean; fileCount?: number; timestamp?: string; errors: string[] }> {
    try {
      const content = await file.text();
      const data = JSON.parse(content);
      const errors: string[] = [];

      // Check required fields
      if (!data.timestamp) errors.push('Missing timestamp');
      if (!data.version) errors.push('Missing version');
      if (!data.data || !Array.isArray(data.data)) errors.push('Missing or invalid data array');
      
      // Check data structure
      if (data.data) {
        for (let i = 0; i < Math.min(data.data.length, 5); i++) { // Check first 5 items
          const item = data.data[i];
          if (!item.fileName) errors.push(`Item ${i + 1}: Missing fileName`);
          if (!item.salesData) errors.push(`Item ${i + 1}: Missing salesData`);
        }
      }

      return {
        valid: errors.length === 0,
        fileCount: data.fileCount || data.data?.length,
        timestamp: data.timestamp,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid JSON format or corrupted file']
      };
    }
  }

  // Google Drive Integration Methods
  async connectToGoogleDrive(): Promise<boolean> {
    const googleDriveAPI = this.initializeGoogleDriveAPI();
    if (!googleDriveAPI) {
      throw new Error('Google Drive API not configured. Please set REACT_APP_GOOGLE_CLIENT_ID and REACT_APP_GOOGLE_API_KEY environment variables.');
    }
    
    try {
      return await googleDriveAPI.signIn();
    } catch (error) {
      console.error('Failed to connect to Google Drive:', error);
      throw new Error('Failed to connect to Google Drive');
    }
  }

  async disconnectFromGoogleDrive(): Promise<void> {
    const googleDriveAPI = this.initializeGoogleDriveAPI();
    if (googleDriveAPI) {
      await googleDriveAPI.signOut();
    }
  }

  isConnectedToGoogleDrive(): boolean {
    const googleDriveAPI = this.initializeGoogleDriveAPI();
    return googleDriveAPI ? googleDriveAPI.isSignedIn() : false;
  }

  async syncBackupToGoogleDrive(): Promise<string> {
    const googleDriveAPI = this.initializeGoogleDriveAPI();
    if (!googleDriveAPI) {
      throw new Error('Google Drive API not configured');
    }

    if (!googleDriveAPI.isSignedIn()) {
      throw new Error('Not connected to Google Drive');
    }

    try {
      const backupJson = await this.createBackup();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `daily-takings-backup-${timestamp}.json`;
      
      const fileId = await googleDriveAPI.uploadBackup(backupJson, fileName);
      return fileId;
    } catch (error) {
      console.error('Error syncing backup to Google Drive:', error);
      throw new Error('Failed to sync backup to Google Drive');
    }
  }

  async downloadAndSyncBackup(): Promise<void> {
    try {
      // Create local backup
      await this.downloadBackup();
      
      // Also sync to Google Drive if connected
      if (this.isConnectedToGoogleDrive()) {
        await this.syncBackupToGoogleDrive();
      }
    } catch (error) {
      console.error('Error in download and sync:', error);
      throw error;
    }
  }

  async listGoogleDriveBackups() {
    const googleDriveAPI = this.initializeGoogleDriveAPI();
    if (!googleDriveAPI) {
      throw new Error('Google Drive API not configured');
    }

    if (!googleDriveAPI.isSignedIn()) {
      throw new Error('Not connected to Google Drive');
    }

    return await googleDriveAPI.listBackups();
  }

  async restoreFromGoogleDriveBackup(fileId: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const googleDriveAPI = this.initializeGoogleDriveAPI();
    if (!googleDriveAPI) {
      throw new Error('Google Drive API not configured');
    }

    if (!googleDriveAPI.isSignedIn()) {
      throw new Error('Not connected to Google Drive');
    }

    try {
      const backupContent = await googleDriveAPI.downloadBackup(fileId);
      
      // Create a temporary file object for the restore function
      const tempFile = new File([backupContent], 'google-drive-backup.json', {
        type: 'application/json'
      });
      
      return await this.restoreFromBackup(tempFile);
    } catch (error) {
      console.error('Error restoring from Google Drive backup:', error);
      throw new Error('Failed to restore from Google Drive backup');
    }
  }

  async deleteGoogleDriveBackup(fileId: string): Promise<boolean> {
    const googleDriveAPI = this.initializeGoogleDriveAPI();
    if (!googleDriveAPI) {
      throw new Error('Google Drive API not configured');
    }

    if (!googleDriveAPI.isSignedIn()) {
      throw new Error('Not connected to Google Drive');
    }

    return await googleDriveAPI.deleteBackup(fileId);
  }
}