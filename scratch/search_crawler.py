import re

def search():
    with open("src/App.tsx", "r", encoding="utf-8") as f:
        content = f.read()
    
    matches = re.finditer(r".{0,15}爬蟲.{0,15}", content)
    for i, m in enumerate(matches):
        print(f"Match {i+1}: {m.group(0)}")

if __name__ == "__main__":
    search()
