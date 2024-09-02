import json
import os
import sys
import uuid

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

from databases.QueryGenerator import DBHelper

sys.path.append(os.path.join(os.getcwd(), '..'))
from logger import CustomLogger

load_dotenv()  # take environment variables from .env.
DBManagerNodeLog = CustomLogger.get_logger("DBManagerNodeLog")


class DBManagerNode():

    def __init__(self, _collection_id):
        #DBManagerNodeLog.info(f"Initializing DBManager for collection_id: {_collection_id}")
        try:
            self.collection_id = _collection_id
    
            __driver = os.getenv("PGVECTOR_DRIVER")
            __user = os.getenv("PGVECTOR_USER")
            __password = os.getenv("PGVECTOR_PASSWORD")
            __host = os.getenv("PGVECTOR_HOST")
            __port = os.getenv("PGVECTOR_PORT")
            __database = os.getenv("PGVECTOR_DATABASE")
            conn_string = f"postgresql+{__driver}://{__user}:{__password}@{__host}:{__port}/{__database}"
            # print(conn_string)
            self.engine = create_engine(conn_string)
            self.connection = self.engine.connect()
            DBManagerNodeLog.info("DBManagerNodeLog::Connection opened")
        except Exception as e:
            DBManagerNodeLog.error(f"Error in DBManagerNodeLog::__init__ {e}")

    def execute(self, query):
        return self.connection.execute(text(query))

    def execute_with_autocommit(self, query):
        self.connection.execution_options(isolation_level="AUTOCOMMIT").execute(text(query))

    def close(self):
        DBManagerNodeLog.info("Closing connection...")
        if self.connection:
            self.connection.close()

    def update_vector_and_assistant_ids_into_collection(self, assistant_id, vector_store_id):
        self.execute_with_autocommit(f"UPDATE public.collections SET c_vector_store_id = '{vector_store_id}', c_assistant_id = '{assistant_id}' WHERE c_id = '{self.collection_id}'")
        self.close()
        
    # def deleteOneFile(self, collection_id, file_name):
    #     collection_id = collection_id.replace("-","")
    #     self.execute_with_autocommit(f"""DELETE FROM "d{collection_id}".documents_embedding WHERE metadata->> 'filename' = '{file_name}';""")
    #     self.close()

