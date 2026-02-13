import feedparser
import json
from datetime import datetime
import os

# Paths
HOME_JSON = 'api/home.json'

# Load existing home.json or create default
if os.path.exists(HOME_JSON):
    with open(HOME_JSON, 'r') as f:
        data = json.load(f)
else:
    data = {
        "updated_iso": "",
        "edition": "",
        "sections": {
            "projects": [],
            "markets": [],
            "foss": []
        }
    }

# --- Decrypt.co (Crypto News) - top 3 ---
decrypt_feed = feedparser.parse('https://decrypt.co/feed')
decrypt_items = []
for entry in decrypt_feed.entries[:3]:
    decrypt_items.append({
        "title": entry.title,
        "url": entry.link,
        "source": "decrypt",
        "timestamp": datetime.now().strftime("%Y-%m-%d"),
        "summary": entry.summary[:100] + "..." if len(entry.summary) > 100 else entry.summary
    })

# --- Hacker News (newest) - top 5 ---
hn_feed = feedparser.parse('https://news.ycombinator.com/rss')
hn_items = []
for entry in hn_feed.entries[:5]:
    hn_items.append({
        "title": entry.title,
        "url": entry.link,
        "source": "hn",
        "timestamp": datetime.now().strftime("%Y-%m-%d"),
        "summary": entry.get('summary', '')[:100] + '...' if len(entry.get('summary', '')) > 100 else entry.get('summary', '')
    })

# Update JSON
data["updated_iso"] = datetime.now().isoformat() + "Z"
data["edition"] = datetime.now().strftime("%Y-%m-%d")
data["sections"]["markets"] = decrypt_items
data["sections"]["foss"] = hn_items

# Save
with open(HOME_JSON, 'w') as f:
    json.dump(data, f, indent=2)

print(f"✅ Updated: {len(decrypt_items)} Decrypt, {len(hn_items)} HN")