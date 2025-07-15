import fs from 'fs';
import path from 'path';
import os from 'os';

// Ensure temp directory exists
export const ensureTempDir = () => {
  const tempDir = process.env.NODE_ENV === "production" ? 
    os.tmpdir() : 
    path.join(process.cwd(), 'temp');
  
  if (!fs.existsSync(tempDir)) {
    try {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('✅ Temp directory created:', tempDir);
    } catch (error) {
      console.error('❌ Failed to create temp directory:', error);
    }
  }
  
  return tempDir;
};
