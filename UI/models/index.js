const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");
const fs = require("fs");
const {getUUID4} = require("../utils");
const db = {};
db.getUUID4 = getUUID4;
db.logging = process.env.DB_DEBUG_QUERY === "true" ? console.log : null;
db.Sequelize = Sequelize;
db.sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    logging: process.env.DB_DEBUG === "true" ? console.info : false,
    freezeTableName: true,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle,
    },
});
db.sequelizeFileUpload = (filePath) =>
    new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
        host: dbConfig.HOST,
        dialect: dbConfig.dialect,
        logging: process.env.DB_DEBUG === "true" ? console.info : false,
        freezeTableName: true,
        poll: {
            max: dbConfig.pool.max,
            min: dbConfig.pool.min,
            acquire: dbConfig.pool.acquire,
            idle: dbConfig.pool.idle,
        },
        dialectOptions: {
            localInfile: true,
            infileStreamFactory: (path) => fs.createReadStream(filePath),
        },
    });

// Register Collections (Tables)

db.api_keys = require("./api_key.model")(db);
db.api_keys_users = require("./api_keys_users.model")(db);
db.feedbacks = require("./feedbacks.model")(db);
db.files = require("./files.model")(db);
db.histories = require("./histories.model")(db);
db.collections = require("./collections.model")(db);
db.orgs = require("./orgs.model")(db);
db.orgsUsers = require("./orgs_users.model")(db);
db.sessions = require("./sessions.model")(db);
db.users = require("./users.model")(db);
db.departments = require("./departments.model")(db);
db.users_departments = require("./users_departments.model")(db);
db.collections_departments = require("./collections_departments.model")(db);
db.api_keys_departments = require("./api_keys_departments.model")(db);
db.mails = require("./mails.model")(db);
db.threads = require("./threads.model")(db);
db.threads_files = require("./threads_files.model")(db);
db.run_infos = require("./run_infos.model.js")(db);
db.rates = require("./rates.model.js")(db);
db.crm_tokens = require("./crmtokens.model.js")(db);
db.file_tokens = require("./file_tokens.model.js")(db);
db.pricing = require("./pricing.model.js")(db);
db.widgets = require("./widgets.model.js")(db);

db.initRelationships = async () => {
    try {
        // Associations or Relationships
        // user departments (One to Many)
        db.users_departments.belongsTo(db.users, {targetKey: 'u_id', foreignKey: "ud_user_id_fk"});
        db.users_departments.belongsTo(db.departments, {targetKey: 'dept_id', foreignKey: "ud_department_id_fk"});
        // Orgs Users (Many to Many)
        db.orgs.belongsToMany(db.users, {
            as: "ou_user_id_fk",
            through: db.orgsUsers,
            sourceKey: "o_id",
            foreignKey: "ou_org_id_fk",
        });
        db.users.belongsToMany(db.orgs, {
            as: "ou_org_id_fk",
            through: db.orgsUsers,
            sourceKey: "u_id",
            foreignKey: "ou_user_id_fk",
        });
        // Api Keys Users (One to Many)
        db.api_keys_users.belongsTo(db.api_keys, {
            targetKey: "ak_id",
            foreignKey: "aku_api_keys_id_fk",
        });
        db.api_keys_users.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "aku_users_id_fk",
        });
        // Feedbacks (One to Many)
        db.feedbacks.belongsTo(db.sessions, {
            targetKey: "s_id",
            foreignKey: "fb_session_id_fk",
        });
        db.feedbacks.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "fb_user_id_fk",
        });
        // Collections (One to Many)
        db.collections.belongsTo(db.orgs, {
            targetKey: "o_id",
            foreignKey: "c_org_id_fk",
        });
        db.collections.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "c_owner_users_fk",
        });
        // Files (One to Many)
        db.files.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "f_user_id_fk",
        });
        db.files.belongsTo(db.collections, {
            targetKey: "c_id",
            foreignKey: "f_collection_id_fk",
        });
        // Histories (One to Many)
        db.histories.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "h_user_id_fk",
        });
        db.histories.belongsTo(db.sessions, {
            targetKey: "s_id",
            foreignKey: "h_session_id_fk",
        });
        // Sessions (One to Many)
        db.sessions.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "s_user_id_fk",
        });
        // Users (One to Many)
        db.users.belongsTo(db.orgs, {
            targetKey: "o_id",
            foreignKey: "u_default_org_fk",
        });
        db.users.belongsTo(db.collections, {
            targetKey: "c_id",
            foreignKey: "u_default_collection_fk",
        });

        db.feedbacks.belongsTo(db.users, { foreignKey: 'fb_user_id_fk' , as: 'user' });

        // created_by, updated_by
        db.api_keys.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "ak_created_by",
        });
        db.api_keys.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "ak_updated_by",
        });
        db.feedbacks.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "fb_created_by",
        });
        db.feedbacks.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "fb_updated_by",
        });
        db.files.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "f_created_by",
        });
        db.files.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "f_updated_by",
        });
        db.histories.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "h_created_by",
        });
        db.histories.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "h_updated_by",
        });
        db.collections.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "c_created_by",
        });
        db.collections.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "c_updated_by",
        });
        db.orgs.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "o_created_by",
        });
        db.orgs.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "o_updated_by",
        });
        db.sessions.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "s_created_by",
        });
        db.sessions.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "s_updated_by",
        });
        db.users.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "u_created_by",
        });
        db.users.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "u_updated_by",
        });
        db.departments.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "dept_created_by",
        });
        db.departments.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "dept_updated_by",
        });
        db.users_departments.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "ud_created_by",
        });
        db.users_departments.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "ud_updated_by",
        });
        db.collections_departments.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "cd_created_by",
        });
        db.collections_departments.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "cd_updated_by",
        });
        db.orgsUsers.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "ou_created_by",
        });
        db.orgsUsers.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "ou_updated_by",
        });
        db.api_keys_departments.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "akd_created_by",
        });
        db.api_keys_departments.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "akd_updated_by",
        });
        db.threads.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "th_created_by",
        });
        db.threads.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "th_updated_by",
        });
        db.threads_files.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "tf_created_by",
        });
        db.threads_files.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "tf_updated_by",
        });
        db.rates.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "r_created_by",
        });
        db.rates.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "r_updated_by",
        });
        db.rates.belongsTo(db.orgs, {
            targetKey: "o_id",
            foreignKey: "r_org_id_fk",
        });
        db.crm_tokens.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "created_by",
        });
        db.crm_tokens.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "updated_by",
        });
        db.file_tokens.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "ft_created_by",
        });
        db.file_tokens.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "ft_updated_by",
        });
        db.pricing.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "p_created_by",
        });
        db.pricing.belongsTo(db.users, {
            targetKey: "u_id",
            foreignKey: "p_updated_by",
        });
        db.widgets.belongsTo(db.users, {targetKey: "u_id", foreignKey: "wg_created_by"});
        db.widgets.belongsTo(db.users, {targetKey: "u_id", foreignKey: "wg_updated_by"});

        db.widgets.belongsTo(db.collections, {targetKey: "c_id", foreignKey: "wg_collection_id_fk"});
        db.widgets.belongsTo(db.api_keys, {targetKey: "ak_id", foreignKey: "wg_api_key_id_fk"});
    } catch (e) {
        console.error("Error:: models/index.js\t", e);
    } finally {
        try {
            const _rates = await db.rates.findAll();
            // console.log("Rates====>",_rates);
            if (!_rates.length) {
                await db.rates.bulkCreate([
                    {
                        r_model: "chat_gpt",
                        r_per_token_rate: 0.001,
                        r_per_storage_rate: 0.20,
                        r_per_token_rate_chatgpt: 0.0005,
                        r_per_storage_rate_chatgpt: 0.10,
                        r_threshold: 120
                    },
                    {
                        r_model: "baali",
                        r_per_token_rate: 0.001,
                        r_per_storage_rate: 0.20,
                        r_per_token_rate_chatgpt: 0.0005,
                        r_per_storage_rate_chatgpt: 0.10,
                        r_threshold: 120
                    },
                    {
                        r_model: "chat_gpt_assistant",
                        r_per_token_rate: 0.001,
                        r_per_storage_rate: 0.20,
                        r_per_token_rate_chatgpt: 0.0005,
                        r_per_storage_rate_chatgpt: 0.10,
                        r_threshold: 120
                    }
                ]);
            }
        } catch (error) {
            console.log(error)
        }
        // try {
        //     const __orgs = await db.orgs.bulkCreate([{
        //         o_id: '8021a9f9-36c6-4d6f-b814-e856b572e84f',
        //         o_name: 'Girikon1',
        //         o_internal_name: 'girikon1'
        //     }]);
        //     const __users = await db.users.bulkCreate([
        //         {u_id: 'aac8f1ce-435f-467d-92a7-3ada1e9fd074', u_name: 'A01', u_email: 'A01@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '72fb1941-4e89-4ca0-bf57-5d552bd9eeda', u_name: 'A02', u_email: 'A02@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '96938009-805a-41a2-9c69-19f1fa99e20c', u_name: 'A03', u_email: 'A03@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: 'efacf6ca-600f-498f-ba03-0bbed73afa59', u_name: 'A04', u_email: 'A04@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '48b7a4ad-7f73-4f1d-b215-29b0540415d6', u_name: 'A05', u_email: 'A05@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: 'd0f481cd-f97a-41e8-80b7-d42f3a048ef1', u_name: 'A06', u_email: 'A06@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: 'f31c069c-1697-4522-8d11-11bc7ef782c2', u_name: 'A07', u_email: 'A07@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '4efe5474-b318-48c0-8966-6f6cde1d7af7', u_name: 'A08', u_email: 'A08@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '2fab55bc-e435-4349-8477-87bdbc73534d', u_name: 'A09', u_email: 'A09@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '7b3fcaea-4088-4b36-8f44-acfbb03cfd6a', u_name: 'A10', u_email: 'A10@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: 'dee62dae-61a2-4f35-9037-8e1d469ed433', u_name: 'A11', u_email: 'A11@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: 'e92f50a7-46e7-49ca-b1d8-6ea2af0f5b38', u_name: 'A12', u_email: 'A12@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '6518a36c-c781-4b77-9595-fdec55ea5a70', u_name: 'A13', u_email: 'A13@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '3f08aae2-9ab8-459d-9d3f-bd894fb17f6f', u_name: 'A14', u_email: 'A14@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '9f0d2b36-89a2-46cf-81ef-5b125841b4f7', u_name: 'A15', u_email: 'A15@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '421daf09-771b-4aa3-a9ed-c32b125cb064', u_name: 'A16', u_email: 'A16@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '487250bf-5271-4443-81dc-271e12314d44', u_name: 'A17', u_email: 'A17@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '8d701bcc-cc30-45e1-bdf6-9a02e314602f', u_name: 'A18', u_email: 'A18@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '082d40f7-4a4d-4b76-8c8a-a8b23309c7ed', u_name: 'A19', u_email: 'A19@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //         {u_id: '50dda587-068c-4432-a5f3-e3665fc7fe74', u_name: 'A20', u_email: 'A20@girikon.com', u_default_org_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f'},
        //     ]);
        //
        //     const __orgs_users = await db.orgsUsers.bulkCreate([
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: 'aac8f1ce-435f-467d-92a7-3ada1e9fd074'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '72fb1941-4e89-4ca0-bf57-5d552bd9eeda'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '96938009-805a-41a2-9c69-19f1fa99e20c'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: 'efacf6ca-600f-498f-ba03-0bbed73afa59'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '48b7a4ad-7f73-4f1d-b215-29b0540415d6'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: 'd0f481cd-f97a-41e8-80b7-d42f3a048ef1'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: 'f31c069c-1697-4522-8d11-11bc7ef782c2'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '4efe5474-b318-48c0-8966-6f6cde1d7af7'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '2fab55bc-e435-4349-8477-87bdbc73534d'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '7b3fcaea-4088-4b36-8f44-acfbb03cfd6a'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: 'dee62dae-61a2-4f35-9037-8e1d469ed433'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: 'e92f50a7-46e7-49ca-b1d8-6ea2af0f5b38'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '6518a36c-c781-4b77-9595-fdec55ea5a70'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '3f08aae2-9ab8-459d-9d3f-bd894fb17f6f'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '9f0d2b36-89a2-46cf-81ef-5b125841b4f7'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '421daf09-771b-4aa3-a9ed-c32b125cb064'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '487250bf-5271-4443-81dc-271e12314d44'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '8d701bcc-cc30-45e1-bdf6-9a02e314602f'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '082d40f7-4a4d-4b76-8c8a-a8b23309c7ed'},
        //         {ou_id: getUUID4(), ou_org_id_fk: '8021a9f9-36c6-4d6f-b814-e856b572e84f', ou_user_id_fk: '50dda587-068c-4432-a5f3-e3665fc7fe74'}
        //     ]);
        // }catch (e) {
        //     console.error("Error:: models/index.js123\t", e);
        // }
        // db.users.findAndCountAll({
        //     include: [{
        //         model: db.orgs,
        //         attributes: [],
        //         where: {
        //             o_id: '8021a9f9-36c6-4d6f-b814-e856b572e84f'
        //         }
        //     }],
        //     attributes: ['u_name', 'u_email', 'u_id', 'u_avatar', 'u_provider'],
        //     limit: 2,
        //     offset: 0,
        //     logging: db.logging
        // }).then((data) => {
        //     console.log("data 111\n", JSON.stringify(data, null, 2));
        // }).catch((e) => {
        //     console.error("Error:: models/index.js\t", e);
        // });
    }
};
module.exports = db;
