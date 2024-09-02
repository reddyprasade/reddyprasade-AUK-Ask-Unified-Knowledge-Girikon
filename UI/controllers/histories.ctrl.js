const db = require("../models");
const { returnSuccess, returnError } = require("../utils");
const History = db.histories;

// Create and Save a new History
exports.create = async (req, res) => {
  try {
    const { question, answer, metadata, action, tags, comments, session_id } = req.body;
    let fb = {
      fb_question: question,
      fb_answer: answer,
      fb_metadata: metadata,
      fb_action: action,
      fb_tags: tags,
      fb_comments: comments,
      fb_session_id_fk: session_id,
      fb_user_id_fk: req.user.id,
    };

    if (!question || !answer || !session_id) {
      returnError(res, "qusetion, answer and session_id are required!", 400);
    }

   await Histories.create(fb);


    returnSuccess(res, "History created successfully!", 200);
  } catch (error) {
    console.error("error in creating feedback : ", error);
    returnError(res, error, 500);
  }
};

// Retrieve all Histories from the database.
exports.get_by_id = async (req, res) => {
  try {
    let fb = await Histories.findOne({ where: { fb_id: req.params.id } });

    returnSuccess(res, fb, 200, "History found successfully!");
  } catch (error) {
    console.error("error in getting feedback : ", error);
    returnError(res, error, 500);
  }
};

// Find a single History with an id
exports.update = async (req, res) => {
  try {
    const { id, question, answer,metadata, action, tags, comments } = req.body;
    let fb = {
      fb_question: question,
      fb_answer: answer,
      fb_metadata: metadata,
      fb_action: action,
      fb_tags: tags,
      fb_comments: comments,
    };

    await Histories.update(fb, { where: { fb_id: id } });

    returnSuccess(res, "History updated successfully!", 200);
  } catch (error) {
    console.error("error in updating feedback : ", error);
    returnError(res, error, 500);
  }
};

// Update a History by the id in the request
exports.list = async (req, res) => {
  try {
    let { pageNo = 0, size = 5, all } = req.query;
    if (all) {
      let hstrs = await History.findAll({
        attributes: ["h_id", "h_question", "h_answer", "h_metadata", "h_session_id_fk", "h_created_at", "h_updated_at", "h_org_id_fk", "h_model_type", "h_selected_key","h_collection_id" ],
        where: { h_session_id_fk: req.params.session_id },
        order: [["h_created_at", "ASC"]]
      });
      hstrs = hstrs.map((item) => {
        return {
          id: item.h_id,
          question: item.h_question,
          answer: item.h_answer,
          metadata: item.h_metadata,
          h_model_type: item.h_model_type,
          h_selected_key: item.h_selected_key,
          h_collection_id: item.h_collection_id,
        };
      });

      returnSuccess(res, hstrs, 200, "Histories found successfully!");
    } else {
      let offset = pageNo * size;

      let hstrs = await History.findAndCountAll({
        attributes: ["h_id", "h_question", "h_answer", "h_metadata", "h_session_id_fk", "h_created_at", "h_updated_at", "h_org_id_fk", "h_model_type", "h_selected_key","h_collection_id"],
        order: [["h_created_at", "ASC"]],
        where: { h_session_id_fk: req.params.session_id },
        offset: offset,
        limit: size,
      });
      hstrs.rows = hstrs.rows.map((item) => {
        return {
          id: item.h_id,
          question: item.h_question,
          answer: item.h_answer,
          metadata: item.h_metadata,
          h_model_type: item.h_model_type,
          h_selected_key: item.h_selected_key,
          h_collection_id: item.h_collection_id,
        };
      });

      returnSuccess(
        res,
        { count: hstrs.count, rows: hstrs.rows },
        200,
        "Histories found successfully!"
      );
    }
  } catch (error) {
    console.error("error in getting all feedback : ", error);
    returnError(res, error, 500);
  }
};

// Delete a History with the specified id in the request
exports.delete = async (req, res) => {
  try {
    await Histories.destroy({ where: { fb_id: req.params.id } });

    returnSuccess(res, "History deleted successfully!", 200);
  } catch (error) {
    console.error("error in deleting feedback : ", error);
    returnError(res, error, 500);
  }
};
