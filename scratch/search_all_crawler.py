import re

def search():
    files = ["src/App.tsx", "server.ts", "app.py"]
    out = []
    for file in files:
        with open(file, "r", encoding="utf-8") as f:
            content = f.read()
        matches = re.finditer(r".{0,25}爬蟲.{0,25}", content)
        out.append(f"=== File: {file} ===")
        for i, m in enumerate(matches):
            out.append(f"Match {i+1}: {m.group(0).strip()}")
        out.append("")
    
    with open("scratch/crawler_search_results.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    print("Done")

if __name__ == "__main__":
    search()
