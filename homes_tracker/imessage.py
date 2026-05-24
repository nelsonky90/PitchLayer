import re
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# Seconds between Unix epoch (1970-01-01) and Apple epoch (2001-01-01)
APPLE_EPOCH = 978307200
URL_RE = re.compile(r"https?://[^\s<>\"']+")


@dataclass
class Message:
    rowid: int
    text: Optional[str]
    date: datetime
    urls: list[str] = field(default_factory=list)
    image_paths: list[str] = field(default_factory=list)


def _apple_ts_to_datetime(ts: int) -> datetime:
    # macOS Catalina+ stores timestamps as nanoseconds; older versions use seconds
    if ts > 1_000_000_000_000:
        ts = ts / 1_000_000_000
    return datetime.fromtimestamp(ts + APPLE_EPOCH, tz=timezone.utc)


def _datetime_to_apple_ts(dt: datetime) -> int:
    return int((dt.timestamp() - APPLE_EPOCH) * 1_000_000_000)


def _urls_from_bytes(data: bytes) -> list[str]:
    try:
        return URL_RE.findall(data.decode("utf-8", errors="ignore"))
    except Exception:
        return []


def list_contacts(db_path: str) -> list[tuple[str, str]]:
    """Return (handle_id, service) for every contact in the iMessage DB."""
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    cur = conn.execute("SELECT id, service FROM handle ORDER BY id")
    result = cur.fetchall()
    conn.close()
    return result


def get_messages(
    db_path: str,
    contact_id: str,
    after_rowid: int = 0,
    after_date: Optional[datetime] = None,
) -> list[Message]:
    """
    Return inbound messages from a contact (matched by substring on handle.id)
    that have rowid > after_rowid and, optionally, date > after_date.
    """
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)

    cur = conn.execute("SELECT rowid FROM handle WHERE id LIKE ?", (f"%{contact_id}%",))
    handle_ids = [row[0] for row in cur.fetchall()]
    if not handle_ids:
        conn.close()
        return []

    placeholders = ",".join("?" * len(handle_ids))
    params: list = list(handle_ids)
    params.append(after_rowid)

    date_clause = ""
    if after_date:
        date_clause = "AND m.date > ?"
        params.append(_datetime_to_apple_ts(after_date))

    query = f"""
        SELECT m.rowid, m.text, m.date, m.cache_has_attachments, m.attributedBody
        FROM message m
        WHERE m.handle_id IN ({placeholders})
          AND m.is_from_me = 0
          AND m.rowid > ?
          {date_clause}
        ORDER BY m.rowid ASC
    """
    rows = conn.execute(query, params).fetchall()

    messages = []
    for rowid, text, apple_date, has_attachments, attributed_body in rows:
        msg_date = _apple_ts_to_datetime(apple_date)

        # Fall back to attributedBody bytes if text is absent
        if text is None and attributed_body:
            text = attributed_body.decode("utf-8", errors="ignore")

        urls = URL_RE.findall(text) if text else []
        if not urls and attributed_body:
            urls = _urls_from_bytes(attributed_body)

        # Collect image attachment paths
        image_paths: list[str] = []
        if has_attachments:
            att_rows = conn.execute(
                """
                SELECT a.filename
                FROM attachment a
                JOIN message_attachment_join maj ON a.rowid = maj.attachment_id
                WHERE maj.message_id = ? AND a.mime_type LIKE 'image/%'
                """,
                (rowid,),
            ).fetchall()
            for (filename,) in att_rows:
                if not filename:
                    continue
                path = Path(filename).expanduser()
                if path.exists():
                    image_paths.append(str(path))

        messages.append(
            Message(rowid=rowid, text=text, date=msg_date, urls=urls, image_paths=image_paths)
        )

    conn.close()
    return messages
