with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'app.post("/api/prices/fast"' in line:
        print(f'Start: {i+1}')
    if 'Fast prices updated for' in line:
        print(f'End Hint: {i+1}')
    if 'const startViteAndExpress' in line:
        print(f'startViteAndExpress: {i+1}')
