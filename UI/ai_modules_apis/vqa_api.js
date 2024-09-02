const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const {AI_MODELS} = require("../utils/constant");
const vqa = async (req) => {
	return new Promise(async (resolve, reject) => {
		let result = [];
		let data = new FormData();
		for (const file of req.files) {
			data.append("files", fs.readFileSync(file.path), file.originalname);
			// data.append('image_url', 'https://picsum.photos/1024');
		}
		data.append('task_name', AI_MODELS.VQA);
		data.append('user_id', req?.user?.id);
		data.append('question', req?.body?.q || req?.body?.question || "what is in this image?");//

		let config = {
			method: 'post',
			timeout: 100000,
			timeoutErrorMessage: "Time out!",
			maxBodyLength: Infinity,
			url: process.env.AI_MODEL_VQA,
			headers: {
				...data.getHeaders()
			},
			data: data
		};

		axios.request(config).then((response) => {
			resolve([response.data])
		}).catch((error) => {
			console.error("ai_modules_apis/vqa_api.js", error);
			resolve(error.toString());
		});
	});
};

module.exports = vqa;
