with open("src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

output = []
for i, line in enumerate(lines):
    if 'viewMode ===' in line:
        output.append(f"Match found at line {i+1}: {line.strip()}")
        # print next 100 lines
        for j in range(max(0, i-5), min(i+400, len(lines))):
            output.append(f"  {j+1}: {lines[j].rstrip()}")

with open("scratch/find_cards_output.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output))
print("Done, output saved to scratch/find_cards_output.txt")
