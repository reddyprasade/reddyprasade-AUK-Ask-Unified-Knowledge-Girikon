const db = require("../models");
const { QueryTypes } = require('sequelize');
const { returnSuccess, returnError } = require("../utils");
const {analyze_girik_sms} = require("../ai_modules_apis");


exports.analyze_girik_sms = async (req, res) => {

    console.log("Request to analyze girik sms:");

    try {
        const girik_sms = await analyze_girik_sms(req);

        console.log("Girik SMS analyzed successfully!");

        returnSuccess(res, girik_sms, 200, "Girik SMS analyzed successfully!");
    } catch (error) {
        console.error("Error in analyzing girik sms:", error);
        returnError(res, error.message, 500);
    }
};
