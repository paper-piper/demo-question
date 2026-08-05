import zipfile, sys, xml.etree.ElementTree as ET

W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

def para_text(p):
    parts=[]
    for node in p.iter():
        t=node.tag
        if t==W+'t': parts.append(node.text or '')
        elif t==W+'tab': parts.append('\t')
        elif t==W+'br': parts.append('\n')
    return ''.join(parts)

def extract(path):
    z=zipfile.ZipFile(path)
    root=ET.fromstring(z.read('word/document.xml'))
    body=root.find(W+'body')
    lines=[]
    def walk(el, intable=False):
        for child in el:
            if child.tag==W+'p':
                txt=para_text(child).strip()
                pPr=child.find(W+'pPr')
                pre=''
                if pPr is not None:
                    st=pPr.find(W+'pStyle')
                    if st is not None:
                        v=st.get(W+'val','')
                        if v.lower().startswith('heading'):
                            n=''.join(c for c in v if c.isdigit())
                            pre='#'*(int(n) if n else 1)+' '
                    if pPr.find(W+'numPr') is not None:
                        pre='  - ' if not pre else pre
                lines.append(('[TBL] ' if intable else '')+pre+txt if txt else '')
            elif child.tag==W+'tbl':
                lines.append('--- TABLE START ---')
                for tr in child.findall(W+'tr'):
                    cells=[]
                    for tc in tr.findall(W+'tc'):
                        ct=' '.join(para_text(p).strip() for p in tc.findall(W+'p'))
                        cells.append(ct.strip())
                    lines.append(' | '.join(cells))
                lines.append('--- TABLE END ---')
            else:
                walk(child, intable)
    walk(body)
    return '\n'.join(lines)

for f in sys.argv[1:]:
    print('='*70); print('FILE:',f.split('/')[-1]); print('='*70)
    print(extract(f))
