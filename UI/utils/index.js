const {v4: uuidv4} = require("uuid");
const crypto = require("crypto");
const moment = require("moment");
const {join} = require("path");
const fs = require("fs");
const otpGenerator = require("otp-generator");
const isValidJson = (str) => {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    },
    parseJson = (str, _default = null) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            if (_default === null) {
                return str;
            } else {
                return _default;
            }
        }
    },
    middleware = (router, middleware) => {
        for (const f of middleware) {
            f(router);
        }
    },
    applyRoutes = (router, routes) => {
        for (const route of routes) {
            const {method, path, handler} = route;
            try {
                router[method.toLowerCase()](path, handler);
            } catch (err) {
                console.error(method);
                console.error(path);
                console.error(handler);
                console.error("applyRoutes", err);
                process.exit(0);
            }
        }
    },
    returnError = (res, error = null, status = 400) => {
        if (res.headersSent) {
            return;
        }
        const _error =
            error && typeof error === "string"
                ? error
                : error && error.message
                ? error.message
                : error;
        res.status(status).json({error: _error});
    },
    returnSuccess = (res, data = null, status = 200, message = "") => {
        if (res.headersSent) {
            return;
        }
        data = data?.dataValues ? data.dataValues : data;
        const result =
            typeof data === "object" || Array.isArray(data)
                ? data
                : {message: data};

        return res.status(status).json(result);
    },
    getUUID4 = () => uuidv4(),
   toInternalName = (str) => {
    str = str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ")  // Replace non-alphanumeric characters with spaces
        .replace(/\s+/g, "_")        // Replace one or more spaces with an underscore
        .replace(/^[_]+/g, "")       // Remove leading underscores
        .replace(/_+$/, "");         // Remove trailing underscores

    return str;
},
    getDomainFromEmail = (email) => {
        try {
            email = email.split("@")[1];
            if (email.lastIndexOf(".") !== -1) {
                email = email.substring(0, email.lastIndexOf("."));
            }
            return email;
        } catch (e) {
            if (email.lastIndexOf(".") !== -1) {
                email = email.substring(0, email.lastIndexOf("."));
            }
            return email.replace(/[@.]/g, "");
        }
    },
    getGenerateRandomString = (length = 32) => {
        let ramStr = Math.random().toString(36).replace("0.", "");
        ramStr += Math.random().toString(36).replace("0.", "");
        ramStr += Math.random().toString(36).replace("0.", "");
        ramStr += Math.random().toString(36).replace("0.", "");
        ramStr += Math.random().toString(36).replace("0.", "");
        return ramStr.substring(0, length);
    },
    getGenerateKey = (prefix = "access") => {
        return `${prefix}-${getUUID4().replace(/-/g, "") + getGenerateRandomString(16)}`;
    },
    getAvatar = (username, email) => {
        let initial = "";
        username = username || email;
        username = toInternalName(username);
        username =
            username.indexOf("_") > -1 ? username.split("_") : username.split("");

        for (let i = 0; i < username.length; i++) {
            if (username[i].length > 0) {
                initial += username[i].substring(0, 1);
            }
        }
        if (initial.length > 0) {
            initial = initial.substring(0, 2);
        }
        initial = initial.toUpperCase();
        return `https://placehold.co/100x100/000000/FFFFFF?&font=roboto&text=${initial}`;
    },
    removeInitial = (obj, arr) => {
        if (!obj) return obj;
        if (Array.isArray(obj)) {
            return obj.map((item) => removeInitial(item, arr));
        } else if (typeof obj === "object") {
            const regx = new RegExp(`^(${arr.join("|")})`, "img");
            return Object.keys(obj).reduce(
                (acc, key) => ({
                    ...acc,
                    [key.replace(regx, "")]:
                        typeof obj[key] === "object" && moment(obj[key]).isValid()
                            ? obj[key]
                            : removeInitial(obj[key], arr),
                }),
                {}
            );
        }
        return obj;
    },
    getFileExtension = (filename) => {
        return filename.split(".").pop();
    },
    createRequiredFolders = (root_path, sub_folder) => {
        const archive = join(root_path, sub_folder);
        const db = join(root_path, "db");
        const docs = join(root_path, "docs");
        const txt = join(root_path, "txt");
        const ai = join(root_path, "ai");

        if (!fs.existsSync(archive)) {
            fs.mkdirSync(archive, {recursive: true});
        }
        if (!fs.existsSync(db)) {
            fs.mkdirSync(db, {recursive: true});
        }
        if (!fs.existsSync(docs)) {
            fs.mkdirSync(docs, {recursive: true});
        }
        if (!fs.existsSync(txt)) {
            fs.mkdirSync(txt, {recursive: true});
        }
        if (!fs.existsSync(ai)) {
            fs.mkdirSync(ai, {recursive: true});
        }
        return docs;
    },
    generateRandomPassword = () => {
        const length = 8;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    },
    generateToken = (length = 20) => {
        try {
            return crypto.randomBytes(length).toString("hex");
        } catch (error) {
            console.error("generateToken", error);
        }
    },
    generateOTP = (length = 6) => {
        return otpGenerator.generate(length, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
    },
    getMaskedString = (input) => {
        const firstHyphenIndex = input.indexOf("-");

        if (input.length < firstHyphenIndex + 10) {
            return input; // Return the original string if it's too short or doesn't contain '-'
        }

        // Extract the parts of the string
        const prefix = input.substring(0, firstHyphenIndex);
        const middleDigits = input.substring(firstHyphenIndex + 1, firstHyphenIndex + 4);
        const digit = input.substring(firstHyphenIndex + 5, firstHyphenIndex + 8);
        const suffix = input.slice(-4);

        // Create the masked string with asterisks

        const maskedString = `${prefix}-${middleDigits}${digit.replace(/./g, "*")}${suffix}`;

        return maskedString;
    },
    countTokens = (sentence) => {
        const tokens = [];
        for (let i = 0; i < sentence.length; i += 4) {
            tokens.push(sentence.substring(i, i + 4));
        }
        return tokens;
    },
    preprocessString = (str) => {
        return str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    };


module.exports = {
    isValidJson,
    parseJson,
    middleware,
    applyRoutes,
    returnError,
    returnSuccess,
    getUUID4,
    toInternalName,
    getDomainFromEmail,
    getGenerateRandomString,
    getGenerateKey,
    getAvatar,
    removeInitial,
    getFileExtension,
    createRequiredFolders,
    generateRandomPassword,
    generateToken,
    generateOTP,
    getMaskedString,
    countTokens,
    preprocessString
};
