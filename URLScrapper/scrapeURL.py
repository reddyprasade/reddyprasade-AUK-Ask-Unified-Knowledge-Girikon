import pandas as pd
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
import time
from selenium import webdriver
from .dataScrapper import DBManagerScrapper
import requests
import os
from io import BytesIO
from PyPDF2 import PdfReader
import sqlite3

class WebScraper:
    options = webdriver.ChromeOptions()
    options.add_argument('headless')  # Run in headless mode (optional)
    options.add_argument('disable-gpu')  # Disable GPU acceleration (optional)
    options.add_argument('no-sandbox')  # Bypass OS security
    options.add_argument('disable-dev-shm-usage')  # Overcome limited resource problems
    options.add_argument('disable-extensions')  # Disable extensions (optional)
    options.add_argument('disable-infobars')  # Disable info bars (optional)
    options.add_argument('start-maximized')  # Start maximized (optional)
    options.add_argument('disable-popup-blocking')  # Disable popup blocking (optional)
    options.add_argument('disable-default-apps')  # Disable default apps (optional)
    options.add_argument("--chromedriver=/usr/lib/chromium-browser/chromedriver")
    save_directory = "../docs/"
    os.makedirs(save_directory, exist_ok=True)
    driver = webdriver.Chrome(options=options)
    #driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options) #ref Link 'https://github.com/password123456/setup-selenium-with-chrome-driver-on-ubuntu_debian'
    try:
        os.remove("my_database.db")
    except Exception as e:
        print(e,"No SQL Lite DB Found")
    db = DBManagerScrapper('my_database.db')
    id = 0
    tbl_name = 'testing'
    url = ''
    whitelist = []
    urls = []
    content = ''
    docs = ""
    single_url_docs=[]
    status = 'pending'
    all_tags = ['a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio', 'b', 'base',
                'basefont', 'bdi', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption',
                'center', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn',
                'dialog', 'dir', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font',
                'footer', 'form', 'frame', 'frameset', 'h1 to h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i',
                'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark',
                'menu', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option',
                'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script',
                'search', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong', 'style', 'sub',
                'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead',
                'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']
    relevant_tags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'li', 'table', 'tr', 'td', 'th',
                     'blockquote', 'code', 'pre', 'span', 'section', 'article', 'aside', 'figure', 'figcaption',
                     'a', 'img', 'iframe', 'form', 'input', 'button', 'select', 'option', 'textarea', 'label',
                     'fieldset', 'legend', 'strong', 'em', 'i', 'b', 'u', 's', 'sub', 'sup', 'abbr', 'address',
                     'cite', 'time', 'samp', 'kbd', 'var', 'mark', 'del', 'ins', 'small', 'big', 'font', 'center',
                     'dir', 'menu', 'caption', 'summary', 'details', 'dialog', 'menuitem', 'main', 'title', 'embed']

    def __init__(self, url, whitelist):
        self.whitelist = whitelist
        try:
            self.db.connect()
            self.db.create_table(self.tbl_name)
            self.db.upsert_data(self.tbl_name, url, '', '', 'pending')
        except Exception as e:
            print(f"Error initializing the WebScraper: {e}")

        self.extract_website_data()

    def get_url(self):
        try:
            data = self.db.fetch_urls(self.tbl_name)
            self.id = data[0]
            self.url = data[1]
            print("Running for\t", self.id, self.url)
        except Exception as e:
            print(f"Error fetching URLs from database: {e}")

    def remove_duplicate_lines(self, content):
        try:
            seen = set()
            unique_lines = []
            for line in content.splitlines():
                line.strip()
                if line not in seen:
                    unique_lines.append(line)
                    seen.add(line)

            return '\n'.join(unique_lines)
        except Exception as e:
            print(f"Error fetching URLs from database: {e}")
            return content

    def remove_unrelated_tag(self, soup):
        # try:
        #     soup.find('header').decompose()
        # except:
        #     pass
        # try:
        #     soup.find('footer').decompose()
        # except:
        #     pass
        try:
            soup.find('nav').decompose()
        except:
            pass
        try:
            soup.find('div', id='google-translate-container').decompose()
        except:
            pass

    def is_valid_url(self, url):
        try:
            # print("URL", url)
            result = urlparse(url)
            # print(all([result.scheme, result.netloc]), result.scheme, result.netloc)
            return all([result.scheme, result.netloc])
        except Exception as e:
            print("Exception Caught in Url", e)
            return False

    def get_all_hyperlink(self, soup, url):
        # Extract all hyperlinks from the soup object
        sub_urls = [urljoin(url, link['href']) for link in soup.find_all('a', href=True) if not link['href'].startswith(('tel:', 'mailto:'))]

        # Insert each URL into the database
        for sub_url in sub_urls:
            try:
                status = "not-whitelisted"
                if True in [sub_url.find(x) > -1 for x in self.whitelist]:
                    status = "pending"
                self.db.upsert_data(self.tbl_name, sub_url, '', '', status)
            except Exception as e:
                print(f"Error inserting URL into database: {e}")

        # Print all the URLs
        # print("Urls:", sub_urls)
        return sub_urls

    def check_for_docs(self, soup):
        try:
            
            # Check if the webpage contains any document files
            # docs = [link['href'] for link in soup.find_all('a', href=True) if link['href'].endswith(('.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'))]
            print(soup.find_all(['embed']))
            docs = [link for link in soup.find_all(['embed'])]
            print("Docs:", docs)
            # for pdf_link in docs:
            if self.url:
                print("PDF Link", self.url)
                response = requests.get(self.url)
                filename = self.url.split('/')[-1]  # Extract the filename from the URL
                if not os.path.exists("../uploads"):
                    os.makedirs("../uploads")
                if not filename.lower().endswith('.pdf'):
                    filename += '.pdf'
                with open(os.path.join("../uploads"+filename), 'wb') as pdf_file:
                    pdf_file.write(response.content)
                pdf = PdfReader(BytesIO(response.content))
                pdf_text = ''
                for page in pdf.pages:
                    pdf_text += page.extract_text()
                self.db.update_content(self.tbl_name, self.id, pdf_text, (str(self.docs) + str('\n'.join(self.urls) or '')), self.status)

                print("docs result",pdf_text)
            
        except Exception as e:
            return ''

    def extract_website_data(self):
        self.urls = []
        self.content = ''
        self.docs = ''
        self.status = 'done'
        self.get_url()

        try:
            if not self.is_valid_url(self.url):
                raise ValueError(f"Invalid URL: {self.url}")
            self.driver.get('data:,')
            time.sleep(1)
            self.driver.get(self.url)
            time.sleep(2)
            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            # print(soup.prettify())
            if soup.get_text().strip() == '':
                self.status = 'document'  # 
                self.check_for_docs(soup)
            else:
                self.remove_unrelated_tag(soup)
                self.urls = self.get_all_hyperlink(soup, self.url)

                text_elements = soup.find_all(self.relevant_tags)

                self.content = '\n'.join([element.get_text().strip() for element in text_elements])
                self.db.update_content(self.tbl_name, self.id, self.remove_duplicate_lines(self.content), (str(self.docs) + str('\n'.join(self.urls) or '')), self.status)
        except Exception as e:
            print(f"Error fetching webpage '{self.url}': {e}")
            self.db.update_content(self.tbl_name, self.id, '', str(self.docs), 'error')
        finally:
            #self.extract_website_data()
            self.driver.quit()
            try:
                os.removedirs("../uploads")
                print("Directory './uploads' and its subdirectories removed successfully.")
            except Exception as e:
                pass
            try:
                os.removedirs("../docs")
                print("Directory './docs' and its subdirectories removed successfully.")
            except Exception as e:
                pass

def getDataFrameWebScrawler():
        conn = sqlite3.connect("my_database.db")
        print("Connection with SQLLite created")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM testing;")
        resultsData = cursor.fetchall()
        print("DB data is",resultsData[0])
        try:
            cursor.execute("Drop Table testing;")
        except Exception as e:
            print("Error in deleting table",e)
        conn.close()
        resultsDF = pd.DataFrame(resultsData,columns = ["id","url","content","docs","created_at","Status"])
        return resultsDF
