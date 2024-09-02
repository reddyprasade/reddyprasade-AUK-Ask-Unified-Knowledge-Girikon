import os
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
load_dotenv()
from generateDocument import getDocument
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


def get_conversational_chain():
    prompt_template = """
    Answer the question as detailed as possible from the provided context, make sure to provide all the details, if the answer is not
    in the provided context just say, "unknown", dont provide the wrong answers \n\n.
    Make Sure to ask all the relevant question from the user required to answer the question accurately.

    Context: \n {context}?\n
    Question: \n{question}\n

    Answer:
    """

    model = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.3)
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

    chain = load_qa_chain(model, chain_type="stuff")
    return chain


def user_input(user_question,docList):
    chain = get_conversational_chain()
    docs = getDocument(docList)
    response = chain(
        {"input_documents": docs, "question": user_question},
        return_only_outputs=True)
    print(response)
    return response["output_text"]


