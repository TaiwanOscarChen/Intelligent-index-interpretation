with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find('          {/* ============================================================== */}\\n          {/* GLOBAL MACRO & OPENAPI LINKS DASHBOARD */}')
end_idx = content.find('{/* ======================= TAB 1: RADAR ======================= */}')

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + "          " + content[end_idx:]
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully removed the cards.")
else:
    print(f"Failed to find indices. Start: {start_idx}, End: {end_idx}")
