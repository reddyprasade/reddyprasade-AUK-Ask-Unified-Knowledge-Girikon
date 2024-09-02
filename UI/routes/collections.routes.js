const ctrl = require("../controllers/collections.ctrl");
const {validateToken} = require("../middlewares/validation");
const uploader = require("../config/file.config");

module.exports = [
    /**
     * POST /api/v1/collections
     * @summary Create a new collection
     * @tags Collections
     * @security apiKeyAuth
     * @param {object} request.body.required - Collection info
     * @example request - Collections example with Local files
     * {
     *    "files": "File{object}",
     *    "section": "chat_gpt",
     *    "name":"My First Collection"
     *  }
     * @example request - Collections example with Drive files
     * {
     *    "section": "chat_gpt",
     *    "name":"My First Collection",
     *    "file_array":"[{"id":"1","name":"file1"}]"
     *  }
     *  @return {object} 200 - success response
     */
    {
        path: "/api/v1/collections",
        method: "post",
        handler: [validateToken, uploader.array("files"), ctrl.create],
    },

    /**
     * GET /api/v1/collections
     * @summary List Collections
     * @tags Collections
     * @security ApiKeyAuth
     * @param {object} request.body.required - Collections info
     * @return {object} 200 - success response
     */
    {
        path: "/api/v1/collections",
        method: "get",
        handler: [validateToken, ctrl.list],
    },

    /**
     * GET /api/v1/collections/{collection_id}
     * @summary Get Collection by ID
     * @tags Collections
     * @security ApiKeyAuth
     * @param {object} request.body.required - Collection info
     * @example request - example
     * {
     *    "collection_id": "984916b6-8110-44c4-a89f-88b46ddf3a8c"
     *  }
     * @return {object} 200 - success response
     */
    {
        path: "/api/v1/collections/:id",
        method: "get",
        handler: [validateToken, ctrl.get_by_id],
    },

    /**
     * PUT /api/v1/collections
     * @summary Update a collection
     * @tags Collections
     * @security apiKeyAuth
     * @param {object} request.body.required - Collection info
     * @example request - example
     * {
     *    "id": "984916b6-8110-44c4-a89f-88b46ddf3a8c",
     *    "name": "Account"
     *  }
     * @return {object} 200 - success response
     */
    {
        path: "/api/v1/collections",
        method: "put",
        handler: [validateToken, ctrl.update],
    },

    /**
     * PUT /api/v1/collections/status
     * @summary Update a collection status
     * @tags Collections
     * @security apiKeyAuth
     * @param {object} request.body.required - Collection info
     * @example request - example
     * {
     *    "id": "984916b6-8110-44c4-a89f-88b46ddf3a8c",
     *    "status": "active"
     *  }
     * @return {object} 200 - success response
     */
    {
        path: "/api/v1/collections/status",
        method: "put",
        handler: [validateToken, ctrl.toggleStatus],
    },

    /**
     * DELETE /api/v1/collections/{collection_id}
     * @summary Delete Collection by ID
     * @tags Collections
     * @security ApiKeyAuth
     * @param {object} request.body.required - Collection info
     * @example request - example
     * {
     *    "collection_id": "984916b6-8110-44c4-a89f-88b46ddf3a8c"
     *  }
     * @return {object} 200 - success response
     */
    {
        path: "/api/v1/collections/:id",
        method: "delete",
        handler: [validateToken, ctrl.delete],
    },

    {
        path: "/api/v1/get_api_key_from_collection/:id",
        method: "get",
        handler: [validateToken, ctrl.get_api_key_from_collection],
    } , 

    {
        path: "/api/v1/get_selected_key/:id",
        method: "get",
        handler: [validateToken, ctrl.get_selected_key_from_collection],
    } ,

    {
        path: "/api/v1/get_selected_collections/:id",
        method: "get",
        handler: [validateToken, ctrl.getCollection_by_api_key],
    } ,

    // get domain_urls from collection
    {
        path: "/api/v1/get_domain_urls/:id",
        method: "get",
        handler: [validateToken, ctrl.get_domain_urls],

    },

    {
        path: "/api/v1/widgets/ask/:id/collection_list",
        method: "get",
        handler: [ctrl.getCollection_by_widget_id], 
    }

];
