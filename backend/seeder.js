require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const PolicyConfig = require('./models/PolicyConfig');

const categories = [
  'graphic_violence', 'hate_symbols', 'self_harm',
  'extremist_propaganda', 'weapons_contraband', 'harassment_humiliation'
];

const run = async () => {
  await connectDB();

  await User.deleteMany();
  await PolicyConfig.deleteMany();

  await User.create([
    { name: 'Admin User', email: 'admin@test.com', password: 'admin123', role: 'admin' },
    { name: 'Test User',  email: 'user@test.com',  password: 'user123',  role: 'user'  }
  ]);

  await PolicyConfig.insertMany(categories.map(cat => ({
    category: cat, enabled: true, threshold: 70, enforcement: 'flag_review'
  })));

  console.log('Seeded ✓');
  process.exit();
};

run();