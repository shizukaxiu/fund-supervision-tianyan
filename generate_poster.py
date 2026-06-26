import json, base64, os, sys, time
import requests

PROMPT_FILE = r"C:\Users\a1246\Desktop\基金监管天眼\garden-gpt-image-2-yunwu\prompt\poster-prompt-v2.md"
OUTPUT_FILE = r"C:\Users\a1246\Desktop\基金监管天眼\poster-fund-supervision.png"
API_KEY = "sk-WV50bMesLj8LjDmJt2JYWRrS8mfBdGcNzwYrR5YffpbEqGOK"
URL = "https://yunwu.ai/v1/images/generations"

def main():
    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        prompt = f.read().strip()

    payload = {
        "model": "gpt-image-2",
        "provider": {"sort": "speed"},
        "prompt": prompt,
        "size": "2000x800",
        "quality": "high",
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    print("Sending request to yunwu.ai...")
    start = time.time()
    resp = requests.post(URL, headers=headers, data=json.dumps(payload), timeout=300)
    elapsed = time.time() - start
    print(f"Response received in {elapsed:.1f}s, status {resp.status_code}")

    if not resp.ok:
        print("API error:", resp.text)
        sys.exit(1)

    data = resp.json()
    first = data.get("data", [{}])[0]
    if first.get("b64_json"):
        image_bytes = base64.b64decode(first["b64_json"])
    elif first.get("url"):
        image_bytes = requests.get(first["url"], timeout=120).content
    else:
        print("No image data found in response")
        sys.exit(1)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "wb") as f:
        f.write(image_bytes)

    print(f"Saved poster to: {OUTPUT_FILE}")
    print(f"Image size: {len(image_bytes)} bytes")

if __name__ == "__main__":
    main()
