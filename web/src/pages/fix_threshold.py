# -*- coding: utf-8 -*-
import re

file_path = r"d:\nasa 2026\web\src\pages\Intelligence.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("  const { reachId } = useStore();", "  const { reachId, reach } = useStore();\n  const [threshold, setThreshold] = useState<number>(0.5);")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
