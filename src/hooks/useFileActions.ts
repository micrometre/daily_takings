import { useState } from 'react';
import { FileManager } from '../components/FileManager';
import { ReportGenerator, type SalesData } from '../utils/reportGenerator';

export function useFileActions(
  onFileSelect: (fileName: string) => void, 
  selectedFile: string | null,
  onFilesChange: () => void
) {
  const [loading, setLoading] = useState(false);
  const fileManager = FileManager.getInstance();

  const handleDelete = async (fileName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete ${fileName}? This action cannot be undone.`)) {
      const success = await fileManager.deleteSalesFile(fileName);
      if (success) {
        onFilesChange(); // Trigger refresh of file list
        if (selectedFile === fileName) {
          onFileSelect('');
        }
      } else {
        alert('Failed to delete file');
      }
    }
  };

  const handleOpenInNewTab = async (fileName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const salesData = await fileManager.readSalesFile(fileName);
      if (!salesData) {
        alert('Failed to load sales data');
        return;
      }

      // Create HTML content for the sales report
      const htmlContent = ReportGenerator.generateWebReportHTML(salesData as SalesData, fileName);
      
      // Create a blob and open in new tab
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      // Clean up the URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      if (!newWindow) {
        alert('Please allow popups to open the sales report in a new tab');
      }
    } catch (error) {
      console.error('Error opening file in new tab:', error);
      alert('Failed to open file in new tab');
    }
  };

  const handleExportToPDF = async (fileName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const salesData = await fileManager.readSalesFile(fileName);
      if (!salesData) {
        alert('Failed to load sales data');
        return;
      }

      // Create HTML content optimized for PDF
      const htmlContent = ReportGenerator.generatePDFReportHTML(salesData as SalesData, fileName);
      
      // Create a hidden iframe to render the content
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm'; // A4 width
      iframe.style.height = '297mm'; // A4 height
      document.body.appendChild(iframe);

      // Write content to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Wait for content to load, then trigger print
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.print();
            // Clean up after a delay
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          }, 500);
        };
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF');
    }
  };

  return {
    handleDelete,
    handleOpenInNewTab,
    handleExportToPDF,
    loading,
    setLoading
  };
}