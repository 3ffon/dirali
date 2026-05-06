const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Image', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    apartment_id: { type: DataTypes.INTEGER, allowNull: false },
    filename: { type: DataTypes.TEXT, allowNull: false },
    original_name: { type: DataTypes.TEXT },
    mime_type: { type: DataTypes.TEXT },
  }, {
    tableName: 'images',
    underscored: true,
  });
};
