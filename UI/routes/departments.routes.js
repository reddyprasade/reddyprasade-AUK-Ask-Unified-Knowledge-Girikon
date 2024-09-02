const ctrl = require("../controllers/departments.ctrl");
const { validateToken } = require("../middlewares/validation");

module.exports = [
  /**
   * POST /api/v1/departments
   * @summary Create a new department
   * @tags Departments
   * @security apiKeyAuth
   * @param {object} request.body.required - Department info
   * @example request - example
   * {
   *    "name": "Account",
   *    "collections": "bc851bb8-023b-469e-aa0c-49b602f9cfaa, bc851bb8-456b-469e-aa0c-49b602f9c543"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/departments",
    method: "post",
    handler: [validateToken, ctrl.create],
  },

  /**
   * GET /api/v1/departments
   * @summary List Departments
   * @tags Departments
   * @security ApiKeyAuth
   * @param {object} request.body.required - Departments info
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/departments",
    method: "get",
    handler: [validateToken, ctrl.list],
  },

  /**
   * GET /api/v1/departments/{department_id}
   * @summary Get Department by ID
   * @tags Departments
   * @security ApiKeyAuth
   * @param {object} request.body.required - Department info
   * @example request - example
   * {
   *    "department_id": "984916b6-8110-44c4-a89f-88b46ddf3a8c"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/departments/:id",
    method: "get",
    handler: [validateToken, ctrl.get_by_id],
  },

  /**
   * PUT /api/v1/departments
   * @summary Update a department
   * @tags Departments
   * @security apiKeyAuth
   * @param {object} request.body.required - Department info
   * @example request - example
   * {
   *    "id": "984916b6-8110-44c4-a89f-88b46ddf3a8c",
   *    "name": "Account",
   *    "collections": "bc851bb8-023b-469e-aa0c-49b602f9cfaa, bc851bb8-456b-469e-aa0c-49b602f9c543"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/departments",
    method: "put",
    handler: [validateToken, ctrl.update],
  },

  /**
   * DELETE /api/v1/departments/{department_id}
   * @summary Delete Department by ID
   * @tags Departments
   * @security ApiKeyAuth
   * @param {object} request.body.required - Department info
   * @example request - example
   * {
   *    "department_id": "984916b6-8110-44c4-a89f-88b46ddf3a8c"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/departments/:id",
    method: "delete",
    handler: [validateToken, ctrl.delete],
  },

  /**
  * GET /api/v1/departwithcollections
  * @summary Get collections with departments
  * @tags Departments
  * @security ApiKeyAuth
  * @param {object} request.body.required - Department info
  * @example request - example
  * @return {object} 200 - success response
  */

  {
    path:"/api/v1/departwithcollections",
    method:"get",
    handler: [validateToken, ctrl.get_departments_with_collections]
  }
];

