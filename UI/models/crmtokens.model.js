const { DataTypes } = require("sequelize");
const { getUUID4, toInternalName, getAvatar, removeInitial, generateOTP } = require("../utils");
const moment = require("moment");
const { encryptData, passwordCompare, passwordEncode } = require("../utils/encryption");
module.exports = (db) => {
    const CrmTokens = db.sequelize.define('crmtokens', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: db.Sequelize.UUIDV4, 
            allowNull: false
        },
        accessToken: {
            type: DataTypes.STRING,
            allowNull: false
        },
        url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        refreshToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        query: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lastRun: {
            type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW 
        },
        source: { type: DataTypes.STRING(100), allowNull: true, defaultValue:"salesforce"},
        created_by: { type: DataTypes.UUID, defaultValue: '12345678-1234-5678-1234-567812345678' },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW },
        updated_by: { type: DataTypes.UUID, defaultValue: '12345678-1234-5678-1234-567812345678' },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW },
    }, {
        timestamps: true,
        underscrored: true,
        createdAt: false,
        updatedAt: false,
        hooks: {
            beforeCreate: async (o, options) => {
                o.created_at = new Date();
                o.updated_at = new Date();
            },
            beforeUpdate: async (o, options) => {
                o.updated_at = new Date();
            }
        }
    });
    return CrmTokens;
};