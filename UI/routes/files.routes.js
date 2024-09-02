const ctrl = require("../controllers/files.ctrl");
const {validateToken} = require("../middlewares/validation");
const multipart = require('connect-multiparty')
const flow = require('../config/flow_node')('tmp');
const fs = require('fs');

const multipartMiddleware = multipart();

module.exports = [

    // /**
    //  * POST /api/v1/files
    //  * @summary File add
    //  * @tags Files
    //  * @param {object} request.body.required - Files add
    //  * @return {object} 200 - success response
    //  * @example request - example 1
    //  * {
    //  *  "collection_id": "John Doe",
    //  *  "files": Files<file>,
    //  *  "files_array": [Files<file>]
    //  *  }
    //  */
    // {path: "/api/v1/files", method: "post", handler: [ctrl.addFiles]},

    // /**
    //  * GET /api/v1/files/list
    //  * @summary Files list
    //  * @tags Files
    //  * @return {object} 200 - success response
    //  */
    // {path: "/api/v1/files/list", method: "get", handler: [ctrl.findAll]},

    // /**
    //  * GET /api/v1/files/by_id/:id
    //  * @summary File
    //  * @tags Files
    //  * @param id request.params.required - File id
    //  * @return {object} 200 - success response
    //  */
    // {path: "/api/v1/files/by_id/:id", method: "get", handler: [ctrl.findOne]},

    /**
     * GET /api/v1/files/:collection_id
     * @summary Files by collection id
     * @tags Files
     * @security ApiKeyAuth
     * @param id request.params.required - File's collection id
     * @return {object} 200 - success response
     */
    { path: "/api/v1/files/:collection_id", method: "get", handler: [validateToken,ctrl.getAllByCollectionId]},

    // /**
    //  * PUT /api/v1/files/:id
    //  * @summary File archive
    //  * @tags Files
    //  * @param id request.params.required - File id
    //  * @return {object} 200 - success response
    //  */
    // {path: "/api/v1/files/:id", method: "put", handler: [ctrl.archiveById]},


    /**
     * DELETE /api/v1/files/:id
     * @summary File delete
     * @tags Files
     * @security ApiKeyAuth
     * @param id request.params.required - File id
     * @return {object} 200 - success response
     */
    { path: "/api/v1/files/:id/:col_id", method: "delete", handler: [validateToken,ctrl.deleteByCollectionId]},


    // {path: "/api/v1/files/upload", method: "post", handler: [multipartMiddleware,ctrl.uploadWithChunks]},

    // {path: "/api/v1/files/upload", method: "get", handler: [ctrl.getWithChunks]},


    /**
     * GET /api/v1/get_file/filename
     * @summary File Get
     * @tags Files
     * @param id request.params.required - File id
     * @return {object} 200 - success response
     */
    { path: "/api/v1/get_file/:data", method: "get", handler: [ctrl.getFileByFileName]},

    { path: "/api/v1/get_encrypted_file_info/:filename", method: "post", handler: [validateToken, ctrl.getEncryptedFileInfo]},

    { path: "/api/v1/get_encrypted_file_info/:filename", method: "get", handler: [validateToken, ctrl.getEncryptedFileInfo]},


];
