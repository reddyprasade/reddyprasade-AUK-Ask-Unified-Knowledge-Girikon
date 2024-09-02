const ctrl = require("../controllers/crm.ctrl");
const {validateToken} = require("../middlewares/validation");
module.exports = [
    {path: "/api/v1/crm/login-salesforce", method: "get", handler: [validateToken, ctrl.loginSalesForce]},
    {path: "/api/v1/connect/salesforce", method: "get", handler: [validateToken, ctrl.connectSalesForce]},
    // {path: "/api/v1/crm/login-salesforce", method: "get", handler: [validateToken, ctrl.loginSalesForce]},
    
]