const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Broker', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    full_name: { type: DataTypes.TEXT, allowNull: false },
    phone: { type: DataTypes.TEXT },
    email: { type: DataTypes.TEXT },
  }, {
    tableName: 'brokers',
    underscored: true,
  });
};
