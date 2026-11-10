// [시안] 미니게임 성공 이펙트: 판정 도장 · 불꽃 파편 · 충격파 · 코인 날아가기 · 점수 칸 번쩍 · 10콤보 배너
var JUICE = { parts:[], rings:[], stamps:[], coins:[], combo:null, scoreFlash:0, coinFlash:0 };
function juicePos(t){   // 성공한 미니게임 요소의 화면 위치 (캔버스 좌표)
  var px = 60, pw = W - 120;
  if (t.mg === 'timing') return [px + 12 + t.cur * (pw - 24), 150];
  if (t.mg === 'charge') return [px + 14 + (t.mark ? t.mark.x : t.g) * (pw - 28), 150];
  if (t.mg === 'mole') return [160 + (t.lane - 1) * 56, 151];
  if (t.mg === 'alert') return [172, 152];
  if (t.mg === 'command') { var n = t.arrows.length, tw = n * 25 - 3; return [Math.round(160 - tw / 2) + (n - 1) * 25 + 11, 154]; }
  return [160, 150];
}
function juiceSuccess(res, t){
  var p = juicePos(t), x = p[0], y = p[1], perf = res === 'perfect';
  var cols = perf ? ['#ffd84a', '#ff4fd8', '#3ef2ff', '#ffffff'] : ['#3ef2ff', '#7be3a0', '#ffffff'];
  var n = perf ? 22 : 12;
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, sp = (perf ? 90 : 60) + Math.random() * 80;
    JUICE.parts.push({ x:x, y:y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 30, life:0.35 + Math.random() * 0.3, max:0.65, c:cols[i % cols.length], star:perf && i % 4 === 0 });
  }
  JUICE.rings.push({ x:x, y:y, t:0, c:perf ? '#ffd84a' : '#3ef2ff', big:perf });
  if (perf) JUICE.rings.push({ x:x, y:y, t:-0.08, c:'#ff4fd8', big:true });
  JUICE.stamps.push({ x:Math.max(40, Math.min(280, x)), y:y - 14, t:0, perf:perf });
  var nc = perf ? 3 : 1;
  for (var c = 0; c < nc; c++) JUICE.coins.push({ x0:x, y0:y, t:-c * 0.06 });
  JUICE.scoreFlash = 0.35;
  if (perf) { fx.flash = Math.max(fx.flash, 0.25); fx.flashColor = '#ffd84a'; fx.shake = Math.max(fx.shake, 0.08); }
  if (G.combo > 0 && G.combo % 10 === 0) JUICE.combo = { n:G.combo, t:0 };
}
function juiceUpdate(dt){
  JUICE.parts = JUICE.parts.filter(function(p){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.vx *= 0.96; p.life -= dt; return p.life > 0; });
  JUICE.rings = JUICE.rings.filter(function(r){ r.t += dt; return r.t < 0.4; });
  JUICE.stamps = JUICE.stamps.filter(function(s){ s.t += dt; return s.t < 0.55; });
  JUICE.coins = JUICE.coins.filter(function(c){ c.t += dt; if (c.t >= 0.42 && !c.done) { c.done = true; JUICE.coinFlash = 0.3; } return c.t < 0.45; });
  if (JUICE.combo) { JUICE.combo.t += dt; if (JUICE.combo.t > 0.9) JUICE.combo = null; }
  JUICE.scoreFlash = Math.max(0, JUICE.scoreFlash - dt); JUICE.coinFlash = Math.max(0, JUICE.coinFlash - dt);
}
function juiceText(s, x, y, size, col, outline){   // 굵은 외곽선 + 색 번짐(하늘 · 분홍) 글자
  ctx.globalAlpha *= 1;
  [[-0.8, 0, '#3ef2ff'], [0.8, 0, '#ff4fd8']].forEach(function(o){ txt(s, x + o[0], y + o[1], size, o[2], 'center', '900'); });
  for (var k = 0; k < 4; k++) txt(s, x + [1, -1, 0, 0][k] * 0.9, y + [0, 0, 1, -1][k] * 0.9, size, outline, 'center', '900');
  txt(s, x, y, size, col, 'center', '900');
}
function juiceDraw(){
  // 점수 · 코인 칸 번쩍
  if (JUICE.scoreFlash > 0) { ctx.globalAlpha = JUICE.scoreFlash * 0.5; R(2, 124, 56, 52, '#3ef2ff'); ctx.globalAlpha = 1; boxBorder(2, 124, 56, 52, '#3ef2ff'); }
  if (JUICE.coinFlash > 0) { ctx.globalAlpha = JUICE.coinFlash * 0.6; R(262, 124, 56, 52, '#ffd84a'); ctx.globalAlpha = 1; boxBorder(262, 124, 56, 52, '#ffd84a'); }
  // 충격파
  JUICE.rings.forEach(function(r){
    if (r.t < 0) return; var k = r.t / 0.4, rad = (r.big ? 26 : 16) * (1 - Math.pow(1 - k, 3));
    ctx.save(); ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = r.c; ctx.lineWidth = (1 - k) * 3 + 0.5;
    ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  });
  // 불꽃 파편 (빛줄기 · 별)
  ctx.save(); ctx.lineCap = 'round';
  JUICE.parts.forEach(function(p){
    var k = p.life / p.max; ctx.globalAlpha = Math.min(1, k * 1.6);
    if (p.star) { var r = 1.5 + k * 2; R(p.x - r, p.y - 0.5, r * 2, 1, p.c); R(p.x - 0.5, p.y - r, 1, r * 2, p.c); return; }
    ctx.strokeStyle = p.c; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
  });
  ctx.restore(); ctx.globalAlpha = 1;
  // 코인 날아가기 (포물선 → 코인 칸)
  JUICE.coins.forEach(function(c){
    if (c.t < 0) return; var k = Math.min(1, c.t / 0.42), e = 1 - Math.pow(1 - k, 2);
    var x = c.x0 + (290 - c.x0) * e, y = c.y0 + (146 - c.y0) * e - Math.sin(k * Math.PI) * 30;
    R(Math.round(x) - 2, Math.round(y) - 2, 5, 5, '#b8860b'); R(Math.round(x) - 1, Math.round(y) - 2, 3, 4, '#ffd84a'); R(Math.round(x), Math.round(y) - 1, 1, 2, '#fff1a0');
  });
  // 판정 도장: 튀어나왔다가 위로 사라짐
  JUICE.stamps.forEach(function(s){
    var k = s.t / 0.55, pop = s.t < 0.08 ? 0.6 + s.t / 0.08 * 0.7 : (s.t < 0.16 ? 1.3 - (s.t - 0.08) / 0.08 * 0.3 : 1);
    ctx.save(); ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1; ctx.translate(s.x, s.y - k * 8); ctx.rotate(s.perf ? -0.12 : 0); ctx.scale(pop, pop);
    juiceText(s.perf ? 'PERFECT!' : 'GOOD', 0, 0, s.perf ? 11 : 8.5, s.perf ? '#ffd84a' : '#7be3a0', '#11152a');
    ctx.restore();
  });
  // 10콤보 배너 + 집중선
  if (JUICE.combo) {
    var t = JUICE.combo.t, k = t / 0.9, a = k > 0.7 ? (1 - k) / 0.3 : 1, pop = t < 0.1 ? 0.5 + t * 8 : (t < 0.2 ? 1.3 - (t - 0.1) * 3 : 1);
    ctx.save(); ctx.globalAlpha = a * 0.35;
    for (var i = 0; i < 28; i++) { var an = i / 28 * Math.PI * 2 + t * 0.6, r0 = 34 + hash(i + Math.floor(t * 12)) * 12;
      ctx.strokeStyle = i % 2 ? '#ffd84a' : '#ff4fd8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(160 + Math.cos(an) * r0, 66 + Math.sin(an) * r0 * 0.6); ctx.lineTo(160 + Math.cos(an) * 200, 66 + Math.sin(an) * 120); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a; ctx.translate(160, 66); ctx.rotate(-0.06); ctx.scale(pop, pop);
    juiceText(JUICE.combo.n + ' COMBO!', 0, 0, 20, '#ffd84a', '#11152a');
    ctx.restore(); ctx.globalAlpha = 1;
  }
}
