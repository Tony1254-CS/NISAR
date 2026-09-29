# -*- coding: utf-8 -*-
import re

file_path = r"d:\nasa 2026\web\src\pages\SARLab.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const ctx = insarCanvasRef.current!.getContext('2d');", "const ctx = insarCanvasRef.current!.getContext('2d')!;")
content = content.replace("const ctx = hAlphaCanvasRef.current!.getContext('2d');", "const ctx = hAlphaCanvasRef.current!.getContext('2d')!;")
content = content.replace("handleInSARClick = (e) =>", "handleInSARClick = (e: any) =>")
content = content.replace("const handleInSARClick = (e) =>", "const handleInSARClick = (e: any) =>")
content = content.replace("onClick={(e) =>", "onClick={(e: any) =>")
content = re.sub(r"onClick=\{\(e\)\s*=>", "onClick={(e: any) =>", content)
content = re.sub(r"const handleInSARClick = \(e\)\s*=>", "const handleInSARClick = (e: any) =>", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
