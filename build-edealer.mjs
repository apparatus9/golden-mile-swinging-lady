// Builds the WordPress / eDealer paste-in version of the legacy page from index.html,
// so the two can never drift. Re-run after any edit:  node build-edealer.mjs
//
// Constraints proven on the team page (see that repo's build-edealer.mjs). In eDealer's CMS:
//   - <script> is stripped   -> no JS; nothing may depend on it
//   - <svg>    is stripped   -> artwork arrives as <img> or a CSS data: URI
//   - <link>   is stripped by KSES unless the author has unfiltered_html
//   - wpautop turns a blank line into <p> and a lone newline into <br>
//   - the host page already renders its own header, nav and footer
import { readFile, writeFile } from 'node:fs/promises';

const CDN = 'https://goldenmile-swinging-lady.netlify.app/';
const WRAP = '.gmc-legacy';
// Every rule of ours is emitted with the class doubled — same element, but specificity
// 0-2-x instead of 0-1-x. A theme rule like `.entry-content p{font-family:Georgia}`
// (0-1-1) then loses to ours. Verified against edealer/preview.html, where a single
// class let the theme's `p{}` recolour and re-font the body copy.
const ROOT = WRAP + WRAP;
const src = await readFile('index.html', 'utf8');

let css = src.match(/<style>([\s\S]*?)<\/style>/)[1];
let html = src.slice(src.indexOf('</style>') + 8)
              .replace(/<\/head>|<body>|<\/body>|<\/html>/g, '');

// ---- drop everything the host page already renders --------------------------
const cut = (re, what) => {
  const before = html;
  html = html.replace(re, '');
  if (html === before) throw new Error('nothing removed for: ' + what);
};
cut(/<div class="topbar">[\s\S]*?<\/div>\s*<\/div>/, 'top bar');
cut(/<header class="hdr"[\s\S]*?<\/header>/, 'sticky header + nav');
cut(/<div class="locbar">[\s\S]*?<\/p>\s*<\/div>/, 'red location bar');
cut(/<footer>[\s\S]*?<\/footer>/, 'footer');
cut(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, 'JSON-LD');
cut(/<script>[\s\S]*?<\/script>/, 'page JS');
html = html.replace(/<!--[\s\S]*?-->/g, '');

// no JS means no scroll-reveal, so the class must not hide anything
html = html.replace(/\s+class="rv"/g, '').replace(/ rv(?=["\s])/g, '');

// ---- names to namespace -----------------------------------------------------
// Theme CSS would otherwise reach generic names like .nav .btn .head .panel .top.
// Only CLASS names go here. CSS custom properties (--red, --grey, ...) are already
// private to the wrapper and must not be rewritten, which is why renaming happens
// on selectors only and never inside a declaration body.
const NAMES = ['btn-red', 'btn-line', 'btn-light', 'herofig', 'eyebrow', 'timeline', 'rxnote', 'center',
  'quote', 'stats', 'split', 'strip', 'terms', 'links', 'panel', 'phone', 'grey', 'black', 'fees', 'hang',
  'head', 'hero', 'lede', 'band', 'wrap', 'rule', 'faq', 'col', 'mid', 'sec', 'top', 'stat', 'ans', 'btn',
  'swing', 'tl', 'hot', 'yr', 'out', 'rx', 'b'];
const IDS = ['top', 'landmark', 'seasons', 'timeline', 'today', 'doctor', 'faq'];
const byLength = [...NAMES].sort((a, b) => b.length - a.length);
const renameSelector = (sel) => byLength.reduce((s, n) =>
  s.replace(new RegExp('\\.' + n.replace(/-/g, '\\-') + '(?![\\w-])', 'g'), '.gmc-' + n), sel);

// ---- scope + rename, selectors only -----------------------------------------
css = css.replace(/\/\*[\s\S]*?\*\//g, '');   // comments first: they sit where selectors get parsed

function scopeSelector(sel) {
  return sel.split(',').map(s => {
    s = renameSelector(s.trim());
    if (!s) return null;
    if (s === 'html') return null;                 // the host owns <html>
    if (s === 'body') return ROOT;                 // our page body becomes our wrapper
    if (s === '*') return ROOT + ',' + ROOT + ' *,' + ROOT + ' *::before,' + ROOT + ' *::after';
    return s.startsWith(ROOT) ? s : ROOT + ' ' + s;
  }).filter(Boolean).join(',');
}

function scopeBlock(text) {
  let out = '', i = 0;
  while (i < text.length) {
    const at = text.indexOf('{', i);
    if (at < 0) break;
    const sel = text.slice(i, at).trim();
    let depth = 1, j = at + 1;
    while (j < text.length && depth) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') depth--;
      j++;
    }
    const body = text.slice(at + 1, j - 1);
    if (/^@(media|supports)/.test(sel)) out += sel + '{' + scopeBlock(body) + '}\n';
    else if (/^@/.test(sel)) out += sel + '{' + body + '}\n';   // keyframes etc: leave alone
    else {
      const sc = scopeSelector(sel);
      if (sc) out += sc + '{' + body.trim() + '}\n';
    }
    i = j;
  }
  return out;
}

css = css.replace(/:root\{/g, ROOT + '{');       // tokens live on the wrapper
css = scopeBlock(css);
// The scroll-reveal rules parked content at opacity:0 until JS added .on. There is no
// JS here, so every one of them has to go — leaving them is a landmine: re-add the
// class and the section disappears for good.
css = css.split('\n').filter(l => !/\.rv(\.on)?\{/.test(l)).join('\n');

// ---- rename classes and ids in the markup -----------------------------------
html = html.replace(/class="([^"]*)"/g, (m, v) =>
  'class="' + v.split(/\s+/).filter(Boolean).map(c => NAMES.includes(c) ? 'gmc-' + c : c).join(' ') + '"');
for (const id of IDS) {
  html = html.replace(new RegExp('id="' + id + '"', 'g'), 'id="gmc-' + id + '"')
             .replace(new RegExp('href="#' + id + '"', 'g'), 'href="#gmc-' + id + '"');
}

// ---- armour against the host theme reaching in -------------------------------
// Inherited properties lose to ANY direct rule, and properties we never set are
// simply the theme's. Both were caught in preview.html: the theme's `p{}` put the
// body copy in Georgia, and its `img{}` gave the artwork a green circular border.
// :where() keeps this at 0-1-0 so every one of our own rules still wins.
const ELS = 'h1,h2,h3,h4,h5,h6,p,a,span,em,i,strong,b,small,ul,ol,li,div,section,figure,' +
            'figcaption,blockquote,hr,img,details,summary,button,label';
const RESET =
  WRAP + ' :where(' + ELS + '){' +
    'margin:0;padding:0;border:0;border-radius:0;background:none;box-shadow:none;' +
    'text-decoration:none;text-transform:none;text-shadow:none;float:none;outline:none;' +
    'font-family:inherit;font-size:inherit;line-height:inherit;letter-spacing:inherit;' +
    'color:inherit;list-style:none;max-width:none;width:auto' +
  '}\n' +
  // font-weight is left alone so <b>/<strong> stay bold; our headings set theirs.
  ROOT + ' :where(p,li,a,span,div,em,strong,b,figcaption,summary,blockquote){' +
    'font-family:var(--sans);color:inherit}\n';

// ---- repairs for what wpautop does to pasted markup -------------------------
const WPAUTOP = ROOT + ' > p:empty{display:none}\n' +
                ROOT + ' > br{display:none}\n' +
                ROOT + ' p:has(> img){margin:0}\n';

// ---- absolute asset URLs: the CMS page is not served from our host ----------
html = html.replace(/src="images\//g, 'src="' + CDN + 'images/');

// ---- Oswald via @import; a <link> would be stripped -------------------------
const FONT = "@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap');\n";

// ---- emit -------------------------------------------------------------------
// One line, deliberately — the same call the team page made. wpautop turns a blank
// line into <p> and a lone newline into <br>, and this markup has inline siblings
// (the two hero buttons, the three link cards, each timeline year span) sitting on
// their own lines. With no newline anywhere there is nothing for it to act on.
// Newlines collapse to a SPACE, not to nothing, so words never run together.
const oneline = (s) => s.replace(/\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
const body = '<div class="gmc-legacy">' + oneline(html) + '</div>';
const sheet = FONT + RESET + css + WPAUTOP;

await writeFile('edealer/legacy-edealer.html', '<style>\n' + sheet + '</style>\n' + body + '\n');
await writeFile('edealer/legacy-edealer.wp.css', sheet);
await writeFile('edealer/legacy-edealer.nocss.html', body + '\n');

// A standalone page for checking the paste locally, with theme-ish CSS in front of it
// so collisions show up here rather than on the live site.
await writeFile('edealer/preview.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>eDealer paste preview</title>
<style>
/* stand-in for a theme: the generic names a host stylesheet is likely to define */
body{margin:0;font:16px/1.5 Georgia,serif;color:#204}
.wrap{max-width:400px;border:4px dashed #c0f;padding:30px}
.btn{background:#0f0;color:#f0f;padding:40px;border-radius:30px}
.nav,.head,.panel,.top,.links,.stats,.hero,.band{outline:4px solid #f0f !important;background:#ffc !important}
h1,h2,h3{font-family:"Comic Sans MS",cursive;color:#f0f;letter-spacing:-2px}
p,li{font-family:Georgia,serif;color:#909}
a{color:#0aa;text-decoration:underline wavy}
img{border:6px solid #0f0;border-radius:50%}
.host{padding:20px;background:#eee;border-bottom:3px solid #999;font:14px system-ui}
</style></head><body>
<div class="host">host page chrome (theme styles above are deliberately hostile)</div>
<div class="wrap"><p>Theme content before the paste.</p></div>
${await readFile('edealer/legacy-edealer.html', 'utf8')}
<div class="wrap"><p>Theme content after the paste.</p></div>
</body></html>
`);

// ---- checks -----------------------------------------------------------------
for (const bad of [/<script/i, /<svg/i, /<link/i, /<!DOCTYPE/i, /<html[\s>]/i, /<body[\s>]/i]) {
  if (bad.test(body)) throw new Error('tag the CMS strips is present: ' + bad);
}
if (/\n[ \t]*\n/.test(body)) throw new Error('blank line left for wpautop to mangle');
for (const line of css.split('\n')) {
  const m = line.match(/^([^@}][^{]*)\{/);   // per line: skip at-rules and the } that closes @media
  if (!m) continue;
  if (!m[1].split(',').every((s) => s.trim().startsWith(WRAP))) {
    throw new Error('unscoped selector would leak into the theme: ' + m[1].trim());
  }
}
if (/-\.gmc/.test(css)) throw new Error('mangled name in CSS');
// nothing may start hidden: there is no JS here to ever reveal it
if (/opacity:0[;}]/.test(sheet)) throw new Error('a rule parks content at opacity:0 with no JS to reveal it');
for (const v of ['--red', '--grey', '--head', '--black', '--body', '--line', '--ink', '--sans', '--muted']) {
  if (!css.includes(v + ':')) throw new Error('custom property lost: ' + v);
}
console.log('css ' + (sheet.length / 1024).toFixed(1) + ' KB   markup ' + (body.length / 1024).toFixed(1) + ' KB');
console.log('checks: no script/svg/link, no blank lines, every selector scoped, tokens intact  OK');
