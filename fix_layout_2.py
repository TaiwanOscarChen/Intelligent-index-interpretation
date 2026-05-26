import os

with open("src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

macro_start = -1
macro_end = -1
for i, line in enumerate(lines):
    if "GLOBAL MACRO & OPENAPI LINKS DASHBOARD" in line:
        macro_start = i - 1  # includes the comment line before
    if macro_start != -1 and "</div>" in line and i > macro_start + 40:
        # Check if the next line is the span
        if i + 2 < len(lines) and "bg-emerald-500 animate-pulse" in lines[i+2]:
            macro_end = i
            break

if macro_start != -1 and macro_end != -1:
    macro_panel = lines[macro_start:macro_end + 1]
    
    # Remove macro panel
    del lines[macro_start:macro_end + 1]
    
    # Find main body
    main_idx = -1
    for i, line in enumerate(lines):
        if "<main className=" in line:
            main_idx = i
            break
            
    if main_idx != -1:
        # Insert macro panel
        for line in reversed(macro_panel):
            lines.insert(main_idx + 1, line)
        
        with open("src/App.tsx", "w", encoding="utf-8") as f:
            f.writelines(lines)
        print("Layout fixed successfully.")
    else:
        print("Main body not found.")
else:
    print(f"Macro panel not found correctly. start={macro_start}, end={macro_end}")
