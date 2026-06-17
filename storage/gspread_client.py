import gspread
from google.oauth2.service_account import Credentials
from models.bid import Bid
import config

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


def get_worksheet():
    """Google Sheetsのワークシートを取得（なければ作成）"""
    creds = Credentials.from_service_account_file(config.GOOGLE_CREDENTIALS_FILE, scopes=SCOPES)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key(config.SPREADSHEET_ID)

    try:
        worksheet = spreadsheet.worksheet(config.WORKSHEET_NAME)
    except gspread.exceptions.WorksheetNotFound:
        worksheet = spreadsheet.add_worksheet(title=config.WORKSHEET_NAME, rows=1000, cols=20)

    return worksheet


def write_bids(bids: list[Bid]) -> None:
    """案件データをスプレッドシートに書き込む"""
    print(f"Google Sheetsに書き込み中: {len(bids)}件")
    worksheet = get_worksheet()

    # 既存データをクリア
    worksheet.clear()

    # ヘッダー + データ行
    rows = [Bid.header_row()] + [bid.to_row() for bid in bids]
    worksheet.update("A1", rows)

    # ヘッダー行を太字に
    worksheet.format("A1:M1", {"textFormat": {"bold": True}})

    print(f"書き込み完了: https://docs.google.com/spreadsheets/d/{config.SPREADSHEET_ID}")


def write_bids_mock(bids: list[Bid]) -> None:
    """モック: 実際には書き込まずコンソールに表示"""
    print("\n[MOCK] Google Sheetsに書き込む内容:")
    print(" | ".join(Bid.header_row()))
    print("-" * 80)
    for bid in bids[:5]:  # 先頭5件だけ表示
        print(" | ".join(str(v) for v in bid.to_row()))
    if len(bids) > 5:
        print(f"  ... 他 {len(bids) - 5} 件")
    print(f"\n合計 {len(bids)} 件を書き込み予定")
