const db = require("../models");
const { returnSuccess, returnError } = require("../utils");
const Feedbacks = db.feedbacks;
const Users = db.users;


// Create and Save a new Feedback
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
      fb_org_id_fk: req.user.org_id,
    };

    if (!question || !answer || !session_id) {
      returnError(res, "qusetion, answer and session_id are required!", 400);
    }

    await Feedbacks.create(fb);

    returnSuccess(res, "Feedback created successfully!", 200);
  } catch (error) {
    console.error("error in creating feedback : ", error);
    returnError(res, error, 500);
  }
};

// Retrieve all Feedbacks from the database.
exports.get_by_id = async (req, res) => {
  try {
    let fb = await Feedbacks.findOne({ where: { fb_id: req.params.id } });

    returnSuccess(res, fb, 200, "Feedback found successfully!");
  } catch (error) {
    console.error("error in getting feedback : ", error);
    returnError(res, error, 500);
  }
};

// Find a single Feedback with an id
exports.update = async (req, res) => {
  try {
    const { id, question, answer, metadata, action, tags, comments } = req.body;
    let fb = {
      fb_question: question,
      fb_answer: answer,
      fb_metadata: metadata,
      fb_action: action,
      fb_tags: tags,
      fb_comments: comments,
    };

    await Feedbacks.update(fb, { where: { fb_id: id } });

    returnSuccess(res, "Feedback updated successfully!", 200);
  } catch (error) {
    console.error("error in updating feedback : ", error);
    returnError(res, error, 500);
  }
};

// Update a Feedback by the id in the request
exports.list = async (req, res) => {
  try {
    let { pageNo = 0, size = 5, all } = req.query;

    const includeUser = {
      model: Users,
      as: 'user',
      attributes: ['u_email']
    };
    
    if (all) {
      let fbs = await Feedbacks.findAll({
        // where: { fb_session_id_fk: req.params.session_id },
        where: { fb_org_id_fk: req.user.org_id},
        order: [["fb_updated_at", "DESC"]],
        include: [includeUser],
      });

      fbs = fbs.map((item) => {
        return {
          id: item.fb_id,
          question: item.fb_question,
          answer: item.fb_answer,
          action: item.fb_action,
          createdAt: item.fb_created_at,
          updatedAt: item.fb_updated_at,
          comments: item.fb_comments,
          user_email: item.user.u_email
        };
      });

      returnSuccess(res, fbs, 200, "Feedbacks found successfully!");
    } else {
      let offset = pageNo * size;

      let fbs = await Feedbacks.findAndCountAll({
        // where: { fb_session_id_fk: req.params.session_id },
        where: { fb_org_id_fk: req.user.org_id },
        offset: pageNo && size ? offset : 0,
        limit: size ? size : 5,
        order: [["fb_updated_at", "DESC"]],
        include: [includeUser],
      });
      fbs.rows = fbs.rows.map((item) => {
        return {
          id: item.fb_id,
          question: item.fb_question,
          answer: item.fb_answer,
          action: item.fb_action,
          createdAt: item.fb_created_at,
          updatedAt: item.fb_updated_at,
          comments: item.fb_comments,
          user_email: item.user.u_email
        };
      });
      
      returnSuccess(
        res,
        { count: fbs.count, rows: fbs.rows },
        200,
        "Feedbacks found successfully!"
      );
    }
  } catch (error) {
    console.error("error in getting all feedback : ", error);
    returnError(res, error, 500);
  }
};


// Delete a Feedback with the specified id in the request
exports.delete = async (req, res) => {
  try {
    await Feedbacks.destroy({ where: { fb_id: req.params.id } });

    returnSuccess(res, "Feedback deleted successfully!", 200);
  } catch (error) {
    console.error("error in deleting feedback : ", error);
    returnError(res, error, 500);
  }
};


exports.feedback_approval = async (req, res) => {
  try {
    const { feedback_id, selected_action , comments} = req.body;
    let status = selected_action === "up" ? "approved" : "rejected";

    let fb = {
      fb_approved_status: status,
      fb_admin_comments: comments,
    };

    await Feedbacks.update(fb, { where: { fb_id: feedback_id } });

    returnSuccess(res, "Feedback updated successfully!", 200);
  } catch (error) {
    console.error("error in updating feedback : ", error);
    returnError(res, error, 500);
  }
}

exports.save_feedback = async (req, res) => {
  try {
    const { question, answer, metadata, action, tags, comments, session_id } = req.body;
    const { id } = req.params;

    const w = await db.widgets.getOne(id);

    const orgId = await db.users.findOne({
      attributes: ['u_default_org_fk'],
      where: { u_id: w?.wg_created_by },
    });

    let fb = {
      fb_question: question,
      fb_answer: answer,
      fb_metadata: metadata,
      fb_action: action,
      fb_tags: tags,
      fb_comments: comments,
      fb_session_id_fk: session_id,
      fb_user_id_fk: w?.wg_created_by || 'bc7cbfc8-4261-4201-992f-9acd55cf72df',
      fb_org_id_fk: orgId?.dataValues?.u_default_org_fk || '68331e69-36c3-4109-ae83-98c80883d898',
    };

    if (!question || !answer || !session_id) {
      returnError(res, "qusetion, answer and session_id are required!", 400);
    }

    await Feedbacks.create(fb);

    returnSuccess(res, "Feedback created successfully!", 200);

  } catch (error) {
    console.error("error in creating feedback : ", error);
    returnError(res, error, 500);
  }
};