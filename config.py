from dotenv import load_dotenv
import os

load_dotenv()

# NJSS認証情報
NJSS_EMAIL = os.getenv("NJSS_EMAIL", "")
NJSS_PASSWORD = os.getenv("NJSS_PASSWORD", "")
NJSS_LOGIN_URL = "https://www.njss.info/login"
NJSS_LIST_URL = "https://www.njss.info/offers/"

# Google Sheets
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID", "")
WORKSHEET_NAME = "入札案件"

# スクレイピング設定
MAX_ITEMS = 50
HEADLESS = True  # Falseにするとブラウザが見える
WAIT_TIMEOUT = 10
