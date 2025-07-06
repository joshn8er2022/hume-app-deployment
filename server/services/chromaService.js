const { getChromaClient, isChromaConnected, retryConnection } = require('../config/chromadb');
const { v4: uuidv4 } = require('uuid');

class ChromaService {
  async ensureConnection() {
    if (!isChromaConnected()) {
      console.log('ChromaDB not connected, attempting to reconnect...');
      await retryConnection();
    }
    
    if (!isChromaConnected()) {
      throw new Error('ChromaDB is not available. Please ensure ChromaDB server is running on http://localhost:8000');
    }
  }

  async create(collectionName, data) {
    await this.ensureConnection();
    
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: collectionName });
    
    const id = uuidv4();
    const document = JSON.stringify(data);
    const metadata = this.extractMetadata(data);
    
    await collection.add({
      ids: [id],
      documents: [document],
      metadatas: [metadata]
    });
    
    return { _id: id, ...data };
  }

  async findOne(collectionName, query) {
    await this.ensureConnection();
    
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: collectionName });
    
    // Convert query to where clause
    const whereClause = this.buildWhereClause(query);
    
    try {
      const results = await collection.query({
        where: whereClause,
        nResults: 1
      });
      
      if (results.documents && results.documents[0] && results.documents[0].length > 0) {
        const data = JSON.parse(results.documents[0][0]);
        return { _id: results.ids[0][0], ...data };
      }
      
      return null;
    } catch (error) {
      console.error('Error in findOne:', error);
      return null;
    }
  }

  async findById(collectionName, id) {
    await this.ensureConnection();
    
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: collectionName });
    
    try {
      const results = await collection.get({
        ids: [id]
      });
      
      if (results.documents && results.documents.length > 0) {
        const data = JSON.parse(results.documents[0]);
        return { _id: id, ...data };
      }
      
      return null;
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  async find(collectionName, query = {}) {
    await this.ensureConnection();
    
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: collectionName });
    
    try {
      let results;
      
      if (Object.keys(query).length === 0) {
        // Get all documents
        results = await collection.get();
      } else {
        // Query with where clause
        const whereClause = this.buildWhereClause(query);
        results = await collection.query({
          where: whereClause,
          nResults: 1000 // Large number to get all matching results
        });
      }
      
      if (results.documents) {
        const documents = Array.isArray(results.documents[0]) ? results.documents[0] : results.documents;
        const ids = Array.isArray(results.ids[0]) ? results.ids[0] : results.ids;
        
        return documents.map((doc, index) => {
          const data = JSON.parse(doc);
          return { _id: ids[index], ...data };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error in find:', error);
      return [];
    }
  }

  async updateById(collectionName, id, data) {
    await this.ensureConnection();
    
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: collectionName });
    
    const document = JSON.stringify(data);
    const metadata = this.extractMetadata(data);
    
    await collection.update({
      ids: [id],
      documents: [document],
      metadatas: [metadata]
    });
    
    return { _id: id, ...data };
  }

  async deleteById(collectionName, id) {
    await this.ensureConnection();
    
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: collectionName });
    
    await collection.delete({
      ids: [id]
    });
    
    return true;
  }

  async count(collectionName, query = {}) {
    await this.ensureConnection();
    
    const results = await this.find(collectionName, query);
    return results.length;
  }

  buildWhereClause(query) {
    const where = {};
    
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        where[key] = { "$eq": value };
      }
    }
    
    return where;
  }

  extractMetadata(data) {
    const metadata = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        metadata[key] = value;
      }
    }
    
    return metadata;
  }
}

module.exports = new ChromaService();