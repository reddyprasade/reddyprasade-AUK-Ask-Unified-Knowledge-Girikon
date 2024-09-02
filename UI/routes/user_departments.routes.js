const ctrl = require("../controllers/user_departments.ctrl");
const { validateToken } = require("../middlewares/validation");

module.exports = [
    /**
     * GET /api/v1/user_departments/:userId
     * @summary Get user departments
     * @tags User Departments
     * @security ApiKeyAuth
     * @param userId request.params.required - User id
     * @return {object} 200 - success response
     */
    {
        path: "/api/v1/user_departments/:userId",
        method: "get",
        handler: [validateToken, ctrl.getDepartmentsByUserId],
    },
    ];