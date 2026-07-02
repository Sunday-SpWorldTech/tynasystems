import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Database service is not configured. Please check the secure server environment settings.');
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    dbName: process.env.MONGO_DB_NAME || undefined
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

