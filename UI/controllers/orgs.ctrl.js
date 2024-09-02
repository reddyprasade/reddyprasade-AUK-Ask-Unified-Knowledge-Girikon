const db = require("../models");
const {returnSuccess, returnError} = require("../utils");
const path = require('path');
const fs = require('fs');
const Orgs = db.orgs;

// Create and Save a new Tutorial
exports.add = async (req, res) => {
    let _body = req.body;
    const _orgs = await Orgs.add(req, _body);
    returnSuccess(res, _orgs);
};

exports.get_logo = async (req, res) => {
    const _org_id = await Orgs.findOne({
        attributes: ['o_id'],
        where: {o_internal_name: req.params.o_internal_name}
    });

    //  console.log(18, _org_id);
    let _logo_path = "";
    // console.log(19, _logo_path);

    try {
        _logo_path = path.join(process.cwd(), 'uploads', _org_id?.dataValues?.o_id, 'logo.png');
        const _file = fs.statSync(_logo_path);
    } catch (e) {
        _logo_path = path.join(process.cwd(), 'uploads', 'logo.png');
    }
    res.sendFile(_logo_path);
};

// add logo in a specific org_id folder

exports.upload_logo = async (req, res) => {
    const _org_id = await Orgs.findOne({
        attributes: ['o_id'],
        where: {o_internal_name: req.params.o_internal_name}
    });
    let _logo_path = path.join(process.cwd(), 'uploads', _org_id?.dataValues?.o_id, 'logo.png');

    try {
        // Move the uploaded file to the specified path
        await fs.promises.rename(req.file.path, _logo_path);
        returnSuccess(res, 'Logo updated successfully', 200);
    } catch (error) {
        console.error('Error saving file:', error);
        returnError(res, 'Error saving file', 500);
    }

}


// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {

};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {

};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {

};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {

};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {

};

// Find all published Tutorials
exports.findAllPublished = (req, res) => {

};