const express = require('express');
const router = express.Router();
const { User } = require('../models');

router.get('/profile', async (req, res) => {
  let user = await User.findOne();
  if (!user) {
    user = await User.create({});
  }
  res.json(user);
});

router.put('/profile', async (req, res) => {
  let user = await User.findOne();
  if (!user) {
    user = await User.create(req.body);
  } else {
    await user.update(req.body);
  }
  res.json(user);
});

module.exports = router;
