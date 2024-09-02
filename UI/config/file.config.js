const fs = require("fs");
const multer = require("multer");
const { getFileExtension } = require("../utils");
const { ALLOW_MIME_TYPE } = require("../utils/constant");

const createDirectoryIfNotExist = (folder_path = "uploads/") => {
    if (!fs.existsSync(folder_path)) {
        fs.mkdirSync(folder_path, { recursive: true });
    }
};
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        createDirectoryIfNotExist(req?.user?.upload_path || "uploads/");
        cb(null, req?.user?.upload_path || "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            `${file.fieldname}-${uniqueSuffix}.${getFileExtension(file.originalname)}`
        );
    },
});
  // Create a multer instance with the storage option:
 const uploader = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
      if(req?.files === null || req?.files === undefined) {
        return cb(null, true);
      }
      if (ALLOW_MIME_TYPE.indexOf(file.mimetype.toLowerCase()) === -1) {
        req.fileValidationError =
          "goes wrong on the mimetype " + file.mimetype.toLowerCase();
        return cb(null, false, new Error(req.fileValidationError));
      }
      cb(null, true);
    },
    limits: {
      fileSize: 1024 * 1024 * 1024 * 5, // 5 GB
    },
  });



module.exports = uploader;
