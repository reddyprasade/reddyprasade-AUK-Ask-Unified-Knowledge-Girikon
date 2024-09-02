const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const {AI_MODELS} = require("../utils/constant");

const summarization = async (req) => {
	return new Promise(async (resolve, reject) => {
		if (process.env.IS_AI_LOCAL === "true") {
			resolve([{
				question: 'Key Responsibility Areas Business Analyst Band 2 V1.0.pdf',
				answer: 'Girikon Solutions Private  Limited (GSPL) has released a new version of its HR/KRA/022/10 document. The document was released on 10th October, 2022. GSPL is a leading provider of HR and HR-related services in India.'
			}]);
		}else {
			let result = [];
			let formData = new FormData();
			for (const file of req.files) {
			
				formData.append(
					"files",
					fs.readFileSync(file.path.replace(/\\/g, "/")),
					file.originalname
				);
			}
			formData.append("user_id", req?.user?.id);
			formData.append("task_name", AI_MODELS.SUMMARIZATION);
			formData.append("column_name", req?.body?.column_name || "NA");
			

			let config = {
				method: "post",
				maxBodyLength: Infinity,
				timeout: 1000 * 1000,
				timeoutErrorMessage: "Time out!",
				url: process.env.AI_MODEL_SUMMARIZATION,
				headers: {
					...formData.getHeaders(),
				},
				data: formData,
			};
			axios.request(config).then((response) => {
				// console.log(323232, JSON.stringify(response.data, null, 2));
				response.data.data.forEach((item) => {
					result.push({
						question: item.filename,
						answer: Array.isArray(item.summary)
							? item.summary.map((item) => item.summary_text).join("\n\n\n")
							: item?.summary?.summary_text,
					});
				});
				resolve(result);
			}).catch((error) => {
				console.error(error);
				resolve(error.toString());
			});
		}
	});
};

module.exports = summarization;
