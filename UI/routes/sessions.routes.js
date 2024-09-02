const ctrl = require("../controllers/sessions.ctrl");
const {validateToken} = require("../middlewares/validation");

module.exports = [
    /**
  * POST /api/v1/session
  * @summary Create a new session
  * @tags Session
  * @security ApiKeyAuth
  * @param {object} request.body.required - session info
  * @example request - example 1
  * @return {object} 200 - success response
  */
    { path: "/api/v1/session", method: "post", handler: [validateToken, ctrl.create] },
];
