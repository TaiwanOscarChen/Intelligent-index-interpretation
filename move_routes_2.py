import os
import re

with open("server.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Extract from app.post("/api/sweep/force") to the end of app.post("/api/prices/fast")
start_idx = content.find('app.post("/api/sweep/force"')
# include the comment before it
comment_idx = content.rfind('//', 0, start_idx)

end_pattern = 'res.status(500).json({ success: false, error: err.message });\\n  }\\n});'
end_idx = content.find(end_pattern, start_idx)

if comment_idx != -1 and end_idx != -1:
    end_idx += len(end_pattern)
    
    routes_code = content[comment_idx:end_idx]
    
    # Remove it
    content = content[:comment_idx] + content[end_idx:]
    
    # Insert it
    insert_target = 'if (!process.env.VERCEL) {'
    insert_idx = content.find(insert_target)
    
    if insert_idx != -1:
        content = content[:insert_idx] + routes_code + "\\n\\n" + content[insert_idx:]
        
        with open("server.ts", "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully moved API routes.")
    else:
        print("Failed to find insert_target")
else:
    print("Failed to find block boundaries")
