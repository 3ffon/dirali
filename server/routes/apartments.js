const express = require('express');
const router = express.Router();
const { Apartment, Answer, Image } = require('../models');

router.get('/', async (req, res) => {
  const apartments = await Apartment.findAll({
    order: [['created_at', 'DESC']],
    include: [{ model: Image, attributes: ['id'] }],
  });
  res.json(apartments);
});

router.post('/', async (req, res) => {
  const apartment = await Apartment.create(req.body);
  res.status(201).json(apartment);
});

router.get('/:id', async (req, res) => {
  const apartment = await Apartment.findByPk(req.params.id, {
    include: [Answer, Image],
  });
  if (!apartment) return res.status(404).json({ error: 'Not found' });
  res.json(apartment);
});

router.put('/:id', async (req, res) => {
  const apartment = await Apartment.findByPk(req.params.id);
  if (!apartment) return res.status(404).json({ error: 'Not found' });
  await apartment.update(req.body);
  res.json(apartment);
});

router.delete('/:id', async (req, res) => {
  const apartment = await Apartment.findByPk(req.params.id);
  if (!apartment) return res.status(404).json({ error: 'Not found' });
  await apartment.destroy();
  res.json({ success: true });
});

router.put('/:id/answers', async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'answers must be an array' });
  }

  const apartment = await Apartment.findByPk(req.params.id);
  if (!apartment) return res.status(404).json({ error: 'Not found' });

  for (const ans of answers) {
    await Answer.upsert({
      apartment_id: parseInt(req.params.id),
      question_id: ans.question_id,
      value: ans.value ?? null,
      notes: ans.notes ?? null,
    });
  }

  const updated = await Answer.findAll({ where: { apartment_id: req.params.id } });
  res.json(updated);
});

module.exports = router;
