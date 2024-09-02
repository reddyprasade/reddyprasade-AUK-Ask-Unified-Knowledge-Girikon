const { DataTypes } = require("sequelize");
module.exports = (db) => {
  const UserDepartments = db.sequelize.define(
    "users_departments",
    {
      ud_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: db.Sequelize.UUIDV4,
        allowNull: false,
      },
      ud_user_id_fk: { type: DataTypes.UUID, allowNull: false },
      ud_department_id_fk: { type: DataTypes.UUID, allowNull: false },
      ud_created_by: { type: DataTypes.UUID },
      ud_created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW,
      },
      ud_updated_by: { type: DataTypes.UUID },
      ud_updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW,
      },
    },
    {
      indexes: [{ unique: true, fields: ["ud_id"] }],
      timestamps: true,
      underscrored: true,
      createdAt: false,
      updatedAt: false,
      hooks: {
        beforeCreate: async (o, options) => {
          o.ud_created_at = new Date();
          o.ud_updated_at = new Date();
        },
        beforeUpdate: async (o, options) => {
          o.ud_updated_at = new Date();
        },
      },
    }
  );

  return UserDepartments;
};
