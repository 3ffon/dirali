const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { Image, Apartment } = require('../models');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const allowedMimes = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
];

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  },
});

router.post('/apartments/:id/images', upload.array('images', 20), async (req, res) => {
  const apartment = await Apartment.findByPk(req.params.id);
  if (!apartment) return res.status(404).json({ error: 'Not found' });

  const records = [];
  for (const file of req.files) {
    const img = await Image.create({
      apartment_id: parseInt(req.params.id),
      filename: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
    });
    records.push(img);
  }
  res.status(201).json(records);
});

router.get('/images/:id/og.png', async (req, res) => {
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: 'Not found' });

  const filePath = path.resolve(uploadsDir, path.basename(image.filename));
  if (!filePath.startsWith(path.resolve(uploadsDir))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });

  try {
    const buf = await sharp(filePath)
      .rotate()
      .resize(1200, 630, { fit: 'cover' })
      .png({ palette: true })
      .toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buf);
  } catch {
    res.status(500).end();
  }
});

router.get('/images/:id/file', async (req, res) => {
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: 'Not found' });

  const filePath = path.resolve(uploadsDir, path.basename(image.filename));
  if (!filePath.startsWith(path.resolve(uploadsDir))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });

  res.setHeader('Content-Type', image.mime_type);
  res.sendFile(filePath);
});

router.delete('/images/:id', async (req, res) => {
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: 'Not found' });

  const filePath = path.resolve(uploadsDir, path.basename(image.filename));
  if (filePath.startsWith(path.resolve(uploadsDir)) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await image.destroy();
  res.json({ success: true });
});

module.exports = router;
