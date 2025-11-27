import mongoose from 'mongoose';

// Get MongoDB URI from environment variables - loaded by Next.js
const MONGODB_URI = process.env.MONGODB_URI;

console.log('MongoDB connection status:', !!MONGODB_URI);

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is missing!');
  console.error('Please check your .env.local file is properly formatted and contains the MongoDB connection string');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface CachedConnection {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

let cached: CachedConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    if (!MONGODB_URI) {
      throw new Error('MongoDB connection string is missing. Please check your environment variables.');
    }

    console.log('Connecting to MongoDB...');
    
    // Extract database name from MongoDB URI
    let dbName;
    try {
      // Parse the database name from the connection string
      // Format is typically: mongodb+srv://username:password@cluster.domain.tld/databaseName?options
      const dbNameMatch = MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
      dbName = dbNameMatch && dbNameMatch[1];
      
      if (!dbName) {
        console.warn('No database name found in the MongoDB URI, using connection without specifying database');
      } else {
        console.log(`Using database: ${dbName}`);
      }
    } catch (error) {
      console.error('Error parsing MongoDB URI:', error);
    }
    
    const connectionOptions = {
      ...opts,
      ...(dbName ? { dbName } : {}) // Only add dbName if it was successfully extracted
    };

    cached.promise = mongoose.connect(MONGODB_URI, connectionOptions)
      .then((mongoose) => {
        console.log('Connected to MongoDB successfully!');
        if (mongoose.connection && mongoose.connection.db) {
          console.log('Connected to database:', mongoose.connection.db.databaseName);
        }
        return mongoose;
      })
      .catch(err => {
        console.error('MongoDB connection error:', err);
        throw err;
      });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
