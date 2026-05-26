import os

with open("server.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Find the start of the force sweep route
force_start = content.find('// 🚀 Smart Start: Force Sweep immediately\\napp.post("/api/sweep/force"')
# Find the end of the fast prices route
fast_prices_end = content.find('  } catch (err: any) {\\n    res.status(500).json({ success: false, error: err.message });\\n  }\\n});') + len('  } catch (err: any) {\\n    res.status(500).json({ success: false, error: err.message });\\n  }\\n});')

if force_start != -1 and fast_prices_end > force_start:
    routes_code = content[force_start:fast_prices_end]
    
    # Remove from inside startViteAndExpress
    content = content[:force_start] + content[fast_prices_end:]
    
    # Insert right before export default app;
    insert_target = 'if (!process.env.VERCEL) {\\n  startViteAndExpress();\\n}'
    insert_idx = content.find(insert_target)
    
    if insert_idx != -1:
        content = content[:insert_idx] + routes_code + "\\n\\n" + content[insert_idx:]
        
        with open("server.ts", "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully moved API routes outside startViteAndExpress.")
    else:
        print("Failed to find insertion target.")
else:
    print(f"Failed to find route block. start={force_start}")
