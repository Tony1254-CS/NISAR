# -*- coding: utf-8 -*-
import re

file_path = r"d:\nasa 2026\web\src\pages\SARLab.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const insarCanvasRef = useRef(null);", "const insarCanvasRef = useRef<HTMLCanvasElement>(null);")
content = content.replace("const hAlphaCanvasRef = useRef(null);", "const hAlphaCanvasRef = useRef<HTMLCanvasElement>(null);")
content = content.replace("handleInSARClick = (e) =>", "handleInSARClick = (e: any) =>")
content = content.replace("handleInSARClick = (e: React.MouseEvent) =>", "handleInSARClick = (e: any) =>") # Just in case

# Fix any 'possibly null' errors by optional chaining or checking
content = content.replace("const rect = insarCanvasRef.current.getBoundingClientRect();", "const rect = insarCanvasRef.current!.getBoundingClientRect();")
content = content.replace("const ctx = insarCanvasRef.current.getContext", "const ctx = insarCanvasRef.current!.getContext")
content = content.replace("insarCanvasRef.current.width", "insarCanvasRef.current!.width")
content = content.replace("insarCanvasRef.current.height", "insarCanvasRef.current!.height")

content = content.replace("const rect = hAlphaCanvasRef.current.getBoundingClientRect();", "const rect = hAlphaCanvasRef.current!.getBoundingClientRect();")
content = content.replace("const ctx = hAlphaCanvasRef.current.getContext", "const ctx = hAlphaCanvasRef.current!.getContext")
content = content.replace("hAlphaCanvasRef.current.width", "hAlphaCanvasRef.current!.width")
content = content.replace("hAlphaCanvasRef.current.height", "hAlphaCanvasRef.current!.height")


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
