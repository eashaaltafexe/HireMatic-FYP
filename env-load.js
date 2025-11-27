// This file explicitly loads environment variables from .env.local
// We'll require this at the entry point of the application
const path = require('path');
const fs = require('fs');

// Define paths
const rootDir = process.cwd();
const envLocalPath = path.join(rootDir, '.env.local');

console.log('\n=== Environment Variables Loader ===');
console.log('Loading from:', envLocalPath);

// Function to parse .env file
function parseEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Environment file not found: ${filePath}`);
      return false;
    }

    // Read the file as text
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for BOM and other encoding issues
    if (content.charCodeAt(0) === 0xFEFF || content.charCodeAt(0) === 0xEFBBBF) {
      console.warn('⚠️ File has BOM character, this might cause parsing issues');
    }
    
    // Split into lines and parse each line
    const lines = content.split(/\r?\n/);
    let envVars = {};
    
    for (const line of lines) {
      // Skip empty lines and comments
      if (!line || line.trim() === '' || line.trim().startsWith('#')) continue;
      
      // Find the first equals sign to split key/value
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      
      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      
      // Remove quotes if they exist
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      envVars[key] = value;
      
      // Set environment variable if not already defined
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
    
    console.log('✅ Loaded variables:');
    // Log found keys without exposing sensitive values
    for (const key of Object.keys(envVars)) {
      const value = envVars[key];
      const maskedValue = key.includes('SECRET') || key.includes('PASSWORD') || key.includes('URI') ? 
        `${value.substring(0, 5)}...${value.substring(value.length - 5)}` : value;
      console.log(`   - ${key}: ${maskedValue}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error loading environment file ${filePath}:`, error.message);
    return false;
  }
}

// Load environment variables
parseEnvFile(envLocalPath);

// Check critical variables
if (!process.env.MONGODB_URI) {
  console.error('⚠️ MONGODB_URI is not set or not properly loaded');
}

if (!process.env.JWT_SECRET) {
  console.error('⚠️ JWT_SECRET is not set or not properly loaded');
  
  // Set a fallback for development mode only
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Setting a temporary JWT_SECRET for development');
    process.env.JWT_SECRET = '72bb8c5361530fa31d69bbe0840cc09d178b7f57a2135368b507b151ac243156';
  }
}

module.exports = { loaded: true }; 