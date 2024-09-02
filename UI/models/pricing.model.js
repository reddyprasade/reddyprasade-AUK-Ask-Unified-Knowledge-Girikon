const { DataTypes } = require("sequelize");
const { getUUID4, toInternalName } = require("../utils");

module.exports = (db) => {
    const Pricing = db.sequelize.define('pricing', {
        p_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false },
        p_name: { type: DataTypes.STRING(100), allowNull: true },
        p_usd_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        p_users: { type: DataTypes.INTEGER, allowNull: true },
        p_storage: { type: DataTypes.INTEGER, allowNull: true },
        p_domain: { type: DataTypes.STRING(100), allowNull: true },
        p_crm_domain: { type: DataTypes.STRING(100), allowNull: true },
        p_collection: { type: DataTypes.INTEGER, allowNull: true },
        p_apis: { type: DataTypes.BOOLEAN, allowNull: true },
        p_supported_models: { type: DataTypes.STRING(100), allowNull: true },
        p_advance_tuning: { type: DataTypes.BOOLEAN, allowNull: true },
        p_token_limit: { type: DataTypes.INTEGER, allowNull: true },
        p_words_limit: { type: DataTypes.INTEGER, allowNull: true },
        p_email_support: { type: DataTypes.STRING(100), allowNull: true },
        p_file_security: { type: DataTypes.BOOLEAN, allowNull: true },
        p_supported_files: { type: DataTypes.STRING(100), allowNull: true },
        p_feedback: { type: DataTypes.BOOLEAN, allowNull: true },
        p_chrome_extention: { type: DataTypes.BOOLEAN, allowNull: true },
        p_supported_languages: { type: DataTypes.STRING(100), allowNull: true },
        p_enterprise_data_security: { type: DataTypes.BOOLEAN, allowNull: true },
        p_model_privacy: { type: DataTypes.BOOLEAN, allowNull: true },
        p_org_id: { type:DataTypes.UUID, allowNull: false},
        p_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
        p_created_by: { type: DataTypes.UUID },
        p_created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW },
        p_updated_by: { type: DataTypes.UUID },
        p_updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW },

    },
        {
            indexes: [
                { unique: true, fields: ['p_id'] },
                { unique: true, fields: ['p_name'] }
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.p_created_at = new Date();
                    o.p_updated_at = new Date();
                    o.p_internal_name = o.p_name.toLowerCase().replace(/ /g, '_');

                },
                beforeUpdate: async (o, options) => {
                    o.p_updated_at = new Date();
                    if (o.p_name) {
                        o.p_internal_name = o.p_name.toLowerCase().replace(/ /g, '_');
                    }
                }
            }
        });

    return Pricing;
}