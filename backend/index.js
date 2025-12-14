const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authMiddleware = require('./authMiddleware');
const { chatController } = require('./chatController');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Protected Chat Route
app.post('/api/chat', authMiddleware, chatController);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

