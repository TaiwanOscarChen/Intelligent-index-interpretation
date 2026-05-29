import re

def fix():
    file_path = "src/initial_stocks.ts"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace "base_price": 100.0, with "base_price": 100.0, "basePrice": 100.0,
    content = re.sub(r'"base_price":\s*([\d\.]+),', r'"base_price": \1, "basePrice": \1,', content)

    # Replace "notes": "..." with "notes": "...", "fundamentalNotes": "..."
    content = re.sub(r'"notes":\s*"([^"]*)"', r'"notes": "\1", "fundamentalNotes": "\1"', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully updated initial_stocks.ts with unified fields!")

if __name__ == "__main__":
    fix()
