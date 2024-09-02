const ctrl = require("../controllers/api_key.ctrl");
const {validateToken} = require("../middlewares/validation");

module.exports = [
    /**
     * POST /api/v1/api_keys
     * @summary Create a new API key
     * @tags API Keys
     * @security ApiKeyAuth
     * @param {object} request.body.required - API Key info
     * @example request - example 1
     * {
     *    "name": "first",
     *    "department_id": "6d0b5509-5100-4e3f-bf74-bb154d51a725"
     *  }
     * @return {object} 200 - success response
     */
    {path: "/api/v1/api_keys", method: "post", handler: [validateToken,ctrl.create]},

    /**
     * GET /api/v1/api_keys/{api_key_id}
     * @summary Get API key by ID
     * @tags API Keys
     * @security ApiKeyAuth
     * @param {object} request.body.required - API Key info
     * @example request - example 1
     * {
     *    "id": "6d0b5509-5100-4e3f-bf74-bb154d51a725"
     *  }
     * @return {object} 200 - success response
     */
    {path: "/api/v1/api_keys/:id", method: "get", handler: [validateToken, ctrl.get_by_id]},

    /**
     * PUT /api/v1/api_keys/{api_key_id}
     * @summary Update a new API key
     * @tags API Keys
     * @security ApiKeyAuth
     * @param {object} request.body.required - API Key info
     * @example request - example 1
     * {
     *     "id": "6d0b5509-5100-4e3f-bf74-bb154d51a725"
     * 
     *  }
     * @return {object} 200 - success response
     */
    {path: "/api/v1/api_keys/:id", method: "put", handler: [validateToken,ctrl.update]},

    /**
     * GET /api/v1/api_keys
     * @summary List API keys
     * @tags API Keys
     * @security ApiKeyAuth
     * @param {object} request.body.required - API Key info
     * @return {object} 200 - success response
     */
    {path: "/api/v1/api_keys", method: "get", handler: [validateToken,ctrl.list]},

    /**
     * DELETE /api/v1/api_keys/{api_key_id}
     * @summary delete a API key
     * @tags API Keys
     * @security ApiKeyAuth
     * @param {object} request.body.required - API Key info
     * @example request - example 1
     * {
     *     "id": "6d0b5509-5100-4e3f-bf74-bb154d51a725"
     *  }
     * @return {object} 200 - success response
     */
    {path: "/api/v1/api_keys/:id", method: "delete", handler: [validateToken,ctrl.delete]},

];
