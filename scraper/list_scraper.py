import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from models.bid import Bid
import config

# モック用ダミーデータ
MOCK_BIDS = [
    {
        "bid_id": f"NJSS-2024-{str(i).zfill(5)}",
        "title": f"令和6年度 システム開発業務委託 案件{i}",
        "organization": ["東京都", "大阪府", "愛知県", "神奈川県", "福岡県"][i % 5],
        "bid_type": ["一般競争入札", "指名競争入札", "随意契約"][i % 3],
        "announced_date": f"2024-{(i % 12) + 1:02d}-01",
        "deadline": f"2024-{(i % 12) + 1:02d}-28",
        "detail_url": f"https://www.njss.info/offers/view/{i}/",
    }
    for i in range(1, 51)
]


def scrape_list_mock() -> list[Bid]:
    """モック: ダミーデータで一覧を返す"""
    print(f"[MOCK] 案件一覧を取得中 (最大{config.MAX_ITEMS}件)")
    bids = []
    for item in MOCK_BIDS[:config.MAX_ITEMS]:
        bids.append(Bid(**item))
        print(f"  取得: {item['bid_id']} - {item['title']}")
    print(f"一覧取得完了: {len(bids)}件")
    return bids


def scrape_list(driver: webdriver.Chrome) -> list[Bid]:
    """実際のスクレイピング（ログイン後に呼ぶ）"""
    print(f"案件一覧を取得中: {config.NJSS_LIST_URL}")
    driver.get(config.NJSS_LIST_URL)

    wait = WebDriverWait(driver, config.WAIT_TIMEOUT)
    bids = []

    while len(bids) < config.MAX_ITEMS:
        # TODO: 実際のセレクタはNJSSのHTMLを確認して設定する
        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".offer-item")))
        items = driver.find_elements(By.CSS_SELECTOR, ".offer-item")

        for item in items:
            if len(bids) >= config.MAX_ITEMS:
                break
            try:
                bid = Bid(
                    bid_id=item.get_attribute("data-id") or "",
                    title=item.find_element(By.CSS_SELECTOR, ".offer-title").text,
                    organization=item.find_element(By.CSS_SELECTOR, ".offer-org").text,
                    bid_type=item.find_element(By.CSS_SELECTOR, ".offer-type").text,
                    announced_date=item.find_element(By.CSS_SELECTOR, ".offer-date").text,
                    deadline=item.find_element(By.CSS_SELECTOR, ".offer-deadline").text,
                    detail_url=item.find_element(By.TAG_NAME, "a").get_attribute("href") or "",
                )
                bids.append(bid)
            except Exception as e:
                print(f"  スキップ: {e}")

        # 次のページへ
        try:
            next_btn = driver.find_element(By.CSS_SELECTOR, ".pagination-next:not(.disabled)")
            next_btn.click()
            time.sleep(random.uniform(1.5, 3.0))  # サーバー負荷軽減
        except Exception:
            break  # 次ページなし

    print(f"一覧取得完了: {len(bids)}件")
    return bids
