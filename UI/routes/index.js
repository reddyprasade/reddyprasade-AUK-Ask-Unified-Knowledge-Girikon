const api_key = require('./api_key.routes'),
    api_keys_models = require('./api_keys_models.routes'),
    api_keys_users = require('./api_keys_users.routes'),
    feedbacks = require('./feedbacks.routes'),
    files = require('./files.routes'),
    histories = require('./histories.routes'),
    collections = require('./collections.routes'),
    orgs = require('./orgs.routes'),
    orgs_users = require('./orgs_users.routes'),
    sessions = require('./sessions.routes'),
    users = require('./users.routes'),
    // users_models_permission = require('./users_models_permission.routes'),
    manage_users = require('./manage_users.routes'),
    departments = require("./departments.routes"),
    ai = require("./ai.routes"),
    user_departments = require("./user_departments.routes"),
    crm = require("./crm.routes"),
    widgets = require("./widgets.routes"),
    giriksms = require("./giriksms.routes");


module.exports = [
    {
        path: "/robots.txt",
        method: "get",
        handler: (req, res) => {
            res.type("text/plain");
            res.send("User-agent: *\nDisallow: /");
        },
    },

    ...api_key,
    ...api_keys_models,
    ...api_keys_users,
    ...feedbacks,
    ...files,
    ...histories,
    ...collections,
    ...orgs,
    ...orgs_users,
    ...sessions,
    ...users,
    // ...users_models_permission,
    ...manage_users,
    ...departments,
    ...ai,
    ...user_departments,
    ...crm,
    ...giriksms,
    ...widgets,


    // {
    //     path: "*",
    //     method: "all",
    //     handler: (req, res) => {
    //         res.type("text/plain");
    //         res.status(404).send("Route not listed in the API documentation.");
    //     }
    // },
];