const expressJSDocSwagger = require('express-jsdoc-swagger');
const options = {
    info: {
        version: '1.0.0',
        title: 'Girikon AI API ',
        description: 'Girikon AI API Documentation',
        termsOfService: "https://girikon.ai/terms-of-service/",
        contact: {
            "name": "API Support",
            "url": "https://girikon.ai/contact/",
            "email": "support@girikon.ai"
        },
        license: {
            name: 'MIT',
        },
    },
    security: {
        // BasicAuth: {
        //     type: 'http',
        //     scheme: 'basic',
        // },
        ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
        }
    },
    servers: [
        {url: 'http://localhost:3000'},
        {
            url: 'https://devapi.girikon.ai',
            description: '',
            // variables: {
            //     protocol: {
            //         enum: ['http','https','ws','wss'],
            //         default: 'http',
            //     },
            //     subdomain: {
            //         enum: ['','devapi', 'gakb-devapi', 'api'],
            //         default: '',
            //         description: '',
            //     },
            //     server: {
            //         enum: ['localhost:{port}', '.girikon.ai', '.girikon.ai:{port}'],
            //         default: 'localhost:{port}',
            //         description: '',
            //     },
            //     port: {
            //         enum: ['','3000', '443', '8443'],
            //         default: '3000',
            //     }
            // },
        },
        {url: 'http://localhost:3443'}
    ],

    // Base directory which we use to locate your JSDOC files
    baseDir: __dirname,
    // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
    filesPattern: ['../**/*.ctrl.js', '../**/*.routes.js'],
    // URL where SwaggerUI will be rendered
    swaggerUIPath: '/api/v1/docs/api-docs',
    // Expose OpenAPI UI
    exposeSwaggerUI: true,
    // Expose Open API JSON Docs documentation in `apiDocsPath` path.
    exposeApiDocs: true,
    // Open API JSON Docs endpoint.
    apiDocsPath: '/api/v1/docs/docs',
    // Set non-required fields as nullable by default
    notRequiredAsNullable: false,
    // You can customize your UI options.
    // you can extend swagger-ui-express config. You can checkout an example of this
    // in the `example/configuration/swaggerOptions.js`
    swaggerUiOptions: {
        // customCssUrl:"https://raw.githubusercontent.com/ravisankarchinnam/openapi-swagger-dark-theme/main/swagger-ui.css",
        swaggerOptions: {
            deepLinking: true,
            displayOperationId: false,
            defaultModelsExpandDepth: -1,
            defaultModelExpandDepth: 1,
            displayRequestDuration: true,
            docExpansion: true,
            showExtensions: true,
            showCommonExtensions: true,
            syntaxHighlight: {
                activate: true,
                theme: 'idea'
            },
            requestSnippetsEnabled: true,
            requestSnippets: {
                generators: {
                    curl_bash: {
                        title: "cURL (bash)",
                        syntax: "bash"
                    },
                    curl_powershell: {
                        title: "cURL (PowerShell)",
                        syntax: "powershell"
                    },
                    curl_cmd: {
                        title: "cURL (CMD)",
                        syntax: "bash"
                    },
                },
                defaultExpanded: true,
                languages: null,
                // e.g. only show curl bash = ["curl_bash"]
            }
        },
        customJsStr: 'console.log("Hello World")',
        customCss: `.swagger-ui .topbar { display: none }.swagger-ui .info{margin:10px 0}`,
    },

    // multiple option in case you want more that one instance
    multiple: true,

};

module.exports = (app) => {
    expressJSDocSwagger(app)(options);
};
