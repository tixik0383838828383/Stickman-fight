#!/usr/bin/env python3
"""Собирает игру в один HTML-файл: Stickman-Duel-Arena.html (CSS и все JS внутри)."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root/'index.html').read_text(encoding='utf-8')
css = (root/'style.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n'+css+'\n</style>')
def inline(m):
    js = (root/m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script')
    return '<script>\n'+js+'\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
out = root/'Stickman-Duel-Arena.html'
out.write_text(html, encoding='utf-8')
print('OK', out, round(out.stat().st_size/1024), 'KB')
