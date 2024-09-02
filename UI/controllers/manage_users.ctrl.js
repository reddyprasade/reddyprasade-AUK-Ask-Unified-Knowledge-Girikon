const db = require("../models");
const { QueryTypes } = require('sequelize');
const { returnSuccess, returnError , generateRandomPassword } = require("../utils");
const { passwordEncode } = require("../utils/encryption");
const sendEmail = require("../config/mail");

const Users = db.users;
const UserDepartment = db.users_departments;
const OrgsUser = db.orgsUsers;
const Mails = db.mails;
const CollectionsDepartments = db.collections_departments;


// Create and Save a new Tutorial
exports.create = async(req, res) => {
  const { name, email, department_ids, org_id } = req.body;

    let default_password = generateRandomPassword();
    console.log("default password", default_password);
    try {
        // validate request
        if (!req.body.email) {
            returnError(res, "User Email can not be empty!");
            return;
        }
        // Check if the departmentId and orgId exist (you may have more complex validations here)
        if (!Array.isArray(department_ids) || !org_id) {
            returnError(res, "Invalid departmentId or orgId.");
            return;
        }
        // Check if the user with the given email already exists
        const existingUser = await Users.findOne({
            where: {
                u_email: email,
            },
        });

        if (existingUser) {
            returnError(res, "User with this email already exists.");
            return;
        }

        // Hash the default password
        let hashedPassword = await passwordEncode(default_password);

        const collections = await CollectionsDepartments.findAll({
            attributes: ['cd_collection_id_fk' ],
            where: {cd_department_id_fk: department_ids[0]}
        });
 

        // create a user
        const _user = await Users.create({
            u_name: name,
            u_email: email,
            u_password: hashedPassword,
            u_mobile:'',
            u_default_org_fk: org_id,
            u_default_collection_fk : collections[0].cd_collection_id_fk,
            u_default_department_fk : department_ids[0],
            u_is_super_admin: false,
            u_status:'active'
        });

        // create user departments
        const userDepartmentPromises = department_ids.map(async (department_id) => {
            return UserDepartment.create({
                ud_user_id_fk: _user.u_id,
                ud_department_id_fk: department_id,
            });
        });

        // wait for all user departments to be created
        await Promise.all(userDepartmentPromises);
        // create a user org
        const _userOrg = await OrgsUser.create({
            ou_org_id_fk: org_id,
            ou_user_id_fk : _user.u_id,
        });

        // Send welcome email to the user
        const emailSubject = "Welcome to Our Application!";
        const loginUrl = process.env.MAIL_WEB_URL;
        const productName = process.env.MAIL_PRODUCT_NAME;
        const supportUrl = process.env.MAIL_SUPPORT_URL;
        const emailBody = `
    <p>Hello ${name},</p>
    <p>Welcome to ${productName}.Your account has been successfully created.</p>
    <p>Your login details:</p>
    <ul>
        <li>Email: ${email}</li>
        <li>Password: ${default_password}</li>
    </ul>
      <p>To get started, please log in using the button below:</p>
      <a style="display:inline-block;background-color:#4CAF50;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:5px;margin-top:10px;" href="${loginUrl}">Log In Here</a>
        <p>If you have any questions or need assistance, please visit our <a href="${supportUrl}">support page</a>.</p>
       <p>We're excited to have you onboard!</p>
      <p>Thank you!</p>
`;

        await sendEmail({
            from: process.env.MAIL_FROM,
            to: email,
            // to: "arun.gupta693@girikon.com",
            subject: emailSubject,
            body: emailBody,
        });


        returnSuccess(res,_user,200,"User added successfully!");
    } catch (error) {
        console.error('Error in create User Controller:', error);
        returnError(res, error.message || "Some error occurred while adding the User.",500);
    }
  };

// Retrieve all users from the database.
exports.list = async (req, res) => {
    try {
        let { pageNo = 0, size = 5 } = req.query;
        let offset = pageNo * size;
        let limit = size;

        const users = await Users.findAndCountAll({
            attributes: ["u_id", "u_name", "u_email","u_created_at","u_updated_at"],
            offset: offset,
            limit: limit,
            order: [["u_updated_at", "DESC"]],
        });

        returnSuccess(res, users, 200, "Users fetched successfully!");
    }
    catch (error) {
        console.error('Error in get User list Controller', error);
        returnError(res, error.message || "Some error occurred while fetching users.", 500);
    }
};


// Fetch all users with the same orgId including departments
exports.getAllUsersWithDepartmentsByOrgId = async (req, res) => {
    try {
        const { org_id } = req.params;
        const { search } = req.query;
        if (!org_id) {
            returnError(res, "org_id parameter is required.");
            return;
        }

        let searchCondition = '';
        if (search) {
            searchCondition = ` AND (users.u_name ILIKE :search OR users.u_email ILIKE :search)`;
        }

        const query = `
            SELECT
                users.u_id,
                users.u_name,
                users.u_email,
                users.u_created_at,
                users.u_updated_at,
                ARRAY_AGG(
                    JSON_BUILD_OBJECT(
                        'dept_name', departments.dept_name,
                        'dept_id', departments.dept_id
                    )
                ) as department
            FROM users
            INNER JOIN orgs_users ON users.u_id = orgs_users.ou_user_id_fk
            LEFT JOIN users_departments ON users.u_id = users_departments.ud_user_id_fk
            LEFT JOIN departments ON users_departments.ud_department_id_fk = departments.dept_id
            WHERE orgs_users.ou_org_id_fk = :orgId AND users.u_is_super_admin = false
            ${searchCondition}
            GROUP BY users.u_id, users.u_name, users.u_email;
        `;

        const users = await db.sequelize.query(query, {
            replacements: { orgId: org_id, search: `%${search}%` },
            type: QueryTypes.SELECT,
            //logging: console.log,
        });

        returnSuccess(res, users, 200, "Users with departments fetched successfully.");
    } catch (error) {
        console.error('Error in get user Controller', error);
        returnError(res, error.message || "Some error occurred while fetching users with departments.", 500);
    }
};




// delete a user
exports.delete = async(req, res) => {
    try {
        const _user = await Users.destroy({
            where: { u_id: req.params.id },
        });
        const _orgsUser = await OrgsUser.destroy({
            where: { ou_user_id_fk: req.params.id },
        });
        returnSuccess(res,"User deleted successfully!",200);
    } catch (error) {
        console.error('Error in delete User Controller', error);
        returnError(res, error.message || "Some error occurred while deleting the User.",500);
    }
};




exports.update = async (req, res) => {
    const { name, email, department_ids } = req.body;
    try {
        let updateFields = {};

        if (email) {
            updateFields.u_email = email;
            const existingUser = await Users.findOne({
                where: {
                    u_email: email,
                }
            });
            if (existingUser) {
                 returnError(res, "User with this email already exists.");
                 return;
            }
        }

        if (name) {
            updateFields.u_name = name;
        }

        // If department_ids is provided, update user departments
        if (department_ids && department_ids.length > 0) {
            // Delete existing user departments
            await UserDepartment.destroy({
                where: { ud_user_id_fk: req.params.id },
            });

            // Create new user departments
            const userDepartmentPromises = department_ids.map(async (department_id) => {
                return  UserDepartment.create({
                    ud_user_id_fk: req.params.id,
                    ud_department_id_fk: department_id,
                });
            });

            await Promise.all(userDepartmentPromises);
            returnSuccess(res, "User updated successfully!", 200);
        }

        // Update the user if any fields are provided
        if (Object.keys(updateFields).length > 0) {
            const [_user] = await Users.update(updateFields, { where: { u_id: req.params.id } });
            if (_user === 0) {
                 returnError(res, "User not found.");
                 return;
            }

             returnSuccess(res, "User updated successfully!", 200);
        } else if (!department_ids || department_ids.length === 0) {
            returnError(res, "No fields to update.");
            return;
        }
    } catch (error) {
        console.error('Error in update User Controller', error);
   returnError(res, error.message || "Some error occurred while updating the User.", 500);
    }
};

