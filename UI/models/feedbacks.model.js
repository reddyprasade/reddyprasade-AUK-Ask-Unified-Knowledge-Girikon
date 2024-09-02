const {DataTypes} = require("sequelize");
module.exports = (db) => {
    const Feedbacks = db.sequelize.define('feedbacks', {
            fb_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            fb_question: {type: DataTypes.TEXT, allowNull: true, defaultValue: ''},
            fb_answer: {type: DataTypes.TEXT, allowNull: true, defaultValue: ''},
            fb_metadata: {type: DataTypes.TEXT, allowNull: true, defaultValue: ''},
            fb_action: {type: DataTypes.STRING(20), allowNull: true, defaultValue: 'up'},
            fb_tags: {type: DataTypes.STRING(1024), allowNull: true, defaultValue: ''},
            fb_comments: {type: DataTypes.TEXT, allowNull: true, defaultValue: ''},
            fb_approved_status: {type: DataTypes.STRING(20), allowNull: true, defaultValue: 'pending'},
            fb_admin_comments: {type: DataTypes.TEXT, allowNull: true, defaultValue: ''},

            fb_session_id_fk: {type: DataTypes.UUID, allowNull: false},
            fb_user_id_fk: {type: DataTypes.UUID, allowNull: false},
            fb_org_id_fk: {type: DataTypes.UUID, allowNull: true, defaultValue: null},

            fb_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            fb_created_by: {type: DataTypes.UUID},
            fb_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            fb_updated_by: {type: DataTypes.UUID},
            fb_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['fb_id']}
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.fb_created_at = new Date();
                    o.fb_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.fb_updated_at = new Date();
                }
            }
        });

    return Feedbacks;
};