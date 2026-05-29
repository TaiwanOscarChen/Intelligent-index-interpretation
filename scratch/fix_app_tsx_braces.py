with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
found = False
for i in range(len(lines) - 8):
    if '無法取得進階董監與機構籌碼明細資料' in lines[i]:
        # i is the line index (0-based) of the warning message
        
        # Let's replace the closing block
        lines[i+3] = "                            )}"
        lines[i+4] = "                            </div>"
        lines[i+5] = "                          )}"
        lines[i+6] = "                        </div>"
        lines[i+7] = "                      )}"
        
        # Delete lines[i+8] because it's the extra closing bracket
        del lines[i+8]
        
        content = '\n'.join(lines)
        with open('src/App.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Brace balance successfully repaired!")
        found = True
        break

if not found:
    print("Failed to locate target section!")
