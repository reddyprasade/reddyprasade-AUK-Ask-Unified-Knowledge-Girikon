const ctrl = require("../controllers/widgets.ctrl");
const { validateToken } = require("../middlewares/validation");

module.exports = [

    /**
     * POST /api/v1/widgets/add
     * @summary Widgets
     * @tags Widgets
     * @security ApiKeyAuth
     * @param {object} request.body.required - Widgets info
     * @example request - example 1
     * {
     *    "feedBackURL":"https://girikon.com/feedback",
     *  }
     * @return {object} 200 - success response
     */
        { path: "/api/v1/widgets/add", method: "post", handler: [validateToken, ctrl.add] },
        { path: "/api/v1/widgets/edit", method: "post", handler: [validateToken, ctrl.edit] },
        { path: "/api/v1/widgets/delete", method: "delete", handler: [validateToken, ctrl.delete] },
        { path: "/api/v1/widgets/getOne", method: "get", handler: [validateToken, ctrl.getOne] },
        { path: "/api/v1/widgets/getAll", method: "get", handler: [validateToken, ctrl.getAll] },
        { path: "/api/v1/widgets/getAllInActive", method: "get", handler: [validateToken, ctrl.getAllInActive] },
        { path: "/api/v1/widgets/main/script/:id", method: "get", handler: [ctrl.mainScript] },
        { path: "/api/v1/widgets/script/:id", method: "get", handler: [ctrl.script] },
];