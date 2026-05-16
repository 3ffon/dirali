require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { sequelize } = require('./models');
const apartmentsRouter = require('./routes/apartments');
const imagesRouter = require('./routes/images');
const brokersRouter = require('./routes/brokers');
const usersRouter = require('./routes/users');
const whatsappRouter = require('./routes/whatsapp');
const whatsapp = require('./services/whatsapp');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

if (process.env.AUTH_PASSWORD) {
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Basic ')) {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString();
      const password = decoded.includes(':') ? decoded.split(':').slice(1).join(':') : decoded;
      if (password === process.env.AUTH_PASSWORD) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="dira-li"');
    res.status(401).send('Unauthorized');
  });
}

app.use(express.json({ limit: '1mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

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
