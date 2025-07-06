const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/HumeJourney';

    console.log('=== DATABASE CONNECTION ATTEMPT ===');
    console.log('MongoDB URI:', mongoURI);
    console.log('Connecting to MongoDB...');

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
    });

    console.log('=== DATABASE CONNECTION SUCCESS ===');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`Connection State: ${conn.connection.readyState}`);

    // Set up connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('=== MONGOOSE EVENT: Connected ===');
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('=== MONGOOSE EVENT: Error ===');
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('=== MONGOOSE EVENT: Disconnected ===');
      console.log('Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      console.log('=== APPLICATION TERMINATION ===');
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('=== DATABASE CONNECTION FAILED ===');
    console.error('Error connecting to MongoDB:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

module.exports = connectDB;