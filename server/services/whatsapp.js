const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');

let client = null;
let qrDataUrl = null;
let status = 'disconnected'; // disconnected | qr | ready | error

function getStatus() {
  return { status, qr: status === 'qr' ? qrDataUrl : null };
}

function initialize() {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '..', 'data', '.wwebjs_auth'),
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', async (qr) => {
    status = 'qr';
    qrDataUrl = await QRCode.toDataURL(qr);
    console.log('[WhatsApp] QR code generated — scan from the app');
  });

  client.on('ready', () => {
    status = 'ready';
    qrDataUrl = null;
    console.log('[WhatsApp] Client is ready');
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Authenticated');
  });

  client.on('auth_failure', (msg) => {
    status = 'error';
    console.error('[WhatsApp] Auth failure:', msg);
  });

  client.on('disconnected', (reason) => {
    status = 'disconnected';
    qrDataUrl = null;
    console.log('[WhatsApp] Disconnected:', reason);
    client = null;
  });

  client.initialize();
}

async function getChats() {
  if (status !== 'ready') return [];
  return client.getChats();
}

async function getMessagesByPhone(phone) {
  if (status !== 'ready') return [];

  const chatId = normalizePhoneToWhatsApp(phone);
  try {
    const chat = await client.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit: 100 });
    const IGNORED_TYPES = ['album', 'unknown'];
    return messages
      .filter((msg) => !IGNORED_TYPES.includes(msg.type))
      .map((msg) => ({
        id: msg.id._serialized,
        body: msg.body,
        fromMe: msg.fromMe,
        timestamp: msg.timestamp,
        type: msg.type,
        hasMedia: msg.hasMedia,
        location: msg.location || null,
        vCards: msg.vCards || [],
      }));
  } catch (err) {
    console.error('[WhatsApp] Error fetching messages for', chatId, err.message);
    return [];
  }
}

async function downloadMedia(messageId) {
  if (status !== 'ready') return null;
  try {
    const msg = await client.getMessageById(messageId);
    if (!msg || !msg.hasMedia) return null;
    const media = await msg.downloadMedia();
    return media;
  } catch (err) {
    console.error('[WhatsApp] Error downloading media:', err.message);
    return null;
  }
}

function normalizePhoneToWhatsApp(phone) {
  let digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) {
    digits = '972' + digits.slice(1);
  }
  if (!digits.includes('@')) {
    digits = digits + '@c.us';
  }
  return digits;
}

function isReady() {
  return status === 'ready';
}

module.exports = { initialize, getStatus, getChats, getMessagesByPhone, downloadMedia, isReady };
