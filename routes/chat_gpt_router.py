import json
import os
import sys
import fnmatch
from io import BytesIO
from typing import Annotated, Optional
from uuid import uuid4
from databases.DBManager import DBManager
from PyPDF2 import PdfReader
from docx import Document
from fastapi import APIRouter, status, Request, Body, File, UploadFile, Form
from fastapi.responses import JSONResponse, HTMLResponse
from girikSMS.serverSentiment import getResponse
from AI_API import OpenAIAssistant
from databases.DBManagerNode import DBManagerNode
from libs.GirikonSendMail import send_mail
from logger import CustomLogger
#import socketio
sys.path.append(os.path.join(os.getcwd(), '..'))
from libs.GirikonVectorManager import GirikonVectorManager

router = APIRouter(prefix="/chat_gpt", tags=["General"], responses={404: {"description": "Not found"}})

ChatGPTRouterLog = CustomLogger.get_logger("ChatGPTRouter")


@router.get("/healthcheck")
async def health_check(request: Request):
    ChatGPTRouterLog.info("routes/chat_gpt_router.py health_check")
    ip = request.client.host
    return {
        "message": "Status: OK",
        "ip": ip,
        "base_url": request.base_url,
        "url": request.url,
        "method": request.method,
        "client.host": request.client.host,
        "client.port": request.client.port,
        "platform": request.headers.get("sec-ch-ua-platform"),
        "referer": request.headers.get("referer"),
        "user_agent": request.headers.get("user-agent")
    }


@router.get("/ip")
def ip(request: Request):
    ChatGPTRouterLog.info("routes/chat_gpt_router.py ip")
    client_host = request.client.host
    return client_host


@router.post("/create_vector")
async def create_vector(request: Annotated[dict, Body()] = None):
    ChatGPTRouterLog.info("create_vector routes/chat_gpt_router.py create_vector")
    try:
        # generate uuid
        _collection_name = request.get("collection_name", str(uuid4()))
        _collection_id = request.get("collection_id", None)
        collection_path = request.get("collection_path", None)
        print(collection_path)
        OPENAI_API_KEY = request.get("chat_gpt_api_key", None)
        # cmetadata = request.get("metadata", dict())
        internal_key = request.get("internal_key", None)
        selected_key = request.get("selected_key", None)
        X_API_KEY_UUID = os.getenv("X_API_KEY_UUID", None)
        info = request.get("info", None)
        files_info = request.get("files_info", None)  # list of files {f_id, f_name}
        response_type = request.get("response_type", 'short_answer')  # short_answer or detailed_answer
        assistant_id = request.get("assistant_id", None)  # short_answer or detailed_answer
        project_id = request.get("project_id", "proj_6z63OdRWAuDUzR3ixvSYLJ0g")
        vector_store_id = request.get("vector_store_id", None)
        callback_url = request.get("callback_url", None)
        domain_url = request.get("domain_url",None)
        whiteList_url = request.get("whitelist_url",None)
        print("vectoreID",vector_store_id)
        print(domain_url,"Domain URL value")
        ChatGPTRouterLog.info("create_vector > " + "_collection_name==" + str(_collection_name))
        ChatGPTRouterLog.info("create_vector > " + "_collection_id==" + str(_collection_id))
        ChatGPTRouterLog.info("create_vector > " + "collection_path==" + str(collection_path))
        ChatGPTRouterLog.info("create_vector > " + "OPENAI_API_KEY==" + str(OPENAI_API_KEY))
        ChatGPTRouterLog.info("create_vector > " + "internal_key==" + str(internal_key))
        ChatGPTRouterLog.info("create_vector > " + "X_API_KEY_UUID==" + str(X_API_KEY_UUID))
        ChatGPTRouterLog.info("create_vector > " + "info==" + str(info))
        ChatGPTRouterLog.info("create_vector > " + "response_type==" + str(response_type))
        ChatGPTRouterLog.info("create_vector > " + "project_id==" + str(project_id))
        ChatGPTRouterLog.info("create_vector > " + "vector_store_id==" + str(vector_store_id))
        ChatGPTRouterLog.info("create_vector > " + "assistant_id==" + str(assistant_id))
        ChatGPTRouterLog.info("create_vector > " + "callback_url==" + str(callback_url))

        # validation checks
        if _collection_id is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Collection Id is required to access this API."})
        if collection_path is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Collection Path is required to access this API."})
        if OPENAI_API_KEY is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Chat GPT Key is required to access this services."})
        if internal_key is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Internal Key is required to access this API."})
        if internal_key != X_API_KEY_UUID:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Invalid API KEY UUID."})
        if info is not None:
            try:
                info = info if type(info) is dict else json.loads(info)
            except Exception as e:
                ChatGPTRouterLog.error(f"Error in API create_vector Error:CGR001\t {e}")
                return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Invalid Info Data."})

        if response_type == 'detailed_answer':
            print("inside detailed answer")
            # Create Instance of OpenAIAssistant
            openAIAssistant = OpenAIAssistant(OPENAI_API_KEY, assistant_id, project_id, _collection_id, _collection_name)
            if vector_store_id != None:
                try:
                    print("inside vector store id")
                    output = openAIAssistant.updateExistingVectorStore(callback_url, vector_store_id, collection_path)
                    print("Final Output", "(**************)")
                    print({"message": output})
                    return JSONResponse(status_code=status.HTTP_200_OK, content={})
                except Exception as e:
                    print(e)
                    return {"message": "Processing Failed"}
            else:
                print("096 assistant_id", openAIAssistant.assistant_id)
                if openAIAssistant.assistant_id is None:
                    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Error in creating Assistant."})
                else:
                    # Create Vector Store
                    vector_info = openAIAssistant.createVectorStoreDB(callback_url, collection_path)
                    print("101 vector_info", vector_info)
                    print("102 assistant_id", vector_info.get("assistant_id"))
                    print("103 vector_store_id", vector_info.get("vector_store_id"))
                    print("104 file_batch", vector_info.get("file_batch"))
                    # update_file_metadata_into_database(vector_store.id, assistant_id, file_batch)
                    return JSONResponse(status_code=status.HTTP_200_OK, content={})

        else:
            if domain_url!=None:
                print("Inside Scrapping Module")
                ChatGPTRouterLog.info("create_vector initializing GirikonVectorManager")
                girikonVectorManager = GirikonVectorManager(OPENAI_API_KEY, _collection_id, selected_key,domain_url,whiteList_url)
                results = {"message": "success"}
                try:
                    # TODO: Add the metadata to the create_vector_store method
                    # read all the files from the collection path and moved files to bkp folder
                    # check if the path exists
                    if not os.path.exists(os.path.join(collection_path, "docs")):
                        _errorMsg = "Collection Path is not valid." + os.path.join(collection_path, "docs")
                        ChatGPTRouterLog.error(f"Error in API create_vector Error:CGR002\t {_errorMsg}")
                        results = {"error": "Collection Path is not valid."}
                        info["error"] = "Collection Path is not valid."
                    else:
                        for root, dirs, files in os.walk(os.path.join(collection_path, "docs")):
                            for file in files:
                                file_path = os.path.join(root, file)
                                if fnmatch.fnmatch(file_path, '*.pdf'):
                                    girikonVectorManager.create_vector_store(file_path, False)
                                    if girikonVectorManager.error is None:
                                        girikonVectorManager.move_file_to_bkp(os.path.join(collection_path, "txt"), file_path)
                                    else:
                                        ChatGPTRouterLog.error(f"Error in API create_vector Error:CGR003\t {girikonVectorManager.error}")
                                        results = {"error": girikonVectorManager.error}
                                        info["error"] = girikonVectorManager.error
                except Exception as e:
                    msg = str(e)
                    ChatGPTRouterLog.error(f"Error in API create_vector Error:CGR004\t {e}")
                    info["error"] = msg
                    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": msg})

                finally:
                    girikonVectorManager.close()
                    send_mail(to=info['email'], __data=info)
                    # call webhook to update the status
                    return JSONResponse(status_code=status.HTTP_200_OK, content=results)
            else:
                ChatGPTRouterLog.info("create_vector initializing GirikonVectorManager")
                girikonVectorManager = GirikonVectorManager(OPENAI_API_KEY, _collection_id, selected_key,domain_url, whiteList_url)
                results = {"message": "success"}
                try:
                    # TODO: Add the metadata to the create_vector_store method
                    # read all the files from the collection path and moved files to bkp folder
                    # check if the path exists
                    if not os.path.exists(os.path.join(collection_path, "docs")):
                        _errorMsg = "Collection Path is not valid." + os.path.join(collection_path, "docs")
                        ChatGPTRouterLog.error(f"Error in API create_vector Error:CGR002\t {_errorMsg}")
                        results = {"error": "Collection Path is not valid."}
                        info["error"] = "Collection Path is not valid."
                    else:
                        for root, dirs, files in os.walk(os.path.join(collection_path, "docs")):
                            for file in files:
                                file_path = os.path.join(root, file)
                                if fnmatch.fnmatch(file_path, '*.pdf'):
                                    girikonVectorManager.create_vector_store(file_path, False)
                                    if girikonVectorManager.error is None:
                                        girikonVectorManager.move_file_to_bkp(os.path.join(collection_path, "txt"), file_path)
                                    else:
                                        ChatGPTRouterLog.error(f"Error in API create_vector Error:CGR003\t {girikonVectorManager.error}")
                                        results = {"error": girikonVectorManager.error}
                                        info["error"] = girikonVectorManager.error
                except Exception as e:
                    msg = str(e)
                    ChatGPTRouterLog.error(f"Error in API create_vector Error:CGR004\t {e}")
                    info["error"] = msg
                    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": msg})

                finally:
                    girikonVectorManager.close()
                    send_mail(to=info['email'], __data=info)
                    # call webhook to update the status
                    return JSONResponse(status_code=status.HTTP_200_OK, content=results)

    except Exception as e:
        msg = str(e)
        ChatGPTRouterLog.error(f"Error in API create_vector Error:CGR005\t {e}")
        if "No such file or directory" in msg:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Collection Path is not valid."})
        elif "Invalid API KEY UUID" in msg:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Invalid API KEY UUID."})
        elif " object has no attribute " in msg:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Response cannot be empty."})


@router.post("/ask")
async def ask(request: Annotated[dict, Body()] = None):
    try:
        print("inside ask api")
        results = {"message": "success"}
        _collection_id = request.get("collection_id", None)
        collection_path = request.get("collection_path", None)
        OPENAI_API_KEY = request.get("chat_gpt_api_key", None)
        # cmetadata = request.get("metadata", dict())
        internal_key = request.get("internal_key", None)
        selected_key = request.get("selected_key", None)
        response_type = request.get("response_type", 'short_answer')  # short_answer or detailed_answer
        X_API_KEY_UUID = os.getenv("X_API_KEY_UUID", None)
        assistant_id = request.get("assistant_id", None)  # short_answer or detailed_answer
        vector_store_id = request.get("vector_store_id", None)  # short_answer or detailed_answer
        thread_id = request.get("thread_id", None)  # short_answer or detailed_answer
        project_id = request.get("project_id", "proj_6z63OdRWAuDUzR3ixvSYLJ0g")
        run_id = request.get("run_id", None)  # short_answer or detailed_answer
        chainConversation = request.get("chain_conversation",None)
        domain_url = request.get("domain_url",None)
        whiteList_url = request.get("whitelist_url",None)
        q = request.get('q')
        print("The datatype of the chain conversation is :- ",type(chainConversation))
        ChatGPTRouterLog.info(f"API ask > collection_id=={_collection_id}")
        ChatGPTRouterLog.info(f"API ask > collection_path=={collection_path}")
        ChatGPTRouterLog.info(f"API ask > OPENAI_API_KEY=={OPENAI_API_KEY}")
        ChatGPTRouterLog.info(f"API ask > internal_key=={internal_key}")
        ChatGPTRouterLog.info(f"API ask > X_API_KEY_UUID=={X_API_KEY_UUID}")
        ChatGPTRouterLog.info(f"API ask > q=={q}")
        try:
            if len(chainConversation)>0:
                chainConversation = "\n".join([str(val["question"])+"\n"+str(val["answer"]) for val in chainConversation])
                print("Formatted chain conversation is:- ",chainConversation)
        except Exception as e:
            print("Error in the chain conversation formatting",e)
        # validation checks
        if _collection_id is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Collection Id is required to access this API."})
        if collection_path is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Collection Path is required to access this API."})
        if OPENAI_API_KEY is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Chat GPT Key is required to access this services."})
        if internal_key is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Internal Key is required to access this API."})
        if internal_key != X_API_KEY_UUID:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Invalid API KEY UUID."})
        if q is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Prompt is required to access this API."})
        print("run")
        if response_type == 'detailed_answer':
            openAIAssistant = OpenAIAssistant(OPENAI_API_KEY, assistant_id, project_id, _collection_id, None)
            ans = openAIAssistant.getAns(vector_store_id, q, thread_id)
            return ans
        else:
            girikonVectorManager = None
            try:
                print(selected_key)
                girikonVectorManager = GirikonVectorManager(OPENAI_API_KEY, _collection_id, selected_key,domain_url,whiteList_url)
                print(girikonVectorManager.selected_key)
                if selected_key == "geminiConversational":
                    # client = socketio.Client()
                    # client.connect('http://localhost:3000')
                    # client.on('message', q)
                    # results = girikonVectorManager.get_results(q,selected_key)
                    # client.emit('message', results)
                    print("Str formatted chainconv",chainConversation)
                    results = girikonVectorManager.get_results(q,selected_key,chainConversation)
                    print(results)
                else:
                    results = girikonVectorManager.get_results(q,selected_key,chainConversation)
                    girikonVectorManager.close()
                    return JSONResponse(status_code=status.HTTP_200_OK, content=results)
            except Exception as e:
                msg = str(e)
                ChatGPTRouterLog.error(f"Error in API ask Error:CGR006\t {e}")
                return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": msg})

            finally:
                girikonVectorManager.close()
                # call webhook to update the status
                return JSONResponse(status_code=status.HTTP_200_OK, content=results)

    except Exception as e:
        msg = str(e)
        ChatGPTRouterLog.error(f"Error in API ask Error:CGR007\t {e}")
        if "No such file or directory" in msg:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Collection Path is not valid."})
        elif "Invalid API KEY UUID" in msg:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Invalid API KEY UUID."})
        elif " object has no attribute " in msg:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Response cannot be empty."})
        else:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": msg})


@router.post("/get_text")
async def get_text(file: Optional[UploadFile] = None,
                   internal_key: Optional[str] = Form(...)):
    try:
        X_API_KEY_UUID = os.getenv("X_API_KEY_UUID", None)

        # validation checks
        if internal_key is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Internal Key is required to access this API."})
        if internal_key != X_API_KEY_UUID:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Invalid API KEY UUID."})
        if file is None:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={
                "content": "",
                "error": "File is required to access this API."
            })

        # check file type pdf
        if file.content_type == "application/pdf":
            # Read the uploaded file content into a BytesIO object
            content = await file.read()
            pdf_data = BytesIO(content)

            # Use PdfReader to open the PDF from the BytesIO object
            reader = PdfReader(pdf_data)

            # Perform operations on the PDF using PdfReader methods
            # (e.g., extract text, get number of pages, etc.)
            num_pages = len(reader.pages)
            print(f"Number of pages in the PDF: {num_pages}")
            text = ""
            for page_num in range(num_pages):
                page = reader.pages[page_num]
                text += page.extract_text()

            if text == "":
                return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={
                    "content": "",
                    "error": "No text found in the PDF. May be the PDF is scanned or corrupted."
                })
            else:
                return JSONResponse(status_code=status.HTTP_200_OK, content={"content": text})

        # check file type docx
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            # Read the uploaded file content into a BytesIO object
            content = await file.read()
            docx_data = BytesIO(content)

            # Use docx2txt to extract text from the BytesIO object
            # text = docx2txt.process(docx_data)
            try:
                document = Document(docx_data)
            except Exception as e:
                return {"error": f"Error processing DOCX file: {e}"}

            paragraphs = document.paragraphs

            text = ""
            for paragraph in paragraphs:
                text += paragraph.text

            return JSONResponse(status_code=status.HTTP_200_OK, content={"content": text})

        elif file.content_type == "application/msword":
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={
                "content": "",
                "error": "DOC files are not supported. Please upload DOCX files."
            })
        else:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={
                "content": "",
                "error": "Invalid file type. Only PDF and DOCX files are supported.",
                "file_extension": file.content_type
            })

    except Exception as e:
        msg = str(e)
        ChatGPTRouterLog.error(f"Error in API get_text Error:CGR008\t {e}")
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": msg})


@router.post("/deleteFiles")
async def delete_files(request: Annotated[dict, Body()] = None):
    try:
        results = {"message": "success"}
        _collection_id = request.get("collection_id", None)
        collection_path = request.get("collection_path", None)
        OPENAI_API_KEY = request.get("chat_gpt_api_key", None)
        internal_key = request.get("internal_key", None)
        selected_key = request.get("selected_key", None)
        X_API_KEY_UUID = os.getenv("X_API_KEY_UUID", None)
        assistant_id = request.get("assistant_id", None)  # short_answer or detailed_answer
        vector_store_id = request.get("vector_store_id", None)  # short_answer or detailed_answer
        fileID = request.get("file_id", None)
        response_type = request.get("response_type", 'short_answer')  # short_answer or detailed_answer
        project_id = request.get("project_id", "proj_6z63OdRWAuDUzR3ixvSYLJ0g")
        fileName = request.get("fileName", None)

        ChatGPTRouterLog.info(f"API ask > collection_id=={_collection_id}")
        ChatGPTRouterLog.info(f"API ask > collection_path=={collection_path}")
        ChatGPTRouterLog.info(f"API ask > OPENAI_API_KEY=={OPENAI_API_KEY}")
        ChatGPTRouterLog.info(f"API ask > internal_key=={internal_key}")
        ChatGPTRouterLog.info(f"API ask > X_API_KEY_UUID=={X_API_KEY_UUID}")

        # # validation checks
        # if _collection_id is None:
        #     return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Collection Id is required to access this API."})
        # if collection_path is None:
        #     return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Collection Path is required to access this API."})
        # if OPENAI_API_KEY is None:
        #     return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Chat GPT Key is required to access this services."})
        # if internal_key is None:
        #     return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Internal Key is required to access this API."})
        # if internal_key != X_API_KEY_UUID:
        #     return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Invalid API KEY UUID."})
        print(_collection_id, fileName, selected_key)
        if response_type == 'detailed_answer':
            openAIAssistant = OpenAIAssistant(OPENAI_API_KEY, assistant_id, project_id, _collection_id, None)
            output = openAIAssistant.deleteFileVectorStore(vector_store_id, fileID)
            return {"message": output}
        elif response_type == "short_answer":
            if fileName != None and fileName != "":
                try:
                    db_connection = DBManager(_collection_id, selected_key)
                except Exception as e:
                    print(e)
                    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Invalid Collection ID."})
                try:
                    db_connection.deleteOneFile(_collection_id, fileName)
                except Exception as e:
                    print(e)
                    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "File not deleted"})
            else:
                return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "FileName is either empty or incorrect."})
        else:
            return {"message": "Vector Update failed."}

    except Exception as e:
        msg = str(e)
        ChatGPTRouterLog.error(f"Error in API ask Error:CGR007\t {e}")
        if "No such file or directory" in msg:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Collection Path is not valid."})
        elif "Invalid API KEY UUID" in msg:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Invalid API KEY UUID."})
        elif " object has no attribute " in msg:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Response cannot be empty."})
        else:
            return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": msg})

@router.post("/sentimentAI")
def getSentiment(request: Annotated[dict, Body()] = None):
    userText = request.get("userText",None)
    supportNo = request.get("supportNo",None)
    customerName = request.get("customerName",None)
    agentName = request.get("agentName",None)
    supportEmail = request.get("supportEmail",None)
    feedBackURL = request.get("feedBackURL",None)
    modelName = request.get("modelName",None)
    internal_key = request.get("internal_key",None)
    X_API_KEY_UUID = os.getenv("X_API_KEY_UUID", None)
    ChatGPTRouterLog.info("userText > " + str(userText))
    ChatGPTRouterLog.info("supportNo > " + str(supportNo))
    ChatGPTRouterLog.info("customerName > " + str(customerName))
    ChatGPTRouterLog.info("agentName > " + str(agentName))
    ChatGPTRouterLog.info("supportEmail > " + str(supportEmail))
    ChatGPTRouterLog.info("feedBackURL > " + str(feedBackURL))
    ChatGPTRouterLog.info("modelName > " + str(modelName))
    
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY","KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY","KEY")
    if userText is None:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "userText is required to access this API."})
    if supportNo is None:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "supportNo is required to access this API."})
    if customerName is None:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "customerName is required to access this API."})
    if agentName is None:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "agentName is required to access this API."})
    if supportEmail is None:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "supportEmail is required to access this API."})
    if feedBackURL is None:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "feedBackURL is required to access this API."})
    if modelName is None:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "modelName is required to access this API."})
    if internal_key is None:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Internal Key is required to access this API."})
    if internal_key != X_API_KEY_UUID:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Invalid API KEY UUID."})
    userID = "001"
    listOfResponse = ["no","No, thank you.","No thanks.","I'm not interested.","I decline.","I'll pass.","Maybe another time.","I'm not sure.","I'll think about it.","I'm good, thanks.","That's very kind, but no thank you.","No way.","Absolutely not.","Don't bother.","I'm not interested in that.","I need to think about it."
    "I'll let you know.","no thanks","no thank","no thank you","no thank u"]
    listOfResponse = [val.lower().replace(" ","").replace(".","").replace("'","") for val in listOfResponse]
    if userText.lower().replace(" ","").replace(".","").replace("'","") in listOfResponse:
        return {"result": "Thanks for connecting with us."}
    try:
        output = getResponse(userID,userText,supportNo,customerName,agentName,supportEmail,feedBackURL,modelName,OPENAI_API_KEY,GEMINI_API_KEY)
        return output
    except Exception as e:
        msg = str(e)
        ChatGPTRouterLog.error(f"Error in API sentimentAI Error:CGR007\t {msg}")
        
    
          