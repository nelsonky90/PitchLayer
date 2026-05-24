import os
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Config:
    contact_id: str            # substring to match against iMessage handle.id, e.g. "+15551234567"
    sheet_id: str              # Google Sheet ID from the URL
    anthropic_api_key: str
    google_credentials_file: str

    contact_name: str = "Delisa Sammy"
    sheet_tab: str = "Homes"
    poll_interval: int = 300   # seconds between checks in --watch mode
    state_file: str = str(Path.home() / ".config/homes_tracker/state.json")
    imessage_db: str = str(Path.home() / "Library/Messages/chat.db")
    lookback_days: int = 60    # how far back to look on first run

    @classmethod
    def from_env(cls) -> "Config":
        required = {
            "CONTACT_ID": "phone/email substring to match (e.g. '+15551234567')",
            "GOOGLE_SHEET_ID": "ID from your Google Sheet URL",
            "ANTHROPIC_API_KEY": "your Anthropic API key",
            "GOOGLE_CREDENTIALS_FILE": "path to Google service account JSON",
        }
        missing = [f"  {k}  — {desc}" for k, desc in required.items() if not os.getenv(k)]
        if missing:
            raise ValueError("Missing required environment variables:\n" + "\n".join(missing))

        return cls(
            contact_id=os.environ["CONTACT_ID"],
            sheet_id=os.environ["GOOGLE_SHEET_ID"],
            anthropic_api_key=os.environ["ANTHROPIC_API_KEY"],
            google_credentials_file=os.path.expanduser(os.environ["GOOGLE_CREDENTIALS_FILE"]),
            contact_name=os.getenv("CONTACT_NAME", "Delisa Sammy"),
            sheet_tab=os.getenv("SHEET_TAB", "Homes"),
            poll_interval=int(os.getenv("POLL_INTERVAL", "300")),
            state_file=os.path.expanduser(
                os.getenv("STATE_FILE", str(Path.home() / ".config/homes_tracker/state.json"))
            ),
            imessage_db=os.path.expanduser(
                os.getenv("IMESSAGE_DB", str(Path.home() / "Library/Messages/chat.db"))
            ),
            lookback_days=int(os.getenv("LOOKBACK_DAYS", "60")),
        )
