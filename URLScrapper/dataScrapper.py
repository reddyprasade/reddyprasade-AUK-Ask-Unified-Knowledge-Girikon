import sqlite3


class DBManagerScrapper:
    def __init__(self, db_name):
        """
        Initialize the DBManager with the database name.
        """
        self.db_name = db_name
        self.connection = None
        self.cursor = None

    def connect(self):
        """
        Connect to the SQLite database.
        """
        try:
            self.connection = sqlite3.connect(self.db_name)
            self.cursor = self.connection.cursor()
            print(f"Connected to {self.db_name} database.")
        except sqlite3.Error as e:
            print(f"Failed to connect to database: {e}")

    def create_table(self, table_name):
        """
        Create a table in the database with specific columns.

        Parameters:
        table_name (str): The name of the table to create.
        """
        try:
            # Define the columns with the 'url' field set as UNIQUE
            columns = '''
            id INTEGER PRIMARY KEY,
            url TEXT UNIQUE,
            content TEXT,
            docs TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending'
            '''
            create_table_query = f"CREATE TABLE IF NOT EXISTS {table_name} ({columns})"
            self.cursor.execute(create_table_query)
            self.connection.commit()
            # print(f"Table '{table_name}' created successfully.")
        except sqlite3.Error as e:
            print(f"Failed to create table: {e}")

    def insert_data(self, table_name, url, content, docs):
        """
        Insert data into the specified table.

        Parameters:
        table_name (str): The name of the table.
        url (str): The URL to insert (must be unique).
        content (str): The content to insert.
        docs (str): The docs to insert.
        """
        try:
            insert_query = f"INSERT INTO {table_name} (url, content, docs) VALUES (?, ?, ?)"
            self.cursor.execute(insert_query, (url, content, docs))
            self.connection.commit()
            # print(f"Data inserted successfully into '{table_name}'.")
        except sqlite3.IntegrityError as e:
            print(f"Failed to insert data: {e} - This URL might already exist.")
        except sqlite3.Error as e:
            print(f"An error occurred: {e}")

    def upsert_data(self, table_name, url, content, docs, status='pending'):
        """
        Upsert data into the specified table.

        Parameters:
        table_name (str): The name of the table.
        url (str): The URL to insert or update (must be unique).
        content (str): The content to insert or update.
        docs (str): The docs to insert or update.
        """
        try:
            upsert_query = f"""INSERT INTO {table_name} (url, content, docs, status) VALUES (?, ?, ?, ?) ON CONFLICT(url) DO NOTHING;"""
            self.cursor.execute(upsert_query, (url, content, docs, status))
            self.connection.commit()
            # print(f"Data upserted successfully into '{table_name}'.")
        except sqlite3.Error as e:
            print(f"Failed to upsert data: {e}")

    def update_content(self, table_name, id, content, docs, status='done'):
        """
        Update the status of a row in the specified table.

        Parameters:
        table_name (str): The name of the table.
        id (int): The ID of the row to update.
        status (str): The status to update to.
        """
        try:
            update_query = f"UPDATE {table_name} SET content = ?, docs = ?, status = ? WHERE id = ?;"
            self.cursor.execute(update_query, (content, docs, status, id))
            self.connection.commit()
            # print(f"Status updated successfully in '{table_name}'.")
        except sqlite3.Error as e:
            print(f"Failed to update status: {e}")

    def fetch_urls(self, table_name):
        """
        Fetch all URLs from the specified table.

        Parameters:
        table_name (str): The name of the table to fetch URLs from.

        Returns:
        list of str: A list of URLs.
        """

        try:
            fetch_query = f"SELECT id, url FROM {table_name} WHERE status = 'pending' ORDER BY id LIMIT 1;"
            self.cursor.execute(fetch_query)
            for row in self.cursor.fetchall():
                id, url = row
                update_query = f"UPDATE {table_name} SET status = 'processing' WHERE id = ?;"
                self.cursor.execute(update_query, (id,))
                self.connection.commit()
                # print(f"URL '{url}' fetched successfully from '{table_name}'.")
                return id, url
            return None, None
        except sqlite3.Error as e:
            print(f"Failed to fetch URLs: {e}")
            return []

    def close(self):
        """
        Close the connection to the SQLite database.
        """
        if self.connection:
            self.connection.close()
            print(f"Connection to {self.db_name} closed.")
