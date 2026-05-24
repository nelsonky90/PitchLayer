from datetime import datetime
from typing import Optional

import gspread
from google.oauth2.service_account import Credentials

from .parser import HomeInfo

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

HEADERS = [
    "Date Received",
    "Address",
    "Price",
    "Beds",
    "Baths",
    "Sq Ft",
    "Year Built",
    "Source",
    "Link",
    "Notes",
    "Status",  # user fills in: Interested / Pass / Visited / Offer
]


def _open_worksheet(sheet_id: str, tab_name: str, credentials_file: str) -> gspread.Worksheet:
    creds = Credentials.from_service_account_file(credentials_file, scopes=SCOPES)
    gc = gspread.authorize(creds)
    spreadsheet = gc.open_by_key(sheet_id)
    try:
        return spreadsheet.worksheet(tab_name)
    except gspread.WorksheetNotFound:
        ws = spreadsheet.add_worksheet(tab_name, rows=1000, cols=len(HEADERS))
        return ws


def ensure_headers(sheet_id: str, tab_name: str, credentials_file: str) -> None:
    ws = _open_worksheet(sheet_id, tab_name, credentials_file)
    if ws.row_values(1) != HEADERS:
        ws.insert_row(HEADERS, index=1)
        # Bold and freeze the header row
        ws.format("1:1", {"textFormat": {"bold": True}})
        ws.freeze(rows=1)


def is_duplicate(
    sheet_id: str,
    tab_name: str,
    credentials_file: str,
    url: Optional[str],
    address: Optional[str],
) -> bool:
    if not url and not address:
        return False
    ws = _open_worksheet(sheet_id, tab_name, credentials_file)
    for row in ws.get_all_values()[1:]:  # skip header
        existing_url = row[8] if len(row) > 8 else ""
        existing_addr = row[1] if len(row) > 1 else ""
        if url and existing_url and url in existing_url:
            return True
        if address and existing_addr and address.lower() == existing_addr.lower():
            return True
    return False


def append_home(
    sheet_id: str,
    tab_name: str,
    credentials_file: str,
    home: HomeInfo,
    received_at: datetime,
) -> None:
    ws = _open_worksheet(sheet_id, tab_name, credentials_file)
    row = [
        received_at.strftime("%Y-%m-%d %H:%M"),
        home.address or "",
        home.price or "",
        home.beds or "",
        home.baths or "",
        home.sqft or "",
        home.year_built or "",
        home.source or "",
        home.url or "",
        home.notes or "",
        "",  # Status
    ]
    ws.append_row(row, value_input_option="USER_ENTERED")
