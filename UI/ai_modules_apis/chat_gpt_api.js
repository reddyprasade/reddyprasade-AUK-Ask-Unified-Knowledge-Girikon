const db = require("../models");
const axios = require("axios");
const {AI_MODELS} = require("../utils/constant");
const FormData = require('form-data');
const {readFileSync, unlinkSync, createReadStream, rename, unlink,} = require("fs");
const files = db.files;
const Sessions = db.sessions;
const Histories = db.histories;
const { Op,Sequelize, where } = require("sequelize");
const {preprocessString} = require("../utils");

const create_vector_in_background = (req, resolve) => {
    try {
        if (process.env.IS_AI_LOCAL === "true") {

            if (resolve) {
                resolve({
                    "question": "What are the rules of Attendance regularization in girikon?",
                    "answer": "Employee needs to regularize his/her attendance on the very next day after he/she joins back to office. Employee needs to mention the reason in the comment box. Employee needs to mention time when he/she reach to/leave from office in case of forget to sign in/sign out.",
                    "metadata": "[{\"score\":87.97,\"filename\":\"files-1709307346142-553625211.pdf\",\"page_number\":12,\"collection_id\":\"2ed9bd13-617a-437a-afb7-470446c8b7ae\",\"original_name\":\"Girikon HrManual2023V2.3.pdf\"},{\"score\":87.49,\"filename\":\"files-1709307346142-553625211.pdf\",\"page_number\":3,\"collection_id\":\"2ed9bd13-617a-437a-afb7-470446c8b7ae\",\"original_name\":\"Girikon HrManual2023V2.3.pdf\"},{\"score\":83.17,\"filename\":\"files-1709307346142-553625211.pdf\",\"page_number\":23,\"collection_id\":\"2ed9bd13-617a-437a-afb7-470446c8b7ae\",\"original_name\":\"Girikon HrManual2023V2.3.pdf\"}]",
                    "session_id": "f43c5ef2-37f5-45f3-ac99-c648efac00b0",
                    "id": "2f90c558-fe2c-42bb-93bb-8227427a92cb"
                });
            }

        } else {

            let data = {
                "task_name": req.params.type,
                "internal_key": process.env.INTERNAL_KEY,
                "collection_path": req?.user?.root_path.replace(/\\/g, "/"),
                // "collection_path": "C:/Users/AbhishekKumar/Desktop/ckb/uploads",
                "chat_gpt_api_key": req?.chat_gpt || process.env.OPENAI_API_KEY,
                "collection_id": req?.body?.collection_id || req?.user?.collection_id,
                "selected_key": req?.user?.selected_key,
                "info": {
                    "email": req?.user?.u_email,
                    "org_name": req?.user?.org_name,
                    "web_url": req?.user?.web_url,
                    "user_name": req?.user?.u_name
                } , 
                "files_info" : req?.files_info,
                "response_type" : req?.body?.response_type,
                "collection_name" : req?.body?.name,
                "vector_store_id" : req?.body?.vector_store_id,
                "callback_url": process.env.API_URL,
                "domain_url":req?.body?.domain_url || null, 
				"whitelist_url":req?.body?.whitelist_url || null
            };

            console.log('data in create vector',data);

            let config = {
                method: 'post',
                timeout: 1800000,
                timeoutErrorMessage: "Time out!",
                maxBodyLength: Infinity,
                url: process.env.AI_MODEL_CHAT_GPT_CREATE_VECTOR,
                headers: {'Content-Type': 'application/json'},
                data: JSON.stringify(data)
            };

            axios.request(config).then((response) => {
                // console.log('create_vector_in_background', response.status);
                // console.log('create_vector_in_background', response.data);
                if (resolve) {
                    resolve(res.data);
                }
            }).catch((error) => {
                // console.error('create_vector_in_background',error);
                if (resolve) {
                    resolve(error.toString());
                }
            });
        }
    } catch (e) {
        console.error(e);
        resolve(e.toString());
    }
};

const delete_vector_in_background = (req, resolve) => {
    try {
        if (process.env.IS_AI_LOCAL === "true") {
            if (resolve) {
                resolve("Deleted");
            }
        } else {
            let data = {
                "task_name": req.params.type,
                "internal_key": process.env.INTERNAL_KEY,
                "collection_path": req?.user?.root_path.replace(/\\/g, "/"),
                "chat_gpt_api_key": req?.chat_gpt || process.env.OPENAI_API_KEY,
                "collection_id": req?.body?.collection_id || req?.user?.collection_id,
                "selected_key": req?.body?.selected_key,
                "info": {
                    "email": req?.user?.u_email,
                    "org_name": req?.user?.org_name,
                    "web_url": req?.user?.web_url,
                    "user_name": req?.user?.u_name
                },
                "vector_store_id": req?.body?.vector_store_id,
                "response_type": req?.body?.response_type,
                "file_id": req?.body?.assistant_file_id,
                "fileName": req?.body?.file_name,
                "domain_url": domain_url || null, 
				"whitelist_url": whitelist_url || null,
            };

            console.log('data in delete vector', data);

            let config = {
                method: 'post',
                timeout: 1800000,
                timeoutErrorMessage: "Time out!",
                maxBodyLength: Infinity,
                url: process.env.AI_MODEL_CHAT_GPT_DELETE_VECTOR,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(data)
            };

            axios.request(config).then((res) => {
            
                if (resolve) {
                    resolve(res.data);
                }
            }).catch((error) => {
             
                if (resolve) {
                    resolve(error.toString());
                }
            });
        }
    }
    catch (e) {
        console.error(e);
        resolve(e.toString());
    }
};




const create_vector = async (collection_path) => {
    return new Promise((resolve) => {
        create_vector_in_background(collection_path, resolve);
    });
};

const updateFileInfo = async (vector_store_id) => {
    const vectorStoreFiles = await openai.beta.vectorStores.files.list(
        vector_store_id
    );
    console.log(vectorStoreFiles);
    vectorStoreFiles.data.forEach(async (file) => {
        const fileData = await openai.beta.files.retrieve(file.id);
        console.log(fileData);
    });
}


/**
 * *
 * @return {Promise<unknown>}
 * @param req
 * @param collection_path - collection path
 * @returns {Promise<unknown>} - response
 * [{
 *  question: "question",
 *  "answer": "answer",
 * }]
 *
 */
const chat_gpt = async (req, collection_path = null) => {
    const q = req?.body?.q;
    let threadId = await Sessions.getThreadIdBySessionId(req?.body?.session_id);

    if (threadId === null) {
        threadId = "";
    } else {
        threadId = threadId.s_thread_id;
    }

    return new Promise(async (resolve) => {
        if (process.env.IS_AI_LOCAL === "true") {
            resolve(
                [
                    {
                        "question": "who is the Product Manager of india?",
                        "answer": " The text does not describe the Product Manager of India",
                        "metadata": "[{\"score\":58.4,\"filename\":\"files-1718180325261-318435171.pdf\",\"page_number\":2,\"collection_id\":\"cde6929e-8a80-4ae0-9cf0-4e7056bfc549\",\"original_name\":\"DataClassificationPolicy.pdf\"},{\"score\":56.25,\"filename\":\"files-1712646484708-876165901.pdf\",\"page_number\":2,\"collection_id\":\"abcc5053-9094-4c2c-8afe-d9993ebf1a6c\",\"original_name\":\"PasswordPolicy.pdf\"},{\"score\":51.98,\"filename\":\"files-1712646789673-72569467.pdf\",\"page_number\":3,\"collection_id\":\"abcc5053-9094-4c2c-8afe-d9993ebf1a6c\",\"original_name\":\"DataClassificationPolicy.pdf\"},{\"score\":50.53,\"filename\":\"files-1712646789673-72569467.pdf\",\"page_number\":6,\"collection_id\":\"abcc5053-9094-4c2c-8afe-d9993ebf1a6c\",\"original_name\":\"DataClassificationPolicy.pdf\"}]",
                        "session_id": "f98a50a9-0f42-4ed1-a5f2-3bf0e9a83d9e",
                        "id": "94e8ef39-1ebc-4b0d-9439-091c84e2c0cc"
                    }
                ]
            );
        } else {
            try {
                if (!collection_path) {
                    return resolve("Collection path is required");
                } else if (!req.chat_gpt && req.body.selected_key !== "baali") {
                    return resolve("Chat GPT API key is required or ask admin to update the key.");
                } else {
                    let data = {
                        "task_name": req.params.type,
                        "internal_key": process.env.INTERNAL_KEY,
                        "q": q,
                        "collection_path": collection_path,
                        "chat_gpt_api_key": req.chat_gpt,
                        "collection_id": req?.body?.collection_id || req?.user?.collection_id,
                        "selected_key": req?.body?.selected_key,
                        "response_type": req?.body?.response_type,
                        "assistant_id": req?.body?.assistant_id,
                        "vector_store_id": req?.body?.vector_store_id,
                        "thread_id": threadId,

                    };
                    if (req?.body?.selected_key === 'geminiConversational') {
                        data.domain_url = req?.body?.domain_url || null;
                        data.whitelist_url = req?.body?.whitelist_url || null;
                        let whereClause = {
                            h_collection_id: req?.body?.collection_id || req?.user?.collection_id,
                        };

                        if (req?.body?.session_id) {
                            whereClause.h_session_id_fk = req.body.session_id;
                        }

                        let historyData = await Histories.findAll({
                            attributes: ['h_id', 'h_res'],
                            where: whereClause,
                            order: [['h_created_at', 'ASC']],
                            limit: 2
                        });

                        historyData = JSON.parse(JSON.stringify(historyData));

                        // Filter out entries where h_res is empty or null
                        const filteredHistoryData = historyData.filter(record => record.h_res && record.h_res.trim() !== '');

                        // Get the last two valid history data entries
                        const lastTwoHistoryData = filteredHistoryData.slice(-2);
                        console.log('Last Two Valid History Data:', lastTwoHistoryData); 

                        if (lastTwoHistoryData.length > 0) {
                            const chainConversation = lastTwoHistoryData.flatMap(record => {
                                try {
                                    const parsedRes = JSON.parse(record.h_res);
                                    return parsedRes.map(entry => ({
                                        question: entry.question,
                                        answer: entry.answer
                                    }));
                                } catch (e) {
                                    console.error("Error parsing h_res:", e);
                                    return [];
                                }
                            });

                            data.chain_conversation = chainConversation;
                        } else {
                            data.chain_conversation = "";
                        }
                    }

                    console.log("data in ask", data);

                    // let historyData = await Histories.findAll({
                    //     attributes: ['h_id', 'h_res', 'h_req', 'h_answer', 'h_filter_question', "h_metadata", "h_answer_tokens","h_question_tokens"],
                    //      where: {
                    //        h_collection_id: req?.body?.collection_id || req?.user?.collection_id,
                    //        h_filter_question: preprocessString(q),

                    //    }
                    // });

                    // historyData = JSON.parse(JSON.stringify(historyData));

                    // console.log('history data', historyData);

                    // if (historyData.length > 0) {
                    //     const filteredData = historyData.filter(record => record.h_answer !== "");
                    //     console.log('filtered data', filteredData);
                    

                    //     if (filteredData.length > 0) {
                    //         const hResArray = filteredData.map(record => record.h_answer);
                    //         console.log('h_res data', hResArray);
                    //         const dataToSend = [
                    //             {
                    //                 "question": q,
                    //                 "answer": hResArray[0],
                    //                 "inputTokens": historyData[0].h_question_tokens,
                    //                 "outputTokens": historyData[0].h_answer_tokens,
                    //                 "metadata": historyData[0].h_metadata

                    //             }
                    //         ]
                    //         console.log('data to send', dataToSend);
                    //         resolve(dataToSend);
                    //     }
                    // }


                    let config = {
                        method: 'post',
                        timeout: 1800000,
                        timeoutErrorMessage: "Time out!",
                        maxBodyLength: Infinity,
                        url: process.env.AI_MODEL_CHAT_GPT,
                        headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify(data)
                    };

                    axios.request(config).then((response) => {
                        console.log(JSON.stringify(response.data));
                        resolve(response.data);
                    }).catch((error) => {
                        console.error('in chat gpt response', error);
                        resolve(error.toString());
                    });
                }
            } catch (e) {
                console.error(e);
                resolve(e.toString());
            }
        }
    });
};



const save_excel = (req, file_id, resolve) => {
    try {

        const url = 'https://apps.girikon.ai/ckb/createCollection';
        const formData = new FormData();
        for (const file of req.files) {
            formData.append("binaryFile", createReadStream(file.path), {filename: file.filename});
        }
        // formData.append("fileID", file_id);
        formData.append("collectionID", req?.body?.collection_id || req?.user?.collection_id);
        formData.append("userMail", req?.user?.u_email);
        formData.append("info", JSON.stringify({
            "email": req?.user?.u_email,
            "org_name": req?.user?.org_name,
            "web_url": req?.user?.web_url,
            "user_name": req?.user?.u_name
        }));

        // // To log the contents of the formData
        // for (let [key, value] of formData.entries()) {
        //     console.log(`${key}: ${value}`);
        // }
       
        let config = {
            method: 'post',
            timeout: 100000,
            timeoutErrorMessage: "Time out!",
            maxBodyLength: Infinity,
            url: url,
            headers: {
                "Content-Type": `multipart/form-data`,
                ...formData.getHeaders()
            },
            data: formData
        };
        axios.request(config).then((res) => {
            console.log(JSON.stringify(res.data));
            resolve(res.data);
        }).catch((error) => {
            console.error('in excel response 196', error.message);
            resolve(error.message);
        });

    } catch (e) {
        console.error('201', e);
        resolve(e.toString());
    }
};

const ask_from_excel = async (req, collection_path = null,collection_id, conflict_type, listFiles, listColumns) => {
    const q = req?.body?.q;
    let _file;
    if (listFiles !== 'null'){
        _file = await db.files.findOne({
            attributes: ['f_name'],
            where: {
                f_original_name: listFiles,
                f_collection_id_fk: req?.body?.collection_id || req?.user?.collection_id
            }
        });
      if(!_file){
        listFiles = "null";
      }
      else{
        listFiles = _file.f_name;
      }

    }
    return new Promise((resolve) => {
        try {
            if (!collection_path) {
                return resolve("Collection path is required");
            } else {

                let data = new FormData();
                data.append('question', q);
                // data.append('fileID', file_ids);
                data.append('collectionID', req?.body?.collection_id || req?.user?.collection_id);
                if(conflict_type === null && listFiles === null && listColumns === null){
                    data.append('conflictTypes' , 'null');
                    data.append('listFiles', 'null');
                    data.append('listColumns', 'null');
                }
            
                else{
               
                    data.append('conflictTypes', conflict_type);
                    data.append('listFiles', listFiles);
                    data.append('listColumns', listColumns);
                }

                let config = {
                    method: 'post',
                    timeout: 1800000,
                    timeoutErrorMessage: "Time out!",
                    maxBodyLength: Infinity,
                    url: "https://apps.girikon.ai/ckb/generateAnswerExcel",
                    headers: {'Content-Type': 'application/json', ...data.getHeaders()},
                    data: data
                };

                axios.request(config).then((response) => {
                    console.log('ans', JSON.stringify(response.data.message));
                    resolve(response.data.message);
                }).catch((error) => {
                    console.error('L203::in excel response', error);
                    resolve(error.toString());
                });
            }
        } catch (e) {
            console.error("L208::", e);
            resolve(e.toString());
        }

    });
};

const delete_file_from_excel = async (req, collection_path = null) => {
    try {
  console.log('in delete file from excel' , req.body);
        const url = 'https://apps.girikon.ai/ckb/deleteFiles';
        const formData = new FormData();
        formData.append("fileName", req?.body?.file_name);
        formData.append("collectionID", req?.body?.collection_id || req?.user?.collection_id,);
        let config = {
            method: 'post',
            timeout: 100000,
            timeoutErrorMessage: "Time out!",
            maxBodyLength: Infinity,
            url: url,
            headers: {
                "Content-Type": `multipart/form-data`,
                ...formData.getHeaders()
            },
            data: formData
        };
        axios.request(config).then((res) => {
            console.log(JSON.stringify(res.data));
            resolve(res.data);
        }).catch((error) => {
            console.error('in excel response 198', error.message);
            resolve(error.message);
        });

    } catch (e) {
        console.error('202', e);
        resolve(e.toString());
    }
}


const chainResponseForFileFromAI = async (req , collection_path = null) =>{

    const q = req?.body?.q;
    return new Promise((resolve) => {
        try {
            if (!collection_path) {
                return resolve("Collection path is required");
            } else {

                let data = new FormData();
                data.append('question', q);
                data.append('collectionID', req?.body?.collection_id || req?.user?.collection_id);
                data.append('listFiles', req?.body?.listFiles);
                data.append('listColumns', req?.body?.listColumns);


                // for (var pair of data.entries()) {
                //     console.log(pair[0] + ', ' + pair[1]);
                // }

                let config = {
                    method: 'post',
                    timeout: 1800000,
                    timeoutErrorMessage: "Time out!",
                    maxBodyLength: Infinity,
                    url: "https://apps.girikon.ai/ckb/chainResponse",
                    headers: { 'Content-Type': 'application/json', ...data.getHeaders() },
                    data: data
                };

                axios.request(config).then((response) => {
                    console.log('ans', JSON.stringify(response.data.message.ANS));
                    resolve(response.data.message);
                }).catch((error) => {
                    console.error('L203::in excel response', error);
                    resolve(error.toString());
                });
            }
        } catch (e) {
            console.error("L2089::", e);
            resolve(e.toString());
        }

    });
} 


const analyze_girik_sms = async (req) => {
    try {
        if (process.env.IS_AI_LOCAL === "true") {
            return { message: "I am not satisfied with the property valuation." };
        } else {
            let data = {
                feedBackURL: req?.body?.feedBackURL,
                supportEmail: req?.body?.supportEmail,
                agentName: req?.body?.agentName,
                supportNo: req?.body?.supportNo,
                customerName: req?.body?.customerName,
                userText: req?.body?.userText,
                modelName: "gemini",
                internal_key: process.env.INTERNAL_KEY
            };

            console.log('data in girik sms', data);

            let config = {
                method: 'post',
                timeout: 1800000,
                timeoutErrorMessage: "Time out!",
                maxBodyLength: Infinity,
                url: process.env.AI_SENTIMENT_ANALYSIS_API,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(data)
            };

            const response = await axios.request(config);
            console.log('analyze_girik_sms in line 495', response.data);
            return response.data.result;
        }
    } catch (error) {
        console.error('analyze_girik_sms error', error);
        throw new Error(error.toString());
    }
};


module.exports = {
    chat_gpt,
    create_vector_in_background,
    create_vector,
    save_excel,
    ask_from_excel,
    chainResponseForFileFromAI,
    updateFileInfo,
    delete_vector_in_background,
    delete_file_from_excel,
    analyze_girik_sms
};


