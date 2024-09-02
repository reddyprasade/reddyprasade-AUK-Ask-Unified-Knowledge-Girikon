const ctrl = require("../controllers/ai.ctrl");
const {validateToken} = require("../middlewares/validation");
const uploader = require("../config/file.config");
const {getFileFromDrive} = require("../middlewares/file_handler");

module.exports = [
    /**
     * POST /api/v1/ai/:type
     * @summary AI with type
     * @tags AI
     * @security ApiKeyAuth
     * @param {object} request.body.required - AI info
     * @param {string} request.params.type.required - AI type
     * @example request - 1. Summarization with file pdf, docx, txt, csv, xlsx
     * {
     *    "files": File,
     *    "user_id": "a9d78aac-5232-4097-b427-d2eb90fc174b",
     *    "task_name": "summarization",
     *    "column_name": "NA"
     *  }
     *
     * @example request - 1. Chat GPT with pre existing collections
     * {
     *    "question": File,
     *    "user_id": "a9d78aac-5232-4097-b427-d2eb90fc174b",
     *    "task_name": "summarization",
     *    "column_name": "NA"
     *  }
     *
     * @return {object} 200 - success response
     */
    {
        path: "/api/v1/ai/:type",
        method: "post",
        handler: [validateToken, uploader.array("files", 50), getFileFromDrive, ctrl.ai_call],
    },
    // {path: "/api/v1/ai/test", method: "post", handler: [validateToken, uploader.array("files", 50), ctrl.test]},
    { path: "/api/v1/ai_public", method: "post", handler: [ctrl.test]},

    { path: "/api/v1/playground/chainResponse", method: "post", handler: [validateToken, uploader.array("files", 50), ctrl.chainResponseFromFile]},

    {path: "/api/v1/vector_store_id_webhook", method: "post", handler: [ctrl.vector_store_id_webhook]},

    { path: "/api/v1/widgets/ask/:id", method: "post", handler: [ctrl.ask] },

    { path: "/api/v1/widgets/ask/:id/pdf/:filename", method: "post", handler: [ctrl.ask_get_pdf_url] },
];
