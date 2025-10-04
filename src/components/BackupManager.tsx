import { useState } from 'react';
import { FileManager } from './FileManager';

interface BackupManagerProps {
  onFilesChange: () => void;
  disabled?: boolean;
}

export function BackupManager({ onFilesChange, disabled = false }: BackupManagerProps) {
  const [loading, setLoading] = useState(false);
  const fileManager = FileManager.getInstance();

  const handleBackupDownload = async () => {
    setLoading(true);
    try {
      await fileManager.downloadBackup();
      alert('Backup downloaded successfully!');
    } catch (error) {
      console.error('Backup error:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupRestore = () => {
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setLoading(true);
      try {
        // Validate backup file first
        const validation = await fileManager.validateBackupFile(file);
        
        if (!validation.valid) {
          alert(`Invalid backup file:\n${validation.errors.join('\n')}`);
          return;
        }

        // Show confirmation with file details
        const confirmMessage = `Restore backup from ${validation.timestamp ? new Date(validation.timestamp).toLocaleDateString() : 'unknown date'}?\n\nThis will restore ${validation.fileCount || 'unknown'} files.\nExisting files with the same names will be overwritten.\n\nContinue?`;
        
        if (!confirm(confirmMessage)) return;

        // Perform restore
        const results = await fileManager.restoreFromBackup(file);
        
        // Show results
        let message = `Backup restore completed!\n\nSuccessfully restored: ${results.success} files`;
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
        
        // Refresh file list
        onFilesChange();
      } catch (error) {
        console.error('Restore error:', error);
        alert(`Failed to restore backup: ${error}`);
      } finally {
        setLoading(false);
        document.body.removeChild(input);
      }
    };
    
    document.body.appendChild(input);
    input.click();
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleBackupDownload}
        disabled={loading || disabled}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        title="Download backup"
      >
        {loading ? '⏳' : '💾'}
      </button>
      <button
        onClick={handleBackupRestore}
        disabled={loading || disabled}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        title="Restore from backup"
      >
        📤
      </button>
    </div>
  );
}

// Hook version for more flexibility
export function useBackupManager(onFilesChange: () => void) {
  const [loading, setLoading] = useState(false);
  const fileManager = FileManager.getInstance();

  const downloadBackup = async () => {
    setLoading(true);
    try {
      await fileManager.downloadBackup();
      return { success: true, message: 'Backup downloaded successfully!' };
    } catch (error) {
      console.error('Backup error:', error);
      return { success: false, message: 'Failed to create backup. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = () => {
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve({ success: false, message: 'No file selected' });
          return;
        }

        setLoading(true);
        try {
          const validation = await fileManager.validateBackupFile(file);
          
          if (!validation.valid) {
            resolve({ 
              success: false, 
              message: `Invalid backup file:\n${validation.errors.join('\n')}` 
            });
            return;
          }

          const confirmMessage = `Restore backup from ${validation.timestamp ? new Date(validation.timestamp).toLocaleDateString() : 'unknown date'}?\n\nThis will restore ${validation.fileCount || 'unknown'} files.\nExisting files with the same names will be overwritten.\n\nContinue?`;
          
          if (!confirm(confirmMessage)) {
            resolve({ success: false, message: 'Restore cancelled by user' });
            return;
          }

          const results = await fileManager.restoreFromBackup(file);
          
          let message = `Backup restore completed!\n\nSuccessfully restored: ${results.success} files`;
          if (results.failed > 0) {
            message += `\nFailed: ${results.failed} files`;
            if (results.errors.length > 0) {
              message += `\n\nErrors:\n${results.errors.slice(0, 3).join('\n')}`;
              if (results.errors.length > 3) {
                message += `\n... and ${results.errors.length - 3} more errors`;
              }
            }
          }
          
          onFilesChange();
          resolve({ success: true, message });
        } catch (error) {
          console.error('Restore error:', error);
          resolve({ success: false, message: `Failed to restore backup: ${error}` });
        } finally {
          setLoading(false);
          document.body.removeChild(input);
        }
      };
      
      document.body.appendChild(input);
      input.click();
    });
  };

  return {
    loading,
    downloadBackup,
    restoreBackup
  };
}