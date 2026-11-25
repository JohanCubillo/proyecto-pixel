// Pueblo Pixel: isla flotante con todo lo que la gente ha construido en los videos.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .7, ...o });
const glowMat = (color, k = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k, roughness: .4 });

export function signTex(lines, bg, fg, w = 512, h = 128, border) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 22); x.fill();
  if (border) { x.lineWidth = 8; x.strokeStyle = border; x.stroke(); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  const L = Array.isArray(lines) ? lines : [lines];
  L.forEach((s, i) => {
    let fs = L.length > 1 ? h * .34 : h * .52;
    x.font = `800 ${fs}px Poppins, sans-serif`;
    while (x.measureText(s).width > w - 40 && fs > 10) { fs -= 2; x.font = `800 ${fs}px Poppins, sans-serif`; }
    x.fillText(s, w / 2, h / 2 + (i - (L.length - 1) / 2) * h * .38);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function sign(lines, bg, fg, w, h, pw, ph, border, emissive) {
  const tex = signTex(lines, bg, fg, w, h, border);
  const m = emissive ? new THREE.MeshBasicMaterial({ map: tex, transparent: true }) : new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .6 });
  return new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), m);
}
function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); b.castShadow = b.receiveShadow = true; return b;
}
function gable(w, h, d, m) { // techo a dos aguas
  const s = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h)]);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
  const r = new THREE.Mesh(g, m); r.castShadow = true; return r;
}
function faceCenter(o) { o.rotation.y = Math.atan2(-o.position.x, -o.position.z); }

export function makeBus() {
  const b = new THREE.Group();
  const white = std(0xf7f7fb), red = std(0xe2363c), blue = std(0x285ac8), glass = std(0x7cc4f2, { roughness: .15, metalness: .3 }), dark = std(0x1b1b24);
  b.add(box(2.3, .78, .92, white, 0, .2, 0));
  b.add(box(2.32, .14, .94, red, 0, .52, 0));
  b.add(box(2.32, .14, .94, blue, 0, .38, 0));
  b.add(box(2.24, .08, .86, white, 0, .98, 0));
  for (let i = 0; i < 6; i++) b.add(box(.28, .22, .95, glass, -.92 + i * .34, .68, 0));
  b.add(box(.06, .34, .78, glass, 1.15, .62, 0));
  for (const z of [-.3, .3]) { const l = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), glowMat(0xfff2b0, 2)); l.position.set(1.17, .36, z); b.add(l); }
  for (const x of [-.72, .72]) for (const z of [-.47, .47]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .12, 16), dark); w.rotation.x = Math.PI / 2; w.position.set(x, .19, z); w.castShadow = true; b.add(w);
  }
  const s = sign('LA TUCANETA', '#ffc83d', '#1d1404', 512, 96, 1.2, .22); s.position.set(-.1, .45, .475); b.add(s);
  const s2 = s.clone(); s2.rotation.y = Math.PI; s2.position.z = -.475; b.add(s2);
  // tucán en el techo
  const tc = new THREE.Group(); tc.position.set(.55, 1.06, 0);
  const body = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), std(0x15151c)); body.scale.set(1, 1.2, .9); tc.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), std(0xffe38a)); chest.position.set(.06, .03, 0); tc.add(chest);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.06, .3, 10), std(0xffa21f)); beak.rotation.z = -Math.PI / 2; beak.position.set(.24, .08, 0); tc.add(beak);
  b.add(tc);
  return b;
}

export function buildTown() {
  const g = new THREE.Group();
  const R = 7, labels = [], anim = [];
  const lab = (txt, x, y, z, cls = 'tlab') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = txt; const o = new CSS2DObject(d); o.position.set(x, y, z); g.add(o); labels.push(o); return o; };

  // isla: césped + roca colgante
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R * .97, .7, 72), std(0x4c9a4f, { roughness: .95 }));
  top.position.y = -.35; top.receiveShadow = true; g.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R * .985, .12, 8, 72), std(0x6dbb5d)); rim.rotation.x = Math.PI / 2; rim.position.y = -.02; g.add(rim);
  const rg = new THREE.ConeGeometry(R * .97, 9, 32, 8); rg.rotateX(Math.PI);
  const p = rg.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i); if (y > 4.45) continue;
    const k = 1 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * .22; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
  }
  rg.computeVertexNormals();
  const cols = []; for (let i = 0; i < p.count; i++) { const f = (p.getY(i) + 4.5) / 9; const c = new THREE.Color(0x3a3440).lerp(new THREE.Color(0x8a5a3a), f); cols.push(c.r, c.g, c.b); }
  rg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const rock = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  rock.position.y = -.7 - 4.5; rock.castShadow = true; g.add(rock);
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(.5 + (i % 3) * .3), new THREE.MeshStandardMaterial({ color: 0x6b4f3a, flatShading: true }));
    const a = i * 1.1; s.position.set(Math.cos(a) * (R + 1.5 + i % 2), -3 - i * .8, Math.sin(a) * (R + 1.2)); g.add(s);
    anim.push(t => { s.position.y = -3 - i * .8 + Math.sin(t * .8 + i) * .25; s.rotation.y = t * .2 + i; });
  }

  // calles: plaza, anillo, diagonales
  const stone = std(0xd8ccb2), asph = std(0x535a6c, { roughness: .9 });
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, .06, 48), stone); plaza.position.y = .03; plaza.receiveShadow = true; g.add(plaza);
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.3, 5.0, 72), asph); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; ring.receiveShadow = true; g.add(ring);
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; const d = box(.18, .01, .05, glowMat(0xffe38a, .3), Math.cos(a) * 4.65, .03, Math.sin(a) * 4.65); d.rotation.y = -a; g.add(d); }
  for (const a of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) {
    const s = box(.7, .03, 2.2, stone, Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2); s.rotation.y = -a + Math.PI / 2; g.add(s);
  }

  // fuente
  const fb = new THREE.Mesh(new THREE.CylinderGeometry(.75, .85, .3, 32), std(0xb9c4d6)); fb.position.y = .18; g.add(fb);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(.66, .66, .05, 32), new THREE.MeshStandardMaterial({ color: 0x5fb7ff, emissive: 0x1f6ad0, emissiveIntensity: .6, roughness: .1 })); water.position.y = .32; g.add(water);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, .6, 12), std(0xb9c4d6)); sp.position.y = .6; g.add(sp);
  const jet = new THREE.Mesh(new THREE.SphereGeometry(.18, 14, 10), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x5fb7ff, emissiveIntensity: .8, transparent: true, opacity: .8 })); jet.position.y = 1.0; g.add(jet);
  anim.push(t => { jet.scale.setScalar(1 + .15 * Math.sin(t * 6)); jet.position.y = 1 + .05 * Math.sin(t * 6); });

  // árbol de Navidad + estrella
  const tree = new THREE.Group(); tree.position.set(0, 0, -1.45);
  [[.75, 1.0, .35], [.6, .85, .95], [.42, .7, 1.45]].forEach(([r, h, y]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 14), std(0x1f7a3a)); c.position.y = y; c.castShadow = true; tree.add(c); });
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(.14), glowMat(0xffd54a, 2)); star.position.y = 1.95; tree.add(star);
  const bulbMats = [glowMat(0xff4060, 1.5), glowMat(0x50d0ff, 1.5), glowMat(0xffd54a, 1.5), glowMat(0x7dff8a, 1.5)];
  for (let i = 0; i < 26; i++) { const a = i * 2.4, y = .3 + (i / 26) * 1.4, r = .7 * (1 - y / 2.1); const b = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), bulbMats[i % 4]); b.position.set(Math.cos(a) * r, y, Math.sin(a) * r); tree.add(b); }
  g.add(tree);
  anim.push(t => { star.rotation.y = t; bulbMats.forEach((m, i) => m.emissiveIntensity = 1 + Math.max(0, Math.sin(t * 3 + i * 1.6)) * 1.5); });

  // luces de colores alrededor de la plaza
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), bulbMats[i % 4]); b.position.set(Math.cos(a) * 2.15, .9 + .12 * Math.cos(i * Math.PI / 5), Math.sin(a) * 2.15); g.add(b); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const pole = box(.05, .95, .05, std(0x3a3f55), Math.cos(a) * 2.15, 0, Math.sin(a) * 2.15); g.add(pole); }

  // iglesia
  const church = new THREE.Group(); church.position.set(0, 0, -3.2); faceCenter(church);
  const wW = std(0xfbfaf5), roofR = std(0xc9352f);
  church.add(box(1.7, 1.3, 1.3, wW));
  const cr = gable(1.9, .8, 1.4, roofR); cr.position.y = 1.3; church.add(cr);
  church.add(box(.55, 2.3, .55, wW, 0, 0, .55));
  const tr = new THREE.Mesh(new THREE.ConeGeometry(.42, .7, 4), roofR); tr.position.set(0, 2.65, .55); tr.rotation.y = Math.PI / 4; church.add(tr);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(.17, 24), glowMat(0xffe38a, .9)); clock.position.set(0, 1.85, .83); church.add(clock);
  church.add(box(.42, .7, .04, std(0x6b3f25), 0, 0, .66));
  for (const x of [-.55, .55]) church.add(box(.22, .4, .04, glowMat(0xffd27a, .8), x, .5, .66));
  g.add(church);

  // Súper Mario
  const sm = new THREE.Group(); sm.position.set(-3.25, 0, -1.2); faceCenter(sm);
  sm.add(box(1.8, 1.0, 1.2, std(0xf4f1ea)));
  sm.add(box(1.84, .18, 1.24, std(0xd93a33), 0, .95, 0));
  const aw = box(1.8, .06, .45, std(0xd93a33), 0, .75, .8); aw.rotation.x = .35; sm.add(aw);
  sm.add(box(1.2, .5, .04, std(0x9fd6ff, { roughness: .1 }), 0, .15, .61));
  const sms = sign('SÚPER MARIO', '#d93a33', '#ffffff', 512, 112, 1.5, .33); sms.position.set(0, 1.32, .62); sm.add(sms);
  g.add(sm);

  // Súper chino (lo atiende @yutico, idea de @feli)
  const sc = new THREE.Group(); sc.position.set(3.25, 0, -1.2); faceCenter(sc);
  sc.add(box(1.7, 1.0, 1.2, std(0xb3202b)));
  sc.add(box(1.86, .12, 1.36, std(0xf2c14e), 0, 1.0, 0));
  const scr = new THREE.Mesh(new THREE.CylinderGeometry(.0, 1.25, .45, 4), std(0x8c1820)); scr.rotation.y = Math.PI / 4; scr.scale.set(1, 1, .75); scr.position.y = 1.35; sc.add(scr);
  sc.add(box(.5, .62, .04, std(0x2a1a10), 0, 0, .61));
  const scs = sign('SÚPER CHINO', '#b3202b', '#ffd54a', 512, 112, 1.5, .33, '#ffd54a'); scs.position.set(0, .82, .63); sc.add(scs);
  for (const x of [-.7, .7]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(.13, 14, 10), glowMat(0xff3a3a, 1.4)); l.scale.y = 1.25; l.position.set(x, .78, .78); sc.add(l);
    anim.push(t => { l.position.x = x + Math.sin(t * 2 + x) * .02; });
  }
  g.add(sc);

  // Club Pixel con rayos de luz
  const club = new THREE.Group(); club.position.set(3.1, 0, 2.0); faceCenter(club);
  club.add(box(1.9, 1.25, 1.4, std(0x3a2273)));
  const neon = sign('CLUB PIXEL', '#1a0b33', '#ff5ad2', 512, 120, 1.6, .38, '#5ae0ff', true); neon.position.set(0, 1.0, .71); club.add(neon);
  club.add(box(.5, .7, .04, glowMat(0xffb35a, .7), 0, 0, .71));
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.22, 1), new THREE.MeshStandardMaterial({ color: 0xe6ecff, metalness: 1, roughness: .15, flatShading: true })); ball.position.y = 1.55; club.add(ball);
  const beams = [];
  [0xff5ad2, 0x5ae0ff, 0xffe066].forEach((c, i) => {
    const bm = new THREE.Mesh(new THREE.ConeGeometry(.45, 4.5, 16, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    bm.geometry.translate(0, -2.25, 0); bm.rotation.x = Math.PI; const piv = new THREE.Group(); piv.position.y = 1.3; piv.add(bm); club.add(piv); beams.push(piv);
  });
  anim.push(t => { ball.rotation.y = t * 1.5; beams.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.3 + i * 2.1) * .55; b.rotation.x = Math.cos(t * 1.1 + i) * .35; }); });
  g.add(club);

  // cancha
  const field = new THREE.Group(); field.position.set(-3.1, 0, 2.05); faceCenter(field);
  const fc = document.createElement('canvas'); fc.width = 512; fc.height = 300; const fx = fc.getContext('2d');
  for (let i = 0; i < 8; i++) { fx.fillStyle = i % 2 ? '#3ba45a' : '#34964f'; fx.fillRect(i * 64, 0, 64, 300); }
  fx.strokeStyle = '#fff'; fx.lineWidth = 6; fx.strokeRect(12, 12, 488, 276); fx.beginPath(); fx.moveTo(256, 12); fx.lineTo(256, 288); fx.stroke();
  fx.beginPath(); fx.arc(256, 150, 44, 0, 7); fx.stroke(); fx.strokeRect(12, 80, 60, 140); fx.strokeRect(440, 80, 60, 140);
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.6), new THREE.MeshStandardMaterial({ map: ft })); fl.rotation.x = -Math.PI / 2; fl.position.y = .04; fl.receiveShadow = true; field.add(fl);
  for (const s of [-1, 1]) {
    const gp = new THREE.Group(); gp.position.set(s * 1.33, .04, 0);
    gp.add(box(.03, .28, .03, std(0xffffff), 0, 0, -.25)); gp.add(box(.03, .28, .03, std(0xffffff), 0, 0, .25)); gp.add(box(.03, .03, .53, std(0xffffff), 0, .28, 0));
    field.add(gp);
  }
  const stands = box(2.4, .35, .35, std(0x6b7aa8), 0, 0, -1.05); field.add(stands);
  const st2 = box(2.4, .2, .3, std(0x8796c2), 0, .35, -1.15); field.add(st2);
  for (let i = 0; i < 14; i++) { const fan = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), std([0x9a5cff, 0xe2363c][i % 2])); fan.position.set(-1.1 + i * .17, .45 + (i % 2) * .2, -1.05 - (i % 2) * .12); field.add(fan); anim.push(t => fan.position.y = .45 + (i % 2) * .2 + Math.abs(Math.sin(t * 5 + i)) * .06); }
  const ballF = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), std(0xffffff)); field.add(ballF);
  anim.push(t => { ballF.position.set(Math.sin(t * .9) * 1.0, .1 + Math.abs(Math.sin(t * 3)) * .15, Math.sin(t * 1.7) * .5); });
  g.add(field);

  // monumento (próximamente)
  const mon = new THREE.Group(); mon.position.set(0, 0, 3.05); faceCenter(mon);
  for (const [x, z] of [[-.7, -.5], [.7, -.5], [-.7, .5], [.7, .5]]) mon.add(box(.06, .45, .06, std(0xffffff), x, 0, z));
  const tape = std(0xffd23a);
  mon.add(box(1.45, .06, .03, tape, 0, .32, .5)); mon.add(box(1.45, .06, .03, tape, 0, .32, -.5)); mon.add(box(.03, .06, 1.05, tape, .7, .32, 0)); mon.add(box(.03, .06, 1.05, tape, -.7, .32, 0));
  const ms = sign(['PRÓXIMAMENTE', 'MONUMENTO'], '#0b1636', '#ffc83d', 512, 160, 1.1, .34, '#ffc83d'); ms.position.set(0, .75, .52); mon.add(ms);
  mon.add(box(.04, .6, .04, std(0x8a6a4a), 0, 0, .5));
  g.add(mon);

  // parada de bus + perezoso (idea de @busologia.p.oficial)
  const a0 = 1.72, stop = new THREE.Group(); stop.position.set(Math.cos(a0) * 5.4, 0, Math.sin(a0) * 5.4); faceCenter(stop);
  stop.add(box(.05, .9, .05, std(0x9aa6c6), -.45, 0, 0)); stop.add(box(.05, .9, .05, std(0x9aa6c6), .45, 0, 0)); stop.add(box(1.1, .06, .5, std(0x2f6fd6), 0, .9, -.1));
  const bs = sign('BUS', '#ffc83d', '#1d1404', 256, 128, .3, .15); bs.position.set(.62, .85, 0); stop.add(bs); stop.add(box(.03, .8, .03, std(0x9aa6c6), .62, 0, 0));
  const sloth = new THREE.Group(); sloth.position.set(-.1, 0, 0);
  const sb = new THREE.Mesh(new THREE.SphereGeometry(.2, 14, 10), std(0x9a7650)); sb.scale.set(1, 1.3, .9); sb.position.y = .28; sloth.add(sb);
  const sh = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 10), std(0x9a7650)); sh.position.y = .6; sloth.add(sh);
  const sf = new THREE.Mesh(new THREE.SphereGeometry(.11, 14, 10), std(0xf0dcb8)); sf.position.set(0, .59, .07); sloth.add(sf);
  for (const x of [-.05, .05]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), std(0x2a1c12)); e.position.set(x, .61, .17); sloth.add(e); }
  const hat = new THREE.Mesh(new THREE.ConeGeometry(.12, .25, 12), std(0xd9262f)); hat.position.set(0, .8, 0); hat.rotation.z = .3; sloth.add(hat);
  stop.add(sloth); anim.push(t => { sloth.rotation.z = Math.sin(t * 1.2) * .06; });
  g.add(stop);
  const park = { a: a0 + .32, r: 4.65 };

  // río con puente y cascada al vacío
  const rp = [[3.4, -5.7], [5.2, -3.9], [6.15, -1.3], [6.25, 1.2], [5.6, 3.3], [4.75, 5.15]].map(([x, z]) => new THREE.Vector3(x, .05, z));
  const curve = new THREE.CatmullRomCurve3(rp);
  const N = 80, rv = [], ru = [], ri = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, pt = curve.getPoint(u), tg = curve.getTangent(u), nx = -tg.z, nz = tg.x, w = .32;
    rv.push(pt.x + nx * w, .05, pt.z + nz * w, pt.x - nx * w, .05, pt.z - nz * w); ru.push(0, u * 8, 1, u * 8);
    if (i < N) { const k = i * 2; ri.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.Float32BufferAttribute(rv, 3)); rgeo.setAttribute('uv', new THREE.Float32BufferAttribute(ru, 2)); rgeo.setIndex(ri); rgeo.computeVertexNormals();
  const flowMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 } }, transparent: true,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform float t; varying vec2 vUv; void main(){ float s=sin(vUv.y*14.-t*4.+sin(vUv.x*9.)*1.2); vec3 c=mix(vec3(.16,.45,.95),vec3(.6,.85,1.),smoothstep(.75,1.,s)); gl_FragColor=vec4(c,.95); }'
  });
  const river = new THREE.Mesh(rgeo, flowMat); river.renderOrder = 2; g.add(river);
  const bank = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, .38, 6, false), std(0x8a7a5a)); bank.scale.y = .12; g.add(bank);
  // mirador y puente
  const ma = -.18; const path = box(.6, .03, 2.0, stone, Math.cos(ma) * 6.0, 0, Math.sin(ma) * 6.0); path.rotation.y = -ma + Math.PI / 2; g.add(path);
  const bridge = new THREE.Group(); bridge.position.copy(curve.getPoint(.4)).setY(.05); bridge.rotation.y = -ma + Math.PI / 2;
  bridge.add(box(.75, .08, .9, std(0x9a6a3e), 0, .05, 0)); for (const x of [-.36, .36]) bridge.add(box(.04, .25, .9, std(0x7a4e2c), x, .1, 0));
  g.add(bridge);
  // cascada
  const fallTop = curve.getPoint(1); const out = new THREE.Vector3(fallTop.x, 0, fallTop.z).normalize();
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(.66, 9.5, 1, 20), new THREE.ShaderMaterial({
    uniforms: { t: flowMat.uniforms.t }, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform float t; varying vec2 vUv; void main(){ float s=sin(vUv.y*40.+t*9.+sin(vUv.x*20.)*2.); float a=(.55+.35*s)*smoothstep(0.,.25,vUv.y); gl_FragColor=vec4(mix(vec3(.55,.8,1.),vec3(1.),.5+.5*s),a*.85); }'
  }));
  fall.position.set(fallTop.x + out.x * .1, -4.75, fallTop.z + out.z * .1); fall.lookAt(fall.position.clone().add(out)); g.add(fall);
  anim.push(t => flowMat.uniforms.t.value = t);

  // casitas del pueblo original
  const hc = [0xe85d5d, 0x5d9be8, 0xf2b84b, 0x8a6be0, 0x4fc48a, 0xf07ab0, 0x60c9d8, 0xe88a4a];
  const hA = [2.55, 2.8, 3.05, 3.3, 3.55, 3.8, 4.05, 4.3, 4.55, 4.8, 5.05];
  hA.forEach((a, i) => {
    const r = 5.6 + (i % 2) * .55, h = new THREE.Group(); h.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); faceCenter(h);
    h.add(box(.7, .55, .6, std(0xfbf6ea)));
    const rf = gable(.85, .4, .7, std(hc[i % hc.length])); rf.position.y = .55; h.add(rf);
    h.add(box(.16, .3, .02, std(0x6b3f25), 0, 0, .31)); h.add(box(.14, .14, .02, glowMat(0xffd27a, 1.1), .2, .27, .31)); h.add(box(.14, .14, .02, glowMat(0xffd27a, 1.1), -.2, .27, .31));
    g.add(h);
  });

  // árboles del borde
  const treeG = new THREE.ConeGeometry(.32, .9, 8); treeG.translate(0, .65, 0);
  const trunkG = new THREE.CylinderGeometry(.06, .07, .25, 6); trunkG.translate(0, .12, 0);
  const tAng = []; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2 + .05; if (a > -0.2 + 2 * Math.PI || (a > 5.2 || a < 1.05)) continue; tAng.push(a); }
  const trees = new THREE.InstancedMesh(treeG, std(0x2a7a46, { flatShading: true }), tAng.length * 2), trunks = new THREE.InstancedMesh(trunkG, std(0x6b4a2e), tAng.length * 2);
  const M = new THREE.Matrix4(); let ti = 0;
  tAng.forEach((a, i) => [6.55, 4.0].forEach((r, j) => {
    if (j === 1 && (i % 3)) return;
    const rr = j ? r + (i % 2) * .1 : r + (i % 2) * .2, s = .8 + (i * 7 % 5) * .1;
    M.compose(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    trees.setMatrixAt(ti, M); trunks.setMatrixAt(ti, M); trees.setColorAt(ti, new THREE.Color().setHSL(.33 + (i % 4) * .02, .5, .28 + (i % 3) * .04)); ti++;
  }));
  trees.count = trunks.count = ti; trees.castShadow = true; g.add(trees, trunks);

  // faroles en el anillo
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2 + .1, x = Math.cos(a) * 5.1, z = Math.sin(a) * 5.1;
    g.add(box(.04, .7, .04, std(0x3a3f55), x, 0, z));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), glowMat(0xffe7a0, 1.6)); bulb.position.set(x, .74, z); g.add(bulb);
  }

  // gente paseando por la plaza
  const skin = [0xf2c9a0, 0xd8a47a, 0xa8714a, 0x7a4e30];
  for (let i = 0; i < 16; i++) {
    const pp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .26, 10), std([0xe2363c, 0x285ac8, 0x3bb36a, 0xf2b84b, 0x9a5cff][i % 5])); body.position.y = .17; pp.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), std(skin[i % 4])); head.position.y = .37; pp.add(head);
    const ht = new THREE.Mesh(new THREE.ConeGeometry(.07, .14, 10), std(0xd9262f)); ht.position.y = .47; pp.add(ht);
    pp.castShadow = true; g.add(pp);
    const r = 1.25 + (i % 3) * .25, sp_ = (.18 + (i % 4) * .05) * (i % 2 ? 1 : -1), off = i * .9;
    anim.push(t => { const a = off + t * sp_; pp.position.set(Math.cos(a) * r, Math.abs(Math.sin(t * 8 + i)) * .03, Math.sin(a) * r); pp.rotation.y = -a + (sp_ > 0 ? Math.PI : 0); });
  }

  // luz cálida del pueblo
  const warm = new THREE.PointLight(0xffc98a, 18, 16, 1.6); warm.position.set(0, 3, 0); g.add(warm);

  // etiquetas
  lab('Iglesia', 0, 3.3, -3.2);
  lab('Súper Mario<small>de Charlito</small>', -3.25, 2.0, -1.2);
  lab('Súper chino<small>lo atiende @yutico · idea de @feli</small>', 3.25, 2.1, -1.2);
  lab('Club Pixel<small>SALAZR.wav · DJ Helicóptero</small>', 3.1, 2.4, 2.0);
  lab('La cancha<small>Sapri 2 · 2 Liga</small>', -3.1, 1.2, 2.05);
  lab('Monumento<small>próximamente</small>', 0, 1.4, 3.05);
  lab('Parada de La Tucaneta<small>idea de @busologia.p.oficial</small>', Math.cos(a0) * 5.4, 1.5, Math.sin(a0) * 5.4);
  lab('El río', 6.1, .9, -1.3);
  lab('La plaza', 0, 1.6, 0);

  return { group: g, labels, park, update: t => anim.forEach(f => f(t)) };
}
