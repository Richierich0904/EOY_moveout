// Flat product drawings for the demo listings, in the site's own palette:
// a pale grey studio backdrop, black and greys for the object, no other colours.
// Each one is a 600×750 SVG so it fills the 4:5 product tiles exactly.

const W = 600, H = 750;
const BG = "#EFEFEC", FLOOR = "#E4E4E0", SHADOW = "#D2D2CD";
const INK = "#1B1B1A", MID = "#3A3A38", GREY = "#8C8C88", LIGHT = "#CFCFCA", WHITE = "#FAFAF8";

function frame(body: string, shadowW = 220) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${BG}"/>
<rect y="560" width="${W}" height="190" fill="${FLOOR}"/>
<ellipse cx="300" cy="606" rx="${shadowW}" ry="22" fill="${SHADOW}"/>
${body}
</svg>`;
}

function label(x: number, y: number, text: string, size = 22, fill = WHITE) {
  return `<text x="${x}" y="${y}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${size}" letter-spacing="2" fill="${fill}" text-anchor="middle">${text}</text>`;
}

const ART: Record<string, () => string> = {
  fridge: () => frame(`
<rect x="200" y="190" width="200" height="410" rx="14" fill="${MID}"/>
<rect x="200" y="190" width="200" height="120" rx="14" fill="${INK}"/>
<rect x="200" y="300" width="200" height="10" fill="${INK}"/>
<rect x="372" y="222" width="10" height="60" rx="5" fill="${LIGHT}"/>
<rect x="372" y="335" width="10" height="110" rx="5" fill="${LIGHT}"/>
<rect x="214" y="596" width="22" height="12" fill="${INK}"/><rect x="364" y="596" width="22" height="12" fill="${INK}"/>`, 130),

  fan: () => frame(`
<ellipse cx="300" cy="596" rx="95" ry="16" fill="${INK}"/>
<rect x="290" y="390" width="20" height="210" fill="${MID}"/>
<circle cx="300" cy="300" r="150" fill="none" stroke="${INK}" stroke-width="10"/>
<circle cx="300" cy="300" r="110" fill="none" stroke="${GREY}" stroke-width="3"/>
<circle cx="300" cy="300" r="70" fill="none" stroke="${GREY}" stroke-width="3"/>
${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<line x1="300" y1="300" x2="${(300 + 145 * Math.cos(a)).toFixed(1)}" y2="${(300 + 145 * Math.sin(a)).toFixed(1)}" stroke="${GREY}" stroke-width="2"/>`; }).join("")}
<g fill="${MID}"><ellipse cx="300" cy="240" rx="34" ry="62"/><ellipse cx="352" cy="330" rx="34" ry="62" transform="rotate(120 352 330)"/><ellipse cx="248" cy="330" rx="34" ry="62" transform="rotate(240 248 330)"/></g>
<circle cx="300" cy="300" r="26" fill="${INK}"/>`, 150),

  rug: () => frame(`
<g transform="translate(300 470) skewX(-24)">
<rect x="-210" y="-90" width="420" height="180" fill="${GREY}"/>
<rect x="-188" y="-70" width="376" height="140" fill="none" stroke="${LIGHT}" stroke-width="6"/>
<rect x="-150" y="-40" width="300" height="80" fill="none" stroke="${MID}" stroke-width="3"/>
<path d="M-60 0 L0 -26 L60 0 L0 26 Z" fill="${MID}"/>
${Array.from({ length: 22 }, (_, i) => `<line x1="${-205 + i * 19.5}" y1="90" x2="${-205 + i * 19.5}" y2="106" stroke="${MID}" stroke-width="3"/>`).join("")}
</g>`, 250),

  lights: () => frame(`
<path d="M70 180 C 170 300, 250 300, 300 220 S 450 140, 530 260 M70 360 C 170 480, 250 480, 300 400 S 450 320, 530 440" fill="none" stroke="${INK}" stroke-width="4"/>
${[[110, 236], [170, 276], [235, 282], [300, 220], [365, 176], [430, 182], [490, 220], [110, 416], [170, 456], [235, 462], [300, 400], [365, 356], [430, 362], [490, 400]]
  .map(([x, y]) => `<g><rect x="${x - 6}" y="${y - 4}" width="12" height="12" fill="${INK}"/><ellipse cx="${x}" cy="${y + 22}" rx="12" ry="18" fill="${WHITE}" stroke="${MID}" stroke-width="3"/></g>`).join("")}
<rect x="500" y="520" width="40" height="64" rx="6" fill="${INK}"/><rect x="512" y="584" width="16" height="16" fill="${GREY}"/>`, 210),

  shelf: () => frame(`
<rect x="170" y="150" width="260" height="450" fill="none" stroke="${INK}" stroke-width="14"/>
<rect x="170" y="290" width="260" height="12" fill="${INK}"/><rect x="170" y="440" width="260" height="12" fill="${INK}"/>
<g fill="${MID}"><rect x="192" y="190" width="22" height="100"/><rect x="218" y="200" width="18" height="90"/><rect x="240" y="180" width="26" height="110"/></g>
<rect x="330" y="236" width="70" height="54" fill="${GREY}"/>
<g fill="${GREY}"><rect x="196" y="350" width="16" height="90"/><rect x="216" y="340" width="20" height="100"/></g>
<g transform="rotate(-14 300 400)"><rect x="280" y="335" width="20" height="104" fill="${MID}"/></g>
<circle cx="370" cy="420" r="20" fill="${LIGHT}" stroke="${MID}" stroke-width="3"/>
<g fill="${MID}"><rect x="200" y="512" width="90" height="16"/><rect x="206" y="528" width="80" height="14"/><rect x="198" y="542" width="96" height="16"/><rect x="204" y="558" width="86" height="30"/></g>`, 150),

  dress: () => frame(`
<path d="M268 150 L300 196 L332 150 L360 170 L340 270 L330 300 L420 590 L180 590 L270 300 L260 270 L240 170 Z" fill="${INK}"/>
<path d="M260 300 L340 300 L338 314 L262 314 Z" fill="${MID}"/>
<path d="M268 150 L300 196 L332 150" fill="none" stroke="${MID}" stroke-width="4"/>
<line x1="300" y1="320" x2="300" y2="590" stroke="${MID}" stroke-width="2"/>
<path d="M240 330 L216 590 M360 330 L384 590" stroke="${MID}" stroke-width="2"/>`, 150),

  stick: () => frame(`
<line x1="180" y1="600" x2="390" y2="230" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
<rect x="170" y="560" width="40" height="40" rx="8" fill="${MID}" transform="rotate(30 190 580)"/>
<path d="M378 250 C 330 170, 360 90, 430 80 C 500 72, 520 150, 470 250 Z" fill="none" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/>
<g stroke="${GREY}" stroke-width="2.5"><line x1="395" y1="110" x2="470" y2="240"/><line x1="420" y1="90" x2="490" y2="210"/><line x1="370" y1="160" x2="440" y2="248"/><line x1="380" y1="210" x2="500" y2="130"/><line x1="365" y1="170" x2="470" y2="90"/><line x1="395" y1="245" x2="495" y2="175"/></g>`, 180),

  headphones: () => frame(`
<path d="M170 380 C 170 180, 430 180, 430 380" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/>
<path d="M190 300 C 210 220, 390 220, 410 300" fill="none" stroke="${GREY}" stroke-width="6"/>
<rect x="138" y="350" width="84" height="150" rx="40" fill="${INK}"/><rect x="378" y="350" width="84" height="150" rx="40" fill="${INK}"/>
<rect x="196" y="372" width="30" height="106" rx="14" fill="${MID}"/><rect x="374" y="372" width="30" height="106" rx="14" fill="${MID}"/>
<circle cx="180" cy="425" r="16" fill="${MID}"/><circle cx="420" cy="425" r="16" fill="${MID}"/>`, 200),

  guitar: () => frame(`
<g transform="translate(15 40) scale(.92) rotate(-18 300 380)">
<rect x="284" y="70" width="32" height="260" fill="${MID}"/>
<path d="M274 40 L326 40 L330 92 L270 92 Z" fill="${INK}"/>
${[52, 66, 80].map((y) => `<circle cx="264" cy="${y}" r="6" fill="${GREY}"/><circle cx="336" cy="${y}" r="6" fill="${GREY}"/>`).join("")}
${[110, 150, 190, 230, 270, 305].map((y) => `<rect x="284" y="${y}" width="32" height="3" fill="${GREY}"/>`).join("")}
<path d="M300 300 C 220 300, 205 360, 238 400 C 180 440, 180 560, 300 572 C 420 560, 420 440, 362 400 C 395 360, 380 300, 300 300 Z" fill="${INK}"/>
<circle cx="300" cy="420" r="34" fill="${MID}"/><circle cx="300" cy="420" r="26" fill="${INK}"/>
<rect x="262" y="500" width="76" height="14" fill="${MID}"/>
${[289, 295, 301, 307].map((x) => `<line x1="${x}" y1="80" x2="${x}" y2="505" stroke="${LIGHT}" stroke-width="1"/>`).join("")}
</g>`, 170),

  mirror: () => frame(`
<rect x="215" y="80" width="170" height="520" rx="10" fill="${INK}"/>
<rect x="231" y="96" width="138" height="488" rx="4" fill="#DCDCD8"/>
<path d="M260 96 L330 96 L246 300 L231 300 L231 160 Z" fill="${WHITE}" opacity=".7"/>
<path d="M369 380 L369 470 L320 584 L290 584 Z" fill="${WHITE}" opacity=".45"/>
<rect x="250" y="600" width="18" height="10" fill="${INK}"/><rect x="332" y="600" width="18" height="10" fill="${INK}"/>`, 130),

  earbuds: () => frame(`
<rect x="200" y="380" width="200" height="200" rx="60" fill="${WHITE}" stroke="${MID}" stroke-width="5"/>
<line x1="200" y1="450" x2="400" y2="450" stroke="${LIGHT}" stroke-width="4"/>
<circle cx="300" cy="520" r="7" fill="${MID}"/>
<g transform="rotate(-20 220 260)"><circle cx="220" cy="250" r="56" fill="${INK}"/><ellipse cx="220" cy="250" rx="30" ry="24" fill="${MID}"/><rect x="200" y="290" width="40" height="80" rx="20" fill="${INK}"/></g>
<g transform="rotate(20 380 260)"><circle cx="380" cy="250" r="56" fill="${INK}"/><ellipse cx="380" cy="250" rx="30" ry="24" fill="${MID}"/><rect x="360" y="290" width="40" height="80" rx="20" fill="${INK}"/></g>`, 150),

  box: () => frame(`
<path d="M180 300 L300 250 L420 300 L420 560 L300 610 L180 560 Z" fill="${MID}"/>
<path d="M180 300 L300 350 L420 300 L300 250 Z" fill="${GREY}"/>
<path d="M300 350 L300 610" stroke="${INK}" stroke-width="4"/>`, 170),
};

function bookArt(code: string) {
  return frame(`
<g transform="rotate(-4 300 470)">
<rect x="170" y="500" width="270" height="56" fill="${GREY}"/><rect x="170" y="500" width="22" height="56" fill="${MID}"/>
<rect x="182" y="444" width="250" height="56" fill="${LIGHT}"/><rect x="182" y="444" width="20" height="56" fill="${GREY}"/>
</g>
<rect x="190" y="130" width="230" height="320" fill="${INK}"/>
<rect x="190" y="130" width="24" height="320" fill="${MID}"/>
<rect x="236" y="170" width="160" height="4" fill="${GREY}"/>
${label(316, 250, code, 40)}
<rect x="236" y="276" width="120" height="4" fill="${GREY}"/>
<rect x="236" y="404" width="80" height="4" fill="${GREY}"/>`, 180);
}

/** Pick a drawing from the listing title. Textbooks show their subject on the cover. */
export function demoArt(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("fridge")) return ART.fridge();
  if (t.includes("fan")) return ART.fan();
  if (t.includes("chem")) return bookArt("CHEM");
  if (t.includes("calculus")) return bookArt("CALC");
  if (t.includes("physics")) return bookArt("PHYS");
  if (t.includes("textbook")) return bookArt("BOOK");
  if (t.includes("rug")) return ART.rug();
  if (t.includes("lights")) return ART.lights();
  if (t.includes("bookshelf")) return ART.shelf();
  if (t.includes("dress")) return ART.dress();
  if (t.includes("lacrosse")) return ART.stick();
  if (t.includes("headphones")) return ART.headphones();
  if (t.includes("guitar")) return ART.guitar();
  if (t.includes("mirror")) return ART.mirror();
  if (t.includes("earbuds")) return ART.earbuds();
  return ART.box();
}
