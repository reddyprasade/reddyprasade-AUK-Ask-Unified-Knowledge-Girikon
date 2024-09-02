const db = require("../models");
const path = require("path");
const {returnSuccess, returnError, createRequiredFolders} = require("../utils");
const { encryptData , decryptData } = require("../utils/encryption");
const { delete_vector_in_background,delete_file_from_excel } = require("../ai_modules_apis");
const Files = db.files;
const Collections = db.collections;
const fs = require('fs');
// const {PassThrough} = require("stream");
const flow = require('../config/flow_node')('tmp');


// get all files by collection id
exports.getAllByCollectionId = async (req, res) => {
    try {
        let {pageNo = 0, size = 5, all} = req.query;

        if (all) {
            let files = await Files.findAll({
                where: {f_collection_id_fk: req.params.collection_id},
                attributes: ["f_id", "f_original_name", "f_size", "f_created_at", "f_collection_id_fk", "f_status","f_name"],
            });
            returnSuccess(res, files, 200, "Files found successfully!");
        } else {
            let offset = pageNo * size;
            let files = await Files.findAndCountAll({
                where: {f_collection_id_fk: req.params.collection_id},
                attributes: ["f_id", "f_original_name", "f_size", "f_created_at", "f_collection_id_fk", "f_status","f_name"],
                offset: offset,
                limit: size,
            });
            returnSuccess(res, {count: files.count, rows: files.rows}, 200, "Files found successfully!");

        }

    } catch (error) {
        console.error("error in getting files : ", error);
        returnError(res, error, 500);
    }
};

exports.deleteById = async (req, res) => {
    Files.delete(req, req.params.id).then((result) => {
        if (result) {
            returnSuccess(res, "File deleted successfully!", 200);
        } else {
            returnError(res, "File not found", 404);
        }
    }).catch((error) => {
            console.error("error in deleting file : ", error);
            returnError(res, error, 500);
        }
    );
}

exports.deleteByCollectionId = async (req, res) => {
    try {
        const collection = await Collections.findOne({
            attributes: ["c_id", "c_vector_store_id", "c_response_type", "c_model_type","c_selected_key"],
            where: { c_id: req.params.col_id },
        });

        const fileData = await Files.findOne({
            attributes: ["f_assistant_file_id", "f_name"],
            where: { f_id: req.params.id },
        });

        if (!collection || !fileData) {
            return returnError(res, "Collection or file not found", 404);
        }

        req.body.collection_id = collection.dataValues.c_id;
        req.body.file_name = fileData.dataValues.f_name;

        if (collection.dataValues.c_model_type === "excel") {
            const fileDeleted = await Files.destroy({
                where: {
                    f_id: req.params.id,
                    f_collection_id_fk: req.params.col_id,
                },
            });

            if (fileDeleted) {
                delete_file_from_excel(req);
                return returnSuccess(res, "File deleted successfully!", 200);
            } else {
                return returnError(res, "File not found", 404);
            }
        } else {
            req.body.vector_store_id = collection.dataValues.c_vector_store_id;
            req.body.response_type = collection.dataValues.c_response_type;
            req.body.assistant_file_id = fileData.dataValues.f_assistant_file_id;
            req.body.file_name = fileData.dataValues.f_name;
            req.body.selected_key = collection.dataValues.c_selected_key;

            const fileDeleted = await Files.destroy({
                where: {
                    f_id: req.params.id,
                    f_collection_id_fk: req.params.col_id,
                },
            });

            if (fileDeleted) {
                delete_vector_in_background(req);
                return returnSuccess(res, "File deleted successfully!", 200);
            } else {
                return returnError(res, "File not found", 404);
            }
        }
    } catch (error) {
        console.error("Error in deleting file:", error);
        return returnError(res, error, 500);
    }
};


exports.uploadWithChunks = (req, res) => {
    flow.post(req, function (status, filename, original_filename, identifier) {
        if (status === 'done') {
            //   const _file = Files.create({
            //     f_id: identifier,
            //     f_name: filename,
            //     f_original_name: original_filename,
            //     f_path: flowHandler.options.target + '/' + filename,
            //     f_ext: 'pdf',
            //     f_size: fs.statSync(flowHandler.options.target + '/' + filename).size,
            //     f_collection_id_fk: req.params.collection_id,
            //     f_user_id_fk: req.user.id,
            //     f_status: "active",
            //     f_created_by: req.user.id,
            //     f_updated_by: req.user.id,
            //   });

            // req.user.root_path = join(req.user.org_root_path, req.body.c_id);
            // req.user.upload_path = createRequiredFolders(req.user.root_path, req.user.sub_folder);

            const orgId = req.body.org_id;
            const collectionId = req.body.c_id;
            const targetDirectory = `./uploads/${orgId}/${collectionId}/docs`;

            fs.mkdirSync(targetDirectory, {recursive: true});

            const filePath = `${targetDirectory}/${filename}`;

            var s = fs.createWriteStream(filePath);

            s.on('finish', function () {
                res.status(200).send();
            });
            flow.write(identifier, s, {end: true});
        } else {
            res.status(/^(partly_done|done)$/.test(status) ? 200 : 500).send();
        }
    });
}


exports.getWithChunks = (req, res) => {
    flow.get(req, function (status, filename, original_filename, identifier) {
        if (status === 'found') {
            res.status(200).send();
        } else {
            res.status(498).send();
        }
    });
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.txt': 'text/plain',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.zip': 'application/zip',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        
        // Add other necessary MIME types
    };
    return mimeTypes[ext] || 'application/octet-stream';
}


exports.getFileByFileName = async (req, res) => {
    const { data } = req.params;
    const { download } = req.query;
    let file_path = "";

    if (!data) {
        return res.status(401).send('Unauthorized access');
    }

    try {
        const decryptedData = decryptData(data);
        const [filename, c_id, access_token, timestamp] = decryptedData.split("|");

        const _file_token = await db.file_tokens.findOne({
            where: {
                ft_secret_token: data,
                ft_file_name: filename,
                ft_collection_id_fk: c_id,
                ft_status: 'active',
                // ft_user_ip: req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'],
            }
        });


        if (!_file_token) {
            return res.status(401).send('Unauthorized access');
        }

        const file_info = await db.files.getFileByCollectionID(filename, c_id);

        if (!file_info) {
            return res.status(404).send('File not found');
        }

        file_path = file_info.dataValues.f_path.replace(/\\/g, "/");
        let k = new RegExp('/docs/', 'img');
        file_path = file_path.replace(k, "/txt/");

        // Check if file exists
        if (!fs.existsSync(file_path)) {
            console.error('File does not exist:', file_path);
            return res.status(404).send('File not found');
        }

        const _res = fs.readFileSync(file_path);
        console.log('File read successfully');

        const contentType = getContentType(file_path);
        let _json = {
            'Content-Type': file_info.dataValues.f_ext || contentType,
            'Content-Length': _res.length,
        };

        if (download) {
            _json['Content-Disposition'] = `attachment; filename="${file_info.dataValues.f_original_name}"`;
        }

        res.writeHead(200, _json);
        res.end(_res);

        // Clear the secret token after the file has been sent
        const _update = await db.file_tokens.update(
            {
                ft_status: 'inactive',
                ft_secret_token: null,
            },
            { where: { ft_id: _file_token.dataValues.ft_id, ft_file_name: filename, ft_collection_id_fk: c_id } }
        );

    } catch (error) {
        console.error("Error:_______________________________________________________________________\n", error);
        return res.status(500).send(error.message);
    }
};


exports.getEncryptedFileInfo = async (req, res) => {

    const {filename} = req.params;
    const {c_id, access_token} = req.query;

    const timestamp = new Date().getTime();

    const dataToEncrypt = `${filename}|${c_id}|${access_token}|${timestamp}`;

    const _encryptData = encryptData(dataToEncrypt);

    await db.file_tokens.create({
        ft_file_name: filename,
        ft_collection_id_fk: c_id,
        ft_secret_token: _encryptData,
        ft_status: 'active',
        ft_user_ip: req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'],
        ft_created_by: req.user.id,
        ft_updated_by: req.user.id
    });
    
    res.status(200).send({
        data: _encryptData,
    });
};
