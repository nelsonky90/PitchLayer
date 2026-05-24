import argparse
import logging
import sys
import time
from datetime import datetime, timezone, timedelta

import anthropic
from dotenv import load_dotenv

from .config import Config
from . import imessage, scraper, sheets, state
from .parser import parse_with_claude

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


def process_messages(config: Config, st: dict, client: anthropic.Anthropic) -> dict:
    after_rowid = st.get("last_rowid", 0)

    # On first run, limit to the configured lookback window
    after_date: datetime | None = None
    if after_rowid == 0:
        after_date = datetime.now(timezone.utc) - timedelta(days=config.lookback_days)
        log.info("First run — scanning messages from last %d days", config.lookback_days)

    messages = imessage.get_messages(
        config.imessage_db, config.contact_id, after_rowid=after_rowid, after_date=after_date
    )

    if not messages:
        log.info("No new messages from %s", config.contact_name)
        return st

    log.info("Found %d new message(s) from %s", len(messages), config.contact_name)
    added = 0

    for msg in messages:
        log.info("Processing rowid=%d  %s", msg.rowid, msg.date.strftime("%Y-%m-%d %H:%M UTC"))
        homes_found: list[tuple] = []

        # --- URL messages: scrape + Claude parse ---
        for url in msg.urls:
            log.info("  Fetching %s", url)
            metadata = scraper.fetch_listing_metadata(url)
            home = parse_with_claude(client, text=msg.text, metadata=metadata, url=url)
            if not home.is_empty():
                home.source = home.source or metadata.get("source")
                home.url = home.url or url
                homes_found.append((home, msg.date))

        # --- Image-only messages: vision ---
        if not homes_found and msg.image_paths:
            log.info("  Analyzing %d image(s) with vision", len(msg.image_paths))
            home = parse_with_claude(client, text=msg.text, image_paths=msg.image_paths)
            if not home.is_empty():
                homes_found.append((home, msg.date))

        # --- Plain-text messages ---
        if not homes_found and msg.text:
            home = parse_with_claude(client, text=msg.text)
            if not home.is_empty():
                homes_found.append((home, msg.date))

        for home, received_at in homes_found:
            if sheets.is_duplicate(
                config.sheet_id, config.sheet_tab, config.google_credentials_file,
                home.url, home.address,
            ):
                log.info("  Skipping duplicate: %s", home.address or home.url)
            else:
                sheets.append_home(
                    config.sheet_id, config.sheet_tab, config.google_credentials_file,
                    home, received_at,
                )
                log.info("  Added: %s  %s", home.address or "(no address)", home.price or "")
                added += 1

        st["last_rowid"] = msg.rowid

    log.info("Done — added %d new home(s)", added)
    return st


def cmd_run(args: argparse.Namespace, config: Config) -> None:
    sheets.ensure_headers(config.sheet_id, config.sheet_tab, config.google_credentials_file)
    client = anthropic.Anthropic(api_key=config.anthropic_api_key)
    st = state.load(config.state_file)

    st = process_messages(config, st, client)
    state.save(config.state_file, st)

    if args.watch:
        log.info("Watching for new messages every %ds — Ctrl+C to stop", config.poll_interval)
        while True:
            time.sleep(config.poll_interval)
            st = process_messages(config, st, client)
            state.save(config.state_file, st)


def cmd_list_contacts(config: Config) -> None:
    contacts = imessage.list_contacts(config.imessage_db)
    print(f"\n{'Contact ID / Phone / Email':<45}  Service")
    print("-" * 60)
    for cid, service in contacts:
        print(f"{cid:<45}  {service}")
    print(f"\nTotal: {len(contacts)} contacts")
    print("\nSet CONTACT_ID= to a substring of the Contact ID above (e.g. her phone number).")


def main() -> None:
    load_dotenv()

    parser = argparse.ArgumentParser(
        description="Watch iMessage for homes from a contact and log them to Google Sheets.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python3 -m homes_tracker list-contacts\n"
            "  python3 -m homes_tracker run\n"
            "  python3 -m homes_tracker run --watch\n"
        ),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    run_p = sub.add_parser("run", help="Process new messages (add --watch to keep polling)")
    run_p.add_argument("--watch", action="store_true", help="Keep running and poll every POLL_INTERVAL seconds")

    sub.add_parser("list-contacts", help="List all iMessage contacts to identify CONTACT_ID")

    args = parser.parse_args()

    try:
        config = Config.from_env()
    except ValueError as exc:
        print(f"\nConfiguration error:\n{exc}\n\nCopy .env.example to .env and fill in the values.",
              file=sys.stderr)
        sys.exit(1)

    if args.command == "run":
        cmd_run(args, config)
    elif args.command == "list-contacts":
        cmd_list_contacts(config)


if __name__ == "__main__":
    main()
