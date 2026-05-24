import json
import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

SOURCE_MAP = {
    "zillow.com": "Zillow",
    "redfin.com": "Redfin",
    "realtor.com": "Realtor.com",
    "compass.com": "Compass",
    "trulia.com": "Trulia",
    "homes.com": "Homes.com",
    "homesnap.com": "Homesnap",
    "movoto.com": "Movoto",
    "apartments.com": "Apartments.com",
}

REAL_ESTATE_LD_TYPES = {
    "RealEstateListing",
    "SingleFamilyResidence",
    "Apartment",
    "House",
    "Residence",
}


def detect_source(url: str) -> str:
    for domain, name in SOURCE_MAP.items():
        if domain in url:
            return name
    return "Other"


def fetch_listing_metadata(url: str) -> dict:
    """
    Fetch a listing URL and return a dict of raw metadata for Claude to parse.
    Returns at minimum {"url": url, "source": source} even on failure.
    """
    source = detect_source(url)
    result: dict = {
        "url": url,
        "source": source,
        "title": None,
        "description": None,
        "json_ld": None,
    }

    try:
        resp = httpx.get(url, headers=HEADERS, timeout=15, follow_redirects=True)
        if resp.status_code != 200:
            return result

        soup = BeautifulSoup(resp.text, "html.parser")

        if soup.title and soup.title.string:
            result["title"] = soup.title.string.strip()

        # Open Graph description (usually has beds/baths/price)
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            result["description"] = og_desc["content"]

        if not result["description"]:
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc and meta_desc.get("content"):
                result["description"] = meta_desc["content"]

        # JSON-LD structured data
        for tag in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(tag.string or "")
                candidates = data if isinstance(data, list) else [data]
                for item in candidates:
                    if not isinstance(item, dict):
                        continue
                    ld_type = item.get("@type", "")
                    if any(t in ld_type for t in REAL_ESTATE_LD_TYPES) or "RealEstate" in ld_type:
                        result["json_ld"] = item
                        break
                if result["json_ld"]:
                    break
            except Exception:
                continue

    except Exception:
        pass

    return result
