const db = require("../models");
const { QueryTypes } = require('sequelize');
const {returnSuccess , returnError,getUUID4,getGenerateKey} = require("../utils");
const moment = require("moment");
const ApiKeys = db.api_keys;
const ApiKeysDepartments = db.api_keys_departments;
const Departments = db.departments;
const ApiKeyUsers = db.api_keys_users;

// Create and Save a new Tutorial
 exports.create = async (req, res) => {

    try {
       const { name , department_id} = req.body;
         // validate request
         if (!name) {
            returnError(res, "Api Key name can not be empty!");
            return;
         }
  
         if (!department_id) {
            returnError(res, "Api Key Department can not be empty!");
            return;
         }
         // const _existApiKey = await ApiKeys.findOne({
         //    where: {
         //       ak_name: name,
         //    },
         // });
         // if (_existApiKey) {
         //    returnError(res, "Api Key with this name already exists.");
         //    return;
         // }
         const _existApiKeyDepartment = await ApiKeysDepartments.findOne({
            where: {
               akd_departments_id_fk: department_id,
            },
         });
         if (_existApiKeyDepartment) {
            returnError(res, "Api Key with this department already exists.");
            return;
         }

       const _apiKeys = await ApiKeys.create({
          ak_name: name,
          ak_id: getUUID4(),
          ak_key: getGenerateKey("bai"),
          ak_is_restricted: true,
          ak_start_from: moment().format("YYYY-MM-DD HH:mm:ss"),
          ak_end_to: moment().add(10, "years").format("YYYY-MM-DD HH:mm:ss"),
         });
       // create api key department
       const _apiKeysDepartment = await ApiKeysDepartments.create({
          akd_api_keys_id_fk: _apiKeys.ak_id,
          akd_departments_id_fk: department_id,
       });
         // create api key user
         const _apiKeysUser = await ApiKeyUsers.create({
            aku_api_keys_id_fk: _apiKeys.ak_id,
            aku_users_id_fk: req.user.id,
         });
       returnSuccess(res,_apiKeys, 200 , "Api Key created successfully!");
    } catch (error) {
       console.error("Error in create Api Controller:", error);
         returnError(res, error.message || "Some error occurred while creating the ApiKeys." ,500);
    }
   
};

// Retrieve all Tutorials from the database.
exports.list = async (req, res) => {
   try {
      const orgId = req.user.org_id;
      const sqlQuery = `
            SELECT
                ak.ak_id,
                ak.ak_name,
                ak.ak_key,
                ak.ak_is_restricted,
                ak.ak_status,
                ak.ak_start_from,
                ak.ak_end_to,
                d.dept_id,
                d.dept_name
            FROM
                api_keys ak
            JOIN
                api_keys_departments akd ON ak.ak_id = akd.akd_api_keys_id_fk
            JOIN
                departments d ON akd.akd_departments_id_fk = d.dept_id
            WHERE
                  d.org_id = :orgId
        `;

      const apiKeysWithDepartments = await db.sequelize.query(sqlQuery, {
         replacements: { orgId },
         type: QueryTypes.SELECT,
         raw: true,
      });

      returnSuccess(res, apiKeysWithDepartments, 200, "Successfully Fetched all APIs with Departments");
   } catch (error) {
      console.error("Error in getAllAPIsWithDepartment API controller:", error);
      returnError(res, error.message || "Some error occurred while retrieving APIs with Departments.", 500);
   }
};

// Retrieve all Tutorials from the database.
exports.get_by_id = async(req, res) => {
   try {
      const _apiKeys = await ApiKeys.findOne({ where: { ak_id: req.params.id } });
      returnSuccess(res, _apiKeys, 200 , "Api Key found successfully!");
   } catch (error) {
      console.error("Error in get Api Key controller:", error);
      returnError(res, error.message || "Some error occurred while retrieving the ApiKey." , 500);
   }
};


//Update a turtoial by the id in the request

exports.update = async(req, res) => {
   try {
      const { name , department_id} = req.body;
   
      // validate request
      if(!name ){
         returnError(res, "Api Key name can not be empty!");
         return;
      }
      if(!department_id ){
         returnError(res, "Api Key department can not be empty!");
         return;
      }

      // const _existApiKeyWithName = await ApiKeys.findOne({
      //    where: {
      //       ak_name: name,
      //    },
      // });
      // if (_existApiKeyWithName) {
      //    returnError(res, "Api Key with this name already exists.");
      //    return;
      // }
      const _existApiKeyDepartment = await ApiKeysDepartments.findOne({
         where: {
            akd_departments_id_fk: department_id,
         },
      });
      if (_existApiKeyDepartment) {
         returnError(res, "Api Key with this department already exists.");
         return;
      }
      const _apiKeys = await ApiKeys.update(
         {
            ak_name: name,
         },
         { where: { ak_id: req.params.id } }
      );
      // update api key department
      const _apiKeysDepartment = await ApiKeysDepartments.update(
         {
            akd_departments_id_fk: department_id,
         },
         { where: { akd_api_keys_id_fk: req.params.id } }
      );
      returnSuccess(res, "Api Key updated successfully!", 200);

   } catch (error) {
      console.error("Error in update Api controller:", error);
      returnError(res, error.message || "Some error occurred while updating the ApiKey.",500);
   }
}
// Delete a Tutorial with the specified id in the request
exports.delete = async(req, res) => {
   try {
      await ApiKeys.destroy({ where: { ak_id: req.params.id } });
      await ApiKeysDepartments.destroy({ where: { akd_api_keys_id_fk: req.params.id } });
      returnSuccess(res, "Api Key deleted successfully!",200);
   } catch (error) {
      console.error("Error in delete api controller:", error);
      returnError(res, error.message || "Some error occurred while deleting the ApiKeys.",500);
   }
};
