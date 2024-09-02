const ctrl = require("../controllers/giriksms.ctrl");
const { validateToken } = require("../middlewares/validation");

module.exports = [

    /**
     * POST /api/v1/giriksms/analyze
     * @summary AI persona of property valuators
     * @tags GirikSMS
     * @security ApiKeyAuth
     * @param {object} request.body.required - GirikSMS info
     * @example request - example 1
     * {
     *    "feedBackURL":"https://girikon.com/feedback",
     *    "supportEmail":"support@girikon.com",
      *    "agentName":"Property Valuator",
       *    "supportNo":"+91-9876543210",
       *    "customerName":"XXXXXX",
       *    "userText":"I am not satisfied with the property valuation.",
       *   "userID":"XXXX"
     *  }
     * @return {object} 200 - success response
     */
    { path: "/api/v1/giriksms/analyze", method: "post", handler: [validateToken, ctrl.analyze_girik_sms] },
];