const ctrl = require("../controllers/orgs.ctrl");
const {validateToken} = require("../middlewares/validation");
const uploader = require("../config/file.config");

module.exports = [
    /**
     * POST /api/v1/org/add
     * @summary Add new orgs
     * @tags Orgs
     * @security apiKeyAuth
     * @param {object} request.body.required - Orgs info
     * @example request - example 1
     * {
     *    "name": "Girikon LLC"
     *  }
     * @return {object} 200 - success response
     */
    {path: "/api/v1/org/add", method: "post", handler: [validateToken,ctrl.add]},

    { path: "/api/v1/org/logo/:o_internal_name", method: "get", handler: [ctrl.get_logo ]},

    { path: "/api/v1/org/logo/:o_internal_name", method: "post", handler: [validateToken,uploader.single('file'), ctrl.upload_logo]}
];
