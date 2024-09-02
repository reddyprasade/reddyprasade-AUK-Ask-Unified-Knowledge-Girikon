const db = require("../models");
const fs = require("fs");
const path = require("path");
const {returnSuccess, returnError} = require("../utils");
const {ai_call_ctrl_public} = require("./ai.ctrl");
const {VALID_MODEL_LIST, AI_MODELS} = require("../utils/constant");

exports.test = async (req, res) => {
    try {
        if (!req.body.wg_collection_id_fk) {
            returnError(res, "Collection ID is required", 400);
        } else if (!req.body.wg_api_key_id_fk) {
            returnError(res, "Widget name is required", 400);
        } else {
            let widgets_result = await db.widgets.add(req);
            returnSuccess(res, widgets_result, 200, "Widgets successfully added!");
        }
    } catch (error) {
        console.error("Error in analyzing Widgets added", error);
        returnError(res, error.message, 500);
    }
};


exports.add = async (req, res) => {
    try {
        if (!req.body.wg_collection_id_fk) {
            returnError(res, "Collection ID is required", 400);
        } else if (!req.body.wg_api_key_id_fk) {
            returnError(res, "Widget name is required", 400);
        } else {
            let widgets_result = await db.widgets.add(req);
            returnSuccess(res, widgets_result, 200, "Widgets successfully added!");
        }
    } catch (error) {
        console.error("Error in analyzing Widgets added", error);
        returnError(res, error.message, 500);
    }
};

exports.edit = async (req, res) => {
    console.log("Request to analyze girik sms:");
    try {
        returnSuccess(res, {}, 200, "Girik SMS analyzed successfully!");
    } catch (error) {
        console.error("Error in analyzing girik sms:", error);
        returnError(res, error.message, 500);
    }
};

exports.delete = async (req, res) => {
    console.log("Request to analyze girik sms:");
    try {
        returnSuccess(res, {}, 200, "Girik SMS analyzed successfully!");
    } catch (error) {
        console.error("Error in analyzing girik sms:", error);
        returnError(res, error.message, 500);
    }
};

exports.getOne = async (req, res) => {
    console.log("Request to analyze girik sms:");
    try {
        returnSuccess(res, {}, 200, "Girik SMS analyzed successfully!");
    } catch (error) {
        console.error("Error in analyzing girik sms:", error);
        returnError(res, error.message, 500);
    }
};

exports.getAll = async (req, res) => {
    console.log("Request to analyze girik sms:");
    try {
        let widgets_result = await db.widgets.findAll();
        returnSuccess(res, widgets_result, 200, "fetched widgets successfully!");
    } catch (error) {
        console.error("Error in analyzing girik sms:", error);
        returnError(res, error.message, 500);
    }
};

exports.getAllInActive = async (req, res) => {
    console.log("Request to analyze girik sms:");
    try {
        returnSuccess(res, {}, 200, "Girik SMS analyzed successfully!");
    } catch (error) {
        console.error("Error in analyzing girik sms:", error);
        returnError(res, error.message, 500);
    }
};

exports.mainScript = async (req, res) => {
    let id = req.params.id;
    id = id.replace(".js", "");
    console.log(id, "id");

    const _file = path.join(process.cwd(), "./widgets/index.js");
    const _script = fs.readFileSync(_file);
    res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
    res.setHeader("X-Powered-By", "Girikon.AI");
    res.setHeader("Access-Control-Allow-Origin", ["http://localhost:3000"]);
    // res.setHeader("Accept-Ranges", "bytes");
    // res.setHeader("Content-Length", _script.length);
    res.setHeader("Last-Modified", new Date());
    res.setHeader("ETag", new Date().getTime());
    res.setHeader("Vary", "Accept-Encoding");
    // res.setHeader("Content-Encoding", "gzip");
    res.setHeader("Content-Disposition", `attachment; filename=${"main_"+id}.js`);
    res.setHeader("Expires", 1.5*86400000); // 1.5 day
    res.setHeader("Cache-Control", "max-age=" + 1.5 * 86400000); // 1.5 day
    res.setHeader("Pragma", "public");
    res.setHeader("Expires", 1.5*86400000); // 1.5 day
    res.send(_script);
    res.end();
}

exports.script = async (req, res) => {
    let id = req.params.id;
    id = id.replace(".js", "");
    console.log(id, "id");
    const info = await db.widgets.getOne(id);
    //get collection info
    // const collectionInfo = await db.collections.getOne(info.wg_collection_id_fk);
    // console.log(info, "info");
    const baseUrl = process.env.API_URL || "http://localhost:3000";
    // const mainScriptUrl = `${baseUrl}/widgets/live.js`;
    // const mainScriptUrl = `${baseUrl}/widgets/live.js`;
    const mainScriptUrl = `${baseUrl}/api/v1/widgets/main/script/${id}.js?=t=${new Date().getTime()}`;
    // const apiUrl = `${baseUrl}/api/v1/ai/ask`;
    const apiUrl = `${baseUrl}/api/v1/widgets/ask`;

    let _script = `!(function () {
      let e = document.createElement("script"),
        t = document.head || document.getElementsByTagName("head")[0];
      (e.src = "${mainScriptUrl}"),
        (e.async = !0),
        (e.onload = () => {
          window.ChatbotWidget.default({
            rasaServerUrl: "${info?.wg_server_url || apiUrl}/${info?.wg_id}",
            userId: "${"Demo" || info?.wg_user_id}",
            initialPayload: "${info?.wg_initial_payload || ""}",
            metadata: ${info?.wg_metadata},
            botAvatar:"${info?.wg_bot_avatar || "https://cdn.pixabay.com/photo/2016/08/31/11/54/user-1633249_960_720.png"}",
            widgetColor: "${info?.wg_widget_color || "#a78bfa"}",
            textColor: "${info?.wg_text_color || "#4c1d95"}",
            userMsgBackgroundColor: "${info?.wg_user_msg_background_color || "#e1d7ff"}",
            botTitle: "${info?.wg_bot_title || "Girikon Chatbot"}",
            botSubTitle: "${info?.wg_bot_sub_title || "Knowledge Base Assistant"}",
            botMsgBackgroundColor: "${info?.wg_bot_msg_background_color || "#f3f4f6"}",
            botResponseDelay: "${info?.wg_bot_response_delay || ""}",
            chatHeaderCss: {
              textColor: "${info?.wg_chat_header_css__text_color || "#4c1d95"}",
              backgroundColor: "${info?.wg_chat_header_css__background_color || "#a78bfa"}",
              enableBotAvatarBorder: ${info?.wg_chat_header_css__enable_bot_avatar_border || true},
            },
            chatHeaderTextColor: "${info?.wg_chat_header_text_color || "#4c1d95"}",
            botMsgColor: "${info?.wg_bot_msg_color || "#4b5563"}",
            userMsgColor: "${info?.wg_user_msg_color || "#4c1d95"}",
            embedded: ${info?.wg_embedded || false},
            buttonsCss: {
              color: "#${info?.wg_buttons_css__color || "#4c1d95"}",
              backgroundColor: "${info?.wg_buttons_css__background_color || "#e1d7ff"}",
              borderColor: "${info?.wg_buttons_css__border_color || "#4b5563"}",
              borderWidth: "${info?.wg_buttons_css__border_width || "0px"}",
              borderRadius: "${info?.wg_buttons_css__border_radius || "20px"}",
              hoverBackgroundColor: "${info?.wg_buttons_css__hover_background_color || "#FFFFFF"}",
              hoverColor: "${info?.wg_buttons_css__hover_color || "#4b5563"}",
              hoverborderWidth: "${info?.wg_buttons_css__hover_border_width || "1px"}",
              enableHover: ${info?.wg_buttons_css__enable_hover || false},
            },
          });
        }),
        t.insertBefore(e, t.firstChild);
    })();`;
    res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
    res.setHeader("Content-Disposition", `attachment; filename=${id}.js`);
    res.setHeader("Expires", 1.5*86400000); // 1.5 day
    res.setHeader("Cache-Control", "max-age="+ 1.5*86400000); // 1.5 day
    res.setHeader("Pragma", "public");
    res.send(_script);
};
