# The Swinging Lady — Golden Mile Chrysler

A single-page site telling the story of the 40-foot Swinging Lady billboard that has
hung above Golden Mile Chrysler at 1743 Eglinton Avenue East since 1962, and of the
CDD6 campaign run under her today.

**Live:** https://goldenmile-swinging-lady.netlify.app

## What's here

| File | Purpose |
|---|---|
| `index.html` | The whole page — markup, CSS and JS inline. No build step, no dependencies. |
| `images/swinging-lady.png` | Colour artwork, used in the hero. Swings on a CSS pendulum. |
| `images/swinging-lady-bw.png` | Greyscale illustration, used in "She Dresses for the Season". Static. |

Open `index.html` directly in a browser and it works — no server needed.

## Design

Deliberately matched to goldenmilechrysler.ca so the two read as one brand:

- **Headings** Oswald, uppercase, 1.1px letter-spacing
- **Body** Arial, 17px / 27px
- **Accent** `#ca0000` (sampled from the live site)
- **Palette** black, white, `#f4f4f4` grey — square corners throughout, no rounded edges

## Images

Both are cut out with transparent backgrounds.

`swinging-lady-bw.png` was extracted from the brochure artwork: cropped below the
headline at y=922 (the one clean row between the type and her hair), background flood
-filled away from the page edges, then a second pass cleared the enclosed white pockets
between her arms, the ropes and the seat. It is encoded as 8-bit greyscale + alpha
rather than RGBA — 251 KB instead of 748 KB, with no visible loss.

## Pasting into WordPress / eDealer

**Use .** One paste, into the code box.

Two WordPress settings matter as much as the markup, both found by measuring the live
page rather than guessing:

1. **Page Attributes -> Template must be .** On  the content
   sits in a 944px Foundation  beside the Contact/Hours sidebar, which is
   what made the page look cramped and clipped.
2. ** goes in Appearance -> Customize -> Additional CSS.**
   Three rules, and the only thing they do is swing the hero figure:  has no
   inline form. It matches , so the one hero image is the
   only element on the whole site it can touch.

`node build-edealer-inline.mjs` generates it. Every style is an inline `style=""`
attribute, because that is the only styling the CMS leaves alone:

| Tried | Result on the live page |
|---|---|
| `<style>` in the HTML block | stripped outright — page rendered with no CSS at all |
| raw CSS in the HTML block | printed as visible text, and `wptexturize` turned `--red` into `–red` |
| inline `style=""` | survives — `wptexturize` and `wpautop` only touch text *between* tags |

What inline styles cannot do, and how the build copes:

- **No `@keyframes`** — the hero figure does not swing in the CMS version. Unavoidable.
- **No media queries** — layout is `flex-wrap` + `flex-basis`, so it reflows on its own
  at any column width. This matters: the page sits in a ~900px column beside the
  Contact/Hours sidebar, so viewport queries would never have fired anyway.
- **No `::before`** — the quote bar and the timeline marker are real elements now.
- **No `:hover`** — dropped.
- **No `@import`** — not needed, the site already loads Oswald.

`background` and `color` carry `!important`, and nothing else does. A theme rule with
`!important` beats a plain inline style; in testing that knocked the black off the hero
and left white text on a pale ground. Those two properties decide legibility, so they
get the armour.

Colour and font are set on **every** text element rather than inherited — an inherited
value loses to any direct theme rule, which is how the body copy came out in Georgia.

`edealer/preview-inline.html` renders the paste after a simulated `wptexturize` +
`wpautop`, inside a narrow column, under deliberately hostile theme CSS.

### The scoped-stylesheet version (only if a stylesheet box exists)



`node build-edealer.mjs` regenerates `edealer/` from `index.html`, so the standalone
page and the CMS version can never drift.

| File | Use |
|---|---|
| `edealer/legacy-edealer.html` | Paste this into a Custom HTML block. Style + markup in one. |
| `edealer/legacy-edealer.wp.css` | The same CSS, if you'd rather put it in Appearance → Customise → Additional CSS. Then paste `legacy-edealer.nocss.html`. |
| `edealer/legacy-edealer.nocss.html` | Markup only. |
| `edealer/preview.html` | Local check: the paste rendered under a deliberately hostile theme. |

What the build does, and why — every item here is a failure that was observed, not a guess:

- **No `<script>`, no `<svg>`, no `<link>`.** The CMS strips all three (the team page
  confirmed 0 of 60 `<svg>` survived). So the scroll-reveal, the mobile nav toggle and
  the JSON-LD are dropped, and the font arrives by `@import` inside `<style>`.
- **Nothing starts hidden.** The reveal rules parked sections at `opacity:0` until JS
  added a class. With no JS those had to go, or the content would never appear. The
  build fails if any `opacity:0` survives.
- **Markup ships on one line.** `wpautop` turns a blank line into `<p>` and a lone
  newline into `<br>`; the two hero buttons and the three link cards sat on their own
  lines and would have been split apart. Newlines collapse to a space, never to nothing.
- **Every class is `gmc-` prefixed and every rule scoped to `.gmc-legacy`**, so nothing
  leaks either way. Generic names like `.nav`, `.btn`, `.head`, `.panel` would otherwise
  collide with the theme.
- **Our rules are emitted with the class doubled** (`.gmc-legacy.gmc-legacy`) for
  specificity 0-2-x, and a `:where()` reset neutralises what the theme reaches in with.
  Without these the theme's `p{}` set the body copy in Georgia and its `img{}` gave the
  artwork a green circular border — both caught in `preview.html`.
- **Images use absolute URLs**, since the CMS page is not served from this host.

The host page supplies its own header, nav, footer and location bar, so the build
removes ours rather than shipping a duplicate banner.

## Deploying

```
netlify deploy --dir . --prod --site 5905207a-b86d-451f-8fec-ca869c7e5d9f
```

## Notes

- The swing animation runs only while the figure is on screen, and stops entirely for
  visitors with `prefers-reduced-motion` set.
- FAQ answers and dealership details are mirrored in JSON-LD (`AutoDealer` + `FAQPage`)
  for rich results.
