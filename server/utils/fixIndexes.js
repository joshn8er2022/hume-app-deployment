const mongoose = require('mongoose');

/**
 * Fix database indexes that are causing issues
 * This script removes problematic indexes that prevent form creation
 */
async function fixDatabaseIndexes() {
  console.log('=== FIXING DATABASE INDEXES ===');
  
  try {
    // Get the FormConfiguration collection
    const db = mongoose.connection.db;
    const collection = db.collection('formconfigurations');
    
    // List current indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('Current indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });
    
    // Check if problematic index exists
    const problematicIndex = indexes.find(index => 
      index.key && index.key['fields.fieldId'] === 1
    );
    
    if (problematicIndex) {
      console.log(`Dropping problematic index: ${problematicIndex.name}`);
      await collection.dropIndex(problematicIndex.name);
      console.log('✓ Problematic index dropped successfully');
    } else {
      console.log('No problematic index found - may already be fixed');
    }
    
    // List indexes after fix
    const newIndexes = await collection.listIndexes().toArray();
    console.log('Indexes after fix:');
    newIndexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });
    
    console.log('=== DATABASE INDEXES FIXED ===');
    return true;
    
  } catch (error) {
    console.error('=== ERROR FIXING DATABASE INDEXES ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

module.exports = { fixDatabaseIndexes };