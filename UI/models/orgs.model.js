const {DataTypes} = require("sequelize");
const {getUUID4, toInternalName} = require("../utils");

module.exports = (db) => {
    const Orgs = db.sequelize.define('orgs', {
            o_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            o_name: {type: DataTypes.STRING(100), allowNull: true},
            o_internal_name: {type: DataTypes.STRING(100), allowNull: false},
            o_logo: {type: DataTypes.STRING(2048), allowNull: true},
            o_total_tokens: {type: DataTypes.INTEGER, allowNull: true, defaultValue: 0},
            o_alert_tokens: {type: DataTypes.INTEGER, allowNull: true},
            o_used_tokens: {type: DataTypes.INTEGER, allowNull: true, defaultValue: 0},

            o_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            o_created_by: {type: DataTypes.UUID},
            o_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            o_updated_by: {type: DataTypes.UUID},
            o_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['o_id']},
                { unique: true, fields: ['o_internal_name']}
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.o_created_at = new Date();
                    o.o_updated_at = new Date();
                    o.o_internal_name = o.o_name.toLowerCase().replace(/ /g, '_');

                },
                beforeUpdate: async (o, options) => {
                    o.o_updated_at = new Date();
                    if (o.o_name) {
                        o.o_internal_name = o.o_name.toLowerCase().replace(/ /g, '_');
                    }
                }
            }
        });

    Orgs.add = async (req, data) => {
        return new Promise(async (resolve, reject) => {      
            const org_name = toInternalName(data?.o_name);
            const orgs_id = await Orgs.findOne({ attributes: ['o_id'], where: { o_internal_name: org_name }});
            if (!orgs_id) {
                const orgs = await Orgs.create({
                    o_id: getUUID4(),
                    o_name: data?.o_name,
                    o_internal_name: org_name,
                    o_status: "active",
                    o_created_by: req.user.id || "",
                    o_updated_by: req.user.id || "",
                    o_logo: data?.logo
                });
                // console.log(51, orgs?.dataValues);
                resolve(orgs?.dataValues ? orgs.dataValues : orgs);
            }
            else {
                resolve("Org already exists, please try again with a different name or contact to admin.");
            }
        });
    };

    return Orgs;
};