const { DataTypes } = require("sequelize");
const { getUUID4, toInternalName, getAvatar, removeInitial, generateOTP } = require("../utils");
const moment = require("moment");
const { encryptData, passwordCompare, passwordEncode } = require("../utils/encryption");
module.exports = (db) => {
    const Users = db.sequelize.define('users', {
        u_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false },
        u_name: { type: DataTypes.STRING(100), allowNull: true },
        u_email: { type: DataTypes.STRING(100), allowNull: false },
        u_password: { type: DataTypes.STRING(512), allowNull: true },
        u_avatar: { type: DataTypes.STRING(100), allowNull: true, defaultValue: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
        u_is_admin: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
        u_is_super_admin: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
        u_provider: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'local' },
        u_mobile: { type: DataTypes.STRING(50), allowNull: true },
        u_chat_gpt_key: { type: DataTypes.STRING(100), allowNull: true },
        u_reset_password_token: { type: DataTypes.STRING(100), allowNull: true },
        u_otp: { type: DataTypes.STRING(10), allowNull: true },
        u_response_type: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'short_answer'},
        u_timezone: { type: DataTypes.STRING(100), allowNull: true },
        u_datetime_format: { type: DataTypes.STRING(100), allowNull: true },
        u_daylight_saving: { type: DataTypes.BOOLEAN, allowNull: true },

        u_default_org_fk: { type: DataTypes.UUID, allowNull: true },
        u_default_collection_fk: { type: DataTypes.UUID, allowNull: true },
        u_default_department_fk: { type: DataTypes.UUID, allowNull: true },

        u_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'inactive' },
        u_created_by: { type: DataTypes.UUID, defaultValue: '12345678-1234-5678-1234-567812345678' },
        u_created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW },
        u_updated_by: { type: DataTypes.UUID, defaultValue: '12345678-1234-5678-1234-567812345678' },
        u_updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW },
        ext_u_id: { type: DataTypes.STRING(100), allowNull: true },
        ext_profile_id: { type: DataTypes.STRING(100), allowNull: true },
        ext_u_type: { type: DataTypes.STRING(100), allowNull: true },
        ext_created_by: { type: DataTypes.STRING(100), allowNull: true },
        ext_created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: db.Sequelize.NOW },
        ext_lastmodify_at: { type: DataTypes.DATE, allowNull: true, defaultValue: db.Sequelize.NOW },
        ext_lastmodify_by: { type: DataTypes.STRING(100), allowNull: true },
        ext_email: { type: DataTypes.STRING(100), allowNull: true },
        ext_source: { type: DataTypes.STRING(100), allowNull: true, defaultValue:"salesforce"},
        ext_username: { type: DataTypes.STRING(100), allowNull: true}
    },
        {
            indexes: [
                { unique: true, fields: ['u_id'] },
                // { unique: true, fields: ['u_email'] },
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.u_created_at = new Date();
                    o.u_updated_at = new Date();
                    o.ext_created_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.u_updated_at = new Date();
                    o.ext_lastmodify_at = new Date();
                }
            }
        });

    Users.getFromKey = async (token) => {
        return new Promise(async (resolve, reject) => {
            try {
                let q = `select aku.aku_id,ak.ak_id,u.u_id,u.u_email,u.u_name,u.u_default_org_fk,u.u_chat_gpt_key, u.u_default_department_fk,u.u_default_collection_fk, ak.ak_key , u.u_is_super_admin, u.u_status
                from users u, api_keys as ak, api_keys_users aku 
                where aku.aku_users_id_fk = u.u_id and aku.aku_api_keys_id_fk = ak.ak_id and ak.ak_key='${token}';`;
                let _user = await db.sequelize.query(q, { type: db.sequelize.QueryTypes.SELECT });
                // console.log("_user", _user);
                let _current_user = _user.length > 0 ? _user[0] : null;
                if (_current_user) {
                    const _org_id = _current_user?.u_default_org_fk;
                    let u_parent_id = await db.sequelize.query(`select u.u_id , u.u_chat_gpt_key , u.u_response_type from users u where u.u_default_org_fk='${_org_id}' and u.u_is_super_admin = true`, { type: db.sequelize.QueryTypes.SELECT });
                    _current_user.u_parent_id = u_parent_id[0]?.u_id;
                    _current_user.u_chat_gpt_key = u_parent_id[0]?.u_chat_gpt_key;
                    _current_user.u_response_type = u_parent_id[0]?.u_response_type;
                    resolve(_current_user);
                }
                else {
                    resolve(null);
                }
            }
            catch (e) {
                console.error("users getFromKey", e);
                resolve(null);
            }
        });
    }
    Users.add = async (req, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Validation for missing organization name
                if (!data?.org_name) {
                    throw new Error("Organization name is required.");
                }

                // Validation for missing username or email
                if (!data?.username && !data?.email) {
                    throw new Error("Username or email is required.");
                }

                // Validation for missing password
                if (!data?.password) {
                    throw new Error("Password is required.");
                }

                // Validation for duplicate email
                const existingUser = await Users.findOne({ where: { u_email: data?.email } });
                if (existingUser) {
                    throw new Error("Email is already registered.");
                }

                const _otp = generateOTP();
                req.user = { id: getUUID4() }
                const _orgs = await db.orgs.add(req, { o_name: data?.org_name });
                const _departments = _orgs?.o_id && await db.departments.create({
                    dept_id: getUUID4(),
                    dept_name: _orgs.o_name + "Department",
                    org_id: _orgs?.o_id,
                    dept_created_by: req.user.id || "",
                    dept_updated_by: req.user.id || ""
                });
                const _collections = _orgs?.o_id && await db.collections.add(req, {
                    c_id: getUUID4(),
                    c_name: _orgs.o_name + "Collection",
                    c_org_id_fk: _orgs?.o_id,
                    c_internal_name: toInternalName(data?.org_name),
                    c_status: "active"
                });
                const _departments_collections = _collections?.c_id && await db.collections_departments.create({
                    cd_id: getUUID4(),
                    cd_collection_id_fk: _collections?.c_id,
                    cd_department_id_fk: _departments?.dept_id,
                    cd_created_by: req.user.id || "",
                    cd_updated_by: req.user.id || ""
                });
                let _user = _departments_collections?.cd_id && await Users.create({
                    u_id: req.user.id,
                    u_name: data?.username || data?.email,
                    u_email: data?.email,
                    u_password: await passwordEncode(data?.password || ""),
                    u_avatar: data?.avatar || getAvatar(data?.username || data?.email) || "",
                    u_is_admin: true,
                    u_is_super_admin: true,
                    u_provider: data?.u_provider || "local",
                    u_mobile: data?.u_mobile || "",
                    u_chat_gpt_key: data?.u_chat_gpt_key || "",
                    u_otp: _otp,
                    u_default_org_fk: _orgs.o_id || "",
                    u_default_collection_fk: _collections?.c_id || "",
                    u_default_department_fk: _departments?.dept_id || "",
                    u_status: data?.u_status || "inactive",
                    u_created_by: data?.u_created_by || req.user.id,
                    u_updated_by: data?.u_updated_by || req.user.id
                });
                _user = _user?.dataValues ? _user?.dataValues : _user;

                const _api_keys = _user?.u_id && await db.api_keys.add(req, { name: "access key" });
                const _api_keys_users = _user?.u_id && await db.api_keys_users.add(req, {
                    aku_api_keys_id_fk: _api_keys?.ak_id,
                    aku_users_id_fk: _user?.u_id
                });

                const _api_keys_department = _api_keys?.ak_id && await db.api_keys_departments.create({
                    akd_id: getUUID4(),
                    akd_api_keys_id_fk: _api_keys?.ak_id,
                    akd_departments_id_fk: _departments?.dept_id,
                    akd_status: "active",
                    akd_created_by: req.user.id || "",
                    akd_updated_by: req.user.id || ""
                });
                delete _user?.u_password;
                if(_api_keys?.ak_key) {
                    _user.access_token = _api_keys?.ak_key;
                }
                _user.message = "User has been registered successfully!";
                _user = removeInitial(_user, ['u_']);
                resolve(_user || _collections || _orgs);
            }
            catch (e) {
                console.error(e);
                reject(new Error(e.message || "An error occurred during user registration."));
            }
        });
    };

    Users.sign_in = async (username, password) => {
        return new Promise(async (resolve, reject) => {
            const _users = await Users.findOne({
                attributes: ['u_id', 'u_name', 'u_email', 'u_password', 'u_avatar', 'u_mobile', 'u_default_org_fk', 'u_default_collection_fk', 'u_is_admin', 'u_is_super_admin', 'u_chat_gpt_key', 'u_timezone', 'u_daylight_saving','u_datetime_format'],
                where: { u_email: username, u_status: 'active' }
            }, { logging: db.logger });
            console.log("user ", _users);
            if (_users) {
                const _password = await passwordCompare(password, _users?.u_password);
                if (_password) {
                    delete _users?.dataValues?.u_password;
                    delete _users?.dataValues?.u_chat_gpt_key;
                    // console.log("user ", _users?.dataValues);
                    let fake_req = { user: { id: _users?.dataValues?.u_id } };
                    const _apiKeys = await db.api_keys.add(fake_req, { name: "access key" });
                    await db.api_keys_users.add(fake_req, {
                        aku_api_keys_id_fk: _apiKeys?.ak_id,
                        aku_users_id_fk: _users?.dataValues?.u_id
                    });
                    _users.dataValues.access_token = _apiKeys?.ak_key;
                    resolve(removeInitial(_users?.dataValues, ['u_']));
                }
                else {
                    resolve({ "errors": "Username or password is incorrect" });
                }
            }
            else {
                resolve({ "errors": "Username or password is incorrect" });
            }
        });
    };


    Users.sign_out = async (req) => {
        console.info("call users sign_out");
        return new Promise(async (resolve, reject) => {
            if (req?.user?.ak_key.startsWith("access-")) {
                const _api_keys = await db.api_keys.destroy({ where: { ak_id: req?.user?.ak_id } });
                const _api_keys_users = await db.api_keys_users.destroy({ where: { aku_id: req?.user?.aku_id } });
                if (_api_keys && _api_keys_users) {
                    resolve("Sign out successfully!");
                }
                else {
                    resolve("Sign out failed!");
                }
            }
            else {
                resolve("You only sign out from access token!");
            }
        });
    };

    Users.sign_in_with_otp = async (username, otp) => {
        return new Promise(async (resolve, reject) => {
            const _users = await Users.findOne({
                attributes: ['u_id', 'u_name', 'u_email', 'u_password', 'u_avatar', 'u_mobile', 'u_default_org_fk', 'u_default_collection_fk', 'u_is_admin', 'u_is_super_admin' , 'u_otp','u_chat_gpt_key'],
                where: { u_email: username, u_status: 'active'}
            }, { logging: db.logger });
            if (_users) {
                if (_users?.dataValues?.u_otp === otp) {
                    delete _users?.dataValues?.u_password;
                    delete _users?.dataValues?.u_chat_gpt_key;
                    let fake_req = { user: { id: _users?.dataValues?.u_id } };
                    const _apiKeys = await db.api_keys.add(fake_req, { name: "access key" });
                    await db.api_keys_users.add(fake_req, {
                        aku_api_keys_id_fk: _apiKeys?.ak_id,
                        aku_users_id_fk: _users?.dataValues?.u_id
                    });
                    _users.dataValues.access_token = _apiKeys?.ak_key;
                    resolve(removeInitial(_users?.dataValues, ['u_']));
                }
                else {
                    resolve({ "errors": "Username or otp is incorrect" });
                }
            }
            else {
                resolve({ "errors": "Username or otp is incorrect" });
            }
        });
    }

    return Users;
};