const ctrl = require("../controllers/users.ctrl");
const {validateToken} = require("../middlewares/validation");

module.exports = [

    /**
     * POST /api/v1/user/sign_up
     * @summary Sign up a new user
     * @tags Users
     * @param {object} request.body.required - User info
     * @example request - example 1
     * {
     *    "username": "John Doe",
     *    "email": "mail@example.com",
     *    "password": "P@$$w0rd",
     *    "org_name": "00D5g100003bruK",
     *    "org_id": "bc851bb8-023b-469e-aa0c-49b602f9cfaa"
     *  }
     * @return {object} 200 - success response
     */
    {path: "/api/v1/user/sign_up", method: "post", handler: [ctrl.sign_up]},

    /**
     * POST /api/v1/user/sign_in
     * @summary Sign in a user
     * @tags Users
     * @param {object} request.body.required - User info
     * @example request - example 1
     * {
     *    "email": "mail@example.com",
     *    "password": "P@$$w0rd",
     *  }
     * @return {object} 200 - success response
     */
    {path: "/api/v1/user/sign_in", method: "post", handler: [ctrl.sign_in]},

    /**
     * DELETE /api/v1/user/sign_out
     * @summary Sign out
     * @tags Users
     * @security apiKeyAuth
     * @param {object} request.body.required - User info
     * @return {object} 200 - success response
     */
    {path: "/api/v1/user/sign_out", method: "delete", handler: [validateToken, ctrl.sign_out]},

    /**
     * POST /api/v1/user/sso
     * @summary SSO - Single Sign On
     * @tags Users
     * @param {object} request.body.required - User info
     * @example request - example 1
     * {
     *    "refresh_token": "bc851bb8-023b-469e-aa0c-49b602f9cfaa"
     *  }
     * @return {object} 200 - success response
     */
    {path: "/api/v1/user/sso", method: "post", handler: [validateToken, ctrl.sso]},

    /**
     * POST /api/v1/user/sso
     * @summary SSO - Single Sign On
     * @tags Users
     * @param {object} request.body.required - User info
     * @example request - example 1
     * {
     *    "refresh_token": "bc851bb8-023b-469e-aa0c-49b602f9cfaa"
     *  }
     * @return {object} 200 - success response
     */
    {path: "/api/v1/user/sso", method: "post", handler: [validateToken, ctrl.sso]},

    /**
     * GET /api/v1/user_dashboard
     * @summary Get user dashboard api data
     * @tags Dashboard
     * @security apiKeyAuth
     * @return {object} 200 - success response
     * @return {object} 500 - error response
     * @return {object} 401 - Unauthorized
     * @return {object} 403 - Forbidden
     * @return {object} 404 - Not Found
     * @return {object} 400 - Bad Request
        */

    {path: "/api/v1/user_dashboard", method: "get", handler: [validateToken, ctrl.user_dashboard]},


    { path: "/api/v1/user/update", method: "put", handler: [validateToken, ctrl.update_chat_gpt_key]},

    /**
     * POST /api/v1/user/forgot_password
     * @summary Forgot password
     * @tags Users
     * @param {object} request.body.required - User info
     * @example request - example 1
     * {
     *   "email": "test@example.com"
     * }
     * @return {object} 200 - success response
     * @return {object} 500 - error response
     * @return {object} 401 - Unauthorized
       */

    { path: "/api/v1/user/forgot_password", method: "post", handler: [ctrl.forgot_password]},

    /**
     * POST /api/v1/user/reset_password
     * @summary Reset password
     * @tags Users
     * @param {object} request.body.required - User info
     * @example request - example 1
     * {
     *  "password": "P@$$w0rd",
     * "confirm_password": "P@$$w0rd",
     * "u_id": "bc851bb8-023b-469e-aa0c-49b602f9cfaa",
     * "token": "bc851bb8-023b-469e-aa0c-49b602f9cfaa"
     * }
     * @return {object} 200 - success response
     * @return {object} 500 - error response
     * @return {object} 401 - Unauthorized
     * @return {object} 404 - Not Found
       */

    { path: "/api/v1/user/reset_password", method: "post", handler: [ctrl.reset_password]},

    /**
     * PUT /api/v1/user/update_password
     * @summary Update password
     * @tags Users
     * @security apiKeyAuth
     * @param {object} request.body.required - User info
     * @example request - example 1
     * {
     * "new_password": "P@$$w0rd",
     * "confirm_password": "P@$$w0rd",
     * "old_password": "P@$$w0rd"
     * }
     * @return {object} 200 - success response
     * @return {object} 500 - error response
     * @return {object} 401 - Unauthorized
     * @return {object} 404 - Not Found
       */

    { path: "/api/v1/user/update_password", method: "put", handler: [validateToken, ctrl.update_password]},

      /**
       * POST /api/v1/user/verify_otp
       * @summary Verify OTP
       * @tags Users
       * @param {object} request.body.required - User info
       * @example request - example 1
       * {
       * "otp": "123456",
       * "u_id": "bc851bb8-023b-469e-aa0c-49b602f9cfaa"
       * }
       * @return {object} 200 - success response
       * @return {object} 500 - error response
       * @return {object} 401 - Unauthorized
       * @return {object} 404 - Not Found
         */

    {path: "/api/v1/user/verify_otp", method: "post", handler: [ctrl.verify_otp]},


  { path: "/api/v1/user/get_key", method: "get", handler: [validateToken, ctrl.get_chat_gpt_key]},


  /* PUT /api/v1/user/update_response_type
    * @summary Update Response Type
    * @tags Users
    * @security apiKeyAuth
    * @param {object} request.body.required - User info
    * @example request - example 1
    * {
    * "response_type": "text"
    * }
    * @return {object} 200 - success response
    * @return {object} 500 - error response
    * @return {object} 401 - Unauthorized
    * @return {object} 404 - Not Found
    */

  {path: "/api/v1/user/update_response_type", method: "put", handler: [validateToken, ctrl.update_response_type]},


  /* GET /api/v1/user/get_response_type
    * @summary Get Response Type
    * @tags Users
    * @security apiKeyAuth
    * @return {object} 200 - success response
    * @return {object} 500 - error response
    * @return {object} 401 - Unauthorized
    * @return {object} 404 - Not Found
    */

  { path: "/api/v1/user/get_response_type", method: "get", handler: [validateToken, ctrl.get_response_type]},
  { path: "/api/v1/user/get_user_with_tokens_usage", method: "get", handler: [validateToken, ctrl.get_users_with_tokens]},


  {path: "/api/v1/user_ip", method: "get", handler: [ctrl.get_user_ip]},
  {path: "/api/v1/user_package", method: "get", handler: [validateToken, ctrl.get_user_package]},

  // update user profile
  {path: "/api/v1/user/update_profile", method: "put", handler: [validateToken, ctrl.update_profile]},

];
