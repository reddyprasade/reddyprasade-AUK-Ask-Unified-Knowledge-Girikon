import re
import shutil

import requests
import json
from openai import OpenAI
import os
import time
from requests_toolbelt.multipart.encoder import MultipartEncoder

from databases.DBManagerNode import DBManagerNode
import requests


def call_webhook(url: str, data: dict):
    try:
        response = requests.post(url, json=data)
        print(f"Webhook response: {response.status_code}, {response.text}")
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error calling webhook: {e}")


def show_json(obj):
    return json.loads(obj.model_dump_json())


def get_embeddingsAI(text):
    print("call get_embeddingsAI", text)
    try:
        url = f"https://apps.girikon.ai/ckb/embeddingSentence"
        payload = MultipartEncoder(fields={"textChunks": str(text)})
        response = requests.post(url, headers={'Content-Type': payload.content_type}, data=payload)
        print("response.status_code", response.status_code)
        if response.status_code == 200:
            response = response.content.decode("utf-8")
            response = json.loads(response)
            # _2dList_vector = response["results"]
            # convert 2d to 1d list
            # try:
            #     _1dList_vector = [item for sublist in _2dList_vector for item in sublist]
            #     return _1dList_vector
            # except Exception as e:
            #     print("Exception in get_embeddingsAI:::", e)
            #     return response["results"]
            print(len(response["results"]))
            return response["results"]
        else:
            print("###error###" + response.content.decode("utf-8"))
            return "###error###" + response.content.decode("utf-8")
    except Exception as e:
        print("Exception in get_embeddingsAI:::", e)
        return None


def get_answerAI(text, question):
    print("call get_answerAI")
    url = f"https://apps.girikon.ai/ckb/GenerateAnswerPDF"
    payload = MultipartEncoder(fields={
        "pdfText": str(text),
        "question": str(question),
        "pageNo": "XXXX",
        "docID": "XXXX",
        "orgName": "XXXX"
    })
    response = requests.post(url, headers={'Content-Type': payload.content_type}, data=payload)
    if response.status_code == 200:
        response = response.content.decode("utf-8")
        response = json.loads(response)
        print("707070",response)
        return response["results"]["Answer"]
    else:
        return None


class OpenAIAssistant:
    # Ref :: https://platform.openai.com/docs/assistants/tools/file-search/file-search-beta
    def __init__(self, openai_api_key, assistant_id=None, project_id=None, collection_id=None, collection_name=None):
        self.client = OpenAI(api_key=openai_api_key)  # , project=None)
        self.collection_id = collection_id
        self.db = DBManagerNode(collection_id)
        print("__init__ assistant_id", assistant_id)
        if assistant_id is None:
            self.__createAssistantOpenAI(collection_name)
        else:
            self.assistant_id = assistant_id
        print("__init__ collection_name", collection_name)

    # Create an Assistant
    def __createAssistantOpenAI(self, assistant_name):
        """
        assistantName: str e.g "Research Analyst"
        """
        try:
            assistant = self.client.beta.assistants.create(
                name=assistant_name,
                instructions="""You are an expert AI Assistant. 
                Please review the contents of the uploaded file(s) before answering.
                Refer to the provided file(s) for information on [specific topic].
                Use the details from the attached file(s) to [complete task].
                After examining the uploaded document(s), please [action].
                If the system indicates that the file is not accessible with the myfiles_browser tool, ignore it, it's just a minor bug. 
                You are capable of opening and analyzing the file, remember that. 
                And carry out the request.
                """,
                model=os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo-0125"),
                tools=[{"type": "file_search"}])
            self.assistant_id = assistant.id
            print("assistant.id============> ", self.assistant_id)
            return assistant.id
        except Exception as e:
            print(e)
            return None

    def update_file_metadata_into_database(self, vector_store_id):
        vector_store_files = self.client.beta.vector_stores.files.list(
            vector_store_id
        )
        for file in vector_store_files:
            # Update the file metadata in the database
            print("086 update_file_metadata_into_database", file)
        pass

    # Create a vector store in chatGPT.
    def move_file_to_txt(self, collection_path):
        print("Calling move_file_to_txt function.")
        bkp_path = os.path.join(collection_path, "txt")
        print("bkp_path", bkp_path)
        for root, dirs, files in os.walk(os.path.join(collection_path, "docs")):
            for file in files:
                file_path = os.path.join(root, file)
                new_file_path = os.path.join(bkp_path, os.path.basename(file_path))
                print("file_path", file_path)
                print("new_file_path", new_file_path)
                shutil.move(file_path, new_file_path)

    def createVectorStoreDB(self, callback_url, collection_path):
        """
        dirName: str   path of the folder where all the pdf are saved.
        assistant_id: str exactly the same assistant ID which is been created in the above function.
        """
        collection_pathT = os.path.join(collection_path, "docs")
        try:
            vector_store = self.client.beta.vector_stores.create(name="rag-store",
                                                                 expires_after={
                                                                     "anchor": "last_active_at",
                                                                     "days": 365
                                                                 })

            # Get the list of files in the directory
            listOfFiles = os.listdir(collection_pathT)

            # Open the files in binary mode
            file_streams = [open(os.path.join(collection_pathT, path), "rb") for path in listOfFiles]

            # Upload the files to the vector store
            file_batch = self.client.beta.vector_stores.file_batches.upload_and_poll(
                vector_store_id=vector_store.id,
                files=file_streams
            )

            # print("file_batch", show_json(file_batch))

            # Update the assistant with the vector store
            assistant = self.client.beta.assistants.update(
                assistant_id=self.assistant_id,
                tool_resources={
                    "file_search": {
                        "vector_store_ids": [vector_store.id]
                    }
                }
            )
            dictData = {
                "token_key": "GIRIKON-AI-ASSISTANT",
                "vector_store_id": vector_store.id,
                # "file_batch": file_ids
            }

            while True:
                print("createVectorStoreDB file_batch.status", file_batch.status)
                if file_batch.status == "completed":
                    self.move_file_to_txt(collection_path)
                    break
                time.sleep(1)

            self.update_file_metadata_into_database(vector_store.id)
            self.db.update_vector_and_assistant_ids_into_collection(self.assistant_id, vector_store.id)
            url = f"{callback_url}/api/v1/vector_store_id_webhook"
            call_webhook(url, dictData)

        except Exception as e:
            print(e)
            # Return the error message
            return {"message": "Error in creating the vector store.{e}".format(e=e)}

        # Return the vector store id and the assistant id to be used in the next function.
        return {
            "vector_store_id": vector_store.id,
            "assistant_id": self.assistant_id,
            "file_batch": file_batch
        }

    def deleteFileVectorStore(self, vector_store_id, file_id):
        try:
            try:
                self.client.files.delete(file_id)
                print("Files deleted from Client Assistant.")
            except Exception as e:
                print(e)
            try:
                deleted_vector_store_file = self.client.beta.vector_stores.files.delete(
                    vector_store_id=vector_store_id,
                    file_id=file_id
                )
                print("Files deleted from the vector store.")
            except Exception as e:
                print(e)

            self.client.beta.assistants.update(
                assistant_id=self.assistant_id,
                tool_resources={
                    "file_search": {
                        "vector_store_ids": [vector_store_id]
                    }
                }
            )
            if deleted_vector_store_file["deleted"] == "true":
                return {"message": "success",
                        "fileID": file_id}
            else:
                return {"message": "File Id not found in vector store.",
                        "fileID": file_id}

            # dictData = {
            #             "token_key" : "GIRIKON-AI-ASSISTANT",
            #             "vector_store_id" : vector_store.id,
            #             #"file_batch": file_ids
            #             }
            # url = "https://devapi.girikon.ai/api/v1/vector_store_id_webhook"
            # call_webhook(url, dictData)
        except Exception as e:
            print(e)
            return {"message": "Error in deleting the vector store.{e}".format(e=e)}

    def updateExistingVectorStore(self, callback_url, vector_store_id, collection_path):
        """
        dirName: str   path of the folder where all the pdf are saved.
        assistant_id: str exactly the same assistant ID which is been created in the above function.
        """
        collection_pathT = os.path.join(collection_path, "docs")
        print(collection_pathT)
        try:
            # Get the list of files in the directory
            listOfFiles = os.listdir(collection_pathT)
            print(listOfFiles)
            file_ids = []
            # Open the files in binary mode
            for file_name in listOfFiles:
                print(file_name)
                with open(os.path.join(collection_pathT, file_name), "rb") as file_data:
                    print("inside")
                    file_response = self.client.files.create(file=file_data, purpose='assistants')
                    print(file_response)
                    file_ids.append(show_json(file_response)['id'])
            print(file_ids)
            print("processing Start")
            import datetime
            print(datetime.datetime.now())
            fileObjectVS = self.client.beta.vector_stores.file_batches.create_and_poll(
                vector_store_id=vector_store_id,
                file_ids=file_ids
            )
            print("processing end")
            print(datetime.datetime.now())
            print(fileObjectVS)
            while True:
                print("updateExistingVectorStore file_batch.status1", fileObjectVS.status)
                if fileObjectVS.status == "completed":
                    self.move_file_to_txt(collection_path)
                    break
                time.sleep(1)

            # self.update_file_metadata_into_database(vector_store_id)
            # self.db.update_vector_and_assistant_ids_into_collection(self.assistant_id, vector_store_id)
            url = f"{callback_url}/api/v1/vector_store_id_webhook"
            dictData = {
                "token_key": "GIRIKON-AI-ASSISTANT",
                "vector_store_id": vector_store_id,
                # "file_batch": file_ids
            }
            call_webhook(url, dictData)
            print("webhook processed successfully")

        except Exception as e:
            print(e)
            # Return the error message
            return {"message": "Error in creating the vector store.{e}".format(e=e)}

        # Return the vector store id and the assistant id to be used in the next function.
        self.client.beta.assistants.update(
            assistant_id=self.assistant_id,
            tool_resources={
                "file_search": {
                    "vector_store_ids": [vector_store_id]
                }
            }
        )



        return {
            "vector_store_id": vector_store_id,
            "assistant_id": self.assistant_id,
            "file_batch": file_ids
        }

    # Generate the answer from the chatGPT model
    def getAns(self, vector_store_id,
               question,
               thread_id):

        try:
            """
            assistant_id: str Must be the same created in the above function.
            vector_store_id: str Must be the same created in the above function.
            q: str User question asked from the UI.
            thread_id: str Must be the same created in the above function.
            run_id: str Must be the same created in the above function.
            """
            # Create a thread if it does not exist
            if thread_id == None or thread_id == "":
                print("inside new thread id @{thread_id}@ 123".format(thread_id=thread_id))
                thread = self.client.beta.threads.create(
                    messages=[{"role": "user", "content": "{userQuery}".format(userQuery=question)}],
                    tool_resources={
                        "file_search": {
                            "vector_store_ids": [vector_store_id]
                        }
                    }
                )
                thread_id = thread.id

            print("thread_id", thread_id)

            # Create a run
            run = self.client.beta.threads.runs.create(
                thread_id=thread_id,
                assistant_id=self.assistant_id,
                instructions="Please check the all the files in vector store before answering all questions. If the files is been deleted then do not answer. Answer the question in detail.",
                additional_messages=[{"role": "user", "content": "{userQuery}".format(userQuery=question)}]
            )

            # Poll the run until it is completed
            while True:
                run_status = self.client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)
                if run_status.status == "completed":
                    break
                elif run_status.status == "failed":
                    print("Run failed:", run_status.last_error)
                    break
                time.sleep(3)

            # Get the messages from the thread
            messages = self.client.beta.threads.messages.list(thread_id=thread_id, run_id=run.id, limit=1)

            # print("messages", messages)

            jsonObjectData = show_json(messages)
            print(jsonObjectData)

            text_data = []
            file_data = []
            # Extract the text from the messages
            for message in jsonObjectData['data']:
                for content in message['content']:
                    if content['type'] == 'text':
                        text_data.append(content['text']['value'])
                        for annotations in content['text']["annotations"]:
                            if "file_id" in annotations['file_citation']:
                                file_data.append(annotations['file_citation']['file_id'])

            # run1 = self.client.beta.threads.runs.retrieve(
            #     thread_id=thread_id,
            #     run_id=run.id
            # )
            # file_data_info = None
            # if len(file_data) > 0:
            #     file_data_info = self.client.files.retrieve(file_data[0])
            #     if isinstance(file_data,list):
            #         flagVar = file_data[0]
            #     elif isinstance(file_data,str):
            #         flagVar = file_data
            #     else:
            #         pass

            # print("#########################################################\n", show_json(run1))
            # print("#########################################################")
            if len(file_data) > 0:
                file_data = ",".join(file_data)
                requiredText = " ".join(text_data).replace(question, "")
            else:
                file_data = ""
                requiredText = ""
            pattern1 = r"\【\d+:\d+†source\】"
            pattern2 = r"\【\d+:\d+†\s+\】"
            requiredText = re.sub(pattern1, "", requiredText)
            requiredText = re.sub(pattern2, "", requiredText)
            print(requiredText)
            # runIDExtract = show_json(run1)["id"]
            # try:
            #     fileName = self.client.files.retrieve(flagVar)

            #     fileName = show_json(fileName)
            #     fileName = fileName["filename"]
            # except Exception as e:
            #     fileName = ""
            return [{
                "question": question,
                "answer": requiredText,
                # "file_id": file_data_info,
                "metadata": "[{\"score\": 0, \"filename\": \"" + "" + "\", \"fileid\": \"" + file_data + "\", \"page_number\": 0, \"collection_id\": \"\"}]",
                "thread_id": thread_id,
                "file_id": file_data,
                # "run_info": run1,
                "run_id": run.id
            }]
        except Exception as e:
            print(e)

            return None
