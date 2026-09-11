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

## Deploying

```
netlify deploy --dir . --prod --site 5905207a-b86d-451f-8fec-ca869c7e5d9f
```

## Notes

- The swing animation runs only while the figure is on screen, and stops entirely for
  visitors with `prefers-reduced-motion` set.
- FAQ answers and dealership details are mirrored in JSON-LD (`AutoDealer` + `FAQPage`)
  for rich results.
