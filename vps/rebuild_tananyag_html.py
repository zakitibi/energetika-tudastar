#!/usr/bin/env python3
"""
Rebuild the embedded Tananyag (view-tan) and Kviz (view-quiz) srcdoc iframes
inside Energetika.html from the single source of truth: Energetika_Tananyag.html.

Why: Energetika.html (the SPA served by Pages) carries a SEPARATE embedded copy
of the tananyag. Editing only Energetika_Tananyag.html (as generate_lesson.sh /
an agent does) leaves the SPA showing stale lessons. Run this after any change
to Energetika_Tananyag.html, then commit + push.

Idempotent & self-bootstrapping: it reads the current view-tan to recover the
two embedding adaptations (<base target="_blank"> + <style id="embed-override">)
and the current Kviz app shell, then re-injects fresh content/data.
"""
import re, json, html, sys, os

REPO = os.environ.get("REPO_DIR", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHELL = os.path.join(REPO, "Energetika.html")
SRC   = os.path.join(REPO, "Energetika_Tananyag.html")

def esc(s):
    return (s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
             .replace('"','&quot;').replace("'",'&#x27;'))

def get_srcdoc(shell, view_id, title):
    marker = 'id="%s"><iframe title="%s" srcdoc="' % (view_id, title)
    i = shell.index(marker)
    start = i + len(marker)
    end = shell.index('"></iframe></div>', start)
    return start, end, html.unescape(shell[start:end])

def grab_json(text, var):
    m = re.search(r'const\s+'+var+r'\s*=\s*', text)
    obj, end = json.JSONDecoder().raw_decode(text, m.end())
    return m.start(), m.end(), obj, end

shell = open(SHELL, encoding="utf-8").read()
source = open(SRC, encoding="utf-8").read()

# ---- 1) Rebuild view-tan from source + embedding adaptations ----
ts, te, cur_tan = get_srcdoc(shell, "view-tan", "Tananyag")
mo = re.search(r'<style id="embed-override">.*?</style>', cur_tan, re.S)
if not mo:
    sys.exit("ERROR: embed-override block not found in current view-tan")
EMBED = mo.group(0)
assert '<base target="_blank">' in cur_tan, "base tag missing in current view-tan"

new_tan = source
if '<base target="_blank">' not in new_tan:
    new_tan = new_tan.replace('<head>', '<head>\n<base target="_blank">', 1)
if '<style id="embed-override">' not in new_tan:
    new_tan = new_tan.replace('</style>', '</style>\n\n'+EMBED, 1)

shell = shell[:ts] + esc(new_tan) + shell[te:]

# ---- 2) Rebuild view-quiz data (QUIZ + TITLES) from source ----
_,_,SRC_QUIZ,_  = grab_json(source, "QUIZ")
_,_,SRC_TITLES,_= grab_json(source, "TITLES")

qs, qe, cur_quiz = get_srcdoc(shell, "view-quiz", "Kikérdező")
qjs = json.dumps(SRC_QUIZ, ensure_ascii=False)
tjs = json.dumps(SRC_TITLES, ensure_ascii=False)
# swap the two const literals in the Kviz app
s0,s1,_,e0 = grab_json(cur_quiz, "QUIZ")
cur_quiz = cur_quiz[:s1] + qjs + cur_quiz[e0:]
s0,s1,_,e0 = grab_json(cur_quiz, "TITLES")
cur_quiz = cur_quiz[:s1] + tjs + cur_quiz[e0:]

shell = shell[:qs] + esc(cur_quiz) + shell[qe:]

open(SHELL, "w", encoding="utf-8").write(shell)
print("Rebuilt Energetika.html from Energetika_Tananyag.html")
print("  lessons:", sorted(SRC_TITLES.keys(), key=int))
print("  questions:", sum(len(v.get('questions',[])) for v in SRC_QUIZ.values()),
      "| cards:", sum(len(v.get('cards',[])) for v in SRC_QUIZ.values()))
