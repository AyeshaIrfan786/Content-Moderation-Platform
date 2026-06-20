require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/appeals',     require('./routes/appeals'));
app.use('/api/admin',       require('./routes/admin'));

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Content Moderation API is running' });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend running. Frontend: http://localhost:5173' });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});