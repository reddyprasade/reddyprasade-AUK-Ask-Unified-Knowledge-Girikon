const ctrl = require("../controllers/feedbacks.ctrl");
const { validateToken } = require("../middlewares/validation");

module.exports = [
  /**
   * POST /api/v1/feedbacks
   * @summary Create a new feedback
   * @tags Feedbacks
   * @security apiKeyAuth
   * @param {object} request.body.required - Feedback info
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
    path: "/api/v1/feedbacks",
    method: "post",
    handler: [validateToken, ctrl.create],
  },

  /**
   * GET /api/v1/feedbacks
   * @summary List Feedbacks
   * @tags Feedbacks
   * @security ApiKeyAuth
   * @param {object} request.body.required - Feedbacks info
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/feedbacks",
    method: "get",
    handler: [validateToken, ctrl.list],
  },

  /**
   * GET /api/v1/feedbacks/{feedback_id}
   * @summary Get Feedback by ID
   * @tags Feedbacks
   * @security ApiKeyAuth
   * @param {object} request.body.required - Feedback info
   * @example request - example
   * {
   *    "feedback_id": "984916b6-8110-44c4-a89f-88b46ddf3a8c"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/feedbacks/:id",
    method: "get",
    handler: [validateToken, ctrl.get_by_id],
  },

  /**
   * PUT /api/v1/feedbacks
   * @summary Update a feedback
   * @tags Feedbacks
   * @security apiKeyAuth
   * @param {object} request.body.required - Feedback info
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
    path: "/api/v1/feedbacks",
    method: "put",
    handler: [validateToken, ctrl.update],
  },

  /**
   * DELETE /api/v1/feedbacks/{feedback_id}
   * @summary Delete Feedback by ID
   * @tags Feedbacks
   * @security ApiKeyAuth
   * @param {object} request.body.required - Feedback info
   * @example request - example
   * {
   *    "feedback_id": "984916b6-8110-44c4-a89f-88b46ddf3a8c"
   *  }
   * @return {object} 200 - success response
   */
  {
    path: "/api/v1/feedbacks/:id",
    method: "delete",
    handler: [validateToken, ctrl.delete],
  },


  {
    path:"/api/v1/feedbacks/approval",
    method:"put",
    handler:[validateToken,ctrl.feedback_approval]
  } , 

  { 
    path: "/api/v1/widgets/ask/:id/feedback",
     method: "post", 
     handler: [ctrl.save_feedback] 
    },

];
