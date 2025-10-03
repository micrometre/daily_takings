import { useState, useEffect } from 'react';
import { FileManager } from './FileManager';
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

  const handleDelete = async (fileName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete ${fileName}? This action cannot be undone.`)) {
      const success = await fileManager.deleteSalesFile(fileName);
      if (success) {
        setFiles(prev => prev.filter(file => file.name !== fileName));
        if (selectedFile === fileName) {
          onFileSelect('');
        }
      } else {
        alert('Failed to delete file');
      }
    }
  };

  const formatFileDate = (file: SalesFile) => {
    return fileManager.formatDate(file.date);
  };

  const formatLastModified = (lastModified: Date) => {
    return lastModified.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            {loading && (
              <div className="p-4 text-center text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Loading files...
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-red-600">
                <p>{error}</p>
                <button 
                  onClick={loadFiles}
                  className="mt-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && files.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <div className="text-4xl mb-2">📄</div>
                <p>No sales files found</p>
                <p className="text-sm mt-1">Create some sales records to see them here</p>
              </div>
            )}

            {!loading && !error && files.length > 0 && (
              <div className="p-2">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className={`
                      group cursor-pointer p-3 rounded-lg mb-2 transition-all duration-200
                      ${selectedFile === file.name 
                        ? 'bg-blue-100 border-2 border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }
                    `}
                    onClick={() => onFileSelect(file.name)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">📊</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {formatFileDate(file)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {file.name}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">
                          Modified: {formatLastModified(file.lastModified)}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => handleDelete(file.name, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all duration-200"
                        title="Delete file"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {files.length} file{files.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      </div>
    </>
  );
}