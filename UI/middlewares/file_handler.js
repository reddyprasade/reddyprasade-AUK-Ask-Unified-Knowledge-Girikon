const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {getUUID4} = require('../utils');
const db = require('../models');
const {returnSuccess, returnError} = require("../utils");
const Files = db.files;


const getFileFromDrive = async (req, res, next) => {
	const data = req.body.file_array;
	const collection_id = req.user.collection_id;

	// If file comes from the local system and not from the cloud
	if(req && res && next && !data){
		next();
	}
	else{

		try {
			let dataArray;
			let _file;
			let _fileArray = [];
			try {
				dataArray = JSON.parse(data);
			}
			catch (parseError) {
				console.error("Error parsing JSON data:", parseError);
				return false;
			}

			if (!Array.isArray(dataArray)) {
				console.error("Parsed data is not an array")
				// returnError(res, "Parsed data is not an array", 400);
				return false;
			}

			await Promise.all(
				dataArray?.map(async (item) => {
					try {
						const provider = item.provider;
						let url;
						let headers;
						let _file_ext;
						if (!item || !item.id || !provider) {
							console.error("Invalid data provided");
							if (res && next) {
								returnError(res, "Invalid data provided", 500);
							}
							else {
								return false;
							}
						}
						if (provider === 'gdrive') {
							if (!item.accessToken) {
								console.error("Access token is not provided");
								if (res && next) {
									returnError(res, "Access token is not provided", 500);
								}
								else {
									return false;
								}
							}
							// Make a GET request to the Google Drive API to download the file
							url = `https://www.googleapis.com/drive/v2/files/${item.id}?alt=media`;
							headers = { "Authorization": `Bearer ${item.accessToken}` };
							_file_ext = item?.mimeType?.split('/')[1];
						}
						else if (provider === 'onedrive') {
							// Make a GET request to the OneDrive API to download the file
							url = item.url;
							headers = {};
							_file_ext = 'pdf';
						}
						else if (provider === 'dropbox') {
							// Make a GET request to the Dropbox API to download the file
							url = item.url;
							headers = {};
							_file_ext = 'pdf';
						}
						const response = await axios.get(url, { headers });

						if (response.status === 200) {
							const fileData = response.data;
							const f_ext = _file_ext;
							const uniqueFilename = getUUID4() + '.' + f_ext;
							const savedPdfPath = path.join(req.user.upload_path, uniqueFilename);
						
							// Check if directory exists, if not create it
							if (!fs.existsSync(path.dirname(req.user.upload_path))) {
								await fs.promises.mkdir(path.dirname(req.user.upload_path), { recursive: true });
							}

							fs.writeFileSync(savedPdfPath, fileData, 'binary');

							_file = await Files.create({
								f_id: getUUID4(),
								f_name: uniqueFilename,
								f_original_name: item.name,
								f_path: savedPdfPath,
								f_ext: f_ext,
								f_size: fs.statSync(savedPdfPath).size,
								f_collection_id_fk: collection_id,
								f_user_id_fk: req.user.id,
								f_status: "active",
								f_created_by: req.user.id,
								f_updated_by: req.user.id,
							});
							_fileArray.push(_file);
						}
						else {
							console.error("Error in getting file from drive");
							if (res && next) {
								returnError(res, `Error in getting file from ${provider} drive`, 500);
							}
							else {
								return false;
							}
						}

					}
					catch (fileError) {
						console.error("Error processing file:", fileError);
						if (res && next) {
							returnError(res, `Error processing file: ${fileError.toString()}`, 500);
						}
						else {
							return false;
						}
					}
				})
			);
			if (next) {

			   req.files = _fileArray.map(file => {
				const { f_id, f_original_name, f_name, f_path, f_ext, f_size } = file.dataValues;
				return {
					id: f_id,
					originalname: f_original_name,
					mimetype: f_ext,
					filename: f_name,		
					path: f_path,			
					size: f_size
				}
			   });
	
				// req.files = _file.map(file => {
				// 	return {
				// 		id: file.f_id,
				// 		name: file.f_original_name,
				// 		new_name: file.f_name,
				// 		path: file.f_path,
				// 		ext: file.f_ext,
				// 		size: file.f_size
				// 	}
				// });
				next();
			}
			else {
				return _file;
			}
		}
		catch (e) {
			console.error(e);
			if (res && next) {
				returnError(res, `Internal Server Error ${e.message}`, 500);
			}
			else {
				return false;
			}
		}
	}

};


module.exports = {getFileFromDrive}