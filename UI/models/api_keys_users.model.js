const {DataTypes} = require("sequelize");
const {getUUID4, getGenerateKey} = require("../utils");
const moment = require("moment");
module.exports = (db) => {
    const ApiKeysUsers = db.sequelize.define('api_keys_users', {
            aku_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},

            aku_api_keys_id_fk: {type: DataTypes.UUID, allowNull: false},
            aku_users_id_fk: {type: DataTypes.UUID, allowNull: false},

            aku_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            aku_created_by: {type: DataTypes.UUID},
            aku_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            aku_updated_by: {type: DataTypes.UUID},
            aku_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['aku_id']}
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.aku_created_at = new Date();
                    o.aku_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.aku_updated_at = new Date();
                }
            }
        });

    ApiKeysUsers.add = async (req, data) => {
        return new Promise(async (resolve, reject) => {
            const _apiKeysUsers = await ApiKeysUsers.create({
                aku_id: getUUID4(),
                aku_api_keys_id_fk: data?.aku_api_keys_id_fk,
                aku_users_id_fk: data?.aku_users_id_fk,
                aku_created_by: req.user.id || "",
                aku_updated_by: req.user.id || ""
            });
            // console.log(51, _apiKeysUsers?.dataValues);
            resolve(_apiKeysUsers?.dataValues ? _apiKeysUsers.dataValues : _apiKeysUsers);
        });
    };
    return ApiKeysUsers;
};