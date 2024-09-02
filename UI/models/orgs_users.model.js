const {DataTypes} = require("sequelize");
module.exports = (db) => {
    const OrgsUsers = db.sequelize.define('orgs_users', {
            ou_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            ou_org_id_fk: {type: DataTypes.UUID, allowNull: false},
            ou_user_id_fk: {type: DataTypes.UUID, allowNull: false},

            ou_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            ou_created_by: {type: DataTypes.UUID},
            ou_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            ou_updated_by: {type: DataTypes.UUID},
            ou_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['ou_id']}
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.ou_created_at = new Date();
                    o.ou_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.ou_updated_at = new Date();
                }
            }
        });

    return OrgsUsers;
};