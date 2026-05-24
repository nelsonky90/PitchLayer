import base64
import json
import re
from dataclasses import dataclass, fields
from pathlib import Path
from typing import Optional

import anthropic

SYSTEM_PROMPT = """You extract real estate listing details from messages, web page metadata, and screenshots.

Return ONLY a JSON object with these fields (use null for anything absent):
{
  "address":    "full property address",
  "price":      "listing price with $ sign, e.g. '$450,000'",
  "beds":       "number of bedrooms, e.g. '3'",
  "baths":      "number of bathrooms, e.g. '2.5'",
  "sqft":       "square footage, e.g. '1,850'",
  "year_built": "year built, e.g. '1998'",
  "source":     "listing site name, e.g. 'Zillow', 'Redfin', 'Compass'",
  "url":        "listing URL",
  "notes":      "brief relevant extras: HOA fee, garage, pool, lot size, etc."
}

No markdown, no explanation — raw JSON only."""


@dataclass
class HomeInfo:
    address: Optional[str] = None
    price: Optional[str] = None
    beds: Optional[str] = None
    baths: Optional[str] = None
    sqft: Optional[str] = None
    year_built: Optional[str] = None
    source: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None

    def is_empty(self) -> bool:
        return not any([self.address, self.price, self.beds, self.baths, self.sqft, self.url])


_FIELD_NAMES = {f.name for f in fields(HomeInfo)}
_MEDIA_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/jpeg",  # best effort — Claude handles most HEIC
}


def _image_block(path: str) -> Optional[dict]:
    p = Path(path)
    media_type = _MEDIA_TYPES.get(p.suffix.lower(), "image/jpeg")
    try:
        data = base64.standard_b64encode(p.read_bytes()).decode()
        return {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}}
    except Exception:
        return None


def _build_context(
    text: Optional[str],
    metadata: Optional[dict],
    url: Optional[str],
) -> str:
    parts = []
    if text:
        parts.append(f"Message text:\n{text}")
    if metadata:
        parts.append(
            "Web page metadata:\n"
            f"  Title: {metadata.get('title')}\n"
            f"  Description: {metadata.get('description')}\n"
            f"  Source: {metadata.get('source')}\n"
            f"  URL: {metadata.get('url')}\n"
            + (
                f"  Structured data:\n{json.dumps(metadata['json_ld'], indent=2)}"
                if metadata.get("json_ld")
                else ""
            )
        )
    elif url:
        parts.append(f"URL: {url}")
    return "\n\n".join(parts)


def parse_with_claude(
    client: anthropic.Anthropic,
    text: Optional[str] = None,
    metadata: Optional[dict] = None,
    image_paths: Optional[list[str]] = None,
    url: Optional[str] = None,
) -> HomeInfo:
    """Extract HomeInfo from any combination of text, listing metadata, and images."""
    content: list[dict] = []

    ctx = _build_context(text, metadata, url)
    if ctx:
        content.append({"type": "text", "text": ctx})

    for path in (image_paths or []):
        block = _image_block(path)
        if block:
            content.append(block)

    if not content:
        return HomeInfo(url=url)

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": content}],
        )
        raw = response.content[0].text.strip()
        # Strip markdown code fences if present
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            data = json.loads(m.group())
            return HomeInfo(**{k: v for k, v in data.items() if k in _FIELD_NAMES and v is not None})
    except Exception:
        pass

    return HomeInfo(url=url)
