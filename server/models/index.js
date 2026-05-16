const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'data', 'database.sqlite'),
  logging: false,
});

const Apartment = require('./Apartment')(sequelize);
const Answer = require('./Answer')(sequelize);
const Image = require('./Image')(sequelize);
const Broker = require('./Broker')(sequelize);
const User = require('./User')(sequelize);

Apartment.hasMany(Answer, { foreignKey: 'apartment_id', onDelete: 'CASCADE' });
Answer.belongsTo(Apartment, { foreignKey: 'apartment_id' });

Apartment.hasMany(Image, { foreignKey: 'apartment_id', onDelete: 'CASCADE' });
Image.belongsTo(Apartment, { foreignKey: 'apartment_id' });

Broker.hasMany(Apartment, { foreignKey: 'broker_id' });
Apartment.belongsTo(Broker, { foreignKey: 'broker_id' });

module.exports = { sequelize, Apartment, Answer, Image, Broker, User };
