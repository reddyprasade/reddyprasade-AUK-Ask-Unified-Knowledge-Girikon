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
DBManagerLog = CustomLogger.get_logger("DBManager")


class DBManager(DBHelper):

    def __init__(self, _collection_id, selected_key):
        self.selected_key = selected_key or "baali"
        #DBManagerLog.info(f"Initializing DBManager for collection_id: {_collection_id}")
        super().__init__(_collection_id)

        __driver = os.getenv("PG_AI_CHATGPT_DRIVER")
        __user = os.getenv("PG_AI_CHATGPT_USER")
        __password = os.getenv("PG_AI_CHATGPT_PASSWORD")
        __host = os.getenv("PG_AI_CHATGPT_HOST")
        __port = os.getenv("PG_AI_CHATGPT_PORT")
        __database = os.getenv("PG_AI_CHATGPT_DATABASE")
        conn_string = f"postgresql+{__driver}://{__user}:{__password}@{__host}:{__port}/{__database}"
        # print(conn_string)
        self.engine = create_engine(conn_string)
        self.connection = self.engine.connect()
        DBManagerLog.info("DBManager::Connection opened")

    def get_connection_string(self):
        return f"postgresql+{os.getenv('DRIVER')}://{os.getenv('USER')}:{os.getenv('PASSWORD')}@{os.getenv('HOST')}:{os.getenv('PORT')}/{os.getenv('DATABASE')}'"

    def execute(self, query):
        return self.connection.execute(text(query))

    def execute_with_autocommit(self, query):
        self.connection.execution_options(isolation_level="AUTOCOMMIT").execute(text(query))

    def create_role(self):
        DBManagerLog.info("Creating role...")
        self.execute_with_autocommit(self.get_role_create_query())

    def create_database(self):
        DBManagerLog.info("DBManager::Creating database...")
        self.execute_with_autocommit(self.get_database_create_query())

    def create_schema(self):
        DBManagerLog.info("DBManager::Creating schema...")
        self.execute_with_autocommit(self.get_schema_create_query())

    def create_table(self):
        DBManagerLog.info("DBManager::Creating table...")
        self.execute_with_autocommit(self.get_table_create_query())
        self.execute_with_autocommit(self.get_table_create_prompt_query())

    def grant_privileges(self):
        DBManagerLog.info("Granting privileges...")
        self.execute_with_autocommit(self.get_grant_query())

    def revoke_privileges(self):
        DBManagerLog.info("Revoking privileges...")
        self.execute_with_autocommit(self.get_revoke_query())

    def drop_role(self):
        DBManagerLog.info("Dropping role...")
        self.execute_with_autocommit(self.get_drop_role_query())

    def drop_database(self):
        DBManagerLog.info("Dropping database...")
        self.execute_with_autocommit(self.get_drop_database_query())

    def drop_schema(self):
        DBManagerLog.info("Dropping schema...")
        self.execute_with_autocommit(self.get_drop_schema_query())

    def drop_table(self):
        DBManagerLog.info("Dropping table...")
        self.execute_with_autocommit(self.get_drop_table_query())

    def is_database_exist(self):
        DBManagerLog.info("Checking if database exists...")
        result = self.execute(self.is_database_exist_query())
        return result.fetchone() is not None

    def is_schema_exist(self):
        DBManagerLog.info("Checking if schema exists...")
        result = self.execute(self.is_schema_exist_query())
        return result.fetchone() is not None

    def close(self):
        DBManagerLog.info("Closing connection...")
        if self.connection:
            self.connection.close()

    def init(self):
        DBManagerLog.info("Initializing ...")
        if not self.is_schema_exist():
            self.create_schema()
            self.create_table()

    def remove(self):
        DBManagerLog.info("Removing...")
        if self.is_schema_exist():
            self.drop_schema()
            self.drop_table()

    def is_document_exist(self, metadata=dict(), version='1') -> bool:
        metadata = json.dumps(metadata)
        result = self.connection.execute(self.get_document_exist_query(), str(metadata), version)
        return result.fetchone()

    def remove_document(self, id):
        self.connection.execute(self.remove_document_query(), id)

    def get_question_data(self, _text, selected_key):
        result = self.connection.execute(self.get_question_embedding(_text, selected_key))
        return result.fetchone()

    def insert_question_embedding(self, _prompt, embedding=None, selected_key="baali"):
        DBManagerLog.info("Inserting question embedding...")
        __id = str(uuid.uuid4())
        self.connection.execute(self.insert_question_embedding_query(), (__id, str(_prompt), str(selected_key or 'baali'), str(embedding)))

    def insert_embedding(self, embedding=None, document="", metadata=dict(), version='1', file='', force_override=False):
        DBManagerLog.info("Inserting embedding...")

        is_document_exist = self.is_document_exist(metadata, version)
        id = str(uuid.uuid4())
        collection_id = self.collection_id
        q = self.get_insert_query()

        # print("is_document_exist", is_document_exist)
        # print("is_document_exist id=", is_document_exist["id"])
        if is_document_exist is not None and not force_override:
            print("if")
            version = str(int(version) + 1)
            return self.insert_embedding(embedding, document, metadata, version, file, force_override)
        elif is_document_exist is not None and force_override:
            print("elif")
            id = is_document_exist["id"]

        print("insert")
        metadata = json.dumps(metadata)
        DBManagerLog.info(q)
        DBManagerLog.info("id=" + id)
        DBManagerLog.info("version=" + version)
        DBManagerLog.info("file=" + file)
        DBManagerLog.info("metadata=" + metadata)
        DBManagerLog.info("collection_id=" + collection_id)

        self.connection.execute(q, (id, collection_id, str(embedding), document, str(metadata), version, file))

    def search_in_db(self, vector, k=3):
        print("search question vector in db...")
        try:
            _query = self.get_search_query(vector, k)
            # print("SQL Query is",_query)
            return self.connection.execute(_query)
        except Exception as e:
            print("search_in_db", e)
            return None

    def get_context_data(self, _dict):
        filename = _dict["filename"] if "filename" in _dict else ""
        page_number = _dict["page_number"] if "page_number" in _dict else 0
        version = _dict["version"] if "version" in _dict else "1"
        _query = self.get_context_query(filename, page_number, version)
        df = pd.read_sql(_query, self.connection)
        return df.loc[0, 'doc']

    def get_role_create_query(self):

        return f"CREATE ROLE {self.role} WITH LOGIN PASSWORD"
    
    def deleteOneFile(self, collection_id, file_name):
        collection_id = collection_id.replace("-","")
        self.execute_with_autocommit(f"""DELETE FROM "d{collection_id}".documents_embedding WHERE metadata->> 'filename' = '{file_name}';""")
        self.close()
