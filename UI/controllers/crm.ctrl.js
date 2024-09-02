const db = require("../models");
const { QueryTypes, Op } = require('sequelize');
const { returnSuccess, returnError, getUUID4, getGenerateKey } = require("../utils");
const moment = require("moment");
const ApiKeys = db.api_keys;
const ApiKeysDepartments = db.api_keys_departments;
const Departments = db.departments;
const ApiKeyUsers = db.api_keys_users;
const jsforce = require('jsforce');
const fs = require("fs");
const csv = require("csvtojson");
const Users = db.users;
const OrgUsers = db.orgsUsers;
const crmToken = db.crm_tokens;
const SF_CONNECT_APP = {
   "CLIENT_ID": process.env.SALESFORCE_CLIENT_ID,
   "CLIENT_SECRET": process.env.SALESFORCE_CLIENT_SECRET
};

const { CLIENT_ID, CLIENT_SECRET } = SF_CONNECT_APP;
const baseUrl = process.env.MAIL_WEB_URL;
const conn = new jsforce.Connection({
   oauth2: {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: `${baseUrl}/connect/callback`
   },
});

const removeDuplicates = (data, key) => {
   const seen = new Set();
   return data.filter(item => {
       const value = item[key];
       if (seen.has(value)) {
           return false;
       }
       seen.add(value);
       return true;
   });
}

const getBulkDataFromSOQL = async (userId, soql) => {
   return new Promise(async (resolve, reject) => {
      try {
         const timestamp = new Date().getTime();
         const recordStream = await conn.bulk.query(soql);
         const fileName = 'users.csv' + timestamp;
         const writableStream = fs.createWriteStream('./' + fileName);

         recordStream.stream().pipe(writableStream);

         writableStream.on('finish', async function () {
            console.log('streaming data to csv file');
            try {
               const jsonObj = await csv().fromFile('./' + fileName);
               console.log(jsonObj);

               // Delete the file after processing
               fs.unlink('./' + fileName, (err) => {
                  if (err) {
                     console.error('Failed to delete file:', err);
                     reject(err);
                     return;
                  }
                  console.log('File deleted successfully');
                  resolve(jsonObj);
               });
            } catch (csvError) {
               console.error('Error processing CSV:', csvError);
               reject(csvError);
            }
         });

         writableStream.on('error', function (err) {
            console.error('Error writing to file:', err);
            reject(err);
         });
      } catch (queryError) {
         console.error('Error querying data:', queryError);
         reject(queryError);
      }
   });
};

// Create and Save a new Tutorial
exports.loginSalesForce = async (req, res) => {
   try {
      returnSuccess(res, { url: `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${baseUrl}/connect/callback&scope=refresh_token web id api&t=1718190835545` }, 200, "Api Key created successfully!");
   } catch (error) {
      console.error("Error in create Api Controller:", error);
      returnError(res, error.message || "Some error occurred while creating the ApiKeys.", 500);
   }

};

exports.connectSalesForce = async (req, res) => {
   console.log("User IDDD=>", req.user);
   const userId = req.user.id;
   const org_id = req.user.org_id;
   const code = req.query.code;

   try {
       // Authorize Salesforce connection
       await conn.authorize(code);
       
      //  console.log('Access Token: ' + conn.accessToken);
      //  console.log('Instance URL: ' + conn.instanceUrl);
      //  console.log('Refresh Token: ' + conn.refreshToken);
      //  console.log("All Conn==>", conn);

       const accessToken = conn.accessToken;
       const url = "";
       const refreshToken = conn.refreshToken;
       const query = 'SELECT Id, Name, Email, Username, Department, IsActive, ProfileId, UserType, CreatedById, CreatedDate, LastModifiedDate, LastModifiedById FROM User';

       const _json = await getBulkDataFromSOQL(userId, query);
       let orgUserData = [];
       //console.log("JSOOOONN==>", _json);
       let checkToken = await crmToken.findOne({where:{source:"salesforce"}});
       if (_json && _json.length) {
           // Create CRM token entry
           if (checkToken) {
            await crmToken.update({
               accessToken: accessToken,
               url: url,
               refreshToken: refreshToken,
               query: query
           },{where:{id:checkToken.id}});
           } else {
            await crmToken.create({
               accessToken: accessToken,
               url: url,
               refreshToken: refreshToken,
               query: query
           });
           }
           // Get all existing users by Id and Email
           const existingUsers = await Users.findAll({
               attributes: ['ext_u_id', 'u_email'],
               where: {
                   [Op.or]: [
                       { ext_u_id: _json.map(user => user.Id) },
                       { u_email: _json.map(user => user.Email) }
                   ]
               },
               logging: console.log,
           });
           

           const existingUserIds = new Set(existingUsers.map(user => user.ext_u_id));
           const existingEmails = new Set(existingUsers.map(user => user.u_email));
         //   console.log("EXISTING USERS======>",existingEmails)
           let newUsers = [];
           for (let usr of _json) {
               if (!existingUserIds.has(usr.Id) && !existingEmails.has(usr.Email)) {
                   let userObject = {
                       u_name: usr.Name,
                       u_email: usr.Email,
                       u_password: "",
                       u_relevant_experience: 0,
                       u_avatar: "",
                       u_is_admin: false,
                       u_is_super_admin: false,
                       u_role: "",
                       u_otp: "",
                       u_otp_time_stamp: null,
                       u_provider: "",
                       u_mobile: "",
                       u_default_org_fk: null,
                       u_default_collection_fk: null,
                       u_default_department_fk: null,
                       u_status: usr.IsActive,
                       u_created_by: userId,
                       u_updated_by: userId,
                       u_total_experience: 0,
                       ext_u_id: usr.Id,
                       ext_profile_id: usr.ProfileId,
                       ext_u_type: usr.UserType,
                       ext_created_by: usr.CreatedById,
                       ext_created_at: usr.CreatedDate,
                       ext_lastmodify_at: usr.LastModifiedDate,
                       ext_lastmodify_by: usr.LastModifiedById,
                       ext_source:"salesforce",
                       ext_username:usr.Username
                   };
                   newUsers.push(userObject);
               }
           }
           const uniqueData = removeDuplicates(newUsers, 'u_email');

           // Bulk create new users
           const createdUsers = await Users.bulkCreate(uniqueData);
           
           for (let usr of createdUsers) {
               orgUserData.push({ ou_org_id_fk: org_id, ou_user_id_fk: usr.u_id });
           }
       }

       // Bulk create OrgUser relationships
       await OrgUsers.bulkCreate(orgUserData);
       res.send(JSON.stringify(_json, null, 2));
   } catch (err) {
       console.error(err);
       res.status(500).send("Error connecting to Salesforce");
   }
};



