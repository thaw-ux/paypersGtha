import { getDriveClient } from './auth';
import { Readable } from 'stream';
import { sanitizeFilename } from '../utils';

export class DriveService {
  /**
   * Find or create a subfolder inside a parent folder in Google Drive
   */
  static async findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const drive = await getDriveClient();
    
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create new folder
    const fileMetadata: { name: string; mimeType: string; parents?: string[] } = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return folder.data.id!;
  }

  private static get rootFolderId(): string | undefined {
    const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!id) return undefined;
    const match = id.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    return id.trim();
  }

  /**
   * Ensure standard hierarchy: Expenses/{YYYY}/{MM}
   */
  static async getDatedExpenseFolder(date: Date = new Date()): Promise<string> {
    const rootFolderId = this.rootFolderId;
    
    // 1. Root/Parent: Expenses
    const expensesFolderId = await this.findOrCreateFolder('Expenses', rootFolderId || undefined);
    
    // 2. Year: {YYYY}
    const year = date.getFullYear().toString();
    const yearFolderId = await this.findOrCreateFolder(year, expensesFolderId);

    // 3. Month: {MM}
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const monthFolderId = await this.findOrCreateFolder(month, yearFolderId);

    return monthFolderId;
  }

  /**
   * Upload file buffer to Google Drive
   */
  static async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    date: Date = new Date()
  ): Promise<{ fileId: string; webViewLink?: string; webContentLink?: string }> {
    const drive = await getDriveClient();
    const targetFolderId = await this.getDatedExpenseFolder(date);

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    const safeFilename = sanitizeFilename(filename);

    const file = await drive.files.create({
      requestBody: {
        name: safeFilename,
        parents: [targetFolderId],
      },
      media: {
        mimeType: mimeType || 'image/jpeg',
        body: readableStream,
      },
      fields: 'id, name, webViewLink, webContentLink',
    });

    return {
      fileId: file.data.id!,
      webViewLink: file.data.webViewLink || undefined,
      webContentLink: file.data.webContentLink || undefined,
    };
  }

  /**
   * Get file stream and metadata from Google Drive (for image proxy view)
   */
  static async getFileStream(fileId: string): Promise<{ stream: NodeJS.ReadableStream; mimeType: string }> {
    const drive = await getDriveClient();

    // Get metadata for mimeType
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType, name',
    });

    // Get binary stream
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return {
      stream: response.data as NodeJS.ReadableStream,
      mimeType: metadata.data.mimeType || 'image/jpeg',
    };
  }

  /**
   * Verify Drive Access and return Root Folder Information
   */
  static async testConnection(): Promise<{ success: boolean; rootFolderName?: string; error?: string }> {
    try {
      const drive = await getDriveClient();
      const folderId = this.rootFolderId;
      
      if (folderId) {
        const res = await drive.files.get({ fileId: folderId, fields: 'id, name' });
        return { success: true, rootFolderName: res.data.name || folderId };
      } else {
        const res = await drive.about.get({ fields: 'user, storageQuota' });
        return { success: true, rootFolderName: 'Drive Root (Default)' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Drive connection failed' };
    }
  }
}
