const {DataTypes} = require("sequelize");
module.exports = (db) => {
    const Sessions = db.sequelize.define('sessions', {
            s_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            s_name: {type: DataTypes.STRING(100), allowNull: true},
            s_description: {type: DataTypes.TEXT, allowNull: false, defaultValue: ''},
            s_user_id_fk: {type: DataTypes.UUID, allowNull: false},
            s_collection_id_fk: {type: DataTypes.UUID, allowNull: true , defaultValue: null},
            s_thread_id: {type: DataTypes.STRING(100), allowNull: true , defaultValue: null},

            s_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            s_created_by: {type: DataTypes.UUID},
            s_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            s_updated_by: {type: DataTypes.UUID},
            s_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['s_id']},
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.s_created_at = new Date();
                    o.s_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.s_updated_at = new Date();
                }
            }
        });



 // get thread id by session id
    Sessions.getThreadIdBySessionId = async(session_id) => {
        console.log("session_id in model", session_id);
        if(session_id === undefined || session_id === null || session_id === "") {
            return null;
        }
        return new Promise(async (resolve, reject) => {
            let thread_id = await Sessions.findOne({
                attributes: ['s_thread_id'],
                where: {s_id: session_id}
            });
            resolve(thread_id);
        });
    }


    return Sessions;
};