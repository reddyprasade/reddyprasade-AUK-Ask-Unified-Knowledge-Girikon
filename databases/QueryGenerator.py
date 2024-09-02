import os
import sys
import hashlib

sys.path.append(os.path.join(os.getcwd(), '..'))
from logger import CustomLogger

DBHelperLog = CustomLogger.get_logger("DBHelper")


class DBHelper:

    def __init__(self, _collection_id):
        # DBHelperLog.info(f"Initializing DBHelper for collection_id: {_collection_id}")
        self.collection_id_original = _collection_id
        self.collection_id = _collection_id.lower().replace("-", "")

    def get_database_name(self):
        return f'd{self.collection_id}'

    def get_role_name(self):
        return f'u{self.collection_id[::-1]}'

    def get_password(self):
        return 'p' + hashlib.sha256(str.encode(self.collection_id)).hexdigest()

    def get_role_create_query(self):
        return f"CREATE ROLE {self.get_role_name()} WITH LOGIN SUPERUSER PASSWORD '{self.get_password()}'"

    def get_database_create_query(self):
        return f"CREATE DATABASE {self.get_database_name()} WITH OWNER {self.get_role_name()}"

    def get_schema_create_query(self):
        s = f"CREATE SCHEMA IF NOT EXISTS {self.get_database_name()};"
        print(s)
        return s

    def get_table_create_query(self):
        t = f"CREATE TABLE IF NOT EXISTS {self.get_database_name()}.documents_embedding(id uuid NOT NULL PRIMARY KEY,collection_id uuid,embedding public.vector,document TEXT,metadata JSONB,version VARCHAR,file TEXT);"
        return t

    def get_table_create_prompt_query(self):
        t = f"CREATE TABLE IF NOT EXISTS {self.get_database_name()}.questions(id uuid NOT NULL PRIMARY KEY,question text, model_type varchar default 'baali', embedding public.vector);"
        return t

    def get_grant_query(self):
        return f"GRANT ALL PRIVILEGES ON DATABASE {self.get_database_name()} TO {self.get_role_name()}"

    def get_revoke_query(self):
        return f"REVOKE ALL PRIVILEGES ON DATABASE {self.get_database_name()} FROM {self.get_role_name()}"

    def get_drop_role_query(self):
        return f"DROP ROLE IF EXISTS {self.get_role_name()}"

    def get_drop_database_query(self):
        return f"DROP DATABASE IF EXISTS {self.get_database_name()}"

    def get_drop_schema_query(self):
        return f"DROP SCHEMA IF EXISTS {self.get_database_name()}"

    def get_drop_table_query(self):
        return f"DROP TABLE IF EXISTS {self.get_database_name()}.documents_embedding"

    def is_database_exist_query(self):
        return f"SELECT 1 FROM pg_database WHERE datname = '{self.get_database_name()}'"

    def is_schema_exist_query(self):
        return f"SELECT 1 FROM information_schema.schemata WHERE schema_name = '{self.get_database_name()}'"

    def is_role_exist_query(self):
        return f"SELECT 1 FROM pg_roles WHERE rolname = '{self.get_role_name()}'"

    def is_privilege_exist_query(self):
        return f"SELECT 1 FROM pg_database WHERE datname = '{self.get_database_name()}' AND datacl LIKE '%{self.get_role_name()}%'"

    def get_all_databases(self):
        return "SELECT datname FROM pg_database WHERE datistemplate = false and datname != 'postgres'"

    def get_all_roles(self):
        return "SELECT * FROM pg_roles where rolcanlogin = true and rolname != 'postgres'"

    def move_rows_from_one_database_table_to_another_database_schema(self, from_database_name, from_table, to_database_name, to_schame, to_table):
        return f"INSERT INTO {to_schame}.{to_table} SELECT * FROM {from_database_name}.{from_table}"

    def get_insert_query(self):
        return f"INSERT INTO {self.get_database_name()}.documents_embedding (id, collection_id, embedding, document, metadata, version, file) VALUES (%s, %s, %s, %s, %s, %s, %s);"

    def get_document_exist_query(self):
        return f"SELECT id FROM {self.get_database_name()}.documents_embedding WHERE metadata = %s and version = %s"

    def get_question_embedding(self, _text, selected_key):
        return f"select embedding from {self.get_database_name()}.questions where question = '{_text}' and model_type='{selected_key}';"

    def insert_question_embedding_query(self):
        return f"insert into {self.get_database_name()}.questions (id, question, model_type, embedding) values (%s, %s, %s, %s);"

    def remove_document_query(self):
        return f"DELETE FROM {self.get_database_name()}.documents_embedding WHERE id = %s"

    def get_search_query(self, vector, limit):
        return f"SELECT (embedding <#> '{vector}') AS cosine_similarity, metadata, file FROM {self.get_database_name()}.documents_embedding where 1 - (embedding <#> '{vector}') > {self.threshold} order by (embedding <#> '{vector}') LIMIT {limit};"

    def get_context_query(self, filename, page_number, version):
        return f"select STRING_AGG(document,' ') as doc from {self.get_database_name()}.documents_embedding where metadata->> 'page_number' = '{page_number}' and metadata->> 'filename' = '{filename}';"
