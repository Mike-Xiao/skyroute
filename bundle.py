# -*- coding: utf-8 -*-
# 把 ES module 源码打包成单个经典脚本 bundle.js，让 file:// 双击可运行
# （浏览器对 file:// 下的 ES module import 有 CORS 限制，必须用经典脚本。）
import re, os

ROOT = r"C:\Users\x50064195\booking-learn\js"
ORDER = ["data.js", "store.js", "ui.js",
         "pages/search.js", "pages/results.js", "pages/seats.js",
         "pages/passengers.js", "pages/payment.js", "pages/order.js",
         "router.js"]

out = []
out.append("// === bundle.js：自动打包生成（源码见 js/ 各模块，便于学习）===\n")
out.append("'use strict';\n\n")

for rel in ORDER:
    p = os.path.join(ROOT, rel.replace("/", os.sep))
    with open(p, encoding="utf-8") as f:
        src = f.read()
    # 去掉 import 行
    src = re.sub(r"^\s*import\s+.*?;\s*$", "", src, flags=re.M)
    # export function X  -> function X
    src = re.sub(r"\bexport\s+function\s+", "function ", src)
    # export const/let  -> const/let
    src = re.sub(r"\bexport\s+(const|let)\s+", r"\1 ", src)
    # export default（无）
    out.append(f"\n// ---------- {rel} ----------\n")
    out.append(src)
    out.append("\n")

bundle_path = os.path.join(ROOT, "bundle.js")
with open(bundle_path, "w", encoding="utf-8") as f:
    f.write("".join(out))
print("BUNDLED ->", bundle_path, "size:", os.path.getsize(bundle_path))
