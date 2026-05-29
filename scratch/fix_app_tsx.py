with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
found = False
for i in range(len(lines) - 8):
    if '無法取得進階董監與機構籌碼明細資料' in lines[i+4]:
        # Let's insert the missing </div> after line i+2 (which is lines[i+1])
        lines.insert(i+2, "                            </div>")
        content = '\n'.join(lines)
        with open('src/App.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully inserted closing div!")
        found = True
        break

if not found:
    print("Failed to locate target section!")
