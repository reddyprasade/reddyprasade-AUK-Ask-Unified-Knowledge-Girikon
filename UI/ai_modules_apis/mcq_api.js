const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { returnSuccess, returnError } = require("../utils");

const mcq = async (req, res) => {
  try {
    const { user_id, question, context } = req.headers;

    const formData = new FormData();
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const path = file.path.replace(/\\/g, "/");
      formData.append("files", fs.createReadStream(path), {
        filepath: path,
        filename: file.originalname,
      });
    }

    let result = await axios.post(process.env.AI_MODEL_MCQ, formData, {
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
        user_id: user_id,
        question: question,
        context: context,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    returnSuccess(res, result.data, 200);
  } catch (error) {
    console.error("error in calling AI API", error.message);
    returnError(res, "Server Error", 500);
  }
};

module.exports = mcq;
