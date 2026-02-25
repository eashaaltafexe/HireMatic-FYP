import { Storage } from 'megajs';
import * as fs from 'fs';
import * as path from 'path';

export class MegaStorageService {
  private email: string;
  private password: string;
  private storage: any;

  constructor() {
    this.email = process.env.MEGA_EMAIL || 'hafsaatiq809@gmail.com';
    this.password = process.env.MEGA_PASSWORD || 'salamduniya321';
  }

  /**
   * Upload file to MEGA cloud storage
   */
  async uploadRecording(filePath: string): Promise<{ success: boolean; link?: string; error?: string }> {
    try {
      console.log('[MEGA] Starting upload process...');
      console.log('[MEGA] File:', filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileSize = fs.statSync(filePath).size;
      console.log('[MEGA] File size:', (fileSize / 1024 / 1024).toFixed(2), 'MB');

      // Login to MEGA
      console.log('[MEGA] Logging in to MEGA...');
      this.storage = await new Storage({
        email: this.email,
        password: this.password
      }).ready;

      console.log('[MEGA] ✅ Logged in successfully');

      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      
      // Get original filename and ensure .mp4 extension
      let fileName = path.basename(filePath);
      if (!fileName.endsWith('.mp4')) {
        fileName = fileName.replace(/\.[^/.]+$/, '') + '.mp4';
      }
      
      console.log('[MEGA] Uploading as:', fileName);

      // Upload file
      const uploadedFile = await this.storage.upload({
        name: fileName,
        size: fileBuffer.length
      }, fileBuffer).complete;

      console.log('[MEGA] ✅ Upload complete!');

      // Get shareable link
      const link = await uploadedFile.link();
      console.log('[MEGA] 📎 Share link:', link);

      // Delete local file after successful upload
      try {
        fs.unlinkSync(filePath);
        console.log('[MEGA] 🗑️ Deleted local file:', filePath);

        // Also delete the temp webm file if it exists
        const webmPath = filePath.replace('.mp4', '.webm');
        if (fs.existsSync(webmPath)) {
          fs.unlinkSync(webmPath);
          console.log('[MEGA] 🗑️ Deleted temp file:', webmPath);
        }
      } catch (deleteError) {
        console.warn('[MEGA] ⚠️ Could not delete local file:', deleteError);
      }

      return {
        success: true,
        link: link
      };

    } catch (error: any) {
      console.error('[MEGA] ❌ Upload error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test MEGA connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[MEGA] Testing connection...');
      this.storage = await new Storage({
        email: this.email,
        password: this.password
      }).ready;
      
      console.log('[MEGA] ✅ Connection successful');
      return true;
    } catch (error: any) {
      console.error('[MEGA] ❌ Connection failed:', error.message);
      return false;
    }
  }
}
