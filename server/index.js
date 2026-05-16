require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const apartmentsRouter = require('./routes/apartments');
const imagesRouter = require('./routes/images');
const brokersRouter = require('./routes/brokers');
const usersRouter = require('./routes/users');
const whatsappRouter = require('./routes/whatsapp');
const whatsapp = require('./services/whatsapp');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/questions', (req, res) => {
  res.sendFile(path.join(__dirname, 'questions.json'));
});

app.use('/api/apartments', apartmentsRouter);
app.use('/api/brokers', brokersRouter);
app.use('/api/users', usersRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api', imagesRouter);

const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..', 'client', 'dist');

app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(STATIC_DIR, 'sw.js'));
});

app.use(express.static(STATIC_DIR));

app.get('*', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

async function start() {
  await sequelize.sync();
  whatsapp.initialize();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
