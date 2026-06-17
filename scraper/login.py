from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import config


def create_driver() -> webdriver.Chrome:
    options = Options()
    if config.HEADLESS:
        options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)


def login(driver: webdriver.Chrome) -> bool:
    """NJSSにログインする。成功したらTrueを返す。"""
    print(f"ログイン中: {config.NJSS_LOGIN_URL}")
    driver.get(config.NJSS_LOGIN_URL)

    wait = WebDriverWait(driver, config.WAIT_TIMEOUT)

    # メールアドレス入力
    email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
    email_input.clear()
    email_input.send_keys(config.NJSS_EMAIL)

    # パスワード入力
    password_input = driver.find_element(By.NAME, "password")
    password_input.clear()
    password_input.send_keys(config.NJSS_PASSWORD)

    # ログインボタンクリック
    login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    login_button.click()

    # ログイン成功確認（URLが変わるのを待つ）
    try:
        wait.until(EC.url_changes(config.NJSS_LOGIN_URL))
        print("ログイン成功")
        return True
    except Exception:
        print("ログイン失敗: タイムアウト")
        return False
