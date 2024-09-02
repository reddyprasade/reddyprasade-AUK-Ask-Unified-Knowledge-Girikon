const {DataTypes} = require("sequelize");
const {toInternalName, getUUID4} = require("../utils");
const path = require("path");
module.exports = (db) => {
	const Collections = db.sequelize.define('collections', {
			c_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
			c_name: {type: DataTypes.STRING(100), allowNull: true},
			c_internal_name: {type: DataTypes.STRING(100), allowNull: false},
			c_public: {type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false},
			c_is_trained: {type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false},

			c_org_id_fk: {type: DataTypes.UUID, allowNull: false},
			c_owner_users_fk: {type: DataTypes.UUID, allowNull: true},
			c_selected_key: {type: DataTypes.STRING(100), allowNull: true , defaultValue: "baali"},
		    c_model_type: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "default" },
			c_assistant_id: { type: DataTypes.STRING(100), allowNull: true },
		    c_vector_store_id: { type: DataTypes.STRING(100), allowNull: true },
			c_response_type: { type: DataTypes.STRING(100), allowNull: true },
			c_domain_url: { type: DataTypes.TEXT, allowNull: true },
			c_whitelist_url: { type: DataTypes.TEXT, allowNull: true },

			c_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
			c_created_by: {type: DataTypes.UUID},
			c_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
			c_updated_by: {type: DataTypes.UUID},
			c_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
		},
		{
			indexes: [
				{unique: true, fields: ['c_id']},
			],
			timestamps: true,
			underscrored: true,
			createdAt: false,
			updatedAt: false,
			hooks: {
				beforeCreate: async (o, options) => {
					o.c_created_at = new Date();
					o.c_updated_at = new Date();
					if (o.c_name && !o.c_internal_name) {
						o.c_internal_name = toInternalName(o.c_name);
					}
				},
				beforeUpdate: async (o, options) => {
					o.c_updated_at = new Date();
					if (o.c_name && !o.c_internal_name) {
						o.c_internal_name = toInternalName(o.c_name);
					}
				}
			}
		});

	Collections.add = async (req, data) => {
		return new Promise(async (resolve, reject) => {

			try {
				const c_internal_name = data?.c_internal_name ? data?.c_internal_name : toInternalName(data?.c_name);
				const collections_id = await Collections.findOne({attributes: ['c_id'], where: {c_internal_name: c_internal_name}}, {logger: db.logging});
				// console.log(48, collections_id);
				if (!collections_id) {
					const _collections = await Collections.create({
						c_id: getUUID4(),
						c_name: data?.c_name,
						c_internal_name: c_internal_name,
						c_selected_key: data?.c_selected_key || "baali",
						c_org_id_fk: data?.c_org_id_fk,
						c_status: "active",
						c_public: data?.c_public || false,
						c_created_by: req.user.id || "",
						c_updated_by: req.user.id || ""
					});
					return resolve(_collections?.dataValues ? _collections.dataValues : _collections);
				}
				else {
					return resolve("Collections already exists, please try again with a different name or contact to admin.");
				}
			}
			catch (e) {
				console.error("collections add", e);
				return reject(e);
			}
		});
	};

	Collections.getCollectionPath = async (c_id) => {
		return new Promise(async (resolve, reject) => {
			try {
				const collections = await Collections.findOne({attributes: ['c_id', 'c_org_id_fk'], where: {c_id: c_id}});
				resolve(path.join(process.cwd(), "uploads", collections?.c_org_id_fk, collections?.c_id));
			}
			catch (e) {
				console.error("collections getCollectionPath", e);
                resolve(null);
			}
		});
	}

	return Collections;
};