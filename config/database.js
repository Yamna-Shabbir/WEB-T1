const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI ='mongodb://localhost:27017/gym-supplies-hub';
    await mongoose.connect(mongoURI);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

