import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from models.bid import Bid
import config

MOCK_DETAILS = {
    "budget": ["500万円", "1,000万円", "2,000万円", "非公開", "300万円"],
    "location": ["東京都千代田区", "大阪府大阪市", "愛知県名古屋市", "神奈川県横浜市", "福岡県福岡市"],
    "category": ["情報システム", "建設工事", "物品購入", "業務委託", "コンサルティング"],
    "contact": ["調達課 03-XXXX-XXXX", "契約係 06-XXXX-XXXX", "総務課 052-XXX-XXXX"],
    "description": [
        "行政システムの開発・保守業務",
        "公共施設の改修工事",
        "事務用品の一括購入",
        "業務フロー改善コンサルティング",
    ],
    "requirements": [
        "ISO27001取得企業、実績3件以上",
        "建設業許可（一般）、地元業者優先",
        "中小企業、納品実績あり",
    ],
}


def scrape_detail_mock(bid: Bid) -> Bid:
    """モック: ダミーの詳細情報を付与して返す"""
    i = int(bid.bid_id.split("-")[-1]) - 1
    bid.budget = MOCK_DETAILS["budget"][i % len(MOCK_DETAILS["budget"])]
    bid.location = MOCK_DETAILS["location"][i % len(MOCK_DETAILS["location"])]
    bid.category = MOCK_DETAILS["category"][i % len(MOCK_DETAILS["category"])]
    bid.contact = MOCK_DETAILS["contact"][i % len(MOCK_DETAILS["contact"])]
    bid.description = MOCK_DETAILS["description"][i % len(MOCK_DETAILS["description"])]
    bid.requirements = MOCK_DETAILS["requirements"][i % len(MOCK_DETAILS["requirements"])]
    return bid


def scrape_details_mock(bids: list[Bid]) -> list[Bid]:
    """モック: 全件に詳細情報を付与"""
    print(f"[MOCK] 詳細情報を取得中 ({len(bids)}件)")
    result = []
    for i, bid in enumerate(bids):
        result.append(scrape_detail_mock(bid))
        print(f"  [{i+1}/{len(bids)}] {bid.bid_id}")
    print("詳細取得完了")
    return result


def scrape_details(driver: webdriver.Chrome, bids: list[Bid]) -> list[Bid]:
    """実際のスクレイピング: 各詳細ページを開いて情報を取得"""
    wait = WebDriverWait(driver, config.WAIT_TIMEOUT)
    result = []

    for i, bid in enumerate(bids):
        print(f"  [{i+1}/{len(bids)}] 詳細取得中: {bid.detail_url}")
        try:
            driver.get(bid.detail_url)
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".offer-detail")))

            # TODO: 実際のセレクタはNJSSのHTMLを確認して設定する
            bid.budget = _safe_text(driver, ".offer-budget")
            bid.location = _safe_text(driver, ".offer-location")
            bid.category = _safe_text(driver, ".offer-category")
            bid.contact = _safe_text(driver, ".offer-contact")
            bid.description = _safe_text(driver, ".offer-description")
            bid.requirements = _safe_text(driver, ".offer-requirements")

            time.sleep(random.uniform(1.5, 3.0))  # サーバー負荷軽減
        except Exception as e:
            print(f"    エラー: {e}")

        result.append(bid)

    print("詳細取得完了")
    return result


def _safe_text(driver: webdriver.Chrome, selector: str) -> str:
    try:
        return driver.find_element(By.CSS_SELECTOR, selector).text.strip()
    except Exception:
        return ""
