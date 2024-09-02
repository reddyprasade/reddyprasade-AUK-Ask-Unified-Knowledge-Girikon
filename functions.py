import os
import json
from typing import List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
import requests
from PyPDF2 import PdfReader
from fastapi import FastAPI
from langchain_core.documents import Document
from starlette.middleware.cors import CORSMiddleware
import google.generativeai as genai
from logger import CustomLogger

FunctionsLog = CustomLogger.get_logger("functions")


def get_filename_from_path(file_path):
    return os.path.basename(file_path)


def pdf_to_document(pdf_path, **kwargs) -> List[Document]:
    FunctionsLog.info(f"Converting PDF to Document: {pdf_path}")
    list_of_documents = []
    try:
        # print("PDF path is",pdf_path)
        # print(os.listdir(pdf_path))
        # if len(os.listdir(pdf_path))>0:
        pdf_reader = PdfReader(os.path.join(pdf_path))
        num_pages = len(pdf_reader.pages)
        for page_num in range(num_pages):
            page = pdf_reader.pages[page_num]
            list_of_documents.append(
                Document(page_content=page.extract_text().strip(), metadata=dict(
                    page_number=page_num + 1,
                    filename=str(get_filename_from_path(pdf_path)),
                    **kwargs
                ))
            )
        return list_of_documents
        # else:
        #     return list_of_documents
    except Exception as e:
        print("Exception in get_raw_txt", e)
        return list_of_documents


def get_embeddings(OPENAI_API_KEY, text: str, model: str = "text-embedding-ada-002"):
    print("get_embeddings:::", text, model)
    try:
        url = "https://api.openai.com/v1/embeddings"

        payload = json.dumps({
            "input": str(text),
            "model": model
        })
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENAI_API_KEY}'
        }

        response = requests.request("POST", url, headers=headers, data=payload)

        result = response.json()
        result = json.loads(result) if isinstance(result, str) else result

        # exceeded your current quota check
        if "error" in result:
            return "###error###" + (result['error']['message'] if "message" in result['error'] else result['error'])

        if "data" in result:
            return result['data'][0]['embedding']
    except Exception as e:
        print("Exception in ./functions.py > get_embeddings:::", e)
        return None

def getEmbeddingsGemini(geminiKey, text: str, model: str = "models/text-embedding-004"):
    try:
        genai.configure(api_key=geminiKey)
        return genai.embed_content(model=model,
                             content=text,
                             task_type="retrieval_document")["embedding"]
    except Exception as e:
        print(e,"API key for the embedding gemini model is exhausted.")
        return "Error in generating embedding for the GEMINI model."
        
    
    
# def handle_i_do_not_know(result):
#     """
#     result:{
#     "id": "chatcmpl-9boDrbaNtjytGEvBMoEvXDo04nPYS",
#     "object": "chat.completion",
#     "created": 1718798219,
#     "model": "gpt-4o",
#     "choices": [{
#             "index": 0,
#             "message": {
#                 "role": "assistant",
#                 "content": "I'm sorry, but the information provided does not mention anything about the Prime Minister of India. Therefore, I do not know who the current Prime Minister of India is based on this context."
#             },
#             "logprobs": None,
#             "finish_reason": "stop"
#         }
#     ],
#     "usage": {
#         "prompt_tokens": 1015,
#         "completion_tokens": 38,
#         "total_tokens": 1053
#     },
#     "system_fingerprint": None
# }
#     """
#     #  _context_summarization["choices"][0]['message']['content']
#     text = ""
#     values = ["i do not know", "i'm sorry", "haven't been trained", "i'm still learning", "i can't answer", "i'm not sure", "i don't know", "i cannot answer", "i cannot answer this question", "*thanks for asking!*","i cannot provide an answer", "beyond my current knowledge", "i'm still under development", "i apologize, but i can't", "i cannot address that question", "i cannot answer", "i cannot answer", "i cannot find", "i cannot give", "i cannot help with", "i cannot offer", "i cannot provide","i cannot provide", "i cannot respond","i cannot supply", "i can't address that question", "i can't answer", "i can't find", "i can't give", "i can't help with", "i can't offer", "i can't provide", "i can't respond", "i can't supply", "i do not know", "i don't have","i don't know", "i don't possess", "i haven't been trained", "i regret that i cannot answer that", "i regret that i cannot answer that.", "i wish i could", "i wish i had the answer", "i'm not able to answer", "i'm not able to give","i'm not able to provide", "i'm not able to respond", "i'm not aware", "i'm not capable", "i'm not certain about that information", "i'm not certain of the ", "i'm not equipped to answer", "i'm not informed", "i'm not knowledgeable","i'm not sure", "i'm sorry", "i'm still learning", "i'm still learning about that", "i'm unable to", "my knowledge doesn't", "my training didn't", "my training does not include", "that exceeds my current knowledge","that information is not available to me", "that question is beyond my expertise", "that question is outside my current understanding", "that topic is unfamiliar to me", "that’s beyond my current capabilities","that's not something i can answer", "that's outside the scope of my knowledge", "unfortunately, i don't know the answer"]
#     if "choices" in result and len(result["choices"]) > 0:
#         if "message" in result["choices"][0]:
#             if "content" in result["choices"][0]["message"]:
#                 text = result["choices"][0]["message"]["content"]
#
#     for value in values:
#         if value in text:
#             result["choices"][0]["message"]["content"] = "This data seems inconclusive. Let's try rephrasing your question to see if we can find a clearer answer."
#             break
#
#     return result


def get_answer(OPENAI_API_KEY, text: str, model: str = "gpt-3.5-turbo-0125"):
    print("get_answer:::", text, model)
    try:
        url = "https://api.openai.com/v1/chat/completions"

        payload = json.dumps({
            "model": model,
            "messages": [{
                "role": "user",
                "content": str(text)
            }],
            "max_tokens": 4000,
            "temperature": 0.1
        })
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENAI_API_KEY}'
        }

        # print("payload", payload)
        # print("headers", headers)
        response = requests.request("POST", url, headers=headers, data=payload)

        result = response.json()
        result = json.loads(result) if isinstance(result, str) else result
        # result = handle_i_do_not_know(result)
        print("result", result)

        # exceeded your current quota check
        if "error" in result:
            return "###error###" + (result['error']['message'] if "message" in result['error'] else result['error'])
        else:
            return result
    except Exception as e:
        print("Exception in ./functions.py > get_embeddings:::", e)
        return None

def getAnswerGemini(geminiKey, text: str, model: str = "gemini-1.5-flash"):
    try:
        genai.configure(api_key = geminiKey)
        modelGemini = genai.GenerativeModel(model,
                                  generation_config={"response_mime_type": "application/json",
                                                     "temperature": 0.1})
        response = modelGemini.generate_content(str(text))
        result = response.text
        try:
            result = json.loads(result) #if isinstance(result, str) else result
        except Exception as e:
            print(e, "error in converting in json")
        answerData = result
        if "error" in result:
            return "###error###" + (result['error']['message'] if "message" in result['error'] else result['error'])
        else:
            return answerData
    except Exception as e:
        print("Exception in ./functions.py > getAnswerGemini:::", e)
        return None
    
def getDocument(dataList):
    sections = []
    current_section = []
    for line in dataList:
        if not line.strip():
            sections.append(current_section)
            current_section = []
        else:
            current_section.append(line)
    sections.append(current_section)
    class Document:
        def __init__(self, page_content):
            self.page_content = page_content
            self.metadata = {}
    documents = [Document(section_content) for section_content in sections]
    return documents
def generateFollowUp(question,answer,context,model: str = "gemini-1.5-flash"):
    prompt_template = f"""
    Generate 3 maximum follow up question considering the below Question and Answer and Context. The generated follow up question should not be exactly from question. It must be from the context.
    {question}
    {answer}
    {context}
    
    ```json
    {{
    FOLLOW_UP_QUESTION: [] # list of follow up Question
    }}
    """
    genai.configure(api_key="AIzaSyCkC1syFj3Z_Rj_j8bQD-7N8E8rSm2GyUg")
    modelGemini = genai.GenerativeModel(model,
                                        generation_config={"response_mime_type": "application/json",
                                                           "temperature": 0.1})
    response = modelGemini.generate_content(prompt_template)
    result = response.text
    return result

def getAnswerGeminiConversational(geminiKey, text: str, context: str, prompt: str, model: str = "gemini-1.5-flash"):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        os.environ["GOOGLE_API_KEY"] = geminiKey
        model = ChatGoogleGenerativeAI(model=model, temperature=0.3)
        prompt = PromptTemplate(template=text, input_variables=["context", "question"])
        chain = load_qa_chain(model, chain_type="stuff")
        response = chain(
            {"input_documents": getDocument(context), "question": prompt},
            return_only_outputs=True)
        try:
            response = json.loads(response) #if isinstance(result, str) else result
        except Exception as e:
            print(e, "error in converting in json")
        answerData = response["output_text"]
        followUpQuestions = json.loads(generateFollowUp(prompt,answerData,context))["FOLLOW_UP_QUESTION"]
        if "error" in response:
            return "###error###" + (chain['error']['message'] if "message" in chain['error'] else chain['error'])
        else:
            try:
                return answerData.replace("print(template.format(input_variables=input_variables))",""),followUpQuestions
            except Exception as e:
                return answerData,followUpQuestions
    except Exception as e:
        print("Exception in ./functions.py > getAnswerGeminiConversational:::", e)
        return None,None
    finally:
        try:
            chain.close()
        except Exception as e:
            print("Model Instance was not Up to close",e)  

def is_allowed_origin(origin: str = None):
    print(origin)
    return True


class DynamicCORSMiddleware(CORSMiddleware):
    def is_allowed_origin(self, origin: str) -> bool:
        return self.is_allowed_origin(origin)


def handle_cors(app: FastAPI):
    new_origins = [
        # "http://localhost",
        # "http://172.190.65.33",
        # "https://*.girikon.com",
        # "https://*.salesforce.com",
        # "https://*.girikon.ai",
        # "https://trailhead.salesforce.com"
    ]

    app.add_middleware(
        DynamicCORSMiddleware,
        allow_credentials=True,
        # allow_origins=new_origins,
        # allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
        # allow_headers=["accept", "Accept-Language", "Content-Language", "Content-Type", "Authorization"]
        allow_origins=['*'],
        allow_methods=['*'],
        allow_headers=['*']
    )


def remove_duplicate_from_list(data_list):
    """
    Removes duplicates from a list based on a unique key formed by combining
    'page_number' and 'filename' fields.

    Args:
        data_list: The list of dictionaries containing 'page_number' and 'filename' keys.

    Returns:
        A new list containing only unique elements based on the combined key.
    """
    seen = set()
    unique_data = []
    for item in data_list:
        key = f"{item['page_number']}_{item['filename']}"
        if key not in seen:
            seen.add(key)
            unique_data.append(item)
    return unique_data
