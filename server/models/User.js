const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.TEXT },
    phone: { type: DataTypes.TEXT },
    email: { type: DataTypes.TEXT },
    address: { type: DataTypes.TEXT },
    latitude: { type: DataTypes.REAL },
    longitude: { type: DataTypes.REAL },
  }, {
    tableName: 'users',
    underscored: true,
  });
};
