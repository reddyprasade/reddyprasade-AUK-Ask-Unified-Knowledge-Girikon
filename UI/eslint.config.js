module.exports = [
    {
        ignores: [
            "!node_modules/",           // unignore `node_modules/` directory
            "node_modules/*",           // ignore its content
            "!node_modules/mylibrary/"  // unignore `node_modules/mylibrary` directory
        ],

        rules: {
            "semi": ["error", "always"],
            "prefer-const": "error",
            "no-var": "error",
            "no-unused-vars": "error",
            "no-undef": "error",

        },
        languageOptions: {
            globals: {
                "process": true,
                "module": true,
                "require": true,
                "console": true,
                "exports": true,
                "global": true,
                "Buffer": true,
                "__dirname": true,
                "setInterval": true,
                "setTimeout": true,
                "clearInterval": true,
                "clearTimeout": true,
                "Promise": true,
                "JSON": true,
            }
        }
    }
];