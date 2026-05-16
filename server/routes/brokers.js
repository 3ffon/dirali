const express = require('express');
const router = express.Router();
const { Broker, Apartment } = require('../models');

router.get('/', async (req, res) => {
  const brokers = await Broker.findAll({
    order: [['created_at', 'DESC']],
    include: [{ model: Apartment, attributes: ['id', 'address', 'asking_price'] }],
  });
  res.json(brokers);
});

router.post('/', async (req, res) => {
  const broker = await Broker.create(req.body);
  res.status(201).json(broker);
});

router.get('/:id', async (req, res) => {
  const broker = await Broker.findByPk(req.params.id);
  if (!broker) return res.status(404).json({ error: 'Not found' });
  res.json(broker);
});

router.put('/:id', async (req, res) => {
  const broker = await Broker.findByPk(req.params.id);
  if (!broker) return res.status(404).json({ error: 'Not found' });
  await broker.update(req.body);
  res.json(broker);
});

router.delete('/:id', async (req, res) => {
  const broker = await Broker.findByPk(req.params.id);
  if (!broker) return res.status(404).json({ error: 'Not found' });
  await broker.destroy();
  res.json({ success: true });
});

module.exports = router;
