from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1];D=R/'dist';errors=[]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.links=[];self.h1=0;self.lang=None;self.alt=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:
   if a['id'] in self.ids:errors.append('Duplicate ID '+a['id'])
   self.ids.add(a['id'])
  if tag=='a' and a.get('href'):self.links.append(a['href'])
  if tag in ['img','script','link']:
   src=a.get('src') or (a.get('href') if tag=='link' and a.get('rel') in ['stylesheet','icon'] else None)
   if src:self.links.append(src)
  if tag=='img' and not a.get('alt'):errors.append('Missing image alternative')
  if tag=='h1':self.h1+=1
  if tag=='html':self.lang=a.get('lang')
pages={}
for p in D.rglob('*.html'):
 q=Page();q.feed(p.read_text());pages[p.resolve()]=q
 if p.name not in ['404.html','index.html','admin.html']:continue
 if p!=D/'index.html' and q.h1!=1:errors.append(f'{p}: expected one H1')
 if not q.lang:errors.append(str(p)+' missing language')
for p,q in pages.items():
 for href in q.links:
  url=urlsplit(href)
  if url.scheme or url.netloc:continue
  target=(D/url.path.lstrip('/')) if url.path.startswith('/') else p.parent/url.path
  if not url.path:target=p
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{p}: broken local link {href}')
  elif url.fragment and target.resolve() in pages and url.fragment not in pages[target.resolve()].ids:errors.append(f'{p}: missing anchor {href}')
for l in ['en','fr']:
 assert (D/f'documents/clement-sampebgo-cv-{l}.pdf').read_bytes().startswith(b'%PDF')
 assert f'cv-{l}.pdf' in (D/l/'index.html').read_text()
 assert (D/l/'index.html').stat().st_size<40000
ET.parse(D/'sitemap.xml')
projects=json.loads((R/'content/projects.json').read_text())
assert len({p['id'] for p in projects})==len(projects)
for project in projects:
 for lang in ['en','fr']:assert (D/lang/'projects'/project['id']/'index.html').is_file()
if errors:raise SystemExit('\n'.join(errors))
print(f'HTML, anchors, image alternatives, local assets, bilingual downloads and sitemap: {len(pages)} pages checked')
