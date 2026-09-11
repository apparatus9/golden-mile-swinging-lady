// ONE paste, for eDealer's code box. Everything is an inline style="" attribute.
//
// Why, from what the live page actually did:
//   - a <style> block is stripped outright (screenshot: page rendered with no CSS)
//   - raw CSS in the content box is printed as text AND corrupted by wptexturize,
//     which turns -- into an en-dash and ' into a curly quote
//   - wptexturize and wpautop only touch text BETWEEN tags, never attribute values,
//     so style="" survives both intact
//
// What inline styles cannot express, and how this handles it:
//   - @keyframes  -> the hero figure is static here; no swing
//   - media queries -> layout uses flex-wrap with flex-basis, so it reflows on its own
//   - :hover      -> dropped
//   - ::before    -> replaced with real elements (the quote bar, the timeline marker)
//   - @import     -> not needed; goldenmilechrysler.ca already loads Oswald site-wide
//
// Colour and font are set on EVERY text element, never inherited: a theme rule like
// `p{font-family:Georgia}` beats inheritance, which is exactly how the body copy came
// out in Georgia during the hostile-theme test.
import { writeFile } from 'node:fs/promises';

const CDN  = 'https://goldenmile-swinging-lady.netlify.app/images/';
const RED = '#ca0000', INK = '#111', BODY = '#3a3a3a', MUTED = '#767676',
      LINE = '#e2e2e2', GREY = '#f4f4f4', DIM = '#c2c2c2', DARKLINE = '#2a2a2a';
const HEAD = "Oswald,'Arial Narrow',Helvetica,Arial,sans-serif";
const SANS = 'Arial,Helvetica,sans-serif';

// ---- element helpers --------------------------------------------------------
const p = (t, o = {}) =>
  `<p style="margin:0 0 ${o.mb ?? 20}px;font-family:${SANS};font-size:${o.fs ?? 17}px;` +
  `line-height:${o.lh ?? 27}px;color:${o.c ?? BODY}">${t}</p>`;

const lede = (t, c = INK) => p(t, { fs: 19, lh: 30, c });

const eyebrow = (t, c = RED) =>
  `<p style="margin:0 0 14px;font-family:${HEAD};font-weight:500;font-size:12px;` +
  `letter-spacing:2.6px;text-transform:uppercase;color:${c}">${t}</p>`;

const h1 = (t) =>
  `<h1 style="margin:0;font-family:${HEAD};font-weight:500;font-size:clamp(1.7rem,5.4cqw,2.7rem);` +
  `line-height:1.08;text-transform:uppercase;letter-spacing:.5px;color:${INK}">${t}</h1>`;

const h2 = (t, c = INK) =>
  `<h2 style="margin:0;font-family:${HEAD};font-weight:400;font-size:clamp(1.35rem,3.6cqw,1.95rem);` +
  `line-height:1.12;text-transform:uppercase;letter-spacing:1.1px;color:${c}">${t}</h2>`;

const h3 = (t, c = INK) =>
  `<h3 style="margin:0 0 10px;font-family:${HEAD};font-weight:700;font-size:19px;` +
  `line-height:1.2;text-transform:uppercase;letter-spacing:1.4px;color:${c}">${t}</h3>`;

const rule = (align) =>
  `<hr style="width:44px;height:3px;background:${RED};border:0;margin:18px ${align === 'center' ? 'auto' : '0'} 0">`;

// the red bar was a ::before; inline styles have no pseudo-elements, so it is real now
const quote = (t, c = INK) =>
  `<div style="margin:36px 0 0">` +
  `<div style="width:44px;height:3px;background:${RED};margin:0 0 20px"></div>` +
  `<div style="font-family:${HEAD};font-weight:400;font-size:clamp(1.1rem,2.6cqw,1.45rem);` +
  `line-height:1.32;letter-spacing:.3px;color:${c}">${t}</div></div>`;

const btn = (href, label, kind) => {
  const base = `display:inline-block;font-family:${HEAD};font-weight:500;font-size:15px;` +
    `letter-spacing:1.2px;text-transform:uppercase;padding:15px 30px;text-decoration:none;` +
    `border:1px solid ${RED};background:${RED};color:#fff`;
  const styles = {
    red: base,
    light: base.replace(`border:1px solid ${RED}`, 'border:1px solid rgba(255,255,255,.55)')
               .replace(`background:${RED}`, 'background:transparent'),
    line: base.replace(`border:1px solid ${RED}`, `border:1px solid ${INK}`)
              .replace(`background:${RED}`, 'background:transparent').replace('color:#fff', `color:${INK}`),
  };
  return `<a href="${href}" style="${styles[kind]}">${label}</a>`;
};

// flex-wrap + flex-basis stands in for the media queries: the columns sit side by side
// when the content column is wide enough and stack by themselves when it is not
// A child may carry its own weight: the hero's text needs more room than the picture.
const row = (kids, { gap = 44, basis = 320, align = 'flex-start', weights = [] } = {}) =>
  `<div style="display:flex;flex-wrap:wrap;gap:${gap}px;align-items:${align}">` +
  kids.map((k, i) => `<div style="flex:${weights[i] ?? 1} 1 ${basis}px;min-width:0">${k}</div>`).join('') +
  '</div>';

// No section ever paints a ground — it sits on whatever the host page provides, so the
// block blends in instead of stacking rectangles down the page. background:transparent
// is stated rather than omitted so a theme rule cannot fill it (armour() adds
// !important to every background we declare). A hairline is the only separator.
const section = (inner, { pad = 54, seam = true } = {}) =>
  `<section style="background:transparent;padding:${pad}px 0` +
  (seam ? `;border-top:1px solid ${LINE}` : '') +
  `"><div style="max-width:1100px;margin:0 auto;padding:0 22px">${inner}</div></section>`;

const centred = (inner) => `<div style="text-align:center;max-width:700px;margin:0 auto 40px">${inner}</div>`;
const col = (inner) => `<div style="max-width:680px;margin:0 auto">${inner}</div>`;
const img = (file, w, h, alt, style) =>
  `<img src="${CDN}${file}" width="${w}" height="${h}" alt="${alt}" ` +
  `style="display:block;border:0;border-radius:0;${style}">`;

// ---- page -------------------------------------------------------------------
const HERO = section(
  row([
    eyebrow('Eglinton Avenue East &middot; Scarborough') + h1('The Swinging Lady') +
    `<div style="margin-top:22px">` +
      p("Toronto's iconic billboard — a 40-foot illuminated figure who has been gliding back and " +
        'forth above Eglinton Avenue East since 1962, quietly inviting every passing driver to swing on by.',
        { fs: 18, lh: 29, c: BODY, mb: 0 }) + '</div>' +
    `<div style="margin-top:30px;display:flex;flex-wrap:wrap;gap:12px">` +
      btn('tel:+14373715007', 'Call 437-371-5007', 'red') +
      btn('#gmc-landmark', 'Read Her Story', 'line') + '</div>',
    `<div style="text-align:center">` +
      img('swinging-lady.png', 543, 979, 'The Swinging Lady, the 40-foot illuminated figure above Golden Mile Chrysler since 1962',
          'max-width:300px;width:100%;height:auto;margin:0 auto') + '</div>',
  ], { basis: 280, align: 'center', weights: [1.5, 1] }),
  { pad: 48, seam: false });

const STRIP = `<div style="background:transparent;padding:18px 22px;text-align:center;` +
  `border-top:1px solid ${LINE};border-bottom:1px solid ${LINE}">` +
  `<div style="font-family:${HEAD};font-weight:500;font-size:clamp(12px,1.7cqw,16px);` +
  `letter-spacing:1.4px;text-transform:uppercase;color:${RED}">Swinging over Eglinton Avenue East since 1962</div></div>`;

const LANDMARK = `<a id="gmc-landmark"></a>` + section(
  centred(eyebrow('The Landmark') + h2('A 40-Foot Toronto Landmark') + rule('center')) +
  col(
    lede('Ask anyone who has driven Eglinton Avenue East through Scarborough and they will know exactly ' +
         'where Golden Mile Chrysler is — even if they have never set foot on the lot.') +
    p('They know it because of the Swinging Lady. For more than sixty years, a 40-foot illuminated figure ' +
      'has perched on a swing above the dealership, gliding back and forth and quietly inviting passing ' +
      'drivers to “swing on by.”') +
    p('She first went up in 1962, back when the dealership was Willison Chrysler. In the decades since, the ' +
      'name on the building has changed and the cars on the lot have changed, but the Swinging Lady has kept ' +
      'swinging — through Toronto winters, summer heat waves, and every era of the city that has grown up ' +
      'around her.', { mb: 0 }) +
    quote('She is not just decoration. She is a piece of Toronto and Scarborough car-culture history.')));

// Ruled strip rather than a black block: inside a content column a dark panel reads as
// a floating rectangle, not as the full-bleed band it is on the standalone page.
const stat = (n, label) =>
  `<div style="text-align:center;padding:26px 12px">` +
  `<div style="font-family:${HEAD};font-weight:400;font-size:clamp(1.6rem,4.2cqw,2.4rem);line-height:1;color:${INK}">${n}</div>` +
  `<div style="margin-top:10px;font-family:${HEAD};font-weight:500;font-size:12px;` +
  `letter-spacing:2.2px;text-transform:uppercase;color:${RED}">${label}</div></div>`;

const STATS = `<div style="background:transparent;border-top:2px solid ${INK};border-bottom:1px solid ${LINE}">` +
  `<div style="max-width:1100px;margin:0 auto;padding:0 22px;display:flex;flex-wrap:wrap">` +
  [['1962', 'First Raised'], ['40 ft', 'Tall'], ['60+', 'Years Swinging'], ['1', 'Toronto Landmark']]
    .map(([n, l], i) => `<div style="flex:1 1 150px;${i ? `border-left:1px solid ${LINE}` : ''}">${stat(n, l)}</div>`)
    .join('') + '</div></div>';

const SEASONS = section(
  row([
    eyebrow('Her Wardrobe') + h2('She Dresses for the Season') + rule() +
    `<div style="margin-top:26px">` +
      lede('Part of the charm is that she pays attention to the weather.') +
      p('In summer the Swinging Lady wears a bikini; when the snow arrives off Lake Ontario, she bundles up ' +
        'in a parka. Generations of GTA kids have watched for her seasonal wardrobe change from the back seat ' +
        'on the drive along Eglinton.') +
      p('It is a small thing, and it is exactly why people remember her. A billboard that changes with the ' +
        'city feels less like advertising and more like a neighbour.', { mb: 0 }) + '</div>',
    `<div style="text-align:center">` +
      img('swinging-lady-bw.png', 680, 1367, 'Illustration of the Swinging Lady on her swing',
          'max-width:290px;width:100%;height:auto;margin:0 auto') +
      `<div style="border-top:1px solid ${LINE};margin-top:22px;padding-top:16px;font-family:${HEAD};` +
      `font-weight:500;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:${MUTED}">` +
      'Above Eglinton Avenue East since 1962</div></div>',
  ], { basis: 300 }),
  {});

const tl = (yr, head, text, hot) =>
  `<div style="padding:28px 0;border-top:1px solid ${LINE}">` +
  `<div style="font-family:${HEAD};font-weight:500;font-size:12px;letter-spacing:2.4px;` +
  `text-transform:uppercase;color:${RED};margin:0 0 9px">${yr}</div>` +
  (hot ? `<div style="display:flex;align-items:baseline;gap:10px">` +
         `<span style="display:inline-block;width:7px;height:7px;background:${RED};flex:0 0 7px"></span>` +
         h3(head) + '</div>'
       : h3(head)) +
  p(text, { mb: 0 }) + '</div>';

const TIMELINE = `<a id="gmc-timeline"></a>` + section(
  centred(eyebrow('Sixty Years Above Eglinton') + h2('Still Swinging, Through Every Era') + rule('center')) +
  `<div style="max-width:720px;margin:0 auto">` +
  tl('1962', 'She goes up over Willison Chrysler',
     'A 40-foot illuminated figure is raised above the lot on Eglinton Avenue East. The dealership is called ' +
     'Willison Chrysler. Cars still have fins. She starts swinging, and does not stop.') +
  tl('The 1970s &amp; 80s', 'A drive-by ritual for the east end',
     'Bikini in July. Parka in January. Kids in the back seat learn to watch for her wardrobe change on the ' +
     'drive down Eglinton — the unofficial way Scarborough tells the seasons apart.') +
  tl('The 1980s', 'She vanishes',
     'One day the swing is empty. The Swinging Lady briefly goes missing, sparking a small civic mystery ' +
     'before she is found and returned to her perch. If anything, the disappearance only cements her status ' +
     'as a beloved neighbourhood fixture — you do not miss a billboard unless it belongs to you.', true) +
  tl('Through the decades', 'The name changes. She does not.',
     'Ownership changes hands, the lineup turns over, and the city grows up around her. The sign has been ' +
     'written up in the local press and is fondly remembered by anyone who grew up in the east end.') +
  tl('Today', 'Golden Mile Chrysler, 1743 Eglinton Ave. East',
     'She watches over the lot near Bermondsey Road, now led by President Navin Kotecha — The Car Doctor — ' +
     'and the CDD6 campaign. Same swing. Same invitation. A very different way of selling cars underneath it.') +
  '</div>');

// The call-to-action carries its weight through the red button, not a black ground.
const band = (eb, head, sub) =>
  `<section style="background:transparent;padding:54px 22px;text-align:center;` +
  `border-top:1px solid ${LINE};border-bottom:1px solid ${LINE}">` +
  `<div style="max-width:820px;margin:0 auto">` + eyebrow(eb) + h2(head) +
  `<div style="margin:20px 0 28px">${p(sub, { c: MUTED, mb: 0 })}</div>` +
  `<a href="tel:+14373715007" style="display:inline-block;font-family:${HEAD};font-weight:500;` +
  `font-size:clamp(1.25rem,3.6cqw,1.9rem);letter-spacing:1.6px;color:#fff;background:${RED};` +
  `padding:13px 38px;text-decoration:none">437-371-5007</a></div></section>`;

const link = (href, title, text, cue, ext) =>
  `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''} style="display:block;text-decoration:none">` +
  `<div style="font-family:${HEAD};font-weight:700;font-size:15px;letter-spacing:1.4px;` +
  `text-transform:uppercase;color:${INK};margin:0 0 9px">${title}</div>` +
  p(text, { fs: 16, lh: 25, c: MUTED, mb: 0 }) +
  `<div style="margin-top:12px;font-family:${HEAD};font-weight:500;font-size:12px;` +
  `letter-spacing:2px;text-transform:uppercase;color:${RED}">${cue}</div></a>`;

const TODAY = `<a id="gmc-today"></a>` + section(
  centred(eyebrow('Today') + h2('Still Swinging at Golden Mile Chrysler') + rule('center')) +
  col(
    lede('Today the Swinging Lady watches over Golden Mile Chrysler at 1743 Eglinton Avenue East, near ' +
         'Bermondsey Road.') +
    p('The dealership is now led by President <strong style="color:' + INK + '">Navin Kotecha — The Car ' +
      'Doctor</strong> — and runs the CDD6 campaign: transparent, all-in weekly lease pricing on new ' +
      'Chrysler, Dodge, Jeep, and RAM vehicles, with every dealer fee built into the number you see.') +
    p('So the landmark that has invited drivers to “swing on by” since 1962 now points to something ' +
      'genuinely worth stopping for: honest pricing, no runaround, and a president who answers for every ' +
      'deal personally.', { mb: 0 }) +
    quote('Next time you spot her over Eglinton, you will know the story — and the deals waiting underneath.')) +
  `<div style="margin-top:50px;padding-top:36px;border-top:1px solid ${LINE}">` +
  row([
    link('#gmc-landmark', 'About Golden Mile Chrysler',
         "One of Toronto's longest-running Chrysler Dodge Jeep RAM dealerships — on Eglinton since 1962.",
         'Since 1962 &rarr;'),
    link('#gmc-doctor', 'Meet The Car Doctor',
         'How Navin Kotecha went from the shop floor to the front of the building — and why it changed the pricing.',
         'Navin Kotecha &rarr;'),
    link('https://cdd6.ca', "This Month's CDD6 Deals",
         'Six prescriptions. All-in weekly lease pricing. Published before you ever pick up the phone.',
         'See the deals &rarr;', true),
  ], { gap: 32, basis: 230 }) + '</div>');

const feeList = (title, items, titleColour, tick) =>
  `<div style="font-family:${HEAD};font-weight:500;font-size:12px;letter-spacing:2.4px;` +
  `text-transform:uppercase;color:${titleColour};padding-bottom:12px;border-bottom:1px solid ${LINE};` +
  `margin:0 0 14px">${title}</div>` +
  items.map((i) =>
    `<div style="padding:8px 0;font-family:${SANS};font-size:17px;line-height:26px;color:${BODY}">` +
    `<span style="color:${tick === '+' ? RED : INK};font-weight:bold;margin-right:10px">${tick}</span>${i}</div>`
  ).join('');

const DOCTOR = `<a id="gmc-doctor"></a>` + section(
  centred(eyebrow('The Short Version') +
          h2('Bad Car Deals Are The Disease.<br>Transparent Pricing Is The Cure.') + rule('center')) +
  col(
    lede('Nav runs Golden Mile Chrysler. He thinks the way most dealerships sell cars is broken — too many ' +
         'hidden fees, too much back-and-forth, too much wasted time. So he built CDD6 to fix it.') +
    p('<strong style="color:'+INK+'">CDD6 stands for Car Doctor Deals in the 6ix.</strong> Every month, Nav ' +
      'prescribes six lease deals on new Chrysler, Dodge, Jeep, and RAM vehicles. Each one is tagged like a ' +
      'medical prescription — Rx #001 through Rx #006 — because the whole concept is built around one idea.',
      { c: BODY }) +
    p('The weekly lease prices on CDD6 include everything the dealer controls. Freight, PDI, admin fees, ' +
      'OMVIC fee — all baked in. The only extras are HST and license plates, because those go to the ' +
      'government, not the dealership.', { c: DIM }) +
    p('That is not a marketing gimmick. It is Ontario law under OMVIC. The difference is that Nav actually ' +
      'follows it to the letter and puts the real number on the website before you ever pick up the phone.',
      { c: BODY, mb: 0 }) +
    `<div style="margin-top:36px">` +
    row([
      feeList('Baked Into The Weekly Price',
              ['Freight', 'PDI', 'Admin fee', 'OMVIC fee', 'Air conditioning charge'], INK, '&#10003;'),
      feeList('The Only Extras — Paid To Government', ['HST', 'License plates'], RED, '+'),
    ], { gap: 36, basis: 240 }) + '</div>'),
  {});

const BACKGROUND = section(
  centred(eyebrow('The Background') + h2('How Nav Got Here') + rule('center') +
          `<div style="margin-top:20px">${p('He learned the business from the shop floor, not the showroom floor. That is the whole difference.', { c: MUTED, mb: 0 })}</div>`) +
  col(
    lede('Navin Kotecha did not grow up planning to run a car dealership. But the automotive industry found ' +
         'him early, and he stayed because he was good at it.') +
    p("Nav built his career across some of Toronto's busiest dealership operations. He managed fixed " +
      'operations — the service bays, the parts departments, the side of the business most customers never ' +
      'see but every dealer depends on. That is where you learn how a dealership actually works: not from ' +
      'the showroom floor, but from the shop floor. You learn what it costs to run the operation, what ' +
      'margins look like, where money gets wasted, and where customers get overcharged.', { mb: 0 }) +
    quote('He understands the cost structure of every deal because he spent years inside the machine before ' +
          'he sat at the front of it.') +
    `<div style="margin-top:36px">` +
    p('When he tells you a price is all-in, he knows exactly what “all-in” means — down to the OMVIC fee and ' +
      'the air conditioning charge.') +
    p('When the opportunity to lead Golden Mile Chrysler came along, Nav took it with a clear plan: strip the ' +
      'games out of the buying process and build something people could actually trust. Golden Mile had the ' +
      'location, the legacy, the Swinging Lady billboard that half of Toronto grew up driving past. What it ' +
      'needed was a new approach. Nav brought one.', { mb: 0 }) + '</div>'));

const rx = (n, label) =>
  `<div style="display:flex;align-items:baseline;gap:16px;padding:13px 0;border-bottom:1px solid ${LINE}">` +
  `<span style="font-family:${HEAD};font-weight:500;font-size:14px;letter-spacing:1.6px;color:${RED};` +
  `flex:0 0 74px">${n}</span>` +
  `<span style="font-family:${SANS};font-size:17px;color:${BODY}">${label}</span></div>`;

const CDD6 = section(
  row([
    eyebrow('What CDD6 Actually Is') + h2("CDD6 Is Nav's Prescription Pad") + rule() +
    `<div style="margin-top:26px">` +
    p('CDD6 is not the dealership. Golden Mile Chrysler is the dealership.') +
    p('Every month, Stellantis — the parent company behind Chrysler, Dodge, Jeep, and RAM — releases new OEM ' +
      'incentive programs. Factory rebates, subvented lease rates, loyalty bonuses. Most dealerships bury ' +
      'those programs in the fine print and use them to pad their own margins. Nav takes those programs and ' +
      'passes them through to the customer as aggressively as possible, then publishes the result on ' +
      `<a href="https://cdd6.ca" target="_blank" rel="noopener" style="color:${RED};font-weight:bold;` +
      'text-decoration:none">cdd6.ca</a>.') +
    p('The six deals rotate monthly. When a new Stellantis program drops, Nav recalculates, picks the six ' +
      'strongest prescriptions, and publishes them. Old deal pages redirect to the permanent model pages, so ' +
      'you always see what is current, never what expired last month.') +
    p('Each deal shows the weekly lease payment, the cash down, the term, the rate, the kilometre allowance, ' +
      'and the complete due-on-delivery breakdown. Everything. On the page. Before you call.', { mb: 0 }) + '</div>',

    `<div style="font-family:${HEAD};font-weight:500;font-size:12px;letter-spacing:2.4px;` +
    `text-transform:uppercase;color:${RED};margin:0 0 6px">This Month's Six</div>` +
    `<div style="border-top:1px solid ${LINE}">` +
    rx('Rx #001', 'Chrysler') + rx('Rx #002', 'Dodge') + rx('Rx #003', 'Jeep') +
    rx('Rx #004', 'RAM') + rx('Rx #005', "Dealer's choice") + rx('Rx #006', 'Door-crasher') + '</div>' +
    `<div style="margin-top:22px">` +
    p('Six prescriptions, refilled every month against the latest Stellantis programs. Weekly lease pricing, ' +
      'all dealer fees included.', { fs: 15, lh: 24, c: MUTED, mb: 0 }) + '</div>' +
    `<div style="margin-top:22px">${btn('https://cdd6.ca', 'Fill at cdd6.ca', 'line')}</div>`,
  ], { basis: 300 }),
  {});

const WHY = section(
  centred(eyebrow('Why “Prescriptions”?') + h2('The Metaphor Is Not An Accident') + rule('center')) +
  col(
    lede('Nav calls himself The Car Doctor because the problem he is solving feels like a diagnosis.') +
    p(`<strong style="color:${RED}">The symptoms:</strong> you search for a car deal online, you find a price ` +
      'that looks good, you drive to the dealership, you sit down, and the number changes. Freight gets ' +
      'added. An admin fee appears. PDI was not included. Suddenly the deal you saw online is hundreds more ' +
      'per month than what you budgeted. That is the disease.') +
    p(`<strong style="color:${RED}">The prescription:</strong> publish the real, all-in price before the ` +
      'customer walks in. Include every fee the dealer controls. Make the weekly payment the actual weekly ' +
      'payment — plus government taxes and plates, and nothing else. No negotiation required.', { mb: 0 }) +
    quote('CDD6 deals are labelled Rx #001 through Rx #006 because they are meant to be filled, not haggled over.') +
    `<div style="margin-top:36px">` +
    p('You see the prescription. You call the number. The price on the phone is the price on the page. That ' +
      'is how it works.', { mb: 0 }) + '</div>'));

const faq = (q, a) =>
  `<details style="border-bottom:1px solid ${LINE}"><summary style="cursor:pointer;padding:20px 0;` +
  `font-family:${HEAD};font-weight:500;font-size:18px;letter-spacing:1.2px;text-transform:uppercase;` +
  `color:${INK}">${q}</summary><div style="padding:0 0 22px">${p(a, { fs: 16, lh: 26, mb: 0 })}</div></details>`;

const TEL = `<a href="tel:+14373715007" style="color:${RED};font-weight:bold;text-decoration:none">437-371-5007</a>`;

const FAQ = `<a id="gmc-faq"></a>` + section(
  centred(eyebrow('About The Car Doctor') + h2('Frequently Asked Questions') + rule('center')) +
  `<div style="max-width:760px;margin:0 auto;border-top:1px solid ${LINE}">` +
  faq('Who is The Car Doctor?',
      'The Car Doctor is Navin Kotecha — Nav — President of Golden Mile Chrysler at 1743 Eglinton Avenue ' +
      'East in Toronto. Nav created the CDD6 campaign (Car Doctor Deals in the 6ix), which prescribes ' +
      'monthly door-crasher lease deals on new Chrysler, Dodge, Jeep, and RAM vehicles with fully ' +
      `transparent, all-in weekly pricing. Call his team at ${TEL}.`) +
  faq('Who is Navin Kotecha?',
      "Navin Kotecha is the President of Golden Mile Chrysler, one of Toronto's longest-running Chrysler " +
      'Dodge Jeep RAM dealerships. Known as The Car Doctor, Nav built his career across multiple major ' +
      'dealership groups in Toronto before taking the helm at Golden Mile. He launched the CDD6 campaign to ' +
      'bring transparent, OMVIC-compliant lease deals directly to Toronto drivers without the typical ' +
      'dealership runaround.') +
  faq('What does The Car Doctor prescribe?',
      'The Car Doctor prescribes six monthly lease deals — tagged Rx #001 through Rx #006 — on new Chrysler, ' +
      'Dodge, Jeep, and RAM vehicles at Golden Mile Chrysler. Each prescription features aggressive weekly ' +
      'lease pricing that includes all dealer fees (freight, PDI, admin, OMVIC). Only HST and licensing are ' +
      'extra. The deals rotate monthly based on Stellantis OEM incentive programs.') +
  faq('How do I contact The Car Doctor?',
      `Call The Car Doctor's team directly at ${TEL}. Golden Mile Chrysler is located at 1743 Eglinton ` +
      'Avenue East, Toronto, ON M4A 1J8 — the dealership with the iconic Swinging Lady billboard. No ' +
      "appointment necessary. Nav's team handles everything from first call to delivery.") +
  faq('Where is the Swinging Lady billboard?',
      'She has been above Golden Mile Chrysler at 1743 Eglinton Avenue East, near Bermondsey Road in ' +
      'Toronto, since 1962 — first raised when the dealership traded as Willison Chrysler. She is visible ' +
      'to eastbound and westbound traffic along Eglinton, and she still changes outfits with the season.') +
  '</div>' +
  `<details style="max-width:760px;margin:34px auto 0"><summary style="cursor:pointer;font-family:${HEAD};` +
  `font-weight:500;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:${MUTED};padding:6px 0">` +
  'View Full Terms</summary><div style="padding-top:16px">' +
  p('All CDD6 weekly lease prices include every fee the dealer controls — freight, PDI, administration, air ' +
    'conditioning charge, and the OMVIC fee — in accordance with Ontario’s all-in price advertising ' +
    'requirements under the Motor Vehicle Dealers Act as administered by OMVIC. HST and license plate fees ' +
    'are extra, as they are payable to the government and not to the dealership.', { fs: 14, lh: 23, c: MUTED }) +
  p('Lease offers are based on current Stellantis Canada OEM incentive programs and are subject to change ' +
    'without notice when those programs change. Advertised payments assume the stated term, cash down, ' +
    'annual kilometre allowance, and lease rate shown on the individual deal page at cdd6.ca. Additional ' +
    'kilometres, excess wear and tear, and optional equipment are extra. Offers apply to new, in-stock ' +
    'Chrysler, Dodge, Jeep, and RAM vehicles at Golden Mile Chrysler, 1743 Eglinton Avenue East, Toronto, ' +
    'ON M4A 1J8, and are subject to credit approval and availability. Vehicle images and descriptions are ' +
    'for illustration only. See dealer for complete details.', { fs: 14, lh: 23, c: MUTED }) +
  p('Historical details regarding the Swinging Lady sign, including its 1962 installation above Willison ' +
    'Chrysler and its temporary disappearance in the 1980s, are recounted from local press coverage and ' +
    'long-standing community recollection.', { fs: 14, lh: 23, c: MUTED, mb: 0 }) +
  '</div></details>');

// ---- emit --------------------------------------------------------------------
// One line: wpautop turns a blank line into <p> and a lone newline into <br>.
const page = [HERO, STRIP, LANDMARK, STATS, SEASONS, TIMELINE,
  band('Swing On By — Or Just Call The Doctor',
       'The Swinging Lady marks the spot.<br>The Car Doctor handles the rest.',
       'Sixty years of pointing drivers to this corner. Here is what is waiting underneath her now.'),
  TODAY, DOCTOR, BACKGROUND, CDD6, WHY,
  band('Fill Your Prescription', "See This Month's Deals At cdd6.ca",
       'No games. No runaround. Just the real price.'),
  FAQ].join('').replace(/\n\s*/g, '');

// One wrapper declaring an inline-size container, so the cqw units above measure the
// content cell — 944px here, a Foundation `cell large-8` beside the sidebar — instead
// of the 1707px window. Sized in vw, every heading was scaled for a page three-quarters
// wider than the column it actually sits in.
const wrapped = '<div style="container-type:inline-size">' + page + '</div>';

// An inline style loses to a theme rule carrying !important — and the failure mode is
// severe: the hostile-theme test knocked the black off the hero and left white text on
// a pale ground, unreadable. Inline + !important is the highest priority there is, so
// the two properties that decide legibility carry it. Nothing else does.
const armour = (s) => s.replace(/style="([^"]*)"/g, (m, decls) =>
  'style="' + decls.split(';').filter(Boolean).map((d) => {
    const prop = d.split(':')[0].trim();
    return /^(background|background-color|color|border-color)$/.test(prop) ? d + ' !important' : d;
  }).join(';') + '"');

await writeFile('edealer/legacy-inline.html', armour(wrapped) + '\n');

// ---- checks ------------------------------------------------------------------
for (const bad of [/<vw/i, /<style/i, /<script/i, /<svg/i, /<link/i, /<!DOCTYPE/i, /<html[\s>]/i]) {
  if (bad.test(wrapped)) throw new Error('tag the CMS strips is present: ' + bad);
}
if (/\n/.test(page)) throw new Error('newline left for wpautop to turn into <br>');
if (/class=/.test(wrapped)) throw new Error('a class remains — nothing may depend on a stylesheet');
if (/--[a-z]/.test(wrapped)) throw new Error('a CSS custom property remains; wptexturize turns -- into an en-dash');
if (/var\(/.test(page)) throw new Error('var() remains but no stylesheet defines it');
const tags = wrapped.match(/<(\w+)(?=[\s>])/g).length, styled = wrapped.match(/style="/g).length;
console.log('one line, ' + (wrapped.length / 1024).toFixed(1) + ' KB, ' + tags + ' tags, ' + styled + ' inline styles');
console.log('checks: no style/script/svg/link tag, no newline, no class, no custom property  OK');
