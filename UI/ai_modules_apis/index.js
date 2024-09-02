const summarization = require("./summarization_api");
const qa = require("./qa_api");
const mcq = require("./mcq_api");
const test_generation = require("./test_generation_api");
const code_generation = require("./code_generation_api");
const { chat_gpt, create_vector, create_vector_in_background, save_excel, ask_from_excel, chainResponseForFileFromAI, updateFileInfo, delete_vector_in_background, delete_file_from_excel,analyze_girik_sms } = require("./chat_gpt_api");
const question_generation = require("./question_generation_api");
const vqa = require("./vqa_api");



module.exports = {
	summarization,
	qa,
	mcq,
	test_generation,
	code_generation,
	chat_gpt,
	create_vector,
	create_vector_in_background,
	question_generation,
	vqa,
	save_excel,
	ask_from_excel,
	chainResponseForFileFromAI,
	updateFileInfo,
	delete_vector_in_background,
	delete_file_from_excel,
	analyze_girik_sms
};