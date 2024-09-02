const ctrl = require("../controllers/histories.ctrl");
const { validateToken } = require("../middlewares/validation");

module.exports = [
  /**
   * POST /api/v1/histories
   * @summary Create a new history
   * @tags Histories
   * @security apiKeyAuth
   * @param {object} request.body.required - History info
   * @example request - example
   * {
   *    "question": "How to create a new user?",
   *    "answer": "You can create a new user by clicking on the 'Create User' button on the top right corner of the page.",
   *    "action": "up",
   *    "tags": "This is harmful / unsafe,This isn't true, This isn't helpful",
   *    "comments": "This is a comment",
   *    "session_id": "bc851bb8-023b-469e-aa0c-49b602f9cfaa"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/histories",
    method: "post",
    handler: [validateToken, ctrl.create],
  },

  /**
   * GET /api/v1/histories
   * @summary List Histories
   * @tags Histories
   * @security ApiKeyAuth
   * @param {object} request.body.required - Histories info
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/histories/:session_id",
    method: "get",
    handler: [validateToken, ctrl.list],
  },

  /**
   * GET /api/v1/histories/{history_id}
   * @summary Get History by ID
   * @tags Histories
   * @security ApiKeyAuth
   * @param {object} request.body.required - History info
   * @example request - example
   * {
   *    "history_id": "984916b6-8110-44c4-a89f-88b46ddf3a8c"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/histories/:id",
    method: "get",
    handler: [validateToken, ctrl.get_by_id],
  },

  /**
   * PUT /api/v1/histories
   * @summary Update a history
   * @tags Histories
   * @security apiKeyAuth
   * @param {object} request.body.required - History info
   * @example request - example
   * {
   *    "id": "984916b6-8110-44c4-a89f-88b46ddf3a8c",
   *    "question": "How to create a new user?",
   *    "answer": "You can create a new user by clicking on the 'Create User' button on the top right corner of the page.",
   *    "action": "up",
   *    "tags": "This is harmful / unsafe,This isn't true, This isn't helpful",
   *    "comments": "This is a comment"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/histories",
    method: "put",
    handler: [validateToken, ctrl.update],
  },

  /**
   * DELETE /api/v1/histories/{history_id}
   * @summary Delete History by ID
   * @tags Histories
   * @security ApiKeyAuth
   * @param {object} request.body.required - History info
   * @example request - example
   * {
   *    "history_id": "984916b6-8110-44c4-a89f-88b46ddf3a8c"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/histories/:id",
    method: "delete",
    handler: [validateToken, ctrl.delete],
  },
];
