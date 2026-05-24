#!/usr/bin/env bash
# Homes Tracker — one-time setup
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/.config/homes_tracker"

echo "=== Homes Tracker Setup ==="
echo ""

# ── 1. Python dependencies ───────────────────────────────────────────────────
echo "Installing Python dependencies..."
pip3 install -r "$REPO_DIR/requirements.txt"
echo ""

# ── 2. Config directory ──────────────────────────────────────────────────────
mkdir -p "$CONFIG_DIR"

if [ ! -f "$REPO_DIR/.env" ]; then
  cp "$REPO_DIR/.env.example" "$REPO_DIR/.env"
  echo "Created .env — open it and fill in the values before running."
else
  echo ".env already exists."
fi
echo ""

# ── 3. Find your contact ID ──────────────────────────────────────────────────
echo "=== Next steps ==="
echo ""
echo "1. Fill in .env with your keys and sheet ID."
echo ""
echo "2. Grant Full Disk Access to Terminal (or your IDE) in:"
echo "   System Settings → Privacy & Security → Full Disk Access"
echo "   (needed to read ~/Library/Messages/chat.db)"
echo ""
echo "3. Find Delisa's contact ID:"
echo "   cd $REPO_DIR && python3 -m homes_tracker list-contacts"
echo "   Set CONTACT_ID= in .env to her phone number shown there."
echo ""
echo "4. Set up Google Sheets access:"
echo "   a) Go to https://console.cloud.google.com"
echo "   b) Create a project, enable the Google Sheets API"
echo "   c) Create a Service Account, download the JSON key"
echo "   d) Save the JSON to $CONFIG_DIR/google_credentials.json"
echo "   e) Share your Google Sheet with the service account email"
echo "      (looks like: something@project.iam.gserviceaccount.com)"
echo ""
echo "5. Test it:"
echo "   cd $REPO_DIR && python3 -m homes_tracker run"
echo ""
echo "6. (Optional) Install as a background service (runs every 5 min):"
echo "   Edit com.pitchlayer.homes-tracker.plist — set WorkingDirectory,"
echo "   YOURUSERNAME, and all API keys, then:"
echo ""
echo "   cp $REPO_DIR/com.pitchlayer.homes-tracker.plist \\"
echo "      ~/Library/LaunchAgents/"
echo "   launchctl load ~/Library/LaunchAgents/com.pitchlayer.homes-tracker.plist"
echo ""
echo "   Logs: tail -f /tmp/homes-tracker.log"
echo ""
