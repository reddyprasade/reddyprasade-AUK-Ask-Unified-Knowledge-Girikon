require('dotenv').config();
const fs = require("fs");
const {readdirSync, lstatSync} = require("fs");
const cors = require('cors');//Ref  https://expressjs.com/en/resources/middleware/cors.html
const http = require('http');
const https = require('https');
const {join} = require("path");
const express = require('express');
const i18next = require('i18next');
const compression = require("compression");
const sprintf = require('i18next-sprintf-postprocessor');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const parser = require('ua-parser-js');
const db = require("./models");
const routes = require("./routes");
const swaggerOptions = require('./config/swagger.config');
const {applyRoutes, isValidJson} = require("./utils");
const {i18nOptions} = require("./config/i18next.config");
const localesFolder = join(__dirname, './locales');
const app = express();
const options = {key: fs.readFileSync('./ssl/key.pem', 'utf8'), cert: fs.readFileSync('./ssl/cert.pem', 'utf8')};
const bodyParser = require('body-parser');

if (!global.i18next) {
    global["i18next"] = i18next;
}
i18next
    .use(Backend)
    .use(sprintf)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        ...i18nOptions,
        preload: readdirSync(localesFolder).filter((fileName) => {
            const joinedPath = join(localesFolder, fileName);
            return lstatSync(joinedPath).isDirectory();
        }),
        backend: {
            loadPath: join(localesFolder, '{{lng}}/{{ns}}.json'),
            addPath: join(localesFolder, '{{lng}}/{{ns}}.missing.json')
        }
    });
// app.use(requestLogger({sequelize: dbsequelize}));
// app.use(cors(corsOptions));
// app.use(cache('60 minutes'))
// app.use(bodyParser({ limit: '50mb' }));

app.use(bodyParser.json({ limit: '5mb' }));
app.use(cors());
app.use(compression());
app.use(i18nextMiddleware.handle(i18next));
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));
app.use("/widgets", express.static(join(__dirname, 'widgets')));
if (process.env.NODE_ENV === "production") {
    app.use(express.static(join(__dirname, (process.env.REACT_BUILD_PATH || 'public'))));
    app.get("*", (req, res, next) => {
        if (req.originalUrl.startsWith('/api/v1/')) {
            try {
                req.ua = req.headers && req.headers['user-agent'] ? parser(req.headers['user-agent']) : {};
            }catch (e) {
                req.ua = {};
            }
            console.log(req.originalUrl);
            next();
        }
        else {
            res.sendFile(join(__dirname, (process.env.REACT_BUILD_PATH || 'public'), 'index.html'));
        }
    });
}
else {
    app.get("/", (req, res) => {
        res.send("server is up")

        var ua = parser(req.headers['user-agent']);
        // res.json({
        //     ua: ua,
        //     "_readableState": req._readableState,
        //     // "_events": req._events,
        //     "_eventsCount": req._eventsCount,
        //     // "_maxListeners": req._maxListeners,
        //     // // "socket": req.socket,
        //     "httpVersionMajor": req.httpVersionMajor,
        //     "httpVersionMinor": req.httpVersionMinor,
        //     "httpVersion": req.httpVersion,
        //     "complete": req.complete,
        //     "rawHeaders": req.rawHeaders,
        //     // "rawTrailers": req.rawTrailers,
        //     // "aborted": req.aborted,
        //     // "upgrade": req.upgrade,
        //     "url": req.url,
        //     "method": req.method,
        //     "statusCode": req.statusCode,
        //     "statusMessage": req.statusMessage,
        //     // "client": req.client,
        //     // "_consuming": req._consuming,
        //     // "_dumped": req._dumped,
        //     // "next": req.next,
        //     "baseUrl": req.baseUrl,
        //     "originalUrl": req.originalUrl,
        //     "_parsedUrl": req._parsedUrl,
        //     "params": req.params,
        //     "query": req.query,
        //     // "res": req.res,
        //     "i18nextLookupName": req.i18nextLookupName,
        //     "lng": req.lng,
        //     "locale": req.locale,
        //     "language": req.language,
        //     "languages": req.languages,
        //     // "i18n": req.i18n,
        //     // "t": req.t,
        //     "body": req.body,
        //     "route": req.route
        // });
        // console.log('server is up and running');
        res.send("server is up and running");
    });
}

const server = process.env.IS_HTTPS === "true" ? https.createServer(options, app) : http.createServer(app);
process.env.PORT = process.env.IS_HTTPS === "true" ? (process.env.HTTPS_PORT || 3443) : (process.env.HTTP_PORT || 4450);
applyRoutes(app, routes);
swaggerOptions(app);

// database sync
const sequelize_opts = process.env.DB_INIT === "true" ? {force: true} : {alter: true};
db.sequelize.sync(sequelize_opts).then((data) => {
    console.info("Database Syncing: \tOK");
}).catch(err => {
    console.error(119, err);
}).finally(async () => {
    // await db.roles.initRole();
    // if (process..env.DB_INIT === "true")  initial();
    await db.initRelationships();
    console.info("Database Associations:\tOK");
    console.info("Application Status:\tOK");

    console.table({
        "Time": new Date().toISOString(),
        "IS_HTTPS": process.env.IS_HTTPS,
        "REACT_BUILD_PATH": process.env.REACT_BUILD_PATH,
        "NODE_ENV": process.env.NODE_ENV,
        "Host": process.env.HOST || "localhost",
        "PORT": process.env.PORT,
        "DB_HOST": process.env.DB_HOST,
        "DB_PORT": process.env.DB_PORT,
        "DB_NAME": process.env.DB_NAME,
        "DB_USER": process.env.DB_USER,
        "DB_INIT": process.env.DB_INIT,
        "DB_DEBUG": process.env.DB_DEBUG,
        "DB_DEBUG_QUERY": process.env.DB_DEBUG_QUERY,
        "JWT_EXPIRESIN": process.env.JWT_EXPIRESIN,
        "Hosted At": `http${process.env.IS_HTTPS === "true"?'s':''}://${process.env.Host || "localhost"}:${process.env.PORT}/`,

        "HTTP_PORT": process.env.HTTP_PORT,
        "HTTPS_PORT": process.env.HTTPS_PORT,
        // "CLOUDNARY_USER_NAME": process.env.CLOUDNARY_USER_NAME,
        // "CLOUDNARY_API_KEY": process.env.CLOUDNARY_API_KEY,
        // "CLOUDNARY_SECRETE_KEY": process.env.CLOUDNARY_SECRETE_KEY,
        // "GOOGLE_SSO_CLIENT_ID": process.env.GOOGLE_SSO_CLIENT_ID,
        // "FACEBOOK_SSO_CLIENT_ID": process.env.FACEBOOK_SSO_CLIENT_ID,
        // "LINKEDIN_SSO_CLIENT_ID": process.env.LINKEDIN_SSO_CLIENT_ID,
    });

});

server.listen(process.env.PORT , () => {
    console.info(`Server is running on port ${process.env.PORT}`);
}
);

process.on('uncaughtException', function (error) {
    fs.writeFileSync('./logs/error.log', JSON.stringify(error.stack));
    console.error('error', error);
    // errorManagement.handler.handleError(error);
    // if(!errorManagement.handler.isTrustedError(error))
    //     process.exit(1)
});
