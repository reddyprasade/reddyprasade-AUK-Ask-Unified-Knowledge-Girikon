const { DataTypes } = require("sequelize");
const { getUUID4, toInternalName } = require("../utils");

module.exports = (db) => {
    const RunInfos = db.sequelize.define('run_infos', {
        run_id: {
           type: DataTypes.STRING(100),
              primaryKey: true,
                defaultValue: getUUID4(),
                allowNull: false            
        },
        run_info: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: ''
        },
        run_created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        run_updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        indexes: [
            { unique: true, fields: ['run_id'] }
        ],
        timestamps: true,
        underscored: true,
        createdAt: false,
        updatedAt: false,
        hooks: {
            beforeCreate: async (o, options) => {
                o.run_created_at = new Date();
                o.run_updated_at = new Date();
            },
            beforeUpdate: async (o, options) => {
                o.run_updated_at = new Date();
            }
        }
    });

    return RunInfos;
};
