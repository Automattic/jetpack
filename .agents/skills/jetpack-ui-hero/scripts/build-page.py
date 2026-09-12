#!/usr/bin/env python3
"""Assemble a hero showcase into one self-contained HTML file.

Every image is inlined as a data URI, so the result is a single file that can be
published as an Artifact or dropped into a worker unchanged.

Usage:  build-page.py <dir>            # <dir> holds pieces.json and everything it names
        build-page.py <dir> --embed    # also write embed-<id>.html per piece

`--embed` writes one standalone fragment per piece, scoped so it cannot leak styles
into a host page: paste it straight into a WordPress Custom HTML block. Nothing in it
touches `body`, `main` or any element selector.

pieces.json:
{
  "title":  "Jetpack Forms Heroes",        # <title>, and the artifact's name
  "h1":     "Jetpack Forms heroes",
  "lede":   "One sentence under the h1.",
  "footer": "One sentence under the last piece.",
  "logo":   { "light": "logo-light.svg", "dark": "logo-dark.svg" },   # optional
  "pieces": [{
    "id":     "fr",                        # scene id prefix: #fr-scene, #fr-box, #fr-stage
    "name":   "Response lands",
    "lede":   "What the piece shows, and why it is shaped this way.",
    "width":  1280, "height": 820,         # the capture size the scene is authored at
    "css":    "piece-fr.css",
    "markup": "piece-fr.html",             # {{asset:plate}} -> data URI
    "vars":   { "t-card": "0.35s" },       # -> --t-card on #fr-scene
    "assets": { "plate": "plate.webp" },   # -> {{asset:plate}} and --plate
    "weight": ["plate.webp"],              # KB shown in the spec table
    "spec": [
      { "dt": "Beats", "beats": [["0.35s", "the card rises"], ["4.6s", "press"]] },
      { "dt": "Weight", "dd": "{weight}", "small": "one WebP; the rest is DOM" },
      { "dt": "Made of", "dd": "HTML + CSS keyframes", "small": "live text, no JS in the animation" }
    ]
  }]
}
"""
import base64, html, json, mimetypes, sys
from pathlib import Path

SKILL_ASSETS = Path(__file__).resolve().parent.parent / 'assets'

esc = html.escape

MIME = {'.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml',
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif'}


def data_uri(path: Path) -> str:
    mime = MIME.get(path.suffix.lower()) or mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return f'data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}'


def read(root: Path, name: str, why: str) -> str:
    p = root / name
    if not p.exists():
        sys.exit(f'{name}: no such file in {root} (named by {why})')
    return p.read_text(encoding='utf-8')


def shared(root: Path, name: str) -> str:
    """Prefer a local override, fall back to the skill's own copy."""
    local = root / name
    return (local if local.exists() else SKILL_ASSETS / name).read_text()


def kb(root: Path, names) -> int:
    for n in names:
        if not (root / n).exists():
            sys.exit(f'{n}: no such file in {root} (named by a piece\'s "weight")')
    return round(sum((root / n).stat().st_size for n in names) / 1024)


def spec_html(rows, weight):
    """Spec rows. Values may carry inline markup on purpose (<code>, <br>), so they
    are not escaped; keep them authored, not user-supplied."""
    out = []
    for row in rows:
        dt = html.escape(str(row['dt']))
        if 'beats' in row:
            items = ''.join(f'<li><span>{t}</span>{d}</li>' for t, d in row['beats'])
            out.append(f'<div><dt>{dt}</dt><dd><ol class="beats">{items}</ol></dd></div>')
        else:
            sub = lambda v: str(v).replace('{weight}', f'{weight} KB')
            small = f'<small>{sub(row["small"])}</small>' if row.get('small') else ''
            out.append(f'<div><dt>{dt}</dt><dd>{sub(row.get("dd", ""))}{small}</dd></div>')
    return '\n    '.join(out)


EMBED = """<div class="jph jph-{pid} is-idle" id="jph-{pid}">
  <div class="jph-box"><div class="jph-scene" id="{pid}-scene">
{markup}
  </div></div>
</div>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fonts}&display=swap">
<style>
/* Scoped to .jph-{pid}: no element selectors, nothing that can reach the host page. */
.jph-{pid} {{
  --sans:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto",sans-serif;
  --wp:-apple-system,system-ui,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;
  --accent:#069e08; --accent-ink:#008710; --accent-pressed:#005b18;
  display:block; width:100%; max-width:{w}px; margin-inline:auto;
}}
/* Inbound guard. A host theme styling `img`, `svg` or `p` would otherwise reach in —
   a themed `img {{ border }}` puts a border round the plate. :where() keeps this at
   zero specificity, so the piece's own rules below still win on source order. */
.jph-{pid} .jph-scene :where(img, svg, div, span, p, b, i, u, em, ol, ul, li, figure) {{
  margin:0; padding:0; border:0; border-radius:0; background:transparent; box-shadow:none;
  max-width:none; min-width:0; max-height:none; outline:0; float:none; list-style:none;
  text-transform:none; text-decoration:none; letter-spacing:normal; vertical-align:baseline;
  box-sizing:border-box;
}}
.jph-{pid} .jph-box {{ position:relative; width:100%; aspect-ratio:{w}/{h}; }}
.jph-{pid} .jph-scene {{ position:absolute; inset:0 auto auto 0; transform-origin:0 0; }}
.jph-{pid} .jph-scene > * {{ position:absolute; }}
.jph-{pid}.is-idle .jph-scene, .jph-{pid}.is-idle .jph-scene * {{ animation-play-state:paused !important; }}
#{pid}-scene {{
  {decls}
}}
{css}
</style>
<script>
(function () {{
  var wrap = document.getElementById('jph-{pid}')
  if (!wrap || wrap.dataset.jph) return
  wrap.dataset.jph = '1'
  var box = wrap.querySelector('.jph-box'), scene = wrap.querySelector('.jph-scene')
  function fit() {{ if (scene.offsetWidth) scene.style.transform = 'scale(' + (box.clientWidth / scene.offsetWidth) + ')' }}
  new ResizeObserver(fit).observe(box); fit()
  function replay() {{
    wrap.classList.remove('is-idle')
    wrap.getAnimations({{ subtree: true }}).forEach(function (a) {{ a.cancel(); a.play() }})
  }}
  var seen = false
  new IntersectionObserver(function (es) {{
    es.forEach(function (e) {{
      if (e.intersectionRatio < 0.5) return
      if (seen) replay(); else {{ seen = true; wrap.classList.remove('is-idle') }}
    }})
  }}, {{ threshold: [0.5] }}).observe(wrap)
  wrap.addEventListener('click', replay)
}})()
</script>
"""


def build_embeds(root: Path, cfg: dict, pieces: list) -> list:
    """One standalone, style-scoped fragment per piece."""
    written = []
    for p, piece_css, markup in pieces:
        pid = p['id']
        decls = '\n  '.join(
            [f'width:{p["width"]}px;', f'height:{p["height"]}px;']
            + [f'--{k}: {v};' for k, v in p.get('vars', {}).items()]
            + [f'--{k}: url("{u}");' for k, u in p['_assets'].items() if f'var(--{k})' in piece_css]
        )
        out = root / f'embed-{pid}.html'
        out.write_text(EMBED.format(pid=pid, w=p['width'], h=p['height'], markup=markup,
                                    decls=decls, css=piece_css,
                                    fonts=cfg.get('fonts', 'family=Inter:wght@400;500;600')),
                       encoding='utf-8')
        written.append(out)
    return written


def build(root: Path, embed: bool = False) -> Path:
    manifest = root / 'pieces.json'
    if not manifest.exists():
        sys.exit(f'no pieces.json in {root} — see this script\'s docstring for the schema')
    cfg = json.loads(manifest.read_text(encoding='utf-8'))
    for key in ('title', 'h1', 'lede', 'footer', 'pieces'):
        if key not in cfg:
            sys.exit(f'pieces.json is missing required key: {key}')
    shell = shared(root, 'shell.css')
    stage = shared(root, 'stage.js')

    styles, sections, boxes, collected = [], [], [], []
    for p in cfg['pieces']:
        pid, w, h = p['id'], p['width'], p['height']
        assets = {k: data_uri(root / v) for k, v in p.get('assets', {}).items()}
        piece_css = read(root, p['css'], f'piece {pid}.css')

        # Inline each asset once, where it is actually referenced: as a CSS custom
        # property only if the stylesheet reads var(--name), and in the markup only
        # if it carries the placeholder. Emitting both doubles the page weight.
        # The scene MUST have explicit dimensions. Its children are all absolutely
        # positioned, so without these it shrink-to-fits to zero, stage.js computes
        # scale(Infinity), CSS drops the invalid transform, and the page renders at
        # 1:1 clipped to a corner — with no error anywhere.
        decls = [f'width:{w}px;', f'height:{h}px;']
        decls += [f'--{k}: {v};' for k, v in p.get('vars', {}).items()]
        decls += [f'--{k}: url("{uri}");' for k, uri in assets.items() if f'var(--{k})' in piece_css]
        styles.append(f'#{pid}-scene {{\n  ' + '\n  '.join(decls) + '\n}\n' + piece_css)
        boxes.append(f'#{pid}-box {{ aspect-ratio:{w}/{h}; }}')

        raw = read(root, p['markup'], f'piece {pid}.markup')
        markup = raw
        for k, uri in assets.items():
            markup = markup.replace('{{asset:' + k + '}}', uri)
        for k in assets:
            in_css, in_markup = f'var(--{k})' in piece_css, '{{asset:' + k + '}}' in raw
            if in_css and in_markup:
                print(f'  warning: piece {pid} asset "{k}" is referenced from BOTH the '
                      f'stylesheet and the markup, so it is inlined twice; pick one')
            elif not in_css and not in_markup:
                print(f'  warning: piece {pid} declares asset "{k}" that nothing references')

        p['_assets'] = assets
        collected.append((p, piece_css, markup))
        sections.append(f'''
<section class="piece" id="piece-{pid}">
  <div class="head">
    <div><h2>{esc(p["name"])}</h2><p class="lede">{esc(p["lede"])}</p></div>
    <button type="button" data-replay="{pid}-stage">Replay <kbd>R</kbd></button>
  </div>

  <div class="stage is-idle" id="{pid}-stage"><div id="{pid}-box"><div id="{pid}-scene" class="scene">
{markup}
  </div></div></div>

  <dl class="spec">
    {spec_html(p.get('spec', []), kb(root, p.get('weight', [])))}
  </dl>
</section>''')

    logo = ''
    if cfg.get('logo'):
        for side in ('light', 'dark'):
            if side not in cfg['logo']:
                sys.exit(f'pieces.json "logo" needs both light and dark; missing: {side}')
        light, dark = data_uri(root / cfg['logo']['light']), data_uri(root / cfg['logo']['dark'])
        logo = (f'<a class="brand" href="https://jetpack.com" aria-label="Jetpack">'
                f'<img class="light" src="{light}" alt="Jetpack"><img class="dark" src="{dark}" alt=""></a>')

    n = len(cfg['pieces'])
    page = f'''<meta charset="utf-8">
<title>{esc(cfg["title"])}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{cfg.get("fonts", "family=Inter:wght@400;500;600")}&display=swap">
<style>
{shell}
{chr(10).join(boxes)}
{chr(10).join(styles)}
</style>

<main>
<header>
  <div>
    {logo}
    <h1>{esc(cfg["h1"])}</h1>
    <p>{esc(cfg["lede"])}</p>
  </div>
  <div class="meta"><b>{n}</b> piece{"s" if n != 1 else ""} · <b>\x00SIZE\x00 KB</b> total · {cfg.get("date", "")}</div>
</header>
{"".join(sections)}
<footer>{esc(cfg["footer"])}</footer>
</main>

<script>
{stage}
</script>
'''
    if embed:
        for e in build_embeds(root, cfg, collected):
            print(f'wrote {e}')

    out = root / 'index.html'
    # Measure after substituting, or the reported total undercounts itself.
    size = round((len(page.encode()) + 4) / 1024)
    out.write_text(page.replace('\x00SIZE\x00', str(size), 1), encoding='utf-8')
    return out


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    root = Path(args[0] if args else '.').resolve()
    path = build(root, embed='--embed' in sys.argv)
    print(f'wrote {path} — {round(path.stat().st_size / 1024)} KB')
