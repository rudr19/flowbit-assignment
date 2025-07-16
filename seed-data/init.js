const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flowbit';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });

    console.log('Connected to MongoDB');
    await mongoose.connection.collection('users').deleteMany({});
    console.log('Cleared existing users');

    const plainPassword = 'StrongDemo@2025!';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const users = [
      {
        email: 'admin@logisticsco.com',
        password: hashedPassword,
        customerId: 'LogisticsCo',
        role: 'Admin',
        firstName: 'Logistics',
        lastName: 'Admin',
        isActive: true
      },
      {
        email: 'admin@retailgmbh.com',
        password: hashedPassword,
        customerId: 'RetailGmbH',
        role: 'Admin',
        firstName: 'Retail',
        lastName: 'Admin',
        isActive: true
      }
    ];

    await mongoose.connection.collection('users').insertMany(users);
    console.log('Seeded 2 Admin users');

  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
