import os
import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix the Layout Issue (Move Macro Panel)
# Extract the macro panel
macro_start = content.find("          {/* ============================================================== */}\\n          {/* GLOBAL MACRO & OPENAPI LINKS DASHBOARD */}")
macro_end = content.find("          </div>\\n\\n            <span className=\\"w-2 h-2 rounded-full")

if macro_start != -1 and macro_end != -1:
    macro_panel = content[macro_start:macro_end + 17] # includes the closing </div> of the macro panel
    
    # Remove macro panel from the wrong location
    content = content[:macro_start] + content[macro_end + 17:]
    
    # Insert it right after <main ...>
    main_body_idx = content.find('<main className="flex-1 w-full max-w-[1700px] mx-auto p-4 md:p-6">')
    if main_body_idx != -1:
        insert_idx = main_body_idx + len('<main className="flex-1 w-full max-w-[1700px] mx-auto p-4 md:p-6">') + 1
        content = content[:insert_idx] + "\\n" + macro_panel + "\\n" + content[insert_idx:]

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Layout fixed.")
