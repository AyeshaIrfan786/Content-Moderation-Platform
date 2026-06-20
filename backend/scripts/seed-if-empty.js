require('dotenv').config();
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  await connectDB();

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Empty database detected — running seeder...');
    execSync('node seeder.js', { stdio: 'inherit' });
  } else {
    console.log('Database already seeded, skipping.');
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
