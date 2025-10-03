import type { SalesFile, SalesSummary } from '../types/sales';

// Re-export types for convenience
export type { SalesFile, SalesSummary } from '../types/sales';

export class FileManager {
  private static instance: FileManager;
  private root: FileSystemDirectoryHandle | null = null;

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  private async getRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.root) {
      this.root = await navigator.storage.getDirectory();
    }
    return this.root;
  }

  async listSalesFiles(): Promise<SalesFile[]> {
    try {
      const root = await this.getRoot();
      const files: SalesFile[] = [];

      // TypeScript workaround for OPFS API
      const entries = (root as any).entries();
      for await (const [name, handle] of entries) {
        if (handle.kind === 'file' && name.startsWith('sales_') && name.endsWith('.txt')) {
          const file = await handle.getFile();
          const dateMatch = name.match(/sales_(\d{4}-\d{2}-\d{2})\.txt/);
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
}