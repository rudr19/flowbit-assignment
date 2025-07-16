const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  console.log('⛏ Connecting using URI:', uri);

  if (!uri || typeof uri !== 'string') {
    throw new Error(' MONGO_URI is not defined or invalid in .env');
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(' MongoDB connected successfully');
  } catch (error) {
    console.error(' MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
