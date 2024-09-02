const AI_MODELS = {
	QA: "qa",
	SUMMARIZATION: "summarization",
	VQA: "vqa",
	MCQ: "mcq",
	TEST_GENERATION: "test_generation",
	QUESTION_GENERATION: "question_generation",
	CODE_GENERATION: "code_generation",
	CHAT_GPT: "chat_gpt",
	BAALI:"baali",
	GEMINI:"gemini",
	GEMINI_CONVERSATION:"geminiConversational"
};
const VALID_MODEL_LIST = [
	"qa", "summarization", "mcq", "test_generation", "question_generation",
	"code_generation", "chat_gpt", "vqa" , "baali" , "gemini" , "geminiConversational"
];
const ALLOW_MIME_TYPE = [
	"audio/aac", "image/avif", "video/x-msvideo", "application/vnd.amazon.ebook",
	"image/bmp", "text/css", "text/csv", "application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/epub+zip", "image/gif", "text/html", "image/vnd.microsoft.icon",
	"image/jpeg", "application/json", "application/ld+json", "audio/x-midi",
	"audio/midi", "text/javascript", "audio/mpeg", "video/mp4", "video/mpeg",
	"application/vnd.apple.installer+xml",
	"application/vnd.oasis.opendocument.presentation",
	"application/vnd.oasis.opendocument.spreadsheet",
	"application/vnd.oasis.opendocument.text", "audio/ogg", "video/ogg",
	"application/ogg", "audio/opus", "font/otf", "image/png", "application/pdf",
	"application/x-httpd-php", "application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"video/mp2t", "text/plain", "audio/wav", "audio/webm", "video/webm",
	"image/webp", "application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"video/3gpp", "audio/3gpp", "video/3gpp2", "audio/3gpp2"
];

module.exports = {
	AI_MODELS,
	VALID_MODEL_LIST,
	ALLOW_MIME_TYPE
}