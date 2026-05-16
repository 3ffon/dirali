const express = require('express');
const router = express.Router();
const whatsapp = require('../services/whatsapp');
const { parseMessages } = require('../services/apartmentParser');

router.get('/status', (req, res) => {
  res.json(whatsapp.getStatus());
});

router.post('/initialize', (req, res) => {
  whatsapp.initialize();
  res.json({ ok: true });
});

router.get('/messages/:phone', async (req, res) => {
  try {
    const messages = await whatsapp.getMessagesByPhone(req.params.phone);
    const typeCounts = {};
    const emptyMessages = [];
    messages.forEach(msg => {
      typeCounts[msg.type] = (typeCounts[msg.type] || 0) + 1;
      if (!msg.body && !msg.hasMedia) {
        emptyMessages.push({ id: msg.id, type: msg.type, timestamp: msg.timestamp });
      }
    });
    console.log(`[WhatsApp] Messages for ${req.params.phone}: ${messages.length} total`);
    console.log('[WhatsApp] Types breakdown:', typeCounts);
    if (emptyMessages.length > 0) {
      console.log('[WhatsApp] Empty messages (no body, no media):', emptyMessages);
    }
    res.json(messages);
  } catch (err) {
    console.error('[WhatsApp] Messages error:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/media', async (req, res) => {
  const messageId = req.query.id;
  if (!messageId) return res.status(400).json({ error: 'Missing id query param' });
  console.log('[WhatsApp] Media request for:', messageId);
  try {
    const media = await whatsapp.downloadMedia(messageId);
    if (!media) {
      console.log('[WhatsApp] Media unavailable for:', messageId);
      return res.status(404).json({ error: 'Media not found or expired' });
    }
    const buffer = Buffer.from(media.data, 'base64');
    res.set('Content-Type', media.mimetype);
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('[WhatsApp] Media download error:', messageId, err.message);
    res.status(500).json({ error: 'Failed to download media' });
  }
});

router.post('/parse', async (req, res) => {
  const { messages, brokerId } = req.body;
  if (!messages || !messages.length) {
    return res.status(400).json({ error: 'No messages provided' });
  }
  try {
    const apartment = await parseMessages(messages, brokerId);
    res.json(apartment);
  } catch (err) {
    console.error('[WhatsApp] Parse error:', err.message);
    res.status(500).json({ error: 'Failed to parse messages' });
  }
});

module.exports = router;
