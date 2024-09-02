const { DataTypes } = require("sequelize");
module.exports = (db) => {
  const CollectionDepartments = db.sequelize.define(
    "collections_departments",
    {
      cd_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: db.Sequelize.UUIDV4,
        allowNull: false,
      },
      cd_collection_id_fk: { type: DataTypes.UUID, allowNull: false },
      cd_department_id_fk: { type: DataTypes.UUID, allowNull: false },
      cd_created_by: { type: DataTypes.UUID },
      cd_created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW,
      },
      cd_updated_by: { type: DataTypes.UUID },
      cd_updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW,
      },
    },
    {
      indexes: [{ unique: true, fields: ["cd_id"] }],
      timestamps: true,
      underscrored: true,
      createdAt: false,
      updatedAt: false,
      hooks: {
        beforeCreate: async (o, options) => {
          o.cd_created_at = new Date();
          o.cd_updated_at = new Date();
        },
        beforeUpdate: async (o, options) => {
          o.cd_updated_at = new Date();
        },
      },
    }
  );

  return CollectionDepartments;
};
