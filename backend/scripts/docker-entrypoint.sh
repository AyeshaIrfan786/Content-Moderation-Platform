#!/bin/sh
set -e

echo "Waiting for MongoDB..."
node <<'EOF'
const mongoose = require('mongoose');
const uri = process.env.MONGO_URI;

(async () => {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      await mongoose.disconnect();
      console.log('MongoDB is ready');
      process.exit(0);
    } catch (error) {
      console.log(`MongoDB not ready (attempt ${attempt}/30)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.error('MongoDB did not become ready in time');
  process.exit(1);
})();
EOF

node scripts/seed-if-empty.js

echo "Starting API server..."
exec node server.js
