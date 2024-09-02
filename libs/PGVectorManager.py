import os
import sys
from typing import List

from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.chat_models import ChatOpenAI
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores.pgvector import PGVector
from langchain_core.documents import Document

from databases.DBManager import DBManager

sys.path.append(os.path.join(os.getcwd(), '..'))
from functions import pdf_to_document
from logger import CustomLogger

PGVectorManagerLog = CustomLogger.get_logger("PGVectorManager")


class PGVectorManager(DBManager):

    def __init__(self, openai_api_key, _collection_id):
        #PGVectorManagerLog.info(f"Initializing PGVectorManager for collection_id: {_collection_id}")
        super().__init__(_collection_id)
        self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
        self.db = None
        self.llm = ChatOpenAI()
        self.memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
        self.text_splitter = CharacterTextSplitter(separator="\n", chunk_size=1000, chunk_overlap=0, length_function=len)

    def get_db_collection(self):
        PGVectorManagerLog.info("Getting db collection...")
        try:
            self.db = PGVector(
                embedding_function=self.embeddings,
                collection_name=self.collection_id,
                connection_string=self.get_connection_string()
            )
            return True
        except Exception as e:
            print(e)
            return None

    def get_documents_list(self, pdf_path, **kwargs) -> List[Document]:
        PGVectorManagerLog.info("Converting pdf to documents...")
        # convert pdf to list of documents
        # TODO: Add support for multiple file types
        documents_arrays = pdf_to_document(pdf_path, **kwargs)
        PGVectorManagerLog.info("Total page in documents_arrays" + str(len(documents_arrays)))

        # convert list of documents to list of documents with each document having a maximum of 1000 characters
        list_of_documents = self.text_splitter.split_documents(documents_arrays)
        PGVectorManagerLog.info("Total page in documents_arrays after split" + str(len(list_of_documents)))
        return list_of_documents

    def create_vector_store(self, pdf_path, **kwargs):
        try:
            PGVectorManagerLog.info("Creating vector store...")
            PGVectorManagerLog.info(pdf_path)

            if not self.is_database_exist():
                #PGVectorManagerLog.info("Database does not exist. Initializing...")
                self.init()
                self.db = PGVector.from_documents(
                    embedding=self.embeddings,
                    documents=self.get_documents_list(pdf_path, **kwargs),
                    collection_name=self.collection_id,
                    connection_string=self.get_connection_string()
                )
            else:
                PGVectorManagerLog.info("Database exists. Adding documents...")
                self.db = PGVector(
                    embedding_function=self.embeddings,
                    collection_name=self.collection_id,
                    connection_string=self.get_connection_string()
                )
                for doc in self.get_documents_list(pdf_path, **kwargs):
                    self.db.add_documents([doc])
        except Exception as e:
            print(e)
            PGVectorManagerLog.error(e)

    def find_similarity_with_score(self, question, top_k):
        PGVectorManagerLog.info("Finding similarity with score...")
        return self.db.similarity_search_with_score(question, k=top_k)

    def ask_question(self, question, top_k):
        try:
            PGVectorManagerLog.info("Asking question...")
            if self.get_db_collection():
                docs_with_score = self.find_similarity_with_score(question, top_k)
                if len(docs_with_score) > 0:
                    for doc, score in docs_with_score:
                        conversation_chain = ConversationalRetrievalChain.from_llm(
                            llm=self.llm,
                            retriever=self.db.as_retriever(search_kwargs={'k': 1, 'filter': doc.metadata}),
                            memory=self.memory,
                            max_tokens_limit=4000,
                            verbose=bool(os.getenv("AI_DEBUG", False))
                        )
                        print("Conversation Chain Loaded")
                        response = conversation_chain.invoke({"question": str(question)})
                else:
                    print("No document found")
            else:
                print("Database not found")
        except Exception as e:
            print(e)
            PGVectorManagerLog.error(e)
