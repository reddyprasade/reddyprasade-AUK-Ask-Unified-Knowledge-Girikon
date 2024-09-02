const { join } = require("path");
const { DataTypes } = require("sequelize");
const { getUUID4 } = require("../utils");

module.exports = (db) => {
    const FileTokens = db.sequelize.define('file_tokens', {
            ft_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            ft_secret_token: {type: DataTypes.STRING(2048), allowNull: true},
            ft_file_name: { type: DataTypes.STRING(256), allowNull: true},
            ft_collection_id_fk: {type: DataTypes.UUID, allowNull: true},
            ft_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            ft_user_ip: {type: DataTypes.STRING(100), allowNull: true},
            ft_created_by: {type: DataTypes.UUID},
            ft_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            ft_updated_by: {type: DataTypes.UUID},
            ft_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['ft_id']}
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.ft_created_at = new Date();
                    o.ft_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.ft_updated_at = new Date();
                }
            }
        });

    // FileTokens.add = async (req, data) => {
    //     try {
    //         return new Promise(async (resolve, reject) => {
    //             const _fileTokens = await FileTokens.create({
    //                 ft_id: getUUID4(),
    //                 ft_token: data.token,
    //                 ft_file_id_fk: data.file_id,
    //                 ft_created_by: req.user.id,
    //                 ft_updated_by: req.user.id
    //             });
    //             resolve(_fileTokens?.dataValues ? _fileTokens.dataValues : _fileTokens);
    //         });
    //     } catch (e) {
    //         console.error("Error in FileTokens.add", e);
    //         return Promise.reject(e);
    //     }
    // };

    return FileTokens;
};