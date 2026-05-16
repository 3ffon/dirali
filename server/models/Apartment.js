const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Apartment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    address: { type: DataTypes.TEXT, allowNull: false },
    neighborhood: { type: DataTypes.TEXT },
    visit_date: { type: DataTypes.DATE },
    asking_price: { type: DataTypes.INTEGER },
    agent_name: { type: DataTypes.TEXT },
    agent_phone: { type: DataTypes.TEXT },
    broker_id: { type: DataTypes.INTEGER },
    latitude: { type: DataTypes.REAL },
    longitude: { type: DataTypes.REAL },
    overall_rating: { type: DataTypes.INTEGER },
    deal_breakers: { type: DataTypes.TEXT, defaultValue: '[]' },
    pros: { type: DataTypes.TEXT, defaultValue: '[]' },
    cons: { type: DataTypes.TEXT, defaultValue: '[]' },
    notes: { type: DataTypes.TEXT },
  }, {
    tableName: 'apartments',
    underscored: true,
  });
};
