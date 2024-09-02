const { DataTypes } = require("sequelize");
module.exports = (db) => {
  const Departments = db.sequelize.define(
    "departments",
    {
      dept_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: db.Sequelize.UUIDV4,
        allowNull: false,
      },
      dept_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "",
      },
      org_id: { type: DataTypes.UUID, allowNull: false },
      dept_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "active",
      },
      dept_created_by: { type: DataTypes.UUID },
      dept_created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW,
      },
      dept_updated_by: { type: DataTypes.UUID },
      dept_updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW,
      },
    },
    {
      indexes: [
        { unique: true, fields: ["dept_id"] },
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

  return Departments;
};
