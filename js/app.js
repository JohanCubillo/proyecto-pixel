import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildTown, makeBus } from './town.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => n.toLocaleString('es-CR');
const setCasas = n => { document.getElementById('nCasas').textContent = fmt(n); document.getElementById('nCasasW').textContent = n === 1 ? 'casa' : 'casas'; };
const K = 40, H = 1.6, TOP = H + .25;
const X = lon => (lon + 84.25) * K, Z = lat => -(lat - 9.62) * K;
const PCOL = { Guanacaste: 0xf2b45a, Alajuela: 0x86cf73, Heredia: 0xf2859f, 'San José': 0x83b2fa, Cartago: 0xc39af0, 'Limón': 0x63d3c6, Puntarenas: 0xf6d468 };
const LBL = { Guanacaste: [-85.45, 10.45], Alajuela: [-84.5, 10.62], Heredia: [-83.98, 10.45], 'San José': [-83.85, 9.45], Cartago: [-83.55, 9.72], 'Limón': [-83.3, 10.1], Puntarenas: [-83.3, 8.85] };
const TOWN_AT = [-82.78, 10.72], TOWN_Y = 9;
const VOLC = [['Rincón de la Vieja', -85.324, 10.83, 3, 3.2], ['Miravalles', -85.153, 10.748, 2.5, 2.6], ['Tenorio', -85.015, 10.673, 2.3, 2.4],
  ['Volcán Arenal', -84.703, 10.463, 3.8, 2.6, 1], ['Volcán Poás', -84.233, 10.2, 2.8, 3, 1], ['Volcán Barva', -84.108, 10.135, 2.5, 2.8],
  ['Volcán Irazú', -83.852, 9.979, 3.4, 3.6], ['Volcán Turrialba', -83.767, 10.025, 3.2, 3, 1], ['Cerro Chirripó', -83.487, 9.484, 4.4, 5.2]];

const q = new URLSearchParams(location.search);
const [PROV, CANT, CASAS0, EST] = await Promise.all(['provincias', 'cantones', 'casas', 'estado'].map(f => fetch(`data/${f}.json`, { cache: 'no-cache' }).then(r => r.json())));
let CASAS = CASAS0;
$('nSeg').textContent = fmt(EST.seguidores); $('nCol').textContent = '₡' + fmt(EST.seguidores * 5);

// ---------------------------------------------------------------- escena
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
const css = new CSS2DRenderer(); css.domElement.className = 'css2d'; stage.appendChild(css.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x14275a, 300, 900);
const cam = new THREE.PerspectiveCamera(40, 1, .1, 4000);
const ctr = new OrbitControls(cam, renderer.domElement);
Object.assign(ctr, { enableDamping: true, dampingFactor: .08, maxPolarAngle: 1.4, minDistance: 1.2, maxDistance: 750, screenSpacePanning: false, zoomSpeed: 1.2 });

// cielo y estrellas
const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'varying vec3 vP; void main(){ float h=vP.y; vec3 c=mix(vec3(.11,.22,.48),vec3(.02,.05,.16),smoothstep(0.,.6,h)); c=mix(vec3(.08,.16,.36),c,smoothstep(-.2,0.,h)); gl_FragColor=vec4(c,1.); }'
}));
scene.add(sky);
{
  const n = 1400, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = Math.random() * Math.PI * 2, v = Math.acos(Math.random() * .9 + .1); p.set([Math.cos(u) * Math.sin(v) * 1800, Math.cos(v) * 1800, Math.sin(u) * Math.sin(v) * 1800], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: .8, fog: false })));
}
const moon = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false })); moon.position.set(-700, 650, -1300); scene.add(moon);

scene.add(new THREE.HemisphereLight(0xb9c9ff, 0x223066, 1.15));
const sun = new THREE.DirectionalLight(0xfff0d8, 1.7);
sun.position.set(-60, 140, 80); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004;
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 10, far: 400 });
scene.add(sun);

// mar con olas suaves
const seaMat = new THREE.ShaderMaterial({
  uniforms: { t: { value: 0 }, fogColor: { value: scene.fog.color }, fogNear: { value: 300 }, fogFar: { value: 900 } }, fog: true,
  vertexShader: 'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition; \n#include <fog_vertex>\n }',
  fragmentShader: 'uniform float t; varying vec3 vW;\n#include <fog_pars_fragment>\nvoid main(){ float w=sin(vW.x*.18+t*.9)*sin(vW.z*.15-t*.7)+.5*sin((vW.x+vW.z)*.4+t*1.6); vec3 c=mix(vec3(.05,.2,.45),vec3(.12,.36,.7),.5+.25*w); gl_FragColor=vec4(c,1.); \n#include <fog_fragment>\n }'
});
const sea = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), seaMat); sea.rotation.x = -Math.PI / 2; scene.add(sea);

// ---------------------------------------------------------------- tierra: provincias en relieve
const landRings = [];
const sideMat = new THREE.MeshStandardMaterial({ color: 0xe6cf98, roughness: .95 });
for (const [name, rings] of Object.entries(PROV)) {
  const shapes = rings.map(r => new THREE.Shape(r.map(([lo, la]) => new THREE.Vector2(X(lo), -Z(la)))));
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: H, bevelEnabled: true, bevelThickness: .25, bevelSize: .2, bevelSegments: 2 });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({ color: PCOL[name], roughness: .85 }), sideMat]);
  m.receiveShadow = true; m.castShadow = true; scene.add(m);
  for (const r of rings) {
    const pts = r.map(([lo, la]) => new THREE.Vector3(X(lo), TOP + .02, Z(la)));
    scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 })));
    const foam = r.map(([lo, la]) => new THREE.Vector3(X(lo), .05, Z(la)));
    scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(foam), new THREE.LineBasicMaterial({ color: 0xd9f1ff, transparent: true, opacity: .55 })));
    const xs = r.map(p => X(p[0])), zs = r.map(p => Z(p[1]));
    landRings.push({ x: xs, z: zs, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), prov: name });
  }
  const d = document.createElement('div'); d.className = 'prov'; d.textContent = name;
  const o = new CSS2DObject(d); o.position.set(X(LBL[name][0]), TOP + 1.5, Z(LBL[name][1])); scene.add(o);
}
// máscara de tierra rasterizada: consulta O(1) para colocar decenas de miles de casas rápido
const MASK = (() => {
  const R = 8, xs = landRings.flatMap(r => [r.x0, r.x1]), zs = landRings.flatMap(r => [r.z0, r.z1]);
  const x0 = Math.min(...xs) - 1, z0 = Math.min(...zs) - 1, w = Math.ceil((Math.max(...xs) - x0 + 2) * R), h = Math.ceil((Math.max(...zs) - z0 + 2) * R);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath();
  for (const r of landRings) { r.x.forEach((x, i) => (i ? g.lineTo : g.moveTo).call(g, (x - x0) * R, (r.z[i] - z0) * R)); g.closePath(); }
  g.fill('evenodd');
  const d = g.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4] > 200 ? 1 : 0;
  // encoger 1 píxel para no dejar casas sobre la orilla
  const e = new Uint8Array(m.length);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; e[i] = m[i] & m[i - 1] & m[i + 1] & m[i - w] & m[i + w]; }
  return { R, x0, z0, w, h, e };
})();
function onLand(x, z) {
  const i = Math.floor((x - MASK.x0) * MASK.R), j = Math.floor((z - MASK.z0) * MASK.R);
  return i >= 0 && j >= 0 && i < MASK.w && j < MASK.h && MASK.e[j * MASK.w + i] === 1;
}
function onLandExact(x, z) {
  for (const r of landRings) {
    if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue;
    let ins = false;
    for (let i = 0, j = r.x.length - 1; i < r.x.length; j = i++)
      if ((r.z[i] > z) !== (r.z[j] > z) && x < (r.x[j] - r.x[i]) * (z - r.z[i]) / (r.z[j] - r.z[i]) + r.x[i]) ins = !ins;
    if (ins) return true;
  }
  return false;
}
// cantones: bordes finos + nombres al acercarse
{
  const segs = [];
  for (const c of CANT) for (const r of c.r) for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; segs.push(X(a[0]), TOP + .03, Z(a[1]), X(b[0]), TOP + .03, Z(b[1])); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
  scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .28 })));
}
const cantLabels = CANT.map(c => { const d = document.createElement('div'); d.className = 'cant'; d.textContent = c.n; const o = new CSS2DObject(d); o.position.set(X(c.c[0]), TOP + .5, Z(c.c[1])); o.visible = false; scene.add(o); return o; });

// volcanes y cerros
const blocked = [], smokes = [];
for (const [n, lo, la, h, r, smoke] of VOLC) {
  const g = new THREE.CylinderGeometry(r * .16, r, h, 28, 6); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > h / 2 - .01 || y < -h / 2 + .01) continue; const k = 1 + Math.sin(i * 91.7) * .07; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  g.computeVertexNormals();
  const cols = []; for (let i = 0; i < p.count; i++) { const f = (p.getY(i) + h / 2) / h; const c = new THREE.Color(0x3f8a4a).lerp(new THREE.Color(0x7a6a5a), Math.min(1, f * 1.3)).lerp(new THREE.Color(0xd8d2cc), Math.max(0, f - .75) * 2.5); cols.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 }));
  m.position.set(X(lo), TOP + h / 2 - .05, Z(la)); m.castShadow = m.receiveShadow = true; scene.add(m);
  const cr = new THREE.Mesh(new THREE.CircleGeometry(r * .13, 16), new THREE.MeshStandardMaterial({ color: 0x2a2226 })); cr.rotation.x = -Math.PI / 2; cr.position.set(X(lo), TOP + h, Z(la)); scene.add(cr);
  blocked.push([X(lo), Z(la), r * .95]);
  const d = document.createElement('div'); d.className = 'volc'; d.textContent = n; const o = new CSS2DObject(d); o.position.set(X(lo), TOP + h + .8, Z(la)); o.userData.volc = 1; scene.add(o); cantLabels.push(o); o.visible = false;
  if (smoke) for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff(), transparent: true, opacity: .5, depthWrite: false }));
    s.userData = { x: X(lo), y: TOP + h, z: Z(la), o: i / 6 }; smokes.push(s); scene.add(s);
  }
}
function puff() {
  if (puff.t) return puff.t;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(235,235,245,.9)'); gr.addColorStop(1, 'rgba(235,235,245,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return (puff.t = new THREE.CanvasTexture(c));
}

// ---------------------------------------------------------------- casas (InstancedMesh: aguanta decenas de miles)
if (q.get('prueba')) {           // ?prueba=30000 genera casas de prueba para medir el rendimiento
  const C = [[10.0, -84.1], [9.93, -84.08], [9.86, -83.92], [10.02, -84.22], [9.99, -83.03], [10.63, -85.44], [9.98, -84.83], [9.37, -83.7], [10.2, -83.79], [10.43, -85.1], [8.64, -83.18], [10.34, -84.43]];
  CASAS = CASAS.slice();
  for (let i = 0; i < +q.get('prueba'); i++) { const c = C[i % C.length]; CASAS.push({ u: 'prueba_' + i, net: i % 3 ? 'ig' : 'tt', prov: 'Prueba', canton: '', dist: '', lat: c[0] + (Math.random() - .5) * .1, lon: c[1] + (Math.random() - .5) * .1, day: 0 }); }
}
// Rejilla hexagonal de lotes: cada casa toma el lote libre en tierra más cercano a su distrito.
// Hasta ~10 000 casas el espaciado es fijo (el mapa no se mueve de un día a otro); con más, se aprietan solas.
const landArea = MASK.e.reduce((a, v) => a + v, 0) / (MASK.R * MASK.R);
const GAP = Math.min(.7, Math.sqrt(landArea * .5 / (Math.max(1, CASAS.length) * .866)));
const HS = .3 * Math.min(1, GAP / .62), CELL = .7;
const LDZ = GAP * .866, LX0 = MASK.x0, LZ0 = MASK.z0;
const LW = Math.ceil(MASK.w / MASK.R / GAP) + 2, LH = Math.ceil(MASK.h / MASK.R / LDZ) + 2;
const slotX = (i, j) => LX0 + (i + (j & 1) * .5) * GAP, slotZ = j => LZ0 + j * LDZ;
const slotOK = new Uint8Array(LW * LH);
for (let j = 0; j < LH; j++) for (let i = 0; i < LW; i++) {
  const x = slotX(i, j), z = slotZ(j);
  slotOK[j * LW + i] = onLand(x, z) && !blocked.some(([bx, bz, br]) => (x - bx) ** 2 + (z - bz) ** 2 < br * br) ? 1 : 0;
}
const ringStart = new Map();
function takeSlot(x, z, key) {
  const fj = Math.round((z - LZ0) / LDZ), fi = Math.round((x - LX0) / GAP - (fj & 1) * .5), maxR = LW + LH;
  let best = -1, bd = Infinity, found = -1, r = key ? ringStart.get(key) || 0 : 0;
  for (; r < maxR; r++) {
    for (let dj = -r; dj <= r; dj++) {
      const j = fj + dj; if (j < 0 || j >= LH) continue;
      const step = Math.abs(dj) === r ? 1 : 2 * r || 1;
      for (let di = -r; di <= r; di += step) {
        const i = fi + di; if (i < 0 || i >= LW || !slotOK[j * LW + i]) continue;
        const d = (slotX(i, j) - x) ** 2 + (slotZ(j) - z) ** 2; if (d < bd) { bd = d; best = j * LW + i; }
      }
    }
    if (best >= 0 && found < 0) found = r;
    if (found >= 0 && r >= found + 1) break;
  }
  if (best < 0) return null;
  if (key) ringStart.set(key, Math.max(0, found - 2));
  slotOK[best] = 0;
  const i = best % LW, j = (best - i) / LW, h1 = Math.sin(best * 12.9898) * 43758.5453, h2 = Math.sin(best * 78.233) * 12543.17;
  return [slotX(i, j) + (h1 - Math.floor(h1) - .5) * GAP * .2, slotZ(j) + (h2 - Math.floor(h2) - .5) * GAP * .2];
}
const grid = new Map(), gk = (x, z) => Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
function claim(x, z) { const k = gk(x, z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push([x, z]); }
const byUser = new Map(), pairs = [];
const houses = [];
for (const p of CASAS) {
  let x = X(p.lon), z = Z(p.lat);
  const nb = p.vecino && byUser.get(String(p.vecino).replace(/^@/, '').toLowerCase());
  const s = nb ? takeSlot(nb.pos.x, nb.pos.z, null) : takeSlot(x, z, p.lat.toFixed(2) + ',' + p.lon.toFixed(2));
  if (s) [x, z] = s;
  claim(x, z);
  const h = { p, pos: new THREE.Vector3(x, TOP, z), rot: (houses.length * 1.7) % 6.28, s: 1, place: [p.dist, p.canton, p.prov].filter(Boolean).join(', '), handle: (p.net === 'ig' ? '@' : '') + p.u };
  houses.push(h); byUser.set(p.u.toLowerCase(), h);
  if (nb) pairs.push([nb, h]);
}
const N = houses.length; 
const bodyG = new THREE.BoxGeometry(1.1, .9, 1.1); bodyG.translate(0, .45, 0);
const roofG = new THREE.ConeGeometry(.95, .75, 4); roofG.rotateY(Math.PI / 4); roofG.translate(0, 1.27, 0);
const winG = new THREE.BoxGeometry(.3, .26, .04); winG.translate(.28, .52, .56);
const bodies = new THREE.InstancedMesh(bodyG, new THREE.MeshStandardMaterial({ color: 0xfbf6ec, roughness: .7 }), Math.max(1, N));
const roofs = new THREE.InstancedMesh(roofG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6 }), Math.max(1, N));
const wins = new THREE.InstancedMesh(winG, new THREE.MeshStandardMaterial({ color: 0xffd47a, emissive: 0xffb02e, emissiveIntensity: 1.2 }), Math.max(1, N));
bodies.castShadow = roofs.castShadow = true; bodies.count = roofs.count = wins.count = N;
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), SC = new THREE.Vector3();
const roofCol = p => new THREE.Color(p.color ? p.color : p.net === 'tt' ? 0x3c78dc : 0xdc3c46);
function place(i) {
  const h = houses[i]; Q.setFromAxisAngle(UP, h.rot); SC.setScalar(Math.max(.0001, h.s * HS)); M4.compose(h.pos, Q, SC);
  bodies.setMatrixAt(i, M4); roofs.setMatrixAt(i, M4); wins.setMatrixAt(i, M4);
}
const dirty = () => { bodies.instanceMatrix.needsUpdate = roofs.instanceMatrix.needsUpdate = wins.instanceMatrix.needsUpdate = true; };
houses.forEach((h, i) => { place(i); roofs.setColorAt(i, roofCol(h.p)); }); dirty();
scene.add(bodies, roofs, wins);
const setScale = (i, v) => { houses[i].s = v; place(i); dirty(); };
setCasas(N);

// corazones entre vecinos
{
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#ff4d7a';
  x.beginPath(); x.moveTo(32, 56); x.bezierCurveTo(-8, 28, 14, -2, 32, 18); x.bezierCurveTo(50, -2, 72, 28, 32, 56); x.fill();
  const t = new THREE.CanvasTexture(c);
  for (const [a, b] of pairs) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false })); s.position.copy(a.pos).lerp(b.pos, .5).setY(TOP + .75); s.scale.setScalar(.35); scene.add(s); }
}

// árboles por todo el país (sin tapar casas)
{
  const tg = new THREE.ConeGeometry(.5, 1.3, 7); tg.translate(0, .9, 0);
  const n = 2200, trees = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: .9 }), n);
  let k = 0, seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let tries = 0; tries < n * 6 && k < n; tries++) {
    const x = X(-85.9 + rnd() * 3.4), z = Z(8.0 + rnd() * 3.2);
    if (!onLand(x, z)) continue;
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL); let near = false;
    for (let i = -1; i <= 1 && !near; i++) for (let j = -1; j <= 1 && !near; j++) for (const [px, pz] of grid.get((cx + i) + ',' + (cz + j)) || []) if ((x - px) ** 2 + (z - pz) ** 2 < 1) { near = true; break; }
    if (near) continue;
    const s = .22 + rnd() * .22; M4.compose(new THREE.Vector3(x, TOP, z), Q.identity(), SC.set(s, s * (.9 + rnd() * .5), s));
    trees.setMatrixAt(k, M4); trees.setColorAt(k, new THREE.Color().setHSL(.3 + rnd() * .07, .45, .22 + rnd() * .1)); k++;
  }
  trees.count = k; trees.castShadow = true; scene.add(trees);
}

// ---------------------------------------------------------------- Pueblo Pixel (isla flotante)
const town = buildTown();
town.group.position.set(X(TOWN_AT[0]), TOWN_Y, Z(TOWN_AT[1])); scene.add(town.group);
const townTitle = (() => { const d = document.createElement('div'); d.className = 'lab town'; d.textContent = 'Pueblo Pixel'; d.onclick = goTown; const o = new CSS2DObject(d); o.position.set(0, 4, 0); town.group.add(o); return o; })();
const bus = makeBus(); scene.add(bus);
function parkBus() {
  const { a, r } = town.park; bus.position.set(Math.cos(a) * r, 0, Math.sin(a) * r).add(town.group.position); bus.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); bus.scale.setScalar(1);
}
parkBus();

// ---------------------------------------------------------------- etiquetas de personas (se reutilizan)
const POOL = 36, labs = [];
for (let k = 0; k < POOL; k++) {
  const d = document.createElement('div'); d.className = 'lab';
  const o = new CSS2DObject(d); o.visible = false; scene.add(o); labs.push({ d, o, i: -1 });
  d.addEventListener('click', () => { if (labs[k].i >= 0) focus(labs[k].i); });
}
let hot = -1, names = 'auto';
function updateLabels() {
  const t = ctr.target, dist = cam.position.distanceTo(t), pick = [];
  if (names === 'auto' && dist < 34) {
    const rad = dist * .6, cand = [];
    for (let i = 0; i < N; i++) { if (houses[i].s < .5) continue; const d = houses[i].pos.distanceToSquared(t); if (d < rad * rad) cand.push([d, i]); }
    cand.sort((a, b) => a[0] - b[0]); for (const [, i] of cand.slice(0, POOL - 1)) pick.push(i);
  }
  if (hot >= 0 && !pick.includes(hot)) pick.unshift(hot);
  labs.forEach((l, k) => {
    const i = pick[k];
    if (i == null) { l.o.visible = false; l.i = -1; return; }
    if (l.i !== i) { const h = houses[i]; l.i = i; l.d.className = 'lab' + (h.p.net === 'tt' ? ' tt' : ''); l.d.innerHTML = esc(h.handle) + '<small>' + esc(h.place) + '</small>'; }
    l.o.visible = true; l.d.classList.toggle('hot', i === hot); l.o.position.copy(houses[i].pos).setY(TOP + .75);
  });
  const showC = names === 'auto' && dist < 150;
  for (const o of cantLabels) { o.visible = showC && (o.userData.volc ? dist < 150 : dist < 90 && o.position.distanceTo(t) < dist * .9); }
  const nearTown = cam.position.distanceTo(town.group.position) < 55;
  for (const o of town.labels) o.visible = nearTown && names !== 'off';
}

// ---------------------------------------------------------------- cámara
let fly = null;
function flyTo(target, dist, dir = new THREE.Vector3(0, .95, 1), dur = 1.6) {
  fly = { t: 0, dur, p0: cam.position.clone(), t0: ctr.target.clone(), t1: target.clone(), p1: target.clone().add(dir.clone().normalize().multiplyScalar(dist)) };
}
const OVER = new THREE.Vector3(X(-84.15), 0, Z(9.8));
function overview() { closeCard(); flyTo(OVER, 230 / Math.min(1, cam.aspect) ** .8, new THREE.Vector3(0, 1.3, .75)); }
function goTown() { stopTour(); closeCard(); flyTo(town.group.position.clone().add(new THREE.Vector3(0, .5, 0)), 26, new THREE.Vector3(.2, .75, 1)); }

// faro sobre la casa elegida
const beacon = new THREE.Group();
const beam = new THREE.Mesh(new THREE.CylinderGeometry(.18, .3, 14, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
beam.position.y = 7; beacon.add(beam);
const halo = new THREE.Mesh(new THREE.RingGeometry(.35, .5, 40), new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false }));
halo.rotation.x = -Math.PI / 2; halo.position.y = .05; beacon.add(halo); beacon.visible = false; scene.add(beacon);

// ---------------------------------------------------------------- tarjeta de la casa
function neighbors(i, n = 4) {
  const out = []; const p = houses[i].pos;
  for (let j = 0; j < N; j++) if (j !== i) out.push([houses[j].pos.distanceToSquared(p), j]);
  return out.sort((a, b) => a[0] - b[0]).slice(0, n).map(x => x[1]);
}
function focus(i, quick) {
  stopTour(); hot = i; const h = houses[i];
  beacon.position.copy(h.pos); beacon.visible = true;
  flyTo(h.pos, quick ? 6 : 7, new THREE.Vector3(.15, .9, 1));
  $('cWho').textContent = h.handle; $('cWhere').textContent = h.place;
  $('cMeta').textContent = (h.p.net === 'ig' ? 'Instagram' : 'TikTok') + (h.p.day ? ' · llegó el día ' + h.p.day : '');
  $('cNb').innerHTML = neighbors(i).map(j => `<button class="chip" data-i="${j}">${esc(houses[j].handle)}</button>`).join('');
  $('card').hidden = false; document.body.classList.add('carding'); $('copied').textContent = '';
  try { history.replaceState(null, '', '?u=' + encodeURIComponent(h.p.u)); } catch (e) {}
}
function closeCard() { $('card').hidden = true; document.body.classList.remove('carding'); hot = -1; beacon.visible = false; try { history.replaceState(null, '', location.pathname); } catch (e) {} }
$('cNb').onclick = e => { const b = e.target.closest('.chip'); if (b) focus(+b.dataset.i); };
$('cClose').onclick = closeCard;
$('cCopy').onclick = async () => {
  const h = houses[hot]; if (!h) return;
  const url = location.origin + location.pathname + '?u=' + encodeURIComponent(h.p.u);
  try { await navigator.clipboard.writeText(url); $('copied').textContent = '¡Enlace copiado!'; } catch (e) { $('copied').textContent = url; }
};

// ---------------------------------------------------------------- buscador por @
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^@/, '');
const index = houses.map(h => norm(h.p.u) + ' ' + norm(h.place));
const sIn = $('search'), sOut = $('results'); let sel = 0, found = [];
function runSearch() {
  const v = norm(sIn.value.trim()); found = [];
  if (v) for (let i = 0; i < N && found.length < 8; i++) if (index[i].includes(v)) found.push(i);
  found.sort((a, b) => (norm(houses[b].p.u).startsWith(v)) - (norm(houses[a].p.u).startsWith(v)));
  sel = 0;
  sOut.innerHTML = !v ? '' : found.length ? found.map((i, k) => `<li role="option" data-i="${i}" class="${k === sel ? 'on' : ''}"><b>${esc(houses[i].handle)}</b><span>${esc(houses[i].place)}</span></li>`).join('')
    : '<li class="none">Todavía no hay una casa con ese nombre. ¡Comentá tu provincia, cantón y distrito!</li>';
  sOut.hidden = !v;
}
sIn.addEventListener('input', runSearch);
sIn.addEventListener('keydown', e => {
  if (!found.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : found.length - 1)) % found.length; [...sOut.children].forEach((li, k) => li.classList.toggle('on', k === sel)); }
  if (e.key === 'Enter') { e.preventDefault(); pick(found[sel]); }
  if (e.key === 'Escape') { sOut.hidden = true; }
});
sOut.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) pick(+li.dataset.i); });
function pick(i) { sOut.hidden = true; sIn.value = houses[i].handle; sIn.blur(); focus(i); }

// ---------------------------------------------------------------- guerra de provincias
function drawRank() {
  const c = {}; for (const n in PROV) c[n] = 0; houses.forEach(h => { if (c[h.p.prov] != null) c[h.p.prov]++; });
  const r = Object.entries(c).sort((a, b) => b[1] - a[1]), max = Math.max(1, r[0][1]);
  $('rank').innerHTML = r.map(([n, v], k) => `<button class="rrow" data-p="${esc(n)}"><span class="rn">${k === 0 ? '<i class="crown"></i>' : ''}${esc(n)}</span><span class="rb"><i style="width:${(v / max * 100).toFixed(1)}%;background:#${PCOL[n].toString(16)}"></i></span><span class="rv">${fmt(v)}</span></button>`).join('');
}
drawRank();
$('rank').onclick = e => { const b = e.target.closest('.rrow'); if (!b) return; const [lo, la] = LBL[b.dataset.p]; closeCard(); flyTo(new THREE.Vector3(X(lo), TOP, Z(la)), 70, new THREE.Vector3(0, 1.1, .8)); };

// ---------------------------------------------------------------- recorrido de La Tucaneta (los nuevos del día)
let tour = null;
function startTour() {
  closeCard();
  const last = Math.max(0, ...houses.map(h => h.p.day || 0));
  const left = houses.map((_, i) => i).filter(i => (houses[i].p.day || 0) === last).slice(0, 400), seq = [];
  let cur = town.group.position.clone();
  while (left.length) { let bi = 0, bd = 1e18; left.forEach((i, k) => { const d = houses[i].pos.distanceToSquared(cur); if (d < bd) { bd = d; bi = k; } }); const n = left.splice(bi, 1)[0]; seq.push(n); cur = houses[n].pos; }
  seq.forEach(i => houses[i].s = .0001); houses.forEach((_, i) => place(i)); dirty();
  tour = { seq, k: 0, t: 0, from: bus.position.clone(), wait: 0, base: N - seq.length };
  setCasas(tour.base); $('tour').textContent = 'Detener recorrido';
}
function stopTour() {
  if (!tour) return; tour = null;
  houses.forEach((h, i) => { h.s = 1; place(i); }); dirty(); parkBus();
  setCasas(N); $('tour').textContent = 'Recorrido de La Tucaneta'; $('now').classList.remove('on');
}
function stepTour(dt) {
  if (!tour) return;
  if (tour.k >= tour.seq.length) { stopTour(); overview(); return; }
  const i = tour.seq[tour.k], to = houses[i].pos.clone().add(new THREE.Vector3(.55, 0, .45));
  if (tour.wait > 0) {
    tour.wait -= dt; const g = Math.min(1, (1.4 - tour.wait) / .45); setScale(i, Math.max(.0001, g < 1 ? g * 1.25 : 1));
    if (tour.wait <= 0) { setScale(i, 1); tour.k++; tour.t = 0; tour.from = bus.position.clone(); }
    return;
  }
  const dist = tour.from.distanceTo(to), dur = Math.min(2.4, .7 + dist / 35);
  tour.t += dt / dur; const s = Math.min(1, tour.t), e = s * s * (3 - 2 * s);
  const p = tour.from.clone().lerp(to, e); p.y = THREE.MathUtils.lerp(tour.from.y, TOP, e) + Math.sin(s * Math.PI) * Math.min(14, dist * .25);
  const prev = bus.position.clone(); bus.position.copy(p); bus.scale.setScalar(THREE.MathUtils.lerp(bus.scale.x, .42, 1 - Math.exp(-dt * 5)));
  const dx = p.x - prev.x, dz = p.z - prev.z; if (dx * dx + dz * dz > 1e-7) bus.rotation.y = Math.atan2(-dz, dx);
  ctr.target.lerp(p, 1 - Math.exp(-dt * 6)); cam.position.lerp(p.clone().add(new THREE.Vector3(0, 5.5, 6.5)), 1 - Math.exp(-dt * 3.5));
  if (s >= 1) {
    tour.wait = 1.4; setCasas(tour.base + tour.k + 1);
    $('nowWho').textContent = houses[i].handle; $('nowWhere').textContent = houses[i].place; $('now').classList.add('on');
  }
}

// ---------------------------------------------------------------- botones
$('tour').onclick = () => tour ? stopTour() : startTour();
$('btnTown').onclick = goTown;
$('btnAll').onclick = () => { stopTour(); overview(); };
$('btnNames').onclick = e => { names = names === 'auto' ? 'off' : 'auto'; e.currentTarget.textContent = names === 'auto' ? 'Ocultar nombres' : 'Mostrar nombres'; };
$('btnRank').onclick = () => $('rankBox').classList.toggle('open');
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let down = null;
renderer.domElement.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
renderer.domElement.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, cam);
  const hit = ray.intersectObjects([bodies, roofs])[0]; if (hit && hit.instanceId != null) focus(hit.instanceId);
});

function size() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h); css.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', size); size();
cam.position.copy(OVER).add(new THREE.Vector3(0, 320, 220)); ctr.target.copy(OVER);
const startU = q.get('u');
if (startU && byUser.has(startU.replace(/^@/, '').toLowerCase())) focus(houses.indexOf(byUser.get(startU.replace(/^@/, '').toLowerCase())));
else overview();
document.body.classList.add('ready');

// ---------------------------------------------------------------- animación
const clock = new THREE.Clock(); let frame = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(.1, clock.getDelta()), t = clock.elapsedTime;
  if (fly && !tour) { fly.t = Math.min(1, fly.t + dt / fly.dur); const e = 1 - (1 - fly.t) ** 3; cam.position.lerpVectors(fly.p0, fly.p1, e); ctr.target.lerpVectors(fly.t0, fly.t1, e); if (fly.t >= 1) fly = null; }
  stepTour(dt);
  town.update(t); seaMat.uniforms.t.value = t;
  town.group.position.y = TOWN_Y + Math.sin(t * .5) * .25;
  if (!tour) bus.position.y = town.group.position.y + .02;
  for (const s of smokes) { const u = (t * .12 + s.userData.o) % 1; s.position.set(s.userData.x + u * 2, s.userData.y + u * 5, s.userData.z - u); s.scale.setScalar(.8 + u * 2.4); s.material.opacity = .45 * (1 - u); }
  halo.scale.setScalar(1 + .35 * Math.sin(t * 4)); beam.material.opacity = .25 + .12 * Math.sin(t * 3);
  const dist = cam.position.distanceTo(ctr.target);
  scene.fog.near = dist * 1.4; scene.fog.far = dist * 4 + 200; seaMat.uniforms.fogNear.value = scene.fog.near; seaMat.uniforms.fogFar.value = scene.fog.far;
  if ((frame++ & 7) === 0) updateLabels();
  ctr.update(); renderer.render(scene, cam); css.render(scene, cam);
});
