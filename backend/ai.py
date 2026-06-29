import base64
import io
import json
import os

import anthropic
from PIL import Image

MEDIA_TYPES = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
}

PROMPT = """Look at this clothing item and return a JSON object with exactly these fields:
{
  "name": "short descriptive name (e.g. 'blue denim jacket', 'floral sundress')",
  "category": "one of: top | bottom | dress | shoes | outerwear | accessory | other",
  "color": "primary color or colors (e.g. 'navy blue', 'black and white stripe')",
  "description": "1-2 sentences on style, material if visible, and occasions it suits",
  "tags": ["tag1", "tag2", "tag3"]
}
Tags should be 3-5 lowercase words useful for filtering, e.g. casual, formal, summer, winter, vintage, athletic.
Return ONLY the JSON object with no explanation or markdown fences."""

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is not set — check your backend/.env file")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def _compress_for_api(image_path: str, max_side: int = 1568, quality: int = 85) -> tuple[bytes, str]:
    """Resize and JPEG-compress an image in memory so it fits the 10 MB API limit.

    1568 px is Anthropic's recommended max side length for vision tasks.
    The original file on disk is never modified.
    """
    with Image.open(image_path) as img:
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")
        img.thumbnail((max_side, max_side), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        return buf.getvalue(), "image/jpeg"


def analyze_clothing_image(image_path: str) -> dict:
    """Send a clothing image to Claude and return structured metadata."""
    image_bytes, media_type = _compress_for_api(image_path)
    image_data = base64.standard_b64encode(image_bytes).decode("utf-8")

    message = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {"type": "text", "text": PROMPT},
                ],
            }
        ],
    )

    raw = message.content[0].text.strip()
    print(f"[AI] Raw response from Claude:\n{raw}\n")

    # Defensive parse: extract JSON even if Claude wraps it in code fences
    if "{" in raw:
        raw = raw[raw.index("{") : raw.rindex("}") + 1]

    result = json.loads(raw)
    print(f"[AI] Parsed metadata: {result}")
    return result


def suggest_outfit(query: str, inventory: list[dict]) -> dict:
    """Generate an outfit suggestion from the user's closet inventory.

    Returns {"suggestion": str, "recommended_ids": list[int]}.
    """
    if not inventory:
        return {
            "suggestion": "Your closet is empty! Upload some clothing photos first, then I can suggest outfits.",
            "recommended_ids": [],
        }

    lines = []
    for item in inventory:
        tags: list[str] = []
        if item.get("tags"):
            try:
                tags = json.loads(item["tags"])
            except (json.JSONDecodeError, TypeError):
                pass
        line = (
            f"[ID:{item['id']}] {item.get('name') or 'Unknown item'}"
            f" ({item.get('category') or 'unknown'})"
            f" — {item.get('color') or 'unknown color'}"
        )
        if item.get("description"):
            line += f" — {item['description']}"
        if tags:
            line += f" [tags: {', '.join(tags)}]"
        lines.append(line)

    prompt = f"""You are a personal stylist with full access to the user's wardrobe. Here is their complete clothing inventory (each item has an ID):

{chr(10).join(lines)}

The user asks: "{query}"

Return a JSON object with exactly these two fields:
{{
  "suggestion": "your outfit recommendation as natural prose, referencing each chosen item by name and explaining why",
  "recommended_ids": [list of integer IDs of the items you are recommending]
}}

Only recommend items from the inventory. If the closet is missing something essential, mention it in the suggestion text. Return ONLY the JSON object."""

    message = _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if "{" in raw:
        raw = raw[raw.index("{") : raw.rindex("}") + 1]

    try:
        result = json.loads(raw)
        return {
            "suggestion": result.get("suggestion", raw),
            "recommended_ids": result.get("recommended_ids", []),
        }
    except json.JSONDecodeError:
        # Fall back gracefully if Claude didn't return valid JSON
        return {"suggestion": raw, "recommended_ids": []}