const {DataTypes, Op} = require("sequelize");
const { countTokens } = require("../utils");

module.exports = (db) => {
    const Rates = db.sequelize.define('rates', {
            r_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            r_org_id_fk: {type: DataTypes.UUID, allowNull: false, defaultValue: "00000000-0000-0000-0000-000000000000"},
            r_is_active: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue:true},
            r_model: {type: DataTypes.TEXT, allowNull: true},
            r_per_token_rate: {type: DataTypes.DOUBLE, allowNull: true},
            r_per_storage_rate: {type: DataTypes.DOUBLE, allowNull: true},
            r_per_token_rate_chatgpt: {type: DataTypes.DOUBLE, allowNull: true},
            r_per_storage_rate_chatgpt: {type: DataTypes.DOUBLE, allowNull: true},
            r_threshold: {type: DataTypes.DOUBLE, allowNull: true},
            r_created_by: {type: DataTypes.UUID, defaultValue: "00000000-0000-0000-0000-000000000000"},
            r_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            r_updated_by: {type: DataTypes.UUID, defaultValue: "00000000-0000-0000-0000-000000000000"},
            r_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['r_id']}
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.r_created_at = new Date();
                    o.r_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.r_updated_at = new Date();
                }
            }
        });
  
    // Histories.sync({ alter: true }).then(() => {
    //     console.log('Table Histories synced');
    // });
    return Rates;
};
