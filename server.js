// Load environment variables first using our custom loader
require('./env-load');

// Enable TypeScript support
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
  },
});

// Check if MongoDB URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: MONGODB_URI is not defined in .env.local');
  console.error('Please check your .env.local file format and make sure it contains:');
  console.error('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
  process.exit(1);
}

// Log environment status
console.log('\x1b[32m%s\x1b[0m', 'Environment variables loaded successfully');
console.log('MongoDB Connection:', process.env.MONGODB_URI ? 'Found' : 'Not found');

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Prepare Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  console.log('\x1b[32m%s\x1b[0m', '✓ Next.js prepared successfully');
  
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Setup WebSocket for transcription
  try {
    const { setupTranscribeWebSocket } = require('./src/virtual-interviewer/server/transcribeWs.ts');
    setupTranscribeWebSocket(server);
    console.log('\x1b[32m%s\x1b[0m', '✓ WebSocket server initialized on /ws/transcribe');
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Failed to initialize WebSocket:', err.message);
  }

  server
    .once('error', (err) => {
      console.error('\x1b[31m%s\x1b[0m', '❌ Server error:');
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log('');
      console.log('\x1b[36m%s\x1b[0m', '🚀 HireMatic Server Ready!');
      console.log('');
      console.log(`   ➜ HTTP:      http://${hostname}:${port}`);
      console.log(`   ➜ WebSocket: ws://${hostname}:${port}/ws/transcribe`);
      console.log('');
      console.log('\x1b[33m%s\x1b[0m', '⏳ Next.js is compiling... (this may take 30-60 seconds)');
      console.log('\x1b[33m%s\x1b[0m', '   Visit http://localhost:3000 when ready');
      console.log('');
    });
  
  // Keep the process alive
  process.on('SIGTERM', () => {
    console.log('\x1b[33m%s\x1b[0m', 'SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
}).catch((err) => {
  console.error('\x1b[31m%s\x1b[0m', '❌ Failed to start server:');
  console.error(err);
  process.exit(1);
}); 