const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Answer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    apartment_id: { type: DataTypes.INTEGER, allowNull: false },
    question_id: { type: DataTypes.TEXT, allowNull: false },
    value: { type: DataTypes.TEXT },
    notes: { type: DataTypes.TEXT },
  }, {
    tableName: 'answers',
    underscored: true,
    indexes: [
      { unique: true, fields: ['apartment_id', 'question_id'] }
    ],
  });
};
