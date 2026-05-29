import os

def main():
    filepath = "src/App.tsx"
    
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Find the starting line index of premium stock card return block
    start_idx = -1
    for i, line in enumerate(lines):
        if "premium-card rounded-xl p-4 shadow-xl" in line and "gap-3 ${borderStyle}" in line:
            # The start of the return statement is a few lines above
            start_idx = i - 7
            break

    if start_idx == -1:
        print("Error: Could not locate card return block start!")
        return

    # Find the ending line index of premium stock card return block
    end_idx = -1
    for i in range(start_idx, len(lines)):
        if "Bottom metadata shadow" in lines[i]:
            # The return ends a few lines below
            end_idx = i + 3
            break

    if end_idx == -1:
        print("Error: Could not locate card return block end!")
        return

    print(f"Located card return block from line {start_idx + 1} to {end_idx + 1}")

    # Extract the block
    block = lines[start_idx:end_idx]
    block_text = "".join(block)

    # Perform the scaling replacements inside this specific block
    replacements = [
        # Card tags
        ('text-[8px] font-mono', 'text-[10px] md:text-[11px] font-mono'),
        # V8050.0 全域檢核 label
        ('text-[8px] font-mono text-zinc-550', 'text-[10px] md:text-[11px] font-mono text-zinc-550'),
        # Score Badge
        ('text-[9px] ${', 'text-[11px] md:text-xs ${'),
        # Technical Grid container
        ('text-[8px] bg-zinc-950', 'text-[11px] md:text-xs bg-zinc-950'),
        # Technical Grid labels (RSI, 狀態, 動能, 量比)
        ('text-[7px]">RSI', 'text-[10px] md:text-[11px]">RSI'),
        ('text-[7px]">狀態', 'text-[10px] md:text-[11px]">狀態'),
        ('text-[7px]">動能', 'text-[10px] md:text-[11px]">動能'),
        ('text-[7px]">量比', 'text-[10px] md:text-[11px]">量比'),
        ('text-zinc-555 text-[7px]', 'text-zinc-555 text-[10px] md:text-[11px]'),
        # Live Headline/Notes
        ('text-[9px] font-sans', 'text-[11px] md:text-xs font-sans'),
        # Pricing Zones container
        ('text-[8px] pt-1', 'text-[10px] md:text-xs pt-1'),
        # Pricing Zones labels
        ('text-zinc-550 text-[7px] block mb-0.5', 'text-zinc-550 text-[8px] md:text-[9px] block mb-0.5'),
        ('text-zinc-555 text-[7px] block mb-0.5', 'text-zinc-400 text-[8px] md:text-[9px] block mb-0.5'),
        # Execution Orders container text size
        ('text-[8px] font-mono space-y-1', 'text-[10px] md:text-[11px] font-mono space-y-1'),
        ('text-zinc-450', 'text-zinc-400'),
        # Execution Orders sub-text
        ('text-[7px] pt-1', 'text-[9px] md:text-[10px] pt-1'),
        ('text-[7px] pt-1 border-t border-zinc-900 text-zinc-500', 'text-[8px] md:text-[9px] pt-1 border-t border-zinc-900 text-zinc-500'),
        # Action Buttons
        ('text-[9px] font-bold rounded shadow', 'text-[11px] md:text-xs font-bold rounded shadow'),
        ('text-[9px] font-bold rounded bg-zinc-900', 'text-[11px] md:text-xs font-bold rounded bg-zinc-900'),
    ]

    for old, new in replacements:
        block_text = block_text.replace(old, new)

    # Re-assemble the lines
    lines[start_idx:end_idx] = [block_text]

    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(lines)

    print("Success: Programmatically updated card view font sizes!")

if __name__ == "__main__":
    main()
