import json
import os
import shutil
import sys
from typing import List
from dotenv import load_dotenv
from langchain.schema import Document
from langchain.text_splitter import CharacterTextSplitter
from databases.DBManager import DBManager
from libs.Prompt import QA_PROMPT,QA_PROMPT_GEMINI
from functions import pdf_to_document, get_embeddings, get_answer, remove_duplicate_from_list, getEmbeddingsGemini, getAnswerGemini, getAnswerGeminiConversational
from AI_API import get_answerAI, get_embeddingsAI
############################Code For web Scrapper##################
from URLScrapper.scrapeURL import WebScraper,getDataFrameWebScrawler
############################Code Ends##############################
sys.path.append(os.path.join(os.getcwd(), '..'))
from logger import CustomLogger
load_dotenv()  # take environment variables from .env.

GirikonVectorManagerLog = CustomLogger.get_logger("GirikonVectorManager")



class GirikonVectorManager(DBManager):
    def __init__(self, OPENAI_API_KEY, _collection_id, selected_key,domain_url,whiteList_url):
        # print("GirikonVectorManager init")
        GirikonVectorManagerLog.info(f"Initializing GirikonVectorManager for collection_id: {_collection_id}")
        super().__init__(_collection_id, selected_key)
        self.selected_key = selected_key
        self.OPENAI_API_KEY = "open AI Keys"
        self.threshold = float(os.getenv("THRESHOLD", 0.5)) or 0.5
        self.chunk_size = int(os.getenv("CHUNK_SIZE", 1000)) or 1000
        self.baali_chunk_size = int(os.getenv("BAALI_CHUNK_SIZE", 9999999999)) or 9999999999
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", 0)) or 0
        self.db = None
        self.error = None
        self.gemini_key = "Gemini Keys"
        self.domain_url = domain_url
        self.whiteList_url = whiteList_url
        # self.llm = ChatOpenAI()
        # self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
        # self.memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
        if self.selected_key == 'baali':
            self.text_splitter = CharacterTextSplitter(separator="\r\n", chunk_size=self.baali_chunk_size, chunk_overlap=self.chunk_overlap, length_function=len)
        elif self.selected_key =="gemini":
            self.text_splitter = CharacterTextSplitter(separator="\n", chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap, length_function=len)
        elif self.selected_key =="geminiConversational":
            self.text_splitter = CharacterTextSplitter(separator="\n", chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap, length_function=len)
        else:
            self.text_splitter = CharacterTextSplitter(separator="\n", chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap, length_function=len)

    def set_error(self, error):
        self.error = error
        print("Error404040: ", error)

    def get_documents_list(self, pdf_path, **kwargs) -> List[Document]:
        GirikonVectorManagerLog.info("Converting pdf to documents...")
        # convert pdf to list of documents
        # TODO: Add support for multiple file types
        documents_arrays = pdf_to_document(pdf_path, **kwargs)
        GirikonVectorManagerLog.info("Total page in documents_arrays" + str(len(documents_arrays)))
        list_of_documents = []
        # convert list of documents to list of documents with each document having a maximum of 1000 characters
        try:
            list_of_documents = self.text_splitter.split_documents(documents_arrays)
        except Exception as e:
            print("Getting empty file array",e)
        GirikonVectorManagerLog.info("Total page in documents_arrays after split" + str(len(list_of_documents)))
        return list_of_documents

    def create_vector_store(self, pdf_path, force_override,**kwargs):
        print("Inside Create Vector. Pdf Path is :- ",pdf_path)
        GirikonVectorManagerLog.info("Creating vector store...")
        documents_list = []
        if not self.is_schema_exist():
            GirikonVectorManagerLog.info("Schema does not exist. Creating...")
            self.init()
        try:
            documents_list = self.get_documents_list(pdf_path, **kwargs)
            # if len(documents_list)>0:
            for doc in documents_list:
                k = None
                if self.selected_key == 'baali':
                    k = get_embeddingsAI(doc.page_content)
                elif self.selected_key == 'gemini':
                    k = get_embeddings(self.OPENAI_API_KEY,doc.page_content)
                elif self.selected_key == "geminiConversational":
                    k = get_embeddings(self.OPENAI_API_KEY,doc.page_content)
                else:
                    k = get_embeddings(self.OPENAI_API_KEY, doc.page_content)
                if type(k) == str and k.startswith('###error###'):
                    self.set_error(k.replace('###error###', ''))
                    break
                self.insert_embedding(k, doc.page_content, doc.metadata, '1', pdf_path, force_override)
            # else:
            #     print("No PDF found to get train the model")
        except Exception as e:
            print("No Document found to train the model.",e)
        #####################Code for web Scraping###############################################
        if self.domain_url !=None or self.domain_url!= "" or self.domain_url!="null":
            try:
                print("Scrapping Started")
                for subURL in self.domain_url.split("\n"):
                    WebScraper(subURL, self.whiteList_url.split("\n"))
                print("Scrapping Done")
                ScrapperDF = getDataFrameWebScrawler()
                print("Scrapped DF is",ScrapperDF)
                for content,docs in zip(ScrapperDF["content"],ScrapperDF["url"]):
                    if len(content)>1000:
                        listOfDocs = []
                        for indexData in range(0,len(content),1000):
                            listOfDocs.append(content[indexData:indexData+1000])
                            
                        for docData in listOfDocs:
                            k = None
                            if self.selected_key == "geminiConversational":
                                k = get_embeddings(self.OPENAI_API_KEY,docData)
                            else:
                                k = get_embeddings(self.OPENAI_API_KEY, docData)
                            if type(k) == str and k.startswith('###error###'):
                                self.set_error(k.replace('###error###', ''))
                                break
                            try: 
                                metaDataVal = {"filename": "","web_link":docs,"page_number": "null"}
                            except Exception as e:
                                print(e,"No metadata found.")
                                metaDataVal = {}
                            self.insert_embedding(k, docData, metaDataVal, '1', docs, force_override)
                    else:
                        k = None
                        if self.selected_key == "geminiConversational":
                            k = get_embeddings(self.OPENAI_API_KEY,docs) 
                        self.insert_embedding(k, content, {"filename":"","web_link":docs,"page_number": "null"}, '1', docs, force_override)  
            except Exception as e:
                print("Error in running scrapping algorithm",e)
            ####################################Code Ends#####################################################
            
    def context_summarization(self, qa_prompt, selected_key,context,prompt):
        if selected_key == "gemini":
            _get_answer = getAnswerGemini(self.gemini_key, qa_prompt)
        elif selected_key == "geminiConversational":
            _get_answer = getAnswerGeminiConversational(self.gemini_key, qa_prompt,context,prompt)
        else:
            _get_answer = get_answer(self.OPENAI_API_KEY, qa_prompt)
        return _get_answer

    def get_question_embeddings(self, _prompt):
        _text_vector = None
        _get_question_data = self.get_question_data(_prompt, self.selected_key)
        if _get_question_data is not None:
            # print("Question already exists in the database", _prompt, _get_question_data)
            _text_vector = _get_question_data['embedding']
        else:
            _text_vector = None
            if self.selected_key == 'baali':
                _text_vector = get_embeddingsAI(_prompt)
            elif self.selected_key == 'gemini' or self.selected_key == "geminiConversational":
                _text_vector = get_embeddings(self.OPENAI_API_KEY,_prompt)
            # elif self.selected_key == "gemini":
            #     _text_vector = getEmbeddingsGemini(self.gemini_key, _prompt)
            else:
                _text_vector = get_embeddings(self.OPENAI_API_KEY, _prompt)

            if type(_text_vector) == str and _text_vector.startswith('###error###'):
                self.set_error(_text_vector.replace('###error###', ''))
                _text_vector = None
            else:
                self.insert_question_embedding(_prompt, _text_vector, self.selected_key)
                pass
        return _text_vector

    def get_search_data(self, prompt, k):
        __vector = self.get_question_embeddings(prompt)

        if __vector is None:
            return None
        t5 = self.search_in_db(__vector, k)
        dict_list = list()
        for i in t5:
            score = i[0]
            metadata = dict(i[1])
            file = i[2]
            _dict = dict()

            _dict["score"] = round(abs(score or 0) * 100, 2)
            # _dict["file"] = file
            _dict["filename"] = metadata['filename']
            _dict["page_number"] = metadata['page_number']
            try:
                _dict["web_link"] = metadata["web_link"]
            except Exception as e:
                print("Web Link is empty because the answer is from PDF.",e)
                _dict["web_link"] = ""
            _dict["collection_id"] = self.collection_id_original
            dict_list.append(_dict)
        return remove_duplicate_from_list(dict_list)

    def get_results(self, prompt, selected_key, chainConversation, k=4):
        print("Recived chain conversation is:-",chainConversation)
        t5 = self.get_search_data(prompt, k)
        if t5 is None:
            return [{
                "question": prompt,
                "error": self.error or "No data found",
                "answer": "",
                "metadata": "[{\"score\": 0, \"filename\": \"Not Found\", \"page_number\": 0, \"collection_id\": \"\",\"web_link\": \"\"}]"
            }]
        try:
            _context = self.get_context_data(t5[0])
        except Exception as e:
            _context = ""
        if _context is None:
            _context = ""
        # if _context is None:
        #     return None
        else:
            if self.selected_key == 'baali':
                count = 0
                for _t5 in t5:
                    if count < 2:
                        _pageText = self.get_context_data(_t5)
                        if _pageText is not None:
                            count += 1
                            _context += "\n" + _pageText

                # _pageOneText = self.get_context_data(t5[0])
                # _pageTwoText = self.get_context_data(t5[1])
                # _pageThreeText = self.get_context_data(t5[2])
                # _pageFourText = self.get_context_data(t5[3])
                # _context = _pageOneText + "\n" + _pageTwoText + "\n" + _pageThreeText + "\n" + _pageFourText
                _get_answer = get_answerAI(_context, prompt)
                print("answer", _get_answer)
                return [{
                    "question": prompt,
                    "answer": _get_answer,
                    "metadata": json.dumps(t5),
                }]
            elif selected_key == "gemini":
                count = 0
                for _t5 in t5:
                    if count < 2:
                        _pageText = self.get_context_data(_t5)
                        if _pageText is not None:
                            count += 1
                            _context += "\n" + _pageText
                QA_PROMPT_GEMINI = """Use the following pieces of context to answer the question at the end. Please make sure the answer comes from the given context only. If you don't know the answer, say "unknown". The generated answer must be in detail and explainable way. Use the maximum information from the context to answer the question.

                                    {context}

                                    Question: {question}

                                    Provide the answer in JSON format with the following structure:

                                    ```json
                                    {{
                                    "ANSWER": "The answer to the question."
                                    }}""".format(context = _context, question = prompt)
                _context_summarization = self.context_summarization(QA_PROMPT_GEMINI,selected_key,_context,prompt)
                if _context_summarization == None:
                    return [{
                        "question": prompt,
                        "error": self.error,
                        "answer": "",
                        "metadata": "[{\"score\": 0, \"filename\": \"Not Found\", \"page_number\": 0, \"collection_id\": \"\"}]"
                    }]
                else:
                    if type(_context_summarization) == str:
                        print("inside string")
                        _context_summarization = _context_summarization.replace('{','').replace('}','')
                        print(_context_summarization)
                        return [{
                            "question": prompt,
                            "answer": _context_summarization,
                            "inputToken": 0,
                            "outputToken": 0,
                            "metadata": json.dumps(t5)
                        }]
                    else:
                        print(_context_summarization)
                        return [{
                            "question": prompt,
                            "answer": list(_context_summarization.values())[0],
                            "inputToken": 0,
                            "outputToken": 0,
                            "metadata": json.dumps(t5)
                        }]
            elif selected_key == "geminiConversational":
                count = 0
                for _t5 in t5:
                    if count < 2:
                        _pageText = self.get_context_data(_t5)
                        if _pageText is not None:
                            count += 1
                            _context += "\n" + _pageText
                print(_pageText,"Line 280")
                print("The chain Conversation is:- ", chainConversation)
                QA_PROMPT_GEMINI = """You are a conversational ChatBot who have the capabilities of greeting people and taking their queries to answer the queries from the below context only. If the user queries is incomplete then ask for the required details and then answer the question.
                                    Consider Knowledge Base data given below for the ChatBot.
                                    
                                    Context: \n {context}?\n
                                    If the above context is empty and customer is asking greetings then handle properly with proper greetings like a chatbot use to do.
                                    
                                    Consider the below data for Chain of Conversation which is already happened between customer and ChatBot.
                                    
                                    {chainConversation}
                                    
                                    Question: \n{question}\n
                                    
                                    Answer:
                                    
                                    """.format(context = _context, question = prompt, chainConversation = chainConversation)
                _context_summarization,followUpQuestions = self.context_summarization(QA_PROMPT_GEMINI,selected_key,_context,prompt)
                try:
                    _context_summarization = json.loads(_context_summarization)
                    _context_summarization = _context_summarization[0]["answer"]
                except Exception as e:
                    print("Error in converting summarized context in dict",e)
                if _context_summarization == None:
                    return [{
                        "question": prompt,
                        "error": self.error,
                        "answer": "",
                        "followUpQuestions":[],
                        "metadata": "[{\"score\": 0, \"filename\": \"Not Found\", \"page_number\": 0, \"collection_id\": \"\",\"web_link\": \"\"}]"
                    }]
                else:
                    if type(_context_summarization) == str:
                        print("inside string")
                        _context_summarization = _context_summarization.replace('{','').replace('}','')
                        return [{
                            "question": prompt,
                            "answer": _context_summarization,
                            "followUpQuestions":followUpQuestions,
                            "inputToken": 0,
                            "outputToken": 0,
                            "metadata": json.dumps(t5)
                        }]
                    else:
                        return [{
                            "question": prompt,
                            "answer": list(_context_summarization.values())[0],
                            "followUpQuestions":followUpQuestions,
                            "inputToken": 0,
                            "outputToken": 0,
                            "metadata": json.dumps(t5)
                        }]
            else:
                print("Inside else")
                _qa_prompt = QA_PROMPT.format(context=_context, question=prompt)
                _context_summarization = self.context_summarization(_qa_prompt,self.selected_key,_context,prompt)
                if type(_context_summarization) == str and _context_summarization.startswith('###error###'):
                    self.set_error(_context_summarization.replace('###error###', ''))
                    return [{
                        "question": prompt,
                        "error": self.error,
                        "answer": "",
                        "metadata": "[{\"score\": 0, \"filename\": \"Not Found\", \"page_number\": 0, \"collection_id\": \"\",\"web_link\": \"\"}]"
                    }]
                    
                else:
                    print("inside else")
                    print(_context_summarization)
                    return [{
                        "question": prompt,
                        "answer": _context_summarization["choices"][0]['message']['content'],
                        "inputToken": _context_summarization["usage"]["prompt_tokens"],
                        "outputToken": _context_summarization["usage"]["completion_tokens"],
                        "metadata": json.dumps(t5)
                    }]

    def move_file_to_bkp(self, bkp_path, file_path):
        bkp_path = os.path.join(bkp_path, os.path.basename(file_path))
        shutil.move(file_path, bkp_path)

# if __name__ == "__main__":
#     collection_id = "6f6b959c-4acb-42f0-bbde-ed49e024c611"
#     db_manager = DBManager(collection_id)
#     # db_manager.drop_role()
#     # db_manager.init()
#     db_manager.remove()
#     print("Done")
