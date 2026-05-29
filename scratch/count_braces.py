with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Let's inspect detailTab === "insiders"
insiders_block = []
for idx in range(2005, 2195):
    insiders_block.append((idx+1, lines[idx]))

# Let's print each line with its nesting of { } and ( )
curly = 0
paren = 0
for lno, line in insiders_block:
    # count non-string/non-comment braces
    # simple approximation
    for char in line:
        if char == '{': curly += 1
        elif char == '}': curly -= 1
        elif char == '(': paren += 1
        elif char == ')': paren -= 1
    
    # print line with brace counts
    clean_line = line.strip().encode('ascii', errors='replace').decode('ascii')
    print(f"{lno:4d} [C:{curly:+d} P:{paren:+d}] {clean_line}")
