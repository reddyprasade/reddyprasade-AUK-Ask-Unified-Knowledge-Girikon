const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const moment = require("moment");
let key = process.env.JWT_KEY;
let iv = process.env.JWT_IV;

const JWT = {
    sign: (payload) => {
        try {
            const signOptions = {
                expiresIn: process.env.JWT_EXPIRESIN,    // 30 days validity
                algorithm: process.env.JWT_ALGORITHM
            };
            return jwt.sign(payload, process.env.JWT_SECRET, signOptions);
        }
        catch (err) {
            console.error(2929, err);
            return false;
        }
    },
    verify: (token) => {
        const verifyOptions = {
            expiresIn: process.env.JWT_EXPIRESIN,
            algorithm: [process.env.JWT_ALGORITHM]
        };
        try {
            return jwt.verify(token, process.env.JWT_SECRET, verifyOptions);
        }
        catch (err) {
            return false;
        }
    },
    decode: (token) => {
        return jwt.decode(token, {complete: true});
    },
    passwordEncode: async (password) => {
        // console.log("salt", process.env.SALT);
        try {
            return await bcrypt.hash(password, 10);
        }
        catch (err) {
            console.error(2929, err);
            return false;
        }
    },
    passwordCompare: async (password, hash) => {
        try {
            return await bcrypt.compare(password, hash);
        }
        catch (err) {
            console.error(2929, err);
            return false;
        }
    }
};
const verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send({
            message: "No token provided!"
        });
    }

    const decoded = JWT.verify(token);
    if (decoded?.id) {
        req.userId = decoded.id;
        next();
    }
    else {
        return res.status(401).send({
            message: "Unauthorized!"
        });
    }
};
const CRYPTO = {
    encrypt: (text) => {
        try {
            const appendTime = "" + text + '_t_' + moment().add(10, 'minutes').unix();
            const algorithm = 'aes-256-cbc';
            // const key = Buffer.from("0123456789RTCDEF", 'hex');
            // const iv = Buffer.from("0123456789ABCDEF", 'hex');
            // const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            let encrypted = cipher.update(appendTime, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
        }
        catch (err) {
            console.error(2929, err);
            return false;
        }
    },
    decrypt: (text) => {
        try {
            const algorithm = 'aes-256-cbc';
            // const key = Buffer.from(process.env.CRYPTO_KEY, 'hex');
            // const iv = Buffer.from(process.env.CRYPTO_IV, 'hex');
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(text, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (err) {
            console.error(2929, err);
            return false;
        }
    },
    gen: () => {
        try {
            return {
                key: new Buffer(crypto.randomBytes(32)).toString('hex'),
                iv: new Buffer(crypto.randomBytes(16)).toString('hex')
            };
        }
        catch (err) {
            console.error(2929, err);
            return false;
        }
    },
    test: (id) => {
        return {t: "" + id + '_t_' + moment().add(10, 'minutes').unix()};
    }
};

module.exports = {
    verifyToken,
    JWT,
    CRYPTO
};
