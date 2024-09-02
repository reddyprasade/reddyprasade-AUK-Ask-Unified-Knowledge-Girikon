const {join} = require("path");
const {DataTypes} = require("sequelize");
const {getUUID4} = require("../utils");
module.exports = (db) => {
	const Files = db.sequelize.define('files', {
			f_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
			f_name: {type: DataTypes.STRING(256), allowNull: true},
			f_original_name: {type: DataTypes.STRING(256), allowNull: false},
			f_path: {type: DataTypes.STRING(2048), allowNull: false},
			f_ext: {type: DataTypes.STRING(100), allowNull: false},
			f_size: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
			f_assistant_file_id: {type: DataTypes.STRING(100), allowNull: true},
			f_vector_store_id: {type: DataTypes.STRING(100), allowNull: true},
		    f_secret_token: { type: DataTypes.STRING(2048), allowNull: true},

			f_collection_id_fk: {type: DataTypes.UUID, allowNull: true},
			f_user_id_fk: {type: DataTypes.UUID, allowNull: true},

			f_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
			f_created_by: {type: DataTypes.UUID},
			f_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
			f_updated_by: {type: DataTypes.UUID},
			f_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
		},
		{
			indexes: [
				{unique: true, fields: ['f_id']}
			],
			timestamps: true,
			underscrored: true,
			createdAt: false,
			updatedAt: false,
			hooks: {
				beforeCreate: async (o, options) => {
					o.f_created_at = new Date();
					o.f_updated_at = new Date();
				},
				beforeUpdate: async (o, options) => {
					o.f_updated_at = new Date();
				}
			}
		});

	Files.add = async (req, files = [], collection_id) => {
		try {
			// return new Promise(async (resolve, reject) => {
			for (let i = 0; i < files.length; i++) {
				let file = files[i];
				file.path = file.path.indexOf(process.cwd()) === -1 ? join(process.cwd(), file.path) : file.path;
				const _files = await Files.create({
					f_id: getUUID4(),
					f_name: file.filename,
					f_original_name: file.originalname,
					f_path: file.path,
					f_ext: file.mimetype,
					f_size: file.size,

					f_collection_id_fk: collection_id,
					f_user_id_fk: req.user.id,
                   f_status: "active",
                   f_created_by: req.user.id,
                   f_updated_by: req.user.id,
              });     
                if (i === files.length - 1) {
                    return _files;
                }          
            }
         
        //   });
        } catch (error) {
            console.error("error in adding file", error.message);
            return false;   
        }
            
    };

	Files.delete = async (req, id) => {
		try {
			let _file = await Files.findOne({where: {f_id: id}});
			if (_file) {
				await Files.destroy({where: {f_id: id}});
				return true;
			}
			else {
				return false;
			}
		}
		catch (e) {
			console.error("files delete", e);
			return false;
		}
	};

	Files.getFileByCollectionID = async (f_name, f_collection_id_fk) => {
		try {
			let _file = await Files.findOne({
				attributes: ['f_original_name', 'f_path', 'f_ext'],
				where: {f_name: f_name, f_collection_id_fk: f_collection_id_fk, f_status: "active"}
			});
			if (_file) {
				return _file;
			}
			else {
				return false;
			}
		}
		catch (e) {
			console.error("files not found", e);
			return false;
		}
	};

	return Files;
};