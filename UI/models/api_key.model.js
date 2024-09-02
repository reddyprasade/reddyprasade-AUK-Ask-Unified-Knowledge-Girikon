const {DataTypes} = require("sequelize");
const {toInternalName, getUUID4, getGenerateKey} = require("../utils");
const moment = require("moment");
module.exports = (db) => {
    const ApiKeys = db.sequelize.define('api_keys', {
            ak_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            ak_name: {type: DataTypes.STRING(100), allowNull: true, defaultValue: 'My Key', unique: false},
            ak_key: {type: DataTypes.STRING(100), allowNull: false},

            ak_is_restricted: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
            ak_start_from: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            ak_end_to: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            ak_last_used_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},

            ak_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            ak_created_by: {type: DataTypes.UUID},
            ak_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            ak_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            ak_updated_by: {type: DataTypes.UUID}
        },
        {
            indexes: [
                {unique: true, fields: ['ak_id']},
                {unique: true, fields: ['ak_key']}
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.ak_created_at = new Date();
                    o.ak_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.ak_updated_at = new Date();
                }
            }
        });

    // ApiKeys.add = async (req, data) => {
    //     console.log(42, req);
    //     console.log(47, data);
    //     return new Promise(async (resolve, reject) => {
    //         const _apiKeys = await ApiKeys.create({
    //             ak_name: data || "access key",
    //             ak_id: getUUID4(),
    //             ak_key: getGenerateKey(data.type || "access"),
    //             ak_is_restricted: true,
    //             ak_start_from: moment().format("YYYY-MM-DD HH:mm:ss"),
    //             ak_end_to: moment().add(10, "years").format("YYYY-MM-DD HH:mm:ss"),
    //             ak_created_by: req.user.id || "",
    //             ak_updated_by: req.user.id || ""
    //         });
    //         // console.log(51, _apiKeys?.dataValues);
    //         resolve(_apiKeys?.dataValues ? _apiKeys.dataValues : _apiKeys);
    //     });
    // };


    ApiKeys.add = async (req, data) => {
        // console.log(42, req);

        try {
            const _apiKeys = await ApiKeys.create({

                ak_name: data.name || "access key",

                ak_id: getUUID4(),
                ak_key: getGenerateKey(data.type || "access"),
                ak_is_restricted: true,
                ak_start_from: moment().format("YYYY-MM-DD HH:mm:ss"),
                ak_end_to: moment().add(10, "years").format("YYYY-MM-DD HH:mm:ss"),
                ak_created_by: req.user.id || "",
                ak_updated_by: req.user.id || ""
            });

            return _apiKeys?.dataValues ? _apiKeys.dataValues : _apiKeys;
        } catch (error) {
            console.error("Error in ApiKeys.add:", error);
            throw error; // Rethrow the error for proper handling in the controller
        }
    };

    ApiKeys.getOne = async (id) => {
        // console.log({where: {wg_status: 'active', wg_id: wg_id},nest: true, plain: true});
        return await ApiKeys.findOne({where: {ak_id: id},nest: true, plain: true});
    }

    return ApiKeys;
};