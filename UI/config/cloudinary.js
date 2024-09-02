require("dotenv").config();
const cloudinary = require("cloudinary").v2;

// console.log(process.env.CLOUDNARY_USER_NAME)
cloudinary.config({
    cloud_name: process.env.CLOUDNARY_USER_NAME,
    api_key: process.env.CLOUDNARY_API_KEY,
    api_secret: process.env.CLOUDNARY_SECRETE_KEY
});

module.exports = cloudinary;