const {join} = require("path");
const db = require("../models");
const validateToken = async (req, res, next) => {
    let {section} = req.body || req.params;
    const {type} = req.params;
    section = section || type;

    let token = String(req.headers['authorization'] || req.headers["x-access-token"] || req.headers["x-api-key"]);
    let private_key_type = req.headers["x-api-private-key-type"] ? req.headers["x-api-private-key-type"] : null;
    let private_key_value = req.headers["x-api-private-key-value"];
    token = token.startsWith('Bearer ') ? token.substring(7, token.length) : token;
    req.token = token;

    if (private_key_type && private_key_type === "chat_gpt") {
        req.chat_gpt = private_key_value === process.env.OPENAI_API_KEY_TEST ? process.env.OPENAI_API_KEY : private_key_value;
    } else if (private_key_type && private_key_type === "baali") {
        req.baali = private_key_value;
    }

    if (token) {
        try {
            let _user = await db.users.getFromKey(token);
            // console.log("_user10", _user);
            const sub_folder = section && section === 'chat_gpt' ? 'docs' : 'ai';
            if (_user) {
                req.chat_gpt = _user?.u_chat_gpt_key;
                req.user = {
                    id: _user?.u_id,
                    u_name: _user?.u_name,
                    u_email: _user?.u_email,
                    ak_key: _user?.ak_key,
                    ak_id: _user?.ak_id,
                    aku_id: _user?.aku_id,
                    org_id: _user?.u_default_org_fk,
                    u_parent_id: _user?.u_parent_id,
                    collection_id: _user?.u_default_collection_fk,
                    u_default_department_fk: _user?.u_default_department_fk,
                    u_is_super_admin: _user?.u_is_super_admin,
                    sub_folder: sub_folder,
                    org_root_path: join(process.cwd(), "uploads", _user?.u_default_org_fk),
                    root_path: join(process.cwd(), "uploads", _user?.u_default_org_fk, (req?.body?.collection_id || _user?.u_default_collection_fk)),
                    upload_path: join(process.cwd(), "uploads", _user?.u_default_org_fk, (req?.body?.collection_id || _user?.u_default_collection_fk), sub_folder),
                    web_url: req?.headers?.origin,
                    u_response_type: _user?.u_response_type,
                };

                next();
            } else {
                return res.status(498).send({message: "Failed! Token is expired!"});
            }
        } catch (e) {
            return res.status(498).send({message: "Failed! Token is expired!"});
        }
    } else {
        return res.status(500).send({message: "Unauthorized access!"});
    }

};

const validateTokenInternal = async (token, req={}) => {
    return new Promise(async (resolve, reject) => {
        req.user = {
            id: "bc7cbfc8-4261-4201-992f-9acd55cf72df",
            org_id: "c1542609-ce72-4fb0-931d-66da113a7258"
        };

        // let {section} = req.body || req.params;
        // const {type} = req.params;
        // section = section || type;

        // let token = String(req.headers['authorization'] || req.headers["x-access-token"] || req.headers["x-api-key"]);
        // let private_key_type = req.headers["x-api-private-key-type"] ? req.headers["x-api-private-key-type"] : null;
        // let private_key_value = req.headers["x-api-private-key-value"];
        // token = token.startsWith('Bearer ') ? token.substring(7, token.length) : token;
        req.token = token;

        // if (private_key_type && private_key_type === "chat_gpt") {
        //     req.chat_gpt = private_key_value === process.env.OPENAI_API_KEY_TEST ? process.env.OPENAI_API_KEY : private_key_value;
        // } else if (private_key_type && private_key_type === "baali") {
        //     req.baali = private_key_value;
        // }

        try {
            let _user = await db.users.getFromKey(token);
            // console.log("_user10", _user);
            const sub_folder = section && section === 'chat_gpt' ? 'docs' : 'ai';
            if (_user) {
                req.chat_gpt = _user?.u_chat_gpt_key;
                req.user = {
                    id: _user?.u_id,
                    u_name: _user?.u_name,
                    u_email: _user?.u_email,
                    ak_key: _user?.ak_key,
                    ak_id: _user?.ak_id,
                    aku_id: _user?.aku_id,
                    org_id: _user?.u_default_org_fk,
                    u_parent_id: _user?.u_parent_id,
                    collection_id: _user?.u_default_collection_fk,
                    u_default_department_fk: _user?.u_default_department_fk,
                    u_is_super_admin: _user?.u_is_super_admin,
                    sub_folder: sub_folder,
                    org_root_path: join(process.cwd(), "uploads", _user?.u_default_org_fk),
                    root_path: join(process.cwd(), "uploads", _user?.u_default_org_fk, (req?.body?.collection_id || _user?.u_default_collection_fk)),
                    upload_path: join(process.cwd(), "uploads", _user?.u_default_org_fk, (req?.body?.collection_id || _user?.u_default_collection_fk), sub_folder),
                    web_url: req?.headers?.origin,
                    u_response_type: _user?.u_response_type,
                };
                resolve(req);
            } else {
                resolve(req);
            }
        } catch (e) {
            resolve(req);
        }
    });

};

module.exports = {
    validateToken,
    validateTokenInternal
};