const {DataTypes, Op} = require("sequelize");
const { countTokens , preprocessString} = require("../utils");

module.exports = (db) => {
    const Histories = db.sequelize.define('histories', {
            h_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            h_question: {type: DataTypes.TEXT, allowNull: true},
            h_answer: {type: DataTypes.TEXT, allowNull: true},
            h_metadata: {type: DataTypes.TEXT, allowNull: true},
            h_error: {type: DataTypes.TEXT, allowNull: true},
            h_req: {type: DataTypes.TEXT, allowNull: true},
            h_res: {type: DataTypes.TEXT, allowNull: true},
            h_model_type: {type: DataTypes.STRING(20), allowNull: true},
            h_selected_key: {type: DataTypes.STRING(20), allowNull: true},
            h_response_type: { type: DataTypes.STRING(100), allowNull: true },
            h_collection_id: { type: DataTypes.STRING(100), allowNull: true},
            h_filter_question: { type: DataTypes.STRING(100), allowNull: true},

            h_session_id_fk: {type: DataTypes.UUID, allowNull: false},
            h_user_id_fk: {type: DataTypes.UUID, allowNull: false},
            h_org_id_fk: {type: DataTypes.UUID, allowNull: false},
            h_answer_tokens: {type: DataTypes.INTEGER, allowNull: true},
            h_question_tokens: { type: DataTypes.INTEGER, allowNull: true},
            h_total_tokens: { type: DataTypes.INTEGER, allowNull: true},
            h_run_id: { type: DataTypes.STRING(100), allowNull: true },
            h_external_user_id: { type: DataTypes.STRING(100), allowNull: true },
            h_external_org_id: { type: DataTypes.STRING(100), allowNull: true },
            h_external_email_id: { type: DataTypes.STRING(256), allowNull: true },

            h_status: {type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active'},
            h_created_by: {type: DataTypes.UUID},
            h_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            h_updated_by: {type: DataTypes.UUID},
            h_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['h_id']}
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.h_created_at = new Date();
                    o.h_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.h_updated_at = new Date();
                }
            }
        });

    Histories.getOriginalNameOfFile = (metadata) => {
        metadata = metadata && typeof metadata === "string" ? JSON.parse(metadata) : metadata;
        // console.log("metadata", metadata);
        return new Promise(async (resolve, reject) => {
            if(!metadata || metadata.length === 0) {
                resolve([]);
            }else {
                const filenames = metadata && metadata.length > 0 && metadata.map((m) => m.filename);
                // console.log("filenames", filenames);
                let fileOriginalName = await db.files.findAll({
                    attributes: ["f_original_name", "f_name"],
                    where: {f_name: {[Op.in]: filenames}}
                }, {raw: true, plain: true});
                fileOriginalName = fileOriginalName?.dataValues || fileOriginalName;

                // console.log("fileOriginalName", fileOriginalName);
                let final_metadata = metadata.map((m) => {
                    const _f = fileOriginalName.filter((f) => f.f_name === m.filename);
                    console.log("_f", _f);
                    m["original_name"] = _f && _f.length > 0 && _f[0].dataValues ? _f[0].dataValues?.f_original_name : "";
                    return m;
                });
                // console.log("final_metadata", final_metadata);
                final_metadata = typeof final_metadata === "string" ? final_metadata : JSON.stringify(final_metadata);
                resolve(final_metadata);
            }
        });
    };

    Histories.updateResponse = async (req, result) => {

        const _collection = await db.collections.findOne({
            attributes: ['c_model_type', 'c_selected_key', "c_response_type"],
            where: { c_id:  req.body?.collection_id || req.user?.collection_id }
        });
        let tempResult = [Array.isArray(result) ? result[result.length - 1] : result];
        let answers = tempResult && tempResult.length > 0 ? tempResult?.map((r) => r.answer || r.a || r.answers || r.ans || "") : (tempResult.answer || tempResult.a || tempResult.answers || tempResult.ans || "");
        let metadata = tempResult && tempResult.length > 0 ? tempResult[0].metadata : tempResult?.metadata;
        let metadataWithOriginalFileName;
        let thread_id = tempResult && tempResult.length > 0 ? tempResult[0]?.thread_id : tempResult?.thread_id;
        let run_id = tempResult && tempResult.length > 0 ? tempResult[0]?.run_id : tempResult?.run_id;
    
        if(metadata){
             metadataWithOriginalFileName = await Histories.getOriginalNameOfFile(metadata);
        }

      
        // console.log("metadataWithOriginalFileName", metadataWithOriginalFileName);
        // console.log("typeof metadataWithOriginalFileName", typeof metadataWithOriginalFileName);
        return Histories.update({
            h_answer: answers.join(", "),
            h_metadata: metadataWithOriginalFileName,
            h_error: typeof result === "string" ? result : result?.error || result?.e || result?.errors,
            h_res: typeof result === "string" ? result : JSON.stringify(result),
            h_model_type: _collection?.dataValues?.c_model_type,
            h_selected_key: _collection?.dataValues?.c_selected_key,
            h_response_type: _collection?.dataValues?.c_response_type,
        }, {where: {h_id: req.h_id}});


    };

    Histories.add = async (req, session_id) => {
        return new Promise(async (resolve, reject) => {
            try {
                let h_req = Object.assign({}, req.params, req.query, req.body);
                console.log('req.body', req.body);
                const _collection = await db.collections.findOne({
                    attributes:['c_model_type','c_selected_key',"c_response_type"],
                    where: {c_id: h_req?.collection_id || req.body?.collection_id || req.user?.collection_id}
                });

                const histories = await Histories.create({
                    h_id: db.getUUID4(),
                    h_question: h_req?.question || h_req?.q || h_req?.questions,
                    h_answer: "",
                    h_metadata: JSON.stringify(h_req?.metadata || h_req?.m || h_req?.metadatas),
                    h_req: JSON.stringify(Object.assign({}, req.params, req.query, req.body)),
                    h_res: "",
                    h_session_id_fk: session_id,
                    h_user_id_fk: req.user.id,
                    h_org_id_fk: req.user.org_id,
                    h_created_by: req.user.id,
                    h_updated_by: req.user.id,
                    h_model_type: _collection?.dataValues?.c_model_type,
                    h_selected_key: _collection?.dataValues?.c_selected_key,
                    h_response_type: _collection?.dataValues?.c_response_type,
                    h_collection_id: h_req?.collection_id || req.body?.collection_id || req.user?.collection_id,
                    h_external_user_id: req.body?.h_external_user_id || req.user.id,
                    h_external_org_id: req.body?.h_external_org_id || req.user.org_id,
                    h_external_email_id: req.body?.h_external_email_id || req.user.email,
                    h_filter_question: preprocessString(h_req?.question || h_req?.q || h_req?.questions),
                });
                resolve(histories.h_id);
            } catch (e) {
                console.error(e);
                resolve(null);
            }
        });
    };
  
    // Histories.sync({ alter: true }).then(() => {
    //     console.log('Table Histories synced');
    // });
    return Histories;
};
