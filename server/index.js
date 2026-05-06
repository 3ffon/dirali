const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const apartmentsRouter = require('./routes/apartments');
const imagesRouter = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/questions', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'questions.json'));
});

app.use('/api/apartments', apartmentsRouter);
app.use('/api', imagesRouter);

async function start() {
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
