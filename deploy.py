import subprocess
subprocess.run(["git", "add", "."])
subprocess.run(["git", "commit", "-m", "feat: flagship major upgrade with bento grid and quant radar charts"])
subprocess.run(["git", "push", "origin", "main"])
