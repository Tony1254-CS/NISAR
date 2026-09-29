# -*- coding: utf-8 -*-
import re

file_path = r"d:\nasa 2026\web\src\pages\Intelligence.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("              );\n            })}", "              </div>\n              );\n            })}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
