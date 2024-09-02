const {DataTypes} = require('sequelize');

module.exports = (db) => {
    const ThreadsFiles = db.sequelize.define('threads_files', {
            tf_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            tf_name: {type: DataTypes.STRING(100), allowNull: true},
            tf_description: {type: DataTypes.TEXT, allowNull: false, defaultValue: ''},
            tf_user_id_fk: {type: DataTypes.UUID, allowNull: false},
            tf_thread_id_fk: {type: DataTypes.UUID, allowNull: true , defaultValue: null},

            tf_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            tf_created_by: {type: DataTypes.UUID},
            tf_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            tf_updated_by: {type: DataTypes.UUID},
            tf_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['tf_id']},
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.tf_created_at = new Date();
                    o.tf_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.tf_updated_at = new Date();
                }
            }
        });

    return ThreadsFiles;
};