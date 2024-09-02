const {getFileFromDrive} = require("../middlewares/file_handler");
const db = require("../models");
const {returnSuccess, returnError, toInternalName, createRequiredFolders} = require("../utils");
const {create_vector_in_background,save_excel} = require("../ai_modules_apis");
const {join, resolve} = require("path");
const fs = require("fs");
const Collections = db.collections;
const Files = db.files;
const Orgs = db.orgs;
const CollectionDepartment = db.collections_departments;
const ApiKeysDepartment = db.api_keys_departments;
const ApiKeys = db.api_keys;
const getModelType = (file) => {
	const file_type = file?.split('.')?.pop();
	if(file_type === "xlsx" || file_type === "xls" || file_type === "csv"){
		return "excel";
	}
	else{
		return "default";
	}
};

// Create and Save a new Collection
exports.create = async (req, res) => {
	try {
		const { name, selected_key, file_array, collection_id , response_type, domain_url, whitelist_url } = req.body;
	

		let _col;
		if (!collection_id) {
			if (!name) {
				returnError(res, "Collection name cannot be empty!", 400);
				return;
			}

			const intName = toInternalName(name);

			let existingCollection = await Collections.findOne({ where: { c_name: intName , c_org_id_fk: req.user.org_id} });
			existingCollection = JSON.parse(JSON.stringify(existingCollection));

			if (existingCollection) {
				req?.files && req?.files?.forEach(file => {
					fs.unlinkSync(file.path);
				});
				returnError(res, "Collection already exists with this Name!", 400);
				return;
			}

			const org_name = await Orgs.findOne({
				attributes: ["o_name"],
				 where: { o_id: req.user.org_id } 
				});
			req.user.org_name = org_name.o_name;

			_col = await Collections.create({
				c_name: name,
				c_org_id_fk: req.user.org_id,
				c_owner_users_fk: req.user.id,
				c_internal_name: intName,
				c_selected_key: selected_key || "baali",
				c_response_type: response_type || "short_answer",
				c_domain_url:domain_url || null, 
				c_whitelist_url:whitelist_url || null,
			});
		
			if(_col){
				// req.response_type = _col.c_response_type;

				await CollectionDepartment.create({
					cd_collection_id_fk: _col.c_id,
					cd_department_id_fk: req.user.u_default_department_fk,
				});

			}
	
		} else {
			_col = await Collections.findOne({ where: { c_id: collection_id } });
			if (!_col) {
				returnError(res, "Collection not found!", 404);
				return;
			}

			req.body.vector_store_id = _col.dataValues.c_vector_store_id || null;
			req.body.response_type = _col.dataValues.c_response_type;
		}

		req.user.root_path = join(req.user.org_root_path, _col.c_id);
		req.user.upload_path = createRequiredFolders(req.user.root_path, req.user.sub_folder);

		let _files = [];
		let file_id = null;
		let files_info = [];
		let file_ids = [];
		let file_names = [];
		req.user.collection_id = collection_id || _col.c_id;
		req.user.selected_key = selected_key;

		if (file_array && file_array.length > 0) {
		
			_files = await getFileFromDrive(req,null, null);
			// file_ids = _files.map(file => file.f_id);
			file_id = _files?.dataValues?.f_id;		
			_col.c_model_type = getModelType(_files?.dataValues?.f_original_name);
			_col.save();


			files_info = await Files.findAll({
				attributes: ["f_id", "f_name"],
				where: { f_collection_id_fk: collection_id || _col.c_id },
			});
			files_info = JSON.parse(JSON.stringify(files_info));

			req.files_info = files_info;
		} else {
			req?.files && req?.files?.forEach(file => {
				const _path = join(req.user.upload_path, file.filename);
				fs.renameSync(file.path, _path);
				file.path = _path;
			});
			_files = await Files.add(req, req?.files, collection_id || _col.c_id);
			// file_ids = _files.map(file => file.f_id);
			file_id = _files?.dataValues?.f_id;
			_col.c_model_type = getModelType(_files?.dataValues?.f_original_name);
			_col.save();

			// find all files in the collection

			files_info = await Files.findAll({
				attributes: ["f_id", "f_name"],
				where: { f_collection_id_fk: collection_id || _col.c_id },
			});
			files_info = JSON.parse(JSON.stringify(files_info));

			req.files_info = files_info;

		}
		// console.log("eleData: ", _col.c_model_type);
		if (_col.c_model_type === "excel"){
			save_excel(req, file_id,(message)=>{
				returnSuccess(res, _col, 200, "Collection created successfully!");
			});
		} else {
	      create_vector_in_background(req);
		  returnSuccess(res, _col, 200, "Collection created successfully!");
		}
	} catch (error) {
		console.error("Error in creating collection: ", error);
		returnError(res, "Internal Server Error", 500);
	}
};


// Retrieve all Collections from the database.
exports.get_by_id = async (req, res) => {
	try {
		let colls = await Collections.findOne({where: {c_id: req.params.id}});
		returnSuccess(res, colls, 200, "Collection found successfully!");
	}
	catch (error) {
		console.error("error in getting collection : ", error);
		returnError(res, error, 500);
	}
};

// Find a single Collection with an id
exports.update = async (req, res) => {
	try {
		const {id, name} = req.body;

		let existcol = await Collections.findOne({
			where: {c_name: name, c_org_id_fk: req.user.org_id},
		});
		existcol = await JSON.parse(JSON.stringify(existcol, null, 4));
		if (existcol) {
		}
		else {
			await Collections.update({c_name: name}, {where: {c_id: id}});
		}
		returnSuccess(res, "Collection updated successfully!", 200);
	}
	catch (error) {
		console.error("error in updating collection : ", error);
		returnError(res, error, 500);
	}
};

// Update a Collection by the id in the request
exports.list = async (req, res) => {
	try {
		let {pageNo = 0, size = 5, all} = req.query;
		if (all) {
			let colls = await Collections.findAll({
				where: {c_org_id_fk: req.user.org_id},
				attributes: ["c_id", "c_name", "c_created_at", "c_status", "c_internal_name", "c_selected_key", "c_domain_url"],
				order: [["c_updated_at", "DESC"]],
			});

			returnSuccess(res, colls, 200, "Collections found successfully!");
		}
		else {
			let offset = pageNo * size;

			let colls = await Collections.findAndCountAll({
				where: {c_org_id_fk: req.user.org_id},
				attributes: ["c_id", "c_name", "c_created_at", "c_status","c_internal_name","c_selected_key" , "c_domain_url"],
				order: [["c_updated_at", "DESC"]],
				offset: pageNo && size ? offset : 0,
				limit: size ? size : 5,
			});
			returnSuccess(
				res,
				{count: colls.count, rows: colls.rows},
				200,
				"Collections found successfully!"
			);
		}
	}
	catch (error) {
		console.error("error in getting all collection : ", error);
		returnError(res, error, 500);
	}
};

// Delete a Collection with the specified id in the request
exports.delete = async (req, res) => {
	try {
		await Collections.destroy({where: {c_id: req.params.id}});
		returnSuccess(res, "Collection deleted successfully!", 200);
	}
	catch (error) {
		console.error("error in deleting collection : ", error);
		returnError(res, error, 500);
	}
};


// Find a single Collection with an id
exports.toggleStatus = async (req, res) => {
	try {
		const {id, status} = req.body;


		await Collections.update({c_status: status}, {where: {c_id: id}});

		returnSuccess(res, "Collection updated successfully!", 200);
	}
	catch (error) {
		console.error("error in updating collection : ", error);
		returnError(res, error, 500);
	}
};

// find api key from collection id
exports.get_api_key_from_collection = async (req, res) => {
	try {
		const { id } = req.params;

		// Find the collection by its ID
		const collection = await Collections.findOne({ where: { c_id: id } });
		if (!collection) {
			return returnError(res, 'Collection not found.', 404);
		}

		// Find all department IDs associated with the collection
		const collectionDepartments = await CollectionDepartment.findAll({
			where: { cd_collection_id_fk: id },
			attributes: ['cd_department_id_fk']
		});

		if (collectionDepartments.length === 0) {
			return returnError(res, 'No departments linked to the collection.', 404);
		}

		const departmentIds = collectionDepartments.map(cd => cd.cd_department_id_fk);

		// Find all API keys associated with the departments
		const apiKeysDepartments = await db.api_keys_departments.findAll({
			where: { akd_departments_id_fk: departmentIds },
			attributes: ['akd_api_keys_id_fk']
		});

		if (apiKeysDepartments.length === 0) {
			return returnError(res, 'No API keys found for the linked departments.', 404);
		}

		const apiKeyIds = apiKeysDepartments.map(akd => akd.akd_api_keys_id_fk);

		// Find all API keys using the IDs
		const apiKeys = await db.api_keys.findAll({
			where: { ak_id: apiKeyIds }
		});

		if (apiKeys.length === 0) {
			return returnError(res, 'No API keys found.', 404);
		}

		// Return all found API keys
		return returnSuccess(res, apiKeys, 200, "API keys found successfully!");

	} catch (error) {
		console.error("Error in getting collection: ", error);
		return returnError(res, 'An error occurred while retrieving API keys.', 500);
	}
};

exports.get_selected_key_from_collection = async (req, res) => {
	try {
		const { id } = req.params;
		// Find the collection by its ID
		const collection = await Collections.findOne(
			{
				attributes: ['c_selected_key'],
				 where: { c_id: id } 
				});
		if (!collection) {
			return returnError(res, 'Collection not found.', 404);
		}

		// Return the selected key
		return returnSuccess(res, collection, 200, "Selected key found successfully!");

	} catch (error) {
		console.error("Error in getting collection: ", error);
		return returnError(res, 'An error occurred while retrieving the selected key.', 500);
	}
};

// select c.c_id, c.c_name from collections as c
// left join api_keys as ak
// left join api_keys_departments as akd on akd.akd_api_keys_id_fk = ak.ak_id
// left join collections_departments as cd on cd.cd_department_id_fk = akd.akd_departments_id_fk
// on c.c_id = cd.cd_collection_id_fk
// where ak.ak_id =
// '136e36af-2016-4c43-b4e1-073711fecc2c'
// and c.c_status =
// 'active'
// ;

exports.getCollection_by_api_key = async (req, res) => {
	try {
		const { id } = req.params;
		// Find the collection by its ID
		const collections_list = await db.sequelize.query(`select c.c_id, c.c_name from collections as c left join api_keys as ak left join api_keys_departments as akd on akd.akd_api_keys_id_fk = ak.ak_id left join collections_departments as cd on cd.cd_department_id_fk = akd.akd_departments_id_fk on c.c_id = cd.cd_collection_id_fk where ak.ak_id = '${id}' and c.c_status = 'active'`, {type: db.Sequelize.QueryTypes.SELECT});
		if (!collections_list) {
			return returnError(res, 'Collections not found.', 404);
		}

		// Return the selected key
		return returnSuccess(res, collections_list, 200, "Collections found successfully!");

	} catch (error) {
		console.error("Error in getting collection: ", error);
		return returnError(res, 'An error occurred while retrieving the collections.', 500);
	}
};


exports.get_domain_urls = async (req, res) => {
	try {
		const { id } = req.params;

		// Find the collection by its ID
		const domain_urls = await Collections.findOne(
			{
				attributes: ['c_domain_url'],
				 where: { c_id: id } 
				});
		if (!domain_urls) {
			return returnError(res, 'Collection not found.', 404);
		}

		// Return the domain urls
		return returnSuccess(res, domain_urls, 200, "Domain urls found successfully!");


	} catch (error) {
		console.error("Error in getting collection: ", error);
		return returnError(res, 'An error occurred while retrieving the domain urls.', 500);
	}
};

exports.getCollection_by_widget_id = async (req, res) => {
	try {

		const {id} = req.params;
		const w = await db.widgets.getOne(id);

		const w_api_key = w?.wg_api_key_id_fk;

		const collections_list = await db.sequelize.query(`select c.c_id, c.c_name from collections as c left join api_keys as ak left join api_keys_departments as akd on akd.akd_api_keys_id_fk = ak.ak_id left join collections_departments as cd on cd.cd_department_id_fk = akd.akd_departments_id_fk on c.c_id = cd.cd_collection_id_fk where ak.ak_id = '${w_api_key}' and c.c_status = 'active'`, {type: db.Sequelize.QueryTypes.SELECT});
		if (!collections_list) {
			return returnError(res, 'Collections not found.', 404);
		}

		return returnSuccess(res, collections_list, 200, "Collections found successfully!");

		
	} catch (error) {
		console.error("Error in getting collection: ", error);
		return returnError(res, 'An error occurred while retrieving the collections.', 500);
	}
};

