import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

/**
 * Local Storage Service
 * Handles storing interview recordings locally on the server
 */
class LocalStorageService {
  private storageDir: string;

  constructor() {
    // Store recordings in a dedicated folder
    this.storageDir = path.join(__dirname, '../recordings');
    this.ensureStorageDirectory();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDirectory() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      console.log(`[Local Storage] Created recordings directory: ${this.storageDir}`);
    }
  }

  /**
   * Save uploaded file to local storage
   */
  async saveRecording(
    filePath: string,
    fileName: string
  ): Promise<{ savedPath: string; url: string }> {
    try {
      // Change extension to .mp4
      const mp4FileName = fileName.replace('.webm', '.mp4');
      const destPath = path.join(this.storageDir, mp4FileName);
      
      console.log(`[Local Storage] Converting ${fileName} to MP4...`);
      console.log(`[Local Storage] File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
      
      // Convert WebM to MP4 using FFmpeg with optimized settings for large files
      return new Promise((resolve, reject) => {
        const conversion = ffmpeg(filePath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .audioBitrate('128k')
          .videoBitrate('2500k')
          .outputOptions([
            '-preset faster',           // Faster encoding
            '-crf 23',                  // Quality
            '-pix_fmt yuv420p',         // Compatibility
            '-movflags +faststart',     // Web playback
            '-max_muxing_queue_size 9999',  // Large buffer for big files
            '-strict experimental',
            '-avoid_negative_ts make_zero'  // Fix timestamp issues
          ])
          .output(destPath)
          .on('start', (cmd) => {
            console.log(`[Local Storage] FFmpeg started`);
            console.log(`[Local Storage] Command: ${cmd.substring(0, 200)}...`);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`[Local Storage] Progress: ${progress.percent.toFixed(1)}%`);
            }
          })
          .on('end', () => {
            if (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0) {
              console.error('[Local Storage] ❌ Conversion produced empty file!');
              // Fallback to WebM
              const webmDest = path.join(this.storageDir, fileName);
              fs.copyFileSync(filePath, webmDest);
              resolve({
                savedPath: webmDest,
                url: `/recordings/${fileName}`
              });
              return;
            }
            
            const outputSize = (fs.statSync(destPath).size / 1024 / 1024).toFixed(2);
            console.log(`[Local Storage] ✅ Conversion complete: ${destPath}`);
            console.log(`[Local Storage] Output size: ${outputSize} MB`);
            
            // Clean up original WebM file
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[Local Storage] Cleaned up temp file`);
              }
            } catch (err) {
              console.warn('[Local Storage] Could not delete temp file:', err);
            }
            
            resolve({
              savedPath: destPath,
              url: `/recordings/${mp4FileName}`
            });
          })
          .on('error', (err, stdout, stderr) => {
            console.error(`[Local Storage] ❌ FFmpeg error: ${err.message}`);
            if (stderr) {
              console.error(`[Local Storage] FFmpeg stderr: ${stderr.substring(stderr.length - 1000)}`);
            }
            
            // Fallback: save as WebM if conversion fails
            try {
              const webmDest = path.join(this.storageDir, fileName);
              fs.copyFileSync(filePath, webmDest);
              console.log(`[Local Storage] ⚠️ Saved as WebM instead: ${webmDest}`);
              resolve({
                savedPath: webmDest,
                url: `/recordings/${fileName}`
              });
            } catch (copyErr: any) {
              console.error(`[Local Storage] Failed to save fallback WebM:`, copyErr.message);
              reject(err);
            }
          });
        
        conversion.run();
      });
    } catch (error: any) {
      console.error('[Local Storage] Save error:', error.message);
      throw new Error('Failed to save recording locally');
    }
  }

  /**
   * Get all recordings
   */
  getAllRecordings(): Array<{ fileName: string; filePath: string; size: number; createdAt: Date }> {
    try {
      const files = fs.readdirSync(this.storageDir);
      
      return files.map(fileName => {
        const filePath = path.join(this.storageDir, fileName);
        const stats = fs.statSync(filePath);
        
        return {
          fileName,
          filePath,
          size: stats.size,
          createdAt: stats.birthtime
        };
      });
    } catch (error: any) {
      console.error('[Local Storage] List error:', error.message);
      return [];
    }
  }

  /**
   * Delete a recording
   */
  deleteRecording(fileName: string): boolean {
    try {
      const filePath = path.join(this.storageDir, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Local Storage] Deleted recording: ${fileName}`);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('[Local Storage] Delete error:', error.message);
      return false;
    }
  }

  /**
   * Get storage directory path
   */
  getStorageDirectory(): string {
    return this.storageDir;
  }
}

export default LocalStorageService;
