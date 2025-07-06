const mongoose = require('mongoose');

/**
 * Comprehensive fix for database indexes and form configurations
 * Ensures ALL application types work properly
 */
async function fixDatabaseIndexes() {
  console.log('=== COMPREHENSIVE DATABASE FIX FOR ALL APPLICATION TYPES ===');
  
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
    
    // Drop ALL problematic indexes that could prevent form creation
    const problematicIndexes = indexes.filter(index => 
      index.key && (
        index.key['fields.fieldId'] === 1 ||
        index.key['fields.fieldId'] === -1 ||
        (index.unique && index.key['fields.fieldId']) ||
        index.name === 'fields.fieldId_1' // Explicitly target this exact index name
      )
    );
    
    // Also try to drop the specific problematic index by name
    const specificProblematicIndexNames = [
      'fields.fieldId_1',
      'fields.fieldId_-1',
      'fields_fieldId_1',
      'fields_fieldId_-1'
    ];
    
    for (const indexName of specificProblematicIndexNames) {
      try {
        console.log(`Attempting to drop specific index: ${indexName}`);
        await collection.dropIndex(indexName);
        console.log(`✓ Specific index ${indexName} dropped successfully`);
      } catch (dropError) {
        console.log(`⚠ Index ${indexName} not found or already dropped: ${dropError.message}`);
      }
    }
    
    for (const index of problematicIndexes) {
      try {
        console.log(`Dropping problematic index: ${index.name}`);
        await collection.dropIndex(index.name);
        console.log(`✓ Index ${index.name} dropped successfully`);
      } catch (dropError) {
        console.log(`⚠ Could not drop index ${index.name}: ${dropError.message}`);
      }
    }
    
    // Also clean up any duplicate or conflicting forms
    console.log('=== CLEANING UP EXISTING FORMS ===');
    const existingForms = await collection.find({}).toArray();
    console.log(`Found ${existingForms.length} existing forms`);
    
    // Group by application type
    const formsByType = {};
    existingForms.forEach(form => {
      if (!formsByType[form.applicationType]) {
        formsByType[form.applicationType] = [];
      }
      formsByType[form.applicationType].push(form);
    });
    
    // Ensure only one default form per type, remove duplicates
    for (const [appType, forms] of Object.entries(formsByType)) {
      console.log(`Processing ${appType} forms: ${forms.length} found`);
      
      const defaultForms = forms.filter(f => f.isDefault);
      if (defaultForms.length > 1) {
        console.log(`Found ${defaultForms.length} default forms for ${appType}, keeping newest`);
        // Sort by creation date, keep the newest
        defaultForms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Remove extra default forms
        for (let i = 1; i < defaultForms.length; i++) {
          await collection.deleteOne({ _id: defaultForms[i]._id });
          console.log(`✓ Removed duplicate default form: ${defaultForms[i]._id}`);
        }
      }
    }
    
    // List indexes after fix
    const newIndexes = await collection.listIndexes().toArray();
    console.log('Indexes after fix:');
    newIndexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });
    
    console.log('=== COMPREHENSIVE DATABASE FIX COMPLETED ===');
    console.log('✅ ALL APPLICATION TYPES SHOULD NOW WORK PROPERLY');
    return true;
    
  } catch (error) {
    console.error('=== ERROR IN COMPREHENSIVE DATABASE FIX ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

module.exports = { fixDatabaseIndexes };