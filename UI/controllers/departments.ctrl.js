const db = require("../models");
const {returnSuccess, returnError} = require("../utils");
const {Op} = require("sequelize");
const Departments = db.departments;
const UserDepartment = db.users_departments;
const CollectionDepartment = db.collections_departments;
const Collections = db.collections;
const ApiKeyDepartment = db.api_keys_departments;
const Apikeys = db.api_keys;

// Create and Save a new Department
exports.create = async (req, res) => {
    try {
        const {name, collections} = req.body;

        if (!collections) {
            returnError(res, "Please select collections!", 400);
            return;
        }

        let dept = {
            dept_name: name,
            org_id: req.user.org_id,
            dept_created_by: req.user.id,
        };

        let existDept = await Departments.findOne({
            where: {dept_name: name, org_id: req.user.org_id},
        });
        existDept = await JSON.parse(JSON.stringify(existDept, null, 4));


        if (existDept) {
            returnError(res, "Department already exist with this name!", 400);
            return;
        }

        let deptResult = await Departments.create(dept);
        deptResult = await JSON.parse(JSON.stringify(deptResult, null, 4));
        await UserDepartment.create({
            ud_user_id_fk: req.user.id,
            ud_department_id_fk: deptResult.dept_id,
        });
        if (collections && collections.length > 0) {
            for (const col of collections) {
                await CollectionDepartment.create({
                    cd_collection_id_fk: col,
                    cd_department_id_fk: deptResult.dept_id,
                });
            }
        }
        returnSuccess(res, "Department created successfully!", 200);

    } catch (error) {
        console.error("error in creating department : ", error);
        returnError(res, error, 500);
    }
};

// Retrieve all Departments from the database.
exports.get_by_id = async (req, res) => {
    try {
        let deps = await Departments.findOne({where: {dept_id: req.params.id}});

        returnSuccess(res, deps, 200, "Department found successfully!");
    } catch (error) {
        console.error("error in getting department : ", error);
        returnError(res, error, 500);
    }
};

// Find a single Department with an id
// exports.update = async (req, res) => {
//   try {
//     const { id, name, collections } = req.body;

//     let existDept = await Departments.findOne({
//       where: { dept_name: name, org_id: req.user.org_id },
//     });
//     existDept = await JSON.parse(JSON.stringify(existDept, null, 4));
//     if (existDept) {
//       returnError(res, "Department already exist with this name!", 400);
//       return;
//     } else {
//       await Departments.update({ dept_name: name }, { where: { dept_id: id } });
//     }
//     await CollectionDepartment.destroy({
//       where: { cd_department_id_fk: id },
//     });
//     if (collections && collections.length > 0) {
//       for (const col of collections) {
//         await CollectionDepartment.create({
//           cd_collection_id_fk: col,
//           cd_department_id_fk: id,
//         });
//       }
//     }
//     returnSuccess(res, "Department updated successfully!", 200);
//   } catch (error) {
//     console.log("error in updating department : ", error);
//     returnError(res, error, 500);
//   }
// };
exports.update = async (req, res) => {
    try {
        const {id, name, collections} = req.body;

        if(collections && collections.length === 0) {
            returnError(res, "Please select collections!", 400);
            return;
        }

        // Check if the name is being changed
        if (name) {
            // If the name is being changed, check if the new name already exists
            let existDept = await Departments.findOne({
                where: {dept_name: name, org_id: req.user.org_id},
            });
            existDept = await JSON.parse(JSON.stringify(existDept, null, 4));
            if (existDept) {
                returnError(res, "Department already exists with this name!", 400);
                return;
            } else {
                await Departments.update({dept_name: name}, {where: {dept_id: id}});
            }
        }

        // Delete existing collection-department associations
        await CollectionDepartment.destroy({
            where: {cd_department_id_fk: id},
        });

        // Create new collection-department associations if collections are provided
        if (collections && collections.length > 0) {
            for (const col of collections) {
                await CollectionDepartment.create({
                    cd_collection_id_fk: col,
                    cd_department_id_fk: id,
                });
            }
        }

        returnSuccess(res, "Department updated successfully!", 200);
    } catch (error) {
        console.error("Error in updating department:", error);
        returnError(res, error, 500);
    }
};


// Update a Department by the id in the request
exports.list = async (req, res) => {
    try {
        let {pageNo = 0, size = 5, all} = req.query;
        if (all) {
            let deps = await Departments.findAll({
                where: {org_id: req.user.org_id},
                attributes: ["dept_id", "dept_name","dept_created_at","dept_updated_at"],
                order: [["dept_updated_at", "DESC"]],
            });
            returnSuccess(res, deps, 200, "Department found successfully!");
        } else {
            let offset = pageNo * size;

            let data = [];
            let deps = await Departments.findAndCountAll({
                where: {org_id: req.user.org_id},
                attributes: ["dept_id", "dept_name","dept_created_at","dept_updated_at"],
                order: [["dept_updated_at", "DESC"]],
                offset: offset,
                limit: size,
            });
            deps = await JSON.parse(JSON.stringify(deps, null, 4));
            if (deps && deps.rows && deps.rows.length > 0) {
                for (const d of deps.rows) {
                    let cd = await CollectionDepartment.findAll({
                        where: {cd_department_id_fk: d.dept_id},
                        attributes: ["cd_collection_id_fk"],
                    });
                    cd = await JSON.parse(JSON.stringify(cd, null, 4));
                    let obj;
                    let colName = [];


                    if (cd && cd.length > 0) {
                        for (const cld of cd) {
                            let col = await Collections.findOne({
                                where: {c_id: cld.cd_collection_id_fk},
                                attributes: ["c_name"],
                            });
                            col = await JSON.parse(JSON.stringify(col, null, 4));
                            if (col) {
                                colName.push({
                                    id: cld.cd_collection_id_fk,
                                    label: col.c_name,
                                    value: col.c_name,
                                });
                            }

                        }
                    }
                    obj = {
                        dept_id: d.dept_id,
                        dept_name: d.dept_name,
                        dept_created_at: d.dept_created_at,
                        dept_updated_at: d.dept_updated_at,
                        coll: colName,
                    };
                    data.push(obj);
                }
            }

            returnSuccess(
                res,
                {count: deps.count, rows: data},
                200,
                "Department found successfully!"
            );
        }
    } catch (error) {
        console.error("error in getting all department : ", error);
        returnError(res, error, 500);
    }
};

// Delete a Department with the specified id in the request
exports.delete = async (req, res) => {
    try {
        await Departments.destroy({where: {dept_id: req.params.id}});
        await UserDepartment.destroy({
            where: {ud_department_id_fk: req.params.id},
        });
        await CollectionDepartment.destroy({
            where: {cd_department_id_fk: req.params.id},
        });

        returnSuccess(res, "Department deleted successfully!", 200);
    } catch (error) {
        console.error("error in deleting department : ", error);
        returnError(res, error, 500);
    }
};


// exports.get_departments_with_collections = async (req, res) => {
//     try {
//       const {key} = req.params;
//       const key_id = await Apikeys.findOne({
//         attributes: ["ak_id"],
//         where: {ak_key: key},
//       });
//       if (!key_id) {
//         returnError(res, "Invalid API key!", 400);
//         return;
//       }

//       const dept_ids = await ApiKeyDepartment.findAll({
//         attributes: ["akd_departments_id_fk"],
//         where: { akd_api_keys_id_fk: key_id.ak_id},
//       });

//       if (!dept_ids || dept_ids.length === 0) {
//         returnError(res, "No departments found for this API key!", 400);
//         return;
//       }

//       let data = [];
//      let department = await Departments.findOne({
//         where: {dept_id: dept_ids[0].akd_departments_id_fk},
//        attributes: ["dept_id", "dept_name", "dept_status", "dept_created_at"],
//       });
//       department = await JSON.parse(JSON.stringify(department, null, 4));
//       if (department) {
//         let cd = await CollectionDepartment.findAll({
//           where: {cd_department_id_fk: department.dept_id},
//           attributes: ["cd_collection_id_fk"],
//         });
//         cd = await JSON.parse(JSON.stringify(cd, null, 4));
//         let obj;
//         let colName = [];
//         if (cd && cd.length > 0) {
//           for (const cld of cd) {
//             let col = await Collections.findOne({
//               where: {c_id: cld.cd_collection_id_fk},
//               attributes: ["c_name", "c_created_at", "c_status"],
//             });
//             col = await JSON.parse(JSON.stringify(col, null, 4));
//             if (col) {
//               colName.push({
//                 col_id: cld.cd_collection_id_fk,
//                 col_name: col.c_name,
//                 col_created_at: col.c_created_at,
//                 col_status: col.c_status,
//               });
//             }
//           }
//         }
//         if (colName.length > 0) {
//           // Only add departments with non-empty collection array
//           obj = {
//             dept_id: department.dept_id,
//             dept_name: department.dept_name,
//             dept_status: department.dept_status,
//             coll: colName,
//           };
//           data.push(obj);
//         }
//       }
//       returnSuccess(res, data, 200, "Departments with collections found successfully!");
//     } catch (error) {
//       console.error("Error in getting departments with collections: ", error);
//       returnError(res, error, 500);
//     }
//   };


// get departments with collections
exports.get_departments_with_collections = async (req, res) => {
    try {
        let _where = {
            org_id: req.user.org_id
        };
        if(req.user.u_is_super_admin === true) {
            _where.dept_created_by= {[Op.in]: [req.user.id, req.user.u_parent_id]};
        }else{
            _where.dept_created_by= {[Op.in]: [req.user.u_parent_id]};
            _where.dept_id= req.user.u_default_department_fk;
        }

        let deps = await Departments.findAll({
            where: _where,
            attributes: ["dept_id", "dept_name", "dept_status", "dept_created_at"],
            logging:console.log
        });
        deps = await JSON.parse(JSON.stringify(deps, null, 4));
        let data = [];
        if (deps && deps.length > 0) {
            for (const d of deps) {
                let cd = await CollectionDepartment.findAll({
                    where: { cd_department_id_fk: d.dept_id },
                    attributes: ["cd_collection_id_fk"],
                });
                cd = await JSON.parse(JSON.stringify(cd, null, 4));
                let obj;
                let colName = [];
                if (cd && cd.length > 0) {
                    for (const cld of cd) {
                        let col = await Collections.findOne({
                            where: { c_id: cld.cd_collection_id_fk },
                            attributes: ["c_name", "c_created_at", "c_status" , "c_internal_name" , "c_selected_key" , "c_model_type"],
                        });
                        col = await JSON.parse(JSON.stringify(col, null, 4));
                        if (col) {
                            colName.push({
                                col_id: cld.cd_collection_id_fk,
                                col_name: col.c_name,
                                col_created_at: col.c_created_at,
                                col_status: col.c_status,
                                col_internal_name: col.c_internal_name,
                                col_selected_key: col.c_selected_key,
                                col_model_type: col.c_model_type
                            });
                        }
                    }
                }
                if (colName.length > 0) {
                    // Only add departments with non-empty collection array
                    obj = {
                        dept_id: d.dept_id,
                        dept_name: d.dept_name,
                        dept_status: d.dept_status,
                        dept_created_at: d.dept_created_at,
                        coll: colName,
                    };
                    data.push(obj);
                }
            }
        }
        returnSuccess(res, data, 200, "Departments with collections found successfully!");
    } catch (error) {
        console.error("Error in getting departments with collections: ", error);
        returnError(res, error, 500);
    }
};



