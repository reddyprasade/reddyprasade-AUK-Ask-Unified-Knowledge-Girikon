const {DataTypes} = require('sequelize');

module.exports = (db) => {
    const Threads = db.sequelize.define('threads', {
            th_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            th_name: {type: DataTypes.STRING(100), allowNull: true},
            th_description: {type: DataTypes.TEXT, allowNull: false, defaultValue: ''},
            th_user_id_fk: {type: DataTypes.UUID, allowNull: false},
            th_collection_id_fk: {type: DataTypes.UUID, allowNull: true , defaultValue: null},

            th_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            th_created_by: {type: DataTypes.UUID},
            th_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            th_updated_by: {type: DataTypes.UUID},
            th_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['th_id']},
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.th_created_at = new Date();
                    o.th_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.th_updated_at = new Date();
                }
            }
        });

    return Threads;
};