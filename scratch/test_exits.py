import requests

url = "https://intelligent-index-interpretation.vercel.app/api/holdings"
try:
    resp = requests.get(url, timeout=10)
    data = resp.json()
    print("API Success:", data.get("success"))
    exits = data.get("exits", [])
    print(f"Total exits returned from Vercel: {len(exits)}")
    
    # Check if there are duplicates by stock_id and exit_date
    seen = set()
    duplicates = []
    for e in exits:
        key = (e.get("stock_id"), e.get("exit_date"))
        if key in seen:
            duplicates.append(key)
        else:
            seen.add(key)
    print(f"Unique exits: {len(seen)}")
    print(f"Duplicate exits: {len(duplicates)}")
    if duplicates:
        print("First 10 duplicates:", duplicates[:10])
except Exception as e:
    print("Error querying Vercel API:", e)
