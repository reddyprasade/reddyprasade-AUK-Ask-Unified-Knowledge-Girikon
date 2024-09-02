const ctrl = require("../controllers/manage_users.ctrl");
const {validateToken} = require("../middlewares/validation");
module.exports = [

    /**
     * POST /api/v1/manage_users
     * @summary Create a new User
     * @tags Users
     * @security apiKeyAuth
     * @param {object} request.body.required - User info
     * @example request - example
     * {
     *    "name": "test",
     *    "email": "test@test.com",
     *    "org_id": "e938749d-3ad4-428c-8143-86bc16f31aab",
     *    "department_ids": ["e938749d-3ad4-428c-8143-86bc16f31aab", "e938749d-3ad4-428c-8143-86bc16f31aab"]
     *  }
     * @return {object} 200 - success response
     */
    {
        path: "/api/v1/manage_users",
        method: "post",
        handler: [validateToken,ctrl.create],
    },

    /**
  * GET /api/v1/manage_users/{org_id}
  * @summary Get Users by Org ID
  * @tags Users
  * @security ApiKeyAuth
  * @param {object} request.body.required - User info
  * @example request - example
  * {
  *    "org_id":"e938749d-3ad4-428c-8143-86bc16f31aab"
  * }
  * @return {object} 200 - success response
  */
    {
        path: "/api/v1/manage_users/:org_id",
        method: "get",
        handler: [validateToken, ctrl.getAllUsersWithDepartmentsByOrgId],
    },

    /**
    * DELETE /api/v1/manage_users/{user_id}
    * @summary Delete User
    * @tags Users
    * @security ApiKeyAuth
    * @param {object} request.body.required - User info
    * @example request - example
       * {
       *    "id":"244c3985-fc84-4bdc-ad26-852e40b61bd0"
       *  }
    * @return {object} 200 - success response
    */

    {
        path:"/api/v1/manage_users/:id",
        method:"delete",
        handler: [validateToken,ctrl.delete]
    },


    /**
     * PUT /api/v1/manage_users/{user_id}
     * @summary Update User
     * @tags Users
     * @security ApiKeyAuth
     * @param {object} request.body.required - User info
     * @example request - example
     * {
     *  "name": "test",
     * "email": "test@test.com" ,
     * "department_ids": ["e938749d-3ad4-428c-8143-86bc16f31aab", "e938749d-3ad4-428c-8143-86bc16f31aab"]
     * }
     * @return {object} 200 - success response
        */
    {
        path:"/api/v1/manage_users/:id",
        method:"put",
        handler: [validateToken,ctrl.update]
    },

    /**
     * GET /api/v1/manage_users/list
     * @summary List Users
     * @tags Users
     * @security ApiKeyAuth
     * @param {object} request.body.required - User info
     * @example request - example
     */
    {
        path:"/api/v1/manage_users/list",
        method:"get",
        handler: [validateToken,ctrl.list]
    }
];