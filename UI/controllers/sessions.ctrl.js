const db = require("../models");
const {returnSuccess, returnError} = require("../utils");
const Sessions = db.sessions;
// Create and Save a new Tutorial
exports.create = async(req, res) => {
  try {
      let _session = await Sessions.create({
          s_user_id_fk: req.user.id,
      });

      _session = JSON.parse(JSON.stringify(_session));

      const _data = {
        session_id: _session.s_id,
      }
    returnSuccess(res, _data,200,"Session created successfully!");
  } catch (error) {
      console.error("Error in create session Controller:", error);
      returnError(res, error.message || "Some error occurred while creating the new session.", 500);
  }
};

// Retrieve all Tutorials from the database.
exports.findAll = async(req, res) => {
  try {
    let _sessions = await Sessions.findAll();
    returnSuccess(res,_sessions,200,"Successfully Fetched all Sessions");

  } catch (error) {
      console.error("Error in fetching sessions Controller:", error);
      returnError(res, error.message || "Some error occurred while fetching sessions.", 500);
  }
};

// Find a single Tutorial with an id
exports.findOne = async(req, res) => {
  try {
    const _session = await Sessions.findOne({
        where: {
            s_id: req.params.id
        }
    });
    returnSuccess(res,_session,200,"Successfully Fetched the Session");
} catch (error) {
      console.error("Error in fetching a session Controller:", error);
      returnError(res, error.message || "Some error occurred while fetching a session.", 500);
  }
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