"""
NJSS スクレイパー

使い方:
  python main.py          # モックモードで実行（実際のサイトにアクセスしない）
  python main.py --real   # 実際のNJSSにアクセスして取得
"""

import argparse
from scraper.login import create_driver, login
from scraper.list_scraper import scrape_list, scrape_list_mock
from scraper.detail_scraper import scrape_details, scrape_details_mock
from storage.gspread_client import write_bids, write_bids_mock


def run_mock():
    """モックモード: ダミーデータで全体の流れを確認"""
    print("=" * 50)
    print("NJSS スクレイパー [モックモード]")
    print("=" * 50)

    bids = scrape_list_mock()
    bids = scrape_details_mock(bids)
    write_bids_mock(bids)

    print("\n完了！")


def run_real():
    """本番モード: 実際にNJSSにアクセスして取得"""
    print("=" * 50)
    print("NJSS スクレイパー [本番モード]")
    print("=" * 50)

    driver = create_driver()
    try:
        if not login(driver):
            print("ログインに失敗しました。認証情報を確認してください。")
            return

        bids = scrape_list(driver)
        bids = scrape_details(driver, bids)
        write_bids(bids)

        print("\n完了！")
    finally:
        driver.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--real", action="store_true", help="実際のNJSSにアクセス")
    args = parser.parse_args()

    if args.real:
        run_real()
    else:
        run_mock()
