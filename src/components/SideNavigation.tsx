import { useState, useEffect } from 'react';
import { FileManager } from './FileManager';
import { FileList } from './FileList';
import { BackupManager } from './BackupManager';
import type { SalesFile } from '../types/sales';

interface SideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (fileName: string) => void;
  selectedFile: string | null;
}

export default function SideNavigation({ isOpen, onClose, onFileSelect, selectedFile }: SideNavigationProps) {
  const [files, setFiles] = useState<SalesFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileManager = FileManager.getInstance();

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const salesFiles = await fileManager.listSalesFiles();
      setFiles(salesFiles);
    } catch (err) {
      setError('Failed to load sales files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Side Navigation */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto lg:shadow-md lg:w-80
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                📁 Sales Files
              </h2>
              <div className="flex items-center space-x-2">
                <BackupManager 
                  onFilesChange={loadFiles}
                />
                <button
                  onClick={loadFiles}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                  title="Refresh files"
                >
                  🔄
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors lg:hidden"
                  title="Close sidebar"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <FileList
              files={files}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              onFilesChange={loadFiles}
              loading={loading}
              error={error}
              onRetry={loadFiles}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center mb-2">
              {files.length} file{files.length !== 1 ? 's' : ''} found
            </p>
            {files.length > 5 && (
              <div className="text-xs text-center">
                <p className="text-amber-600 mb-1">💡 Consider backing up your data!</p>
                <BackupManager 
                  onFilesChange={loadFiles}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}