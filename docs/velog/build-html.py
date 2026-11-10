"""Velog 원고(MD)를 이미지가 모두 들어간 HTML 파일 하나로 만든다.

사용법: python build-html.py 01-planning-and-start.md
결과:   같은 폴더에 01-planning-and-start.html
"""
import base64
import html
import mimetypes
import re
import sys
from pathlib import Path

import markdown

src = Path(sys.argv[1]).resolve()
text = src.read_text(encoding="utf-8")

# 머리 주석에서 메타 정보 읽기
meta = {}
m = re.match(r"\s*<!--(.*?)-->\s*", text, re.S)
if m:
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    text = text[m.end():]

title = meta.get("Velog 제목", src.stem)
series = meta.get("시리즈", "")
tags = [t.strip() for t in meta.get("태그", "").split(",") if t.strip()]

body = markdown.markdown(text, extensions=["tables", "fenced_code"])


def embed(match):
    path = (src.parent / match.group(1)).resolve()
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f'src="data:{mime};base64,{data}"'


body = re.sub(r'src="([^"]+\.(?:png|jpe?g|gif|webp))"', embed, body)
# 이미지가 든 문단은 그림, 기울임만 있는 문단은 캡션으로 표시
body = re.sub(r"<p>(<img [^>]+>)\s*<em>(.*?)</em></p>",
              r'<figure>\1<figcaption>\2</figcaption></figure>', body, flags=re.S)
body = re.sub(r"<p><em>(그림 .*?)</em></p>", r'<p class="cap">\1</p>', body, flags=re.S)
body = body.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")

tag_html = "".join(f"<span>{html.escape(t)}</span>" for t in tags)
series_html = f'<div class="series">{html.escape(series)}</div>' if series else ""

page = f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<style>
:root {{
  --bg: #ffffff; --ink: #212529; --sub: #495057; --muted: #868e96;
  --line: #e9ecef; --soft: #f8f9fa; --accent: #12b886; --code: #f1f3f5;
}}
@media (prefers-color-scheme: dark) {{
  :root {{
    --bg: #121212; --ink: #ececec; --sub: #d9d9d9; --muted: #acacac;
    --line: #2a2a2a; --soft: #1e1e1e; --accent: #63e6be; --code: #2a2a2a;
  }}
}}
* {{ box-sizing: border-box; }}
body {{
  margin: 0; background: var(--bg); color: var(--ink);
  font-family: "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "맑은 고딕", system-ui, sans-serif;
  line-height: 1.75; font-size: 18px; word-break: keep-all; overflow-wrap: anywhere;
}}
main {{ max-width: 768px; margin: 0 auto; padding: 64px 16px 120px; }}
h1 {{ font-size: 2.6rem; line-height: 1.35; margin: 0 0 24px; letter-spacing: -0.02em; }}
.info {{ display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }}
.info span {{
  background: var(--soft); color: var(--accent); border-radius: 16px;
  padding: 2px 14px; font-size: 0.9rem; font-weight: 600;
}}
.series {{
  background: var(--soft); border-radius: 8px; padding: 20px 24px; margin-bottom: 48px;
  font-weight: 700; font-size: 1.15rem; border-left: 4px solid var(--accent);
}}
h2 {{ font-size: 1.75rem; line-height: 1.4; margin: 64px 0 16px; letter-spacing: -0.01em; }}
p {{ margin: 18px 0; }}
img {{ max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 4px; }}
figure {{ margin: 36px 0; }}
figcaption, .cap {{ color: var(--muted); font-size: 0.92rem; text-align: center; margin-top: 10px; }}
.cap {{ margin-top: -8px; }}
.tbl {{ overflow-x: auto; margin: 24px 0; }}
table {{ border-collapse: collapse; width: 100%; font-size: 0.95rem; line-height: 1.6; }}
th, td {{ border: 1px solid var(--line); padding: 8px 12px; text-align: left; vertical-align: top; }}
th {{ background: var(--soft); }}
td img {{ margin: 0; }}
blockquote {{
  margin: 32px 0; padding: 16px 24px; background: var(--soft);
  border-left: 4px solid var(--accent); color: var(--sub);
}}
blockquote p {{ margin: 0; }}
code {{ background: var(--code); padding: 2px 6px; border-radius: 4px; font-size: 0.88em; }}
ul, ol {{ padding-left: 1.4em; }}
li {{ margin: 6px 0; }}
a {{ color: var(--accent); }}
@media (max-width: 600px) {{
  body {{ font-size: 16px; }}
  h1 {{ font-size: 1.9rem; }}
  h2 {{ font-size: 1.4rem; }}
}}
</style>
</head>
<body>
<main>
<h1>{html.escape(title)}</h1>
<div class="info">{tag_html}</div>
{series_html}
{body}
</main>
</body>
</html>
"""

out = src.with_suffix(".html")
out.write_text(page, encoding="utf-8")
print(f"saved {out} ({out.stat().st_size / 1024:.0f} KB)")
