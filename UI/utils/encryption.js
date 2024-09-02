const crypto = require('crypto');
const bcrypt = require('bcrypt');
const secret_key = process.env.SECRET_KEY;
const secret_iv = process.env.SECRET_IV;
const encryption_method = process.env.ENCRYPTION_METHOD;

// console.log(secret_key, secret_iv, encryption_method);
if (!secret_key || !secret_iv || !encryption_method) {
    throw new Error('secretKey, secretIV, and encryption Method are required')
}

// Generate secret hash with crypto to use for encryption
const key = crypto
    .createHash('sha512')
    .update(secret_key)
    .digest('hex')
    .substring(0, 32);
const encryptionIV = crypto
    .createHash('sha512')
    .update(secret_iv)
    .digest('hex')
    .substring(0, 16);

// Encrypt data
const encryptData = (data) => {
    const cipher = crypto.createCipheriv(encryption_method, key, encryptionIV)
    return Buffer.from(
        cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
    ).toString('base64') // Encrypts data and converts to hex and base64
}

// Decrypt data
const decryptData = (encryptedData) => {
    const buff = Buffer.from(encryptedData, 'base64')
    const decipher = crypto.createDecipheriv(encryption_method, key, encryptionIV)
    return (
        decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
        decipher.final('utf8')
    ) // Decrypts data and converts to utf8
}

const passwordEncode = (plainPassword) => {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                reject(err);
            }
            bcrypt.hash(plainPassword, salt, (err, hashPassword) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(hashPassword);
                }
            });
        });
    });
};

const passwordCompare = (plainPassword, hashPassword) => {
    // console.log("plainPassword ", plainPassword, " hashPassword ", hashPassword);
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainPassword, hashPassword, (err, isPasswordMatch) => {
            // console.log("isPasswordMatch ", isPasswordMatch, " err ", err);
            if (err) {
                reject(err);
            }
            else {
                resolve(isPasswordMatch);
            }
        });
    });
}

module.exports = {
    encryptData,
    decryptData,
    passwordEncode,
    passwordCompare
};