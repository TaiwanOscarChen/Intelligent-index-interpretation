with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's locate '無法取得進階董監與機構籌碼明細資料' and find the end marker 'detailTab === "filings"'
start_str = '⚠️ 無法取得進階董監與機構籌碼明細資料。'
# Wait, let's search with a safer string to avoid unicode issues in search query if they differ
search_str = '無法取得進階董監與機構籌碼明細資料'

start_idx = content.find(search_str)
if start_idx == -1:
    print("Search string not found!")
    exit(1)

# Find the end 'detailTab === "filings"' after start_idx
end_str = 'detailTab === "filings"'
end_idx = content.find(end_str, start_idx)
if end_idx == -1:
    print("End string not found!")
    exit(1)

# Now, we want to replace the whole part starting from the warning div closing tag to the filings tab check
# Let's see: the warning div is:
# <div className="text-center py-6 text-zinc-650 font-mono text-[9px] bg-zinc-950 p-3.5 rounded-lg border border-zinc-850/80">
#   ⚠️ 無法取得進階董監與機構籌碼明細資料。
# </div>
#
# We want to replace everything from the first closing ')}' or '</div>' after '無法取得進階董監與機構籌碼明細資料'
# up to 'detailTab === "filings"'

# Actually, let's just replace the entire segment programmatically.
# Let's print the segment first (avoiding non-ascii encoding errors) to verify.
segment = content[start_idx:end_idx]
print("Segment size:", len(segment))

# The correct replacement:
# from the search string to the filings tab
# Let's rewrite the lines inside this segment perfectly.
new_segment = """無法取得進階董監與機構籌碼明細資料。
                              </div>
                            )}
                            </div>
                          )}
                        </div>
                      )}
                    
                    {"""

# Replace in content
content = content[:start_idx] + new_segment + content[end_idx:]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Block successfully replaced and cleaned up!")
