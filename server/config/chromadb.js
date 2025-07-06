const { ChromaClient } = require('chromadb');

let chromaClient = null;
let isConnected = false;

const connectToChroma = async (retries = 3, delay = 2000) => {
  const chromaHost = process.env.CHROMA_HOST || 'localhost';
  const chromaPort = process.env.CHROMA_PORT || 8000;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempting to connect to ChromaDB at: http://${chromaHost}:${chromaPort} (attempt ${attempt}/${retries})`);
      
      chromaClient = new ChromaClient({
        host: chromaHost,
        port: chromaPort,
      });
      
      // Test the connection by trying to list collections
      await chromaClient.listCollections();
      
      console.log('Successfully connected to ChromaDB');
      isConnected = true;
      
      // Initialize required collections
      await initializeCollections();
      
      return chromaClient;
    } catch (error) {
      console.error(`ChromaDB connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        console.error('Failed to connect to ChromaDB after all retries');
        console.error('ChromaDB connection error: Failed to connect to chromadb. Make sure your server is running and try again. If you are running from a browser, make sure that your chromadb instance is configured to allow requests from the current origin using the CHROMA_SERVER_CORS_ALLOW_ORIGINS environment variable.');
        console.error(`Make sure ChromaDB server is running on http://${chromaHost}:${chromaPort}`);
        console.error('To start ChromaDB, run: docker run -p 8000:8000 chromadb/chroma');
        
        // Don't crash the server, just mark as disconnected
        isConnected = false;
        return null;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const initializeCollections = async () => {
  if (!chromaClient) return;
  
  const collections = ['users', 'leads', 'applications', 'communications'];
  
  for (const collectionName of collections) {
    try {
      await chromaClient.getOrCreateCollection({
        name: collectionName,
      });
      console.log(`Collection '${collectionName}' initialized`);
    } catch (error) {
      console.error(`Error initializing collection '${collectionName}':`, error.message);
    }
  }
};

const getChromaClient = () => {
  if (!isConnected || !chromaClient) {
    throw new Error('ChromaDB is not connected. Please ensure ChromaDB server is running.');
  }
  return chromaClient;
};

const isChromaConnected = () => {
  return isConnected;
};

// Retry connection function for use in services
const retryConnection = async () => {
  if (!isConnected) {
    console.log('Attempting to reconnect to ChromaDB...');
    return await connectToChroma();
  }
  return chromaClient;
};

module.exports = {
  connectToChroma,
  getChromaClient,
  isChromaConnected,
  retryConnection,
};