import type { SalesFile } from '../types/sales';
import { FileManager } from './FileManager';
import { useFileActions } from '../hooks/useFileActions';

interface FileListProps {
  files: SalesFile[];
  selectedFile: string | null;
  onFileSelect: (fileName: string) => void;
  onFilesChange: () => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function FileList({ 
  files, 
  selectedFile, 
  onFileSelect, 
  onFilesChange,
  loading, 
  error, 
  onRetry 
}: FileListProps) {
  const fileManager = FileManager.getInstance();
  const { handleDelete, handleOpenInNewTab, handleExportToPDF } = useFileActions(
    onFileSelect, 
    selectedFile, 
    onFilesChange
  );

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

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        Loading files...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
        <button 
          onClick={onRetry}
          className="mt-2 text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-4xl mb-2">📄</div>
        <p>No sales files found</p>
        <p className="text-sm mt-1">Create some sales records to see them here</p>
      </div>
    );
  }

  return (
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
            
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => handleOpenInNewTab(file.name, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-all duration-200"
                title="Open in new tab"
              >
                🔗
              </button>
              <button
                onClick={(e) => handleExportToPDF(file.name, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-all duration-200"
                title="Export to PDF"
              >
                📄
              </button>
              <button
                onClick={(e) => handleDelete(file.name, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all duration-200"
                title="Delete file"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}