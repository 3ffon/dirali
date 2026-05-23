require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { sequelize, Apartment, Image } = require('./models');
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

let indexHtml = '';
try {
  indexHtml = fs.readFileSync(path.join(STATIC_DIR, 'index.html'), 'utf8');
} catch {}

app.get('/apartments/:id', async (req, res) => {
  if (!indexHtml) return res.sendFile(path.join(STATIC_DIR, 'index.html'));
  try {
    const apartment = await Apartment.findByPk(req.params.id, {
      include: [{ model: Image, limit: 1 }],
    });
    if (!apartment) return res.send(indexHtml);

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const price = apartment.asking_price
      ? ` · ₪${Number(apartment.asking_price).toLocaleString('he-IL')}`
      : '';
    const title = `דירה לי | ${apartment.address || 'דירה'}${price}`;
    const descParts = [];
    if (apartment.neighborhood) descParts.push(`שכונת ${apartment.neighborhood}`);
    if (apartment.overall_rating) descParts.push(`דירוג: ${'★'.repeat(apartment.overall_rating)}${'☆'.repeat(5 - apartment.overall_rating)}`);
    if (apartment.visit_date) descParts.push(`ביקור: ${new Date(apartment.visit_date).toLocaleDateString('he-IL')}`);
    if (apartment.notes) descParts.push(apartment.notes);
    let description = descParts.join(' · ') || 'צפו בפרטי הדירה באפליקציית דירה לי';
    if (description.length < 110) description += ' · צפו בפרטי הדירה המלאים באפליקציית דירה לי';

    const ogTags = [
      `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`,
      `<meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />`,
      `<meta property="og:url" content="${baseUrl}/apartments/${apartment.id}" />`,
      `<meta property="og:type" content="website" />`,
    ];
    if (apartment.Images && apartment.Images.length > 0) {
      ogTags.push(`<meta property="og:image" content="${baseUrl}/api/images/${apartment.Images[0].id}/og.png" />`);
    }

    const html = indexHtml.replace('</head>', `  ${ogTags.join('\n    ')}\n  </head>`);
    res.send(html);
  } catch {
    res.send(indexHtml);
  }
});

app.get('*', (req, res) => {
  if (!indexHtml) return res.sendFile(path.join(STATIC_DIR, 'index.html'));
  res.send(indexHtml);
});

async function start() {
  await sequelize.sync();
  whatsapp.initialize();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
