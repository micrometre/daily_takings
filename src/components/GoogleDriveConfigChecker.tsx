import { useState } from 'react';

export default function GoogleDriveConfigChecker() {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
  const clientId = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_GOOGLE_CLIENT_ID) || 'Not configured';
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_GOOGLE_API_KEY) || 'Not configured';

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-medium text-blue-800">
          🔧 Google Drive Configuration Checker
        </span>
        <span className="text-blue-600">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-3 text-xs">
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold text-gray-800 mb-2">Current Configuration</h4>
            <div className="space-y-1">
              <div>
                <strong>Current Origin:</strong> 
                <code className="ml-1 bg-gray-100 px-1 rounded">{currentOrigin}</code>
              </div>
              <div>
                <strong>Client ID:</strong> 
                <code className="ml-1 bg-gray-100 px-1 rounded text-xs">
                  {clientId.length > 50 ? `${clientId.substring(0, 50)}...` : clientId}
                </code>
              </div>
              <div>
                <strong>API Key:</strong> 
                <code className="ml-1 bg-gray-100 px-1 rounded">
                  {apiKey !== 'Not configured' ? `${apiKey.substring(0, 10)}...` : apiKey}
                </code>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ OAuth Configuration Required</h4>
            <p className="text-yellow-700 mb-2">
              To fix the "idpiframe_initialization_failed" error, add this origin to your Google Cloud Console:
            </p>
            <div className="bg-yellow-100 p-2 rounded">
              <code className="text-sm">{currentOrigin}</code>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-3 rounded">
            <h4 className="font-semibold text-green-800 mb-2">✅ How to Fix</h4>
            <ol className="list-decimal list-inside space-y-1 text-green-700">
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Find your OAuth 2.0 Client ID</li>
              <li>Click edit (pencil icon)</li>
              <li>Add <code className="bg-green-100 px-1 rounded">{currentOrigin}</code> to "Authorized JavaScript origins"</li>
              <li>Save and wait 5-10 minutes</li>
              <li>Refresh this page and try connecting again</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}