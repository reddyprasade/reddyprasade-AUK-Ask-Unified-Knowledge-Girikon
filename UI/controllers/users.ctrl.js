const db = require("../models");
const { returnSuccess, getDomainFromEmail, returnError, generateToken, generateOTP, getMaskedString, toInternalName } = require("../utils");
const { passwordEncode, passwordCompare , encryptData,decryptData} = require("../utils/encryption");
const {Sequelize, Op, where, QueryTypes} = require("sequelize");
const moment = require("moment");
const sendEmail = require("../config/mail");
const Users = db.users;
const Orgs = db.orgs;
const Rates = db.rates;
const Collections = db.collections;
const UserDepartment = db.users_departments;
const pricing = db.pricing;


const personal_domain = ['gmail', 'yahoo', 'hotmail', 'aol', 'outlook', 'live', 'msn', 'yandex', 'zoho', 'protonmail', 'icloud', 'mail', 'gmx', 'fastmail', 'inbox', 'rocketmail', 'aim', 'rediffmail', 'lycos', 'hushmail', 'mailfence', 'tutanota', 'ymail', 'qq', '163', '126', 'rambler', 'mailinator', 'myway', 'mac', 'me', 'sbcglobal', 'att', 'btinternet', 'verizon', 'comcast', 'rogers', 'bellsouth', 'charter', 'virginmedia', 'sky', 'optonline', 'frontier', 'earthlink', 'cox', 'netzero', 'juno', 'peoplepc', 'bigpond', 'shaw', 'sympatico', 'telus', 'bluewin', 'tiscali', 'orange', 'wanadoo', 'free', 'laposte', 'web', 'libero', 'virgilio', 'alice', 'tin', 'tele2', 'netvigator', 'sina', 'yeah', 'yahoomail'];


// Create and Save a new Tutorial
exports.sign_up = async (req, res) => {
    try {
        let _body = req.body;
        let result = "Missing required fields";
      
        _body.org_name = !_body?.org_name
            ? getDomainFromEmail(_body?.email)
            : _body?.org_name;


        if(personal_domain.includes(getDomainFromEmail(_body?.email))){
            returnError(res, "Please use your official email address.", 400);
            return;
        }


        const existing_org = await Orgs.findOne({
            attributes: ['o_id' , 'o_internal_name', 'o_name', 'o_created_by'],
            where: { o_internal_name: toInternalName(_body?.org_name)},
        });


        if (existing_org) {
            const _user = await Users.findOne({
                attributes: ['u_id', 'u_email', 'u_name'],
                where: { u_id: existing_org?.dataValues?.o_created_by },
            });
            returnError(res, `Organization already exists created by ${_user?.dataValues?.u_email}`, 400);
            return;
        }

        if (_body?.username && _body?.email && _body?.org_name) {
            result = await Users.add(req, _body);

           if(result?.id){
             // send otp to user
               const currentDateTime = new Date().getTime();
               const _user_id = `${encryptData(result?.id)}####${currentDateTime}`;
                const emailSubject = "OTP for Email Verification";
                const emailBody = `
                <p>Hello ${_body?.username},</p>
                <p>Your OTP for Email Verification is: ${result?.otp}</p>
                <p>Please click on link below to verify your email:</p>
                <a href="${process.env.MAIL_WEB_URL}/verify-otp?otp=${result?.otp}&u_id=${_user_id}">Verify Email</a>
                <p> Or you can copy and paste the below link in your browser:</p>
                <p>${process.env.MAIL_WEB_URL}/verify-otp?otp=${result?.otp}&u_id=${_user_id}</p>
                <p>If you did not request an OTP, please ignore this email.</p>
                `;

                await sendEmail({
                    from: process.env.MAIL_FROM,
                    to: _body?.email,
                    // to: "arun.gupta693@girikon.com",
                    subject: emailSubject,
                    body: emailBody,
                });
           }
        
            returnSuccess(res, result);
        }
        returnSuccess(res, {message: result});
    } catch (error) {
        console.error("error in sign up user : ", error.message);
        returnError(res, error, 500);
    }
};

// Retrieve all Tutorials from the database.
exports.sign_in = async (req, res) => {
    try {
        const email = req.body?.email || req.body?.username;
        const password = req.body?.password;
        let _user = await Users.sign_in(email, password);

        if (_user.errors || !_user) {
            returnError(res, "Invalid email or password.", 404);
            return;
        }
        // const _user_org = await UserDepartment.findOne({
        //     attributes: ['ud_department_id_fk'],
        //     where: { ud_user_id_fk: _user.id },
        // });
        // console.log("user_org", _user_org);
        let org = await Orgs.findOne({where: {o_id: _user.default_org_fk}});
        org = await JSON.parse(JSON.stringify(org, null, 4));
        let collection = await Collections.findOne({ where: { c_id: _user.default_collection_fk }});
        collection = await JSON.parse(JSON.stringify(collection, null, 4));
        returnSuccess(res, {..._user, org_plain_name:org.o_name, org_name: org.o_internal_name , collection_name: collection.c_name , selected_key: collection.c_selected_key});
    } catch (error) {
        console.error("error in sign in user : ", error);
        returnError(res, error, 500);
    }
};

// Find a single Tutorial with an id
exports.sign_out = async (req, res) => {
    const _user = await Users.sign_out(req);
    returnSuccess(res, _user);
};
// Find a single Tutorial with an id
exports.sso = (req, res) => {
};

// exports.user_dashboard = async (req, res) => {
//     const {month, year} = req.query;
//     console.log("Month==>", month, "Year==>", year)
//     const oneMonthAgo = new Date();
//     oneMonthAgo.setDate(oneMonthAgo.getDate() - 30); // Adjust for the number of days back
//     const histories_logs = await db.histories.findAll({
//         attributes: [
//             [Sequelize.fn('DATE', Sequelize.col('h_created_at')), 'date'],
//             [Sequelize.fn('count', '*'), 'count'], // Count the number of logs per date
//         ],
//         where: {
//             h_created_at: {
//                 [Op.gte]: oneMonthAgo, // Filter for logs since one month ago
//             },
//             h_org_id_fk: req.user.org_id,   
//         },
//         group: [Sequelize.fn('DATE', Sequelize.col('h_created_at'))],
//         logging: console.log,
//     });
//     db.collections.count({where: {c_created_by: req.user.id}}).then((collections) => {
//         db.files.count({where: {f_created_by: req.user.id}}).then((files) => {
//             db.histories.count({where: {h_created_by: req.user.id}}).then((histories) => {
//                 returnSuccess(res, {
//                     total: {
//                         collections,
//                         files,
//                         histories
//                     },
//                     histories: histories_logs
//                 });
//             });
//         });
//     });
// };

exports.user_dashboard = async (req, res) => {
    const { month, year, key, type } = req.query;
    console.log("Month==>", month, "Year==>", year);

    // Map of month names to numbers with only the first letter capitalized
    const monthNames = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    let typeColumn = 'h_model_type';
    let modelValue = "";
    if(key === "chat_gpt") {
        typeColumn = 'h_response_type';
    }

    if (key === "chat_gpt" && type === "short_answer") {
        modelValue = "chat_gpt"
    } else if (key === "chat_gpt" && type === "detailed_answer") {
        modelValue = "chat_gpt_assistant"
    } else {
        modelValue = "baali"
    }

    // Convert month name to number (case insensitive)
    const monthNumber = monthNames[month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()];
    const parsedYear = parseInt(year, 10);

    if (!monthNumber || isNaN(parsedYear)) {
        return res.status(400).json({ error: 'Invalid month or year' });
    }

    // Construct start and end dates for the given month and year
    const startDate = new Date(parsedYear, monthNumber - 1, 1);
    const endDate = new Date(parsedYear, monthNumber, 0, 23, 59, 59, 999); // Last moment of the given month

    try {
        // Construct the dynamic where clause
        const whereClause = {
            h_created_at: {
                [Op.between]: [startDate, endDate], // Filter for logs within the given month and year
            },
            h_org_id_fk: req.user.org_id,
            h_selected_key: key,
        };
        whereClause[typeColumn] = type; // Dynamically add the typeColumn

        const histories_logs = await db.histories.findAll({
            attributes: [
                [Sequelize.literal("TO_CHAR(h_created_at, 'YYYY-MM-DD HH24')"), 'date'],
                [Sequelize.fn('count', '*'), 'count'], // Count the number of logs per date
                [Sequelize.fn('sum', Sequelize.col('h_answer_tokens')), 'total_answer_tokens'],
                [Sequelize.fn('sum', Sequelize.col('h_question_tokens')), 'total_question_tokens'],
                [Sequelize.fn('sum', Sequelize.col('h_total_tokens')), 'total_tokens'],
            ],
            where: whereClause,
            group: [Sequelize.literal("TO_CHAR(h_created_at, 'YYYY-MM-DD HH24')")],
            // logging: console.log,
        });

        const collectionsCount = await db.collections.count({
            where: { c_created_by: req.user.id },
        });

        const filesCount = await db.files.count({
            where: { f_created_by: req.user.id },
        });

        const historiesCount = await db.histories.count({
            where: { h_created_by: req.user.id },
        });

        const rates = await db.rates.findOne({
            where: { r_model: modelValue }
        });

        returnSuccess(res, {
            total: {
                collections: collectionsCount,
                files: filesCount,
                histories: historiesCount,
            },
            histories: histories_logs,
            rates: rates
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.get_users_with_tokens = async (req, res) => {
    try {
        let userId = req.user.id;
        let orgId = req.user.org_id;
        let query = `SELECT 
                users.u_id, 
                users.u_name, 
                users.u_email,
                COALESCE(SUM(histories.h_answer_tokens), 0) AS total_answer_tokens,
                COALESCE(SUM(histories.h_question_tokens), 0) AS total_question_tokens,
                COALESCE(SUM(histories.h_total_tokens), 0) AS total_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'baali' AND histories.h_model_type = 'excel' THEN histories.h_total_tokens ELSE 0 END), 0) AS baali_excel_total_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'baali' AND histories.h_model_type = 'excel' THEN histories.h_question_tokens ELSE 0 END), 0) AS baali_excel_total_question_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'baali' AND histories.h_model_type = 'excel' THEN histories.h_answer_tokens ELSE 0 END), 0) AS baali_excel_total_answer_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'chat_gpt' AND histories.h_response_type = 'short_answer' THEN histories.h_total_tokens ELSE 0 END), 0) AS chat_gpt_short_answer_total_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'chat_gpt' AND histories.h_response_type = 'short_answer' THEN histories.h_question_tokens ELSE 0 END), 0) AS chat_gpt_short_answer_total_question_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'chat_gpt' AND histories.h_response_type = 'short_answer' THEN histories.h_answer_tokens ELSE 0 END), 0) AS chat_gpt_short_answer_total_answer_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'chat_gpt' AND histories.h_response_type = 'detailed_answer' THEN histories.h_total_tokens ELSE 0 END), 0) AS chat_gpt_detailed_answer_total_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'chat_gpt' AND histories.h_response_type = 'detailed_answer' THEN histories.h_question_tokens ELSE 0 END), 0) AS chat_gpt_detailed_answer_total_question_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'chat_gpt' AND histories.h_response_type = 'detailed_answer' THEN histories.h_answer_tokens ELSE 0 END), 0) AS chat_gpt_detailed_answer_total_answer_tokens,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'baali' THEN histories.h_total_tokens * rates.r_per_token_rate ELSE 0 END), 0) AS baali_total_cost,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'chat_gpt' AND histories.h_response_type = 'short_answer' THEN histories.h_total_tokens * rates.r_per_token_rate ELSE 0 END), 0) AS chat_gpt_short_answer_total_cost,
                COALESCE(SUM(CASE WHEN histories.h_selected_key = 'chat_gpt' AND histories.h_response_type = 'detailed_answer' THEN histories.h_total_tokens * rates.r_per_token_rate ELSE 0 END), 0) AS chat_gpt_detailed_answer_total_cost,
                MAX(CASE WHEN rates.r_model = 'baali' THEN rates.r_per_token_rate ELSE NULL END) AS baali_excel_rate,
                MAX(CASE WHEN rates.r_model = 'chat_gpt' THEN rates.r_per_token_rate ELSE NULL END) AS chat_gpt_short_answer_rate,
                MAX(CASE WHEN rates.r_model = 'chat_gpt_assistant' THEN rates.r_per_token_rate ELSE NULL END) AS chat_gpt_detailed_answer_rate
            FROM users 
            INNER JOIN orgs_users ON users.u_id = orgs_users.ou_user_id_fk
            LEFT JOIN histories ON users.u_id = histories.h_user_id_fk
            LEFT JOIN rates ON (
                (rates.r_model = 'baali') OR
                (rates.r_model = 'chat_gpt') OR
                (rates.r_model = 'chat_gpt_assistant')
            )
            WHERE orgs_users.ou_org_id_fk = :orgId 
              AND users.u_is_super_admin = false
            GROUP BY users.u_id, users.u_name, users.u_email`
                        
        const users = await db.sequelize.query(query, {
            replacements: { orgId: orgId },
            type: QueryTypes.SELECT,
            // logging: console.log,
        });
        returnSuccess(res, users, 200, "Users with departments fetched successfully.");
    } catch (error) {
        returnError(res, error.message || "Some error occurred while updating the Chat GPT key.",500);
    }
}



//update user 

exports.update_chat_gpt_key = async (req, res) => {
  const { chatGPTKey } = req.body;

  if(getMaskedString(chatGPTKey) === chatGPTKey){
    returnError(res, "Chat GPT key is invalid.", 400);
    return;
  }

 try {

   const _user = await Users.update(
    { 
       u_chat_gpt_key: chatGPTKey
},
    {where: {u_id: req.user.id}
  });
   returnSuccess(res, 'Chat GPT key updated successfully!' , 200);
 } catch (error) {
   returnError(res, error.message || "Some error occurred while updating the Chat GPT key.",500);
 }
};

// get chat gpt key
exports.get_chat_gpt_key = async (req, res) => {
    try {
        const _user = await Users.findOne({
            attributes: ['u_chat_gpt_key'],
            where: {
                u_id: req.user.id,
            }
            });

        const _encrypted_chat_gpt_key = encryptData(_user.dataValues.u_chat_gpt_key);

        const _data = {
            original_chat_gpt_key: getMaskedString(_user.dataValues.u_chat_gpt_key),
            // encrypted_chat_gpt_key: _encrypted_chat_gpt_key
        }
        
        if (!_user) {
            returnError(res, "User does not exist.", 404);
            return;
        }
        returnSuccess(res, _data, 200);
    } catch (error) {
        returnError(res, error.message || "Some error occurred while getting the Chat GPT key.",500);
    }
    }


// forgot password
exports.forgot_password = async (req, res) => {
  const { email } = req.body;
  try {
    const _user = await Users.findOne({
        where: {
            u_email: email,
        }
        });
    if (!_user) {
        returnError(res, "User with this email does not exist.", 404);
        return;
    }
    else{
       const token = await generateToken();
       _user.u_reset_password_token = token;
        await _user.save();

        // Send welcome email to the user
        const emailSubject = "Password Reset Link";
        const supportUrl = process.env.MAIL_SUPPORT_URL;
        const webUrl = process.env.MAIL_WEB_URL;
        const emailBody = `
       <p>Hello ${_user.u_name},</p>
       <p>We received a request to reset your password. Please click on the link below to reset your password:</p>
       <a href="${webUrl}/reset-password?u_id=${_user.u_id}&token=${token}">Reset Password</a>
       <p> Or you can copy and paste the below link in your browser:</p>
       <p>${webUrl}/reset-password?u_id=${_user.u_id}&token=${token}</p>
       <p>If you did not request a password reset, please ignore this email.</p>
       <p>If you have any questions or need assistance, please visit our <a href="${supportUrl}">support page</a>.</p>
 `;

     await sendEmail({
        from: process.env.MAIL_FROM,
        to: email,
        // to: "arun.gupta693@girikon.com",
        subject: emailSubject,
        body: emailBody,
    });

        returnSuccess(res, "Password Reset link sent to your email.", 200);
    }
  
    }
    catch (error) {
        returnError(res, error.message || "Some error occurred while forgot the password.",500);
    }
};


// reset password
exports.reset_password = async (req, res) => {
    const { password, confirm_password, u_id, token } = req.body;
   try {
    const _user = await Users.findOne({
        attributes: ['u_password','u_reset_password_token','u_id','u_email','u_name','u_status'],
        where: {
            u_id: u_id,
            u_reset_password_token: token
        }
        });
    
    if (!_user) {
        returnError(res, "Invalid token or user id.", 404);
        return;
    }
    else if (await passwordCompare(password, _user.u_password)) {
        returnError(res, "New password must be different from the existing password.", 400);
        return;
    }
    else if (!password || !confirm_password) {
        returnError(res, "Missing required fields.", 400);
        return;
    }
    else if (_user.u_password === password) {
        returnError(res, "Old password and new password cannot be same.", 400);
        return;
    }

    else if (password !== confirm_password) {
        returnError(res, "Password and confirm password do not match.", 400);
        return;
    }
    else{
        const hashed_password = await passwordEncode(password);
        _user.u_password = hashed_password;
        _user.u_reset_password_token = null;
        await _user.save();
        returnSuccess(res, "Password reset successfully!", 200);
    }
    }
    catch (error) {
        returnError(res, error.message || "Some error occurred while resetting the password.",500);
    }

};

//update password for a user
exports.update_password = async (req, res) => {
    const { new_password, confirm_password, old_password } = req.body;
    try {
        const _user = await Users.findOne({
            where: {
                u_id: req.user.id,
            }
            });
        if (!_user) {
            returnError(res, "User does not exist.", 404);
            return;
        }
        else if (!old_password || !new_password || !confirm_password) {
            returnError(res, "Missing required fields.", 400);
            return;
        }
        else if (old_password === new_password) {
            returnError(res, "Old password and new password cannot be same.", 400);
            return;
        }
        else if (new_password !== confirm_password) {
            returnError(res, "Password and confirm password do not match.", 400);
            return;
        }
        else if (!await passwordCompare(old_password, _user.u_password)) {
            returnError(res, "Old password is incorrect.", 400);
            return;
        }
        else{
            const hashed_password = await passwordEncode(new_password);
            _user.u_password = hashed_password;
            await _user.save();
            returnSuccess(res, "Password updated successfully!", 200);
        }
        }
        catch (error) {
            returnError(res, error.message || "Some error occurred while Updating the password.",500);
        }
};



exports.verify_otp = async (req, res) => {
    const { otp, u_id, email } = req.body;

    try {
        let _user;

        if (!u_id) {
            _user = await Users.findOne({
                where: {
                    u_email: email,
                }
            });
        } else {
            const _split_user_id = u_id.split("####");
            const _u_id = decryptData(_split_user_id[0]);
            _user = await Users.findOne({
                where: {
                    u_id: _u_id,
                }
            });
        }

        if (!_user) {
         returnError(res, "User does not exist.", 404);
            return;
        }

        if (_user.u_otp !== otp) {
            returnError(res, "Invalid OTP or Link has been expired.", 400);
            return;
        }

        // _user.u_otp = null;
        _user.u_status = "active";
        await _user.save();


        const signInResponse = await Users.sign_in_with_otp(_user.dataValues.u_email,otp);

        delete signInResponse.otp;


        if (signInResponse.errors || !signInResponse) {
            returnError(res, "Invalid email or password.", 404);
            return;
        }

        _user.u_otp = null;
        await _user.save();
        let org = await Orgs.findOne({ where: { o_id: signInResponse.default_org_fk } });
        org = await JSON.parse(JSON.stringify(org, null, 4));
        let collection = await Collections.findOne({ where: { c_id: signInResponse.default_collection_fk } });
        collection = await JSON.parse(JSON.stringify(collection, null, 4));
        returnSuccess(res, { ...signInResponse, org_name: org.o_name, collection_name: collection.c_name });

   
    } catch (error) {
        returnError(res, error.message || "Some error occurred while verifying the otp.", 500);
        return;
    }
};



exports.update_response_type = async (req, res) => {
    const { data } = req.body;
    try {
        const _user = await Users.update(
            {
                u_response_type: data
            },
            {
                where: { u_id: req.user.id }
            });
        returnSuccess(res, 'Answer Type updated successfully!', 200);
    } catch (error) {
        returnError(res, error.message || "Some error occurred while updating the Answer type.", 500);
    }
};

exports.get_response_type = async (req, res) => {
    try {
        const _user = await Users.findOne({
            attributes: ['u_response_type'],
            where: {
                u_id: req.user.id,
            }
        });

        // const _encrypted_chat_gpt_key = encryptData(_user.dataValues.u_chat_gpt_key);

        // const _data = {
        //     original_chat_gpt_key: getMaskedString(_user.dataValues.u_chat_gpt_key),
        //     // encrypted_chat_gpt_key: _encrypted_chat_gpt_key
        // }

        if (!_user) {
            returnError(res, "User does not exist.", 404);
            return;
        }
        returnSuccess(res, _user, 200);
    } catch (error) {
        returnError(res, error.message || "Some error occurred while getting the Chat GPT key.", 500);
    }
}

exports.get_user_ip = async (req, res) => {
    try {
        console.log(req.headers['x-real-ip'], req.headers['x-forwarded-for'], req.connection.remoteAddress);
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req?.headers?.['x-real-ip'];
        returnSuccess(res, ip, 200);
    } catch (error) {
        returnError(res, error.message || "Some error occurred while getting the IP.", 500);
    }
}

exports.get_user_package = async (req, res) => { 
    console.log(req.user.org_id);
    try {
        const packageDetails = await pricing.findOne({
            where: {
                p_org_id: req.user.org_id,
            }
        });
        returnSuccess(res, packageDetails, 200);
    } catch (error) {
        returnError(res, error.message || "Some error occurred while getting the IP.", 500);
    }
}

exports.update_profile = async (req, res) => {
    const {timezone , datetime_format,daylight_saving} = req.body;
    if(!timezone || !datetime_format ){
        returnError(res, "Missing required fields.", 400);
        return;
    }
    try {
        const _user = await Users.update(
            {
                u_timezone: timezone,
                u_datetime_format: datetime_format,
                u_daylight_saving: daylight_saving
            },
            {
                where: { u_id: req.user.id }
            });
        returnSuccess(res, 'Profile updated successfully!', 200);
    } catch (error) {
        returnError(res, error.message || "Some error occurred while updating the profile.", 500);
    }   
};