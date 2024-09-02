const db = require("../models");
const { QueryTypes } = require('sequelize');
const { returnSuccess, returnError } = require("../utils");
const UserDepartment = db.users_departments;
const Departments = db.departments;

// fetch departments by user id
exports.getDepartmentsByUserId = async (req, res) => {

    try {
        // Fetch departments for the specified user using Sequelize model
        const departments = await UserDepartment.findAll({
            attributes: ['ud_department_id_fk'],
            where: {
                ud_user_id_fk: req.params.userId,
            },
            include: [
                {
                    model: Departments,
                    attributes: ['dept_id', 'dept_name'], // Adjust the attributes based on your departments table
                },
            ],
        });

        returnSuccess(res, departments, 200, "Departments fetched successfully.");
    } catch (error) {
        console.error('Error in get user departments Controller', error);
        returnError(res, error.message || "Some error occurred while fetching user departments.", 500);
    }
}