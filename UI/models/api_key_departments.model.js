const { DataTypes } = require("sequelize");
module.exports = (db) => {
  const ApiKeysDepartments = db.sequelize.define(
    "api_keys_departments",
      {
        akd_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false },
        akd_api_keys_id_fk: { type: DataTypes.UUID, allowNull: false },
        akd_departments_id_fk: { type: DataTypes.UUID, allowNull: false },
        akd_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
        akd_created_by: { type: DataTypes.UUID },
        akd_created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW },
        akd_updated_by: { type: DataTypes.UUID },
        akd_updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW }
    },
        {
            indexes: [
                { unique: true, fields: ['akd_id'] }
            ],
      timestamps: true,
      underscrored: true,
      createdAt: false,
      updatedAt: false,
      hooks: {
        beforeCreate: async (o, options) => {
          o.dept_created_at = new Date();
          o.dept_updated_at = new Date();
        },
        beforeUpdate: async (o, options) => {
          o.dept_updated_at = new Date();
        },
      },
    }
  );

  return ApiKeysDepartments;
};
