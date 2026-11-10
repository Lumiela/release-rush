// #57 미니게임 성공 이펙트 (보여 주기용 · 판정 · 점수 · 시간 · 게임 난수와 무관, 장식 난수는 Math.random)
// 가시성 원칙: 미니게임 패널 안에는 짧고 가는 효과(판정 도장 · 파편 · 충격파)만, 큰 효과(번개 · CRITICAL · 배너 · 색종이)는 위쪽 전투 화면과 화면 가장자리
var JUICE = { parts:[], rings:[], stamps:[], coins:[], flies:[], dmg:[], confetti:[], bolt:null, combo:null, streakBanner:null, comboTick:null,
  scoreFlash:0, coinFlash:0, edge:0, edgePerf:false, punch:0, punchX:160, punchY:150, streak:0 };
var RAINBOW = ['#ff4fd8', '#ffd84a', '#3ef2ff', '#b6ff4a', '#ff8a5c'];
var FLASH2 = ['#ffd84a', '#ff4fd8'];   // 큰 글자는 2색만 번갈아 (글자 이미지 수를 줄임)
function juicePos(t){   // 성공한 미니게임 요소의 화면 위치 (캔버스 좌표)
  var px = 60, pw = W - 120;
  if (t.mg === 'timing') return [px + 12 + t.cur * (pw - 24), 150];
  if (t.mg === 'charge') return [px + 14 + (t.mark ? t.mark.x : t.g) * (pw - 28), 150];
  if (t.mg === 'mole') return [160 + (t.lane - 1) * 56, 151];
  if (t.mg === 'alert') return [172, 152];
  if (t.mg === 'command') { var n = t.arrows.length, tw = n * 25 - 3; return [Math.round(160 - tw / 2) + (n - 1) * 25 + 11, 154]; }
  return [160, 150];
}
function juiceMonster(){ return BT && BT.enemy ? [BT.enemy.x - 2, GROUND - (BT.isBoss ? 30 : 14)] : [232, 92]; }
function juiceConfetti(n){ for (var i = 0; i < n; i++) JUICE.confetti.push({ x:Math.random() * W, y:20 - Math.random() * 10, vx:(Math.random() - 0.5) * 30, vy:40 + Math.random() * 50, r:Math.random() * 6, c:RAINBOW[i % RAINBOW.length], life:1.2 + Math.random() * 0.6 }); }
function juiceSuccess(res, t, pts){
  var p = juicePos(t), x = p[0], y = p[1], perf = res === 'perfect', m = juiceMonster();
  var cols = perf ? ['#ffd84a', '#ff4fd8', '#3ef2ff', '#ffffff', '#b6ff4a'] : ['#3ef2ff', '#7be3a0', '#ffffff'];
  var n = perf ? 30 : 14;
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, sp = (perf ? 110 : 70) + Math.random() * 90;
    JUICE.parts.push({ x:x, y:y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 40, life:0.3 + Math.random() * 0.35, max:0.65, c:cols[i % cols.length], star:perf && i % 4 === 0 });
  }
  JUICE.rings.push({ x:x, y:y, t:0, c:perf ? '#ffd84a' : '#3ef2ff', big:perf });
  if (perf) { JUICE.rings.push({ x:x, y:y, t:-0.07, c:'#ff4fd8', big:true }); JUICE.rings.push({ x:x, y:y, t:-0.14, c:'#3ef2ff', big:true }); }
  JUICE.stamps.push({ x:Math.max(40, Math.min(280, x)), y:y - 14, t:0, perf:perf });
  for (var c = 0; c < (perf ? 4 : 2); c++) JUICE.coins.push({ x0:x, y0:y, t:-c * 0.05 });
  JUICE.flies.push({ x0:x, y0:y - 6, t:0, text:'+' + fmt(pts), perf:perf });   // 점수가 점수 칸으로 날아감
  // 성공 자리 → 몬스터 번개, 몬스터 위 피해 숫자
  JUICE.bolt = { x0:x, y0:y - 6, x1:m[0], y1:m[1], t:0, perf:perf };
  JUICE.dmg.push({ x:m[0] + (Math.random() - 0.5) * 10, y:m[1] - 10, t:0, text:'+' + fmt(pts), perf:perf });
  for (var j = 0; j < (perf ? 12 : 6); j++) { var a2 = Math.random() * Math.PI * 2, s2 = 60 + Math.random() * 60; JUICE.parts.push({ x:m[0], y:m[1], vx:Math.cos(a2) * s2, vy:Math.sin(a2) * s2 - 30, life:0.25 + Math.random() * 0.25, max:0.5, c:cols[j % cols.length], star:false }); }
  JUICE.edge = perf ? 0.4 : 0.22; JUICE.edgePerf = perf;
  if (perf) { JUICE.punch = 0.12; JUICE.punchX = x; JUICE.punchY = y; fx.flash = Math.max(fx.flash, 0.25); fx.flashColor = '#ffd84a'; fx.shake = Math.max(fx.shake, 0.1); }
  // 연속 PERFECT
  JUICE.streak = perf ? JUICE.streak + 1 : 0;
  if (perf && (JUICE.streak === 3 || JUICE.streak === 5 || (JUICE.streak >= 8 && JUICE.streak % 4 === 0))) { JUICE.streakBanner = { n:JUICE.streak, t:0 }; juiceConfetti(26); }
  // 콤보: 5마다 작은 알림, 10마다 큰 배너
  if (G.combo > 0 && G.combo % 10 === 0) { JUICE.combo = { n:G.combo, t:0 }; juiceConfetti(40); fx.shake = Math.max(fx.shake, 0.18); }
  else if (G.combo > 0 && G.combo % 5 === 0) JUICE.comboTick = { n:G.combo, t:0 };
}
function juiceMiss(){ JUICE.streak = 0; }
function juiceUpdate(dt){
  function step(arr, grav, drag){ return arr.filter(function(p){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += grav * dt; p.vx *= drag; p.life -= dt; return p.life > 0; }); }
  JUICE.parts = step(JUICE.parts, 170, 0.96);
  JUICE.confetti = step(JUICE.confetti, 20, 0.99).filter(function(p){ p.r += dt * 8; return p.y < 108; });   // 색종이는 전투 화면 안에서만
  JUICE.rings = JUICE.rings.filter(function(r){ r.t += dt; return r.t < 0.42; });
  JUICE.stamps = JUICE.stamps.filter(function(s){ s.t += dt; return s.t < 0.55; });
  JUICE.dmg = JUICE.dmg.filter(function(d){ d.t += dt; return d.t < 0.8; });
  JUICE.coins = JUICE.coins.filter(function(c){ c.t += dt; if (c.t >= 0.42 && !c.done) { c.done = true; JUICE.coinFlash = 0.3; } return c.t < 0.45; });
  JUICE.flies = JUICE.flies.filter(function(f){ f.t += dt; if (f.t >= 0.45 && !f.done) { f.done = true; JUICE.scoreFlash = 0.35; } return f.t < 0.48; });
  if (JUICE.bolt) { JUICE.bolt.t += dt; if (JUICE.bolt.t > 0.2) JUICE.bolt = null; }
  ['combo', 'streakBanner', 'comboTick'].forEach(function(k){ var o = JUICE[k]; if (o) { o.t += dt; if (o.t > (k === 'comboTick' ? 0.6 : 1)) JUICE[k] = null; } });
  JUICE.scoreFlash = Math.max(0, JUICE.scoreFlash - dt); JUICE.coinFlash = Math.max(0, JUICE.coinFlash - dt);
  JUICE.edge = Math.max(0, JUICE.edge - dt); JUICE.punch = Math.max(0, JUICE.punch - dt);
}
// 이펙트 글자는 한 번만 그려 이미지로 저장해 두고(글자 · 크기 · 색마다), 커지고 기울어지는 건 이미지를 늘리고 돌려서 표현.
// 글자를 매 프레임 다른 크기로 그리면 글자 모양을 새로 만드느라 첫 성공 때 0.3~0.5초 멈췄음
var JUICE_SPR = {}, JUICE_SPR_N = 0, JUICE_RS = S;   // 화면과 같은 해상도 (메모리를 적게 써서 메모리 정리로 끊기지 않게)
function juiceSprite(s, size, col, outline){
  var key = s + '|' + size + '|' + col + '|' + outline, c = JUICE_SPR[key];
  if (c) return c;
  if (JUICE_SPR_N > 240) { JUICE_SPR = {}; JUICE_SPR_N = 0; }
  c = document.createElement('canvas');
  var g = c.getContext('2d'), keep = ctx;
  g.font = 'bold ' + size + 'px "Malgun Gothic","맑은 고딕",sans-serif';
  var w = g.measureText(s).width + 4, h = size * 1.5 + 4;
  c.width = Math.ceil(w * JUICE_RS); c.height = Math.ceil(h * JUICE_RS); c.cw = w; c.ch = h;
  ctx = g; ctx.setTransform(JUICE_RS, 0, 0, JUICE_RS, 0, 0);
  try {
    txt(s, w / 2 - 0.9, h / 2, size, '#3ef2ff', 'center'); txt(s, w / 2 + 0.9, h / 2, size, '#ff4fd8', 'center');
    for (var k = 0; k < 4; k++) txt(s, w / 2 + [1, -1, 0, 0][k] * 0.9, h / 2 + [0, 0, 1, -1][k] * 0.9, size, outline, 'center');
    txt(s, w / 2, h / 2, size, col, 'center');
  } finally { ctx = keep; }
  JUICE_SPR[key] = c; JUICE_SPR_N++;
  return c;
}
// 점수 숫자: 크기를 바꾸지 않고 바로 그림 (숫자마다 이미지를 만들면 쓰레기가 쌓여 메모리 정리로 끊김)
// 숫자는 0~9 · + · 쉼표 글자 이미지를 한 번 만들어 이어 붙임 (그리기 명령 수를 줄여 한꺼번에 몰릴 때 끊기지 않게)
function juiceNum(s, x, y, size, col){
  var cs = [], w = 0, i;
  for (i = 0; i < s.length; i++) { var c = juiceSprite(s[i], size, col, '#11152a'); cs.push(c); w += c.cw - 3.2; }
  var cx = x - w / 2;
  ctx.imageSmoothingEnabled = true;
  for (i = 0; i < cs.length; i++) { ctx.drawImage(cs[i], cx - 1.6, y - cs[i].ch / 2, cs[i].cw, cs[i].ch); cx += cs[i].cw - 3.2; }
  ctx.imageSmoothingEnabled = false;
}
function juiceText(s, x, y, size, col, outline){   // 굵은 외곽선 + 색 번짐(하늘 · 분홍) 글자 (저장한 이미지로, 정해진 글자만)
  var c = juiceSprite(s, size, col, outline);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(c, x - c.cw / 2, y - c.ch / 2, c.cw, c.ch); ctx.imageSmoothingEnabled = false;
}
// 자주 쓰는 이펙트 글자 이미지를 대기 화면에서 미리 만들어 둠 (첫 성공 때 만들지 않게)
var JUICE_WARM = false;
function juiceWarm(){
  if (JUICE_WARM) return; JUICE_WARM = true;
  FLASH2.forEach(function(c){ juiceSprite('PERFECT!', 11, c, '#11152a'); juiceSprite('10 COMBO!', 20, c, '#11152a'); juiceSprite('PERFECT ×3', 16, c, '#11152a'); juiceSprite('PERFECT ×5', 16, c, '#11152a'); });
  juiceSprite('GOOD', 8.5, '#7be3a0', '#11152a'); juiceSprite('연속 퍼펙트!', 7, '#ffffff', '#11152a'); juiceSprite('CRITICAL!', 9, '#ff5a3a', '#11152a');
  // 이펙트가 쓰는 그리기 방식(기울이고 늘린 이미지 · 원 · 둥근 선 · 꺾인 선 · 숫자)을 실제 게임 캔버스에 한 번씩 그려 둠.
  // 처음 쓸 때 한 번 준비하느라 0.1초쯤 멈추는 것을 대기 화면으로 옮김 (바로 뒤에 대기 화면 배경이 덮어서 안 보임)
  ctx.save();
  try {
    for (var key in JUICE_SPR) { var c = JUICE_SPR[key]; ctx.save(); ctx.translate(160, 90); ctx.rotate(0.08); ctx.scale(1.2, 1.2); ctx.globalAlpha = 0.5; ctx.imageSmoothingEnabled = true; ctx.drawImage(c, -c.cw / 2, -c.ch / 2, c.cw, c.ch); ctx.imageSmoothingEnabled = false; ctx.restore(); }
    ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#3ef2ff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(160, 90, 20, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(100, 90); ctx.lineTo(140, 80); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.lineJoin = 'miter'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(100, 100); ctx.lineTo(120, 90); ctx.lineTo(140, 105); ctx.stroke(); ctx.restore();
    juiceNum('+0123456789,', 160, 60, 9, '#ffd84a'); juiceNum('+0123456789,', 160, 70, 7.5, '#ffffff'); juiceNum('+0123456789,', 160, 80, 7, '#ffd84a'); juiceNum('+0123456789,', 160, 90, 6, '#7be3a0');   // 숫자 글자 이미지도 미리
  } finally { ctx.restore(); }
}
function popScale(t){ return t < 0.08 ? 0.5 + t / 0.08 * 0.8 : (t < 0.16 ? 1.3 - (t - 0.08) / 0.08 * 0.3 : 1); }
// 줌 펀치: draw()에서 장면을 그리기 전에 호출 (PERFECT 순간 성공 자리를 중심으로 최대 3% 확대)
function juicePunch(){ if (JUICE.punch > 0 && scene === 'play') { var k = 1 + 0.03 * (JUICE.punch / 0.12); ctx.translate(JUICE.punchX, JUICE.punchY); ctx.scale(k, k); ctx.translate(-JUICE.punchX, -JUICE.punchY); } }
function juiceDraw(){
  var i;
  // 점수 · 코인 칸 번쩍
  if (JUICE.scoreFlash > 0) { ctx.globalAlpha = JUICE.scoreFlash * 0.5; R(2, 124, 56, 52, '#3ef2ff'); ctx.globalAlpha = 1; boxBorder(2, 124, 56, 52, '#3ef2ff'); }
  if (JUICE.coinFlash > 0) { ctx.globalAlpha = JUICE.coinFlash * 0.6; R(262, 124, 56, 52, '#ffd84a'); ctx.globalAlpha = 1; boxBorder(262, 124, 56, 52, '#ffd84a'); }
  // 번개: 성공 자리 → 몬스터 (매 프레임 모양이 바뀌는 지그재그)
  var b = JUICE.bolt;
  if (b) {
    var segs = 9, pts = [];
    for (i = 0; i <= segs; i++) { var k = i / segs, j = i === 0 || i === segs ? 0 : (Math.random() - 0.5) * 14; pts.push([b.x0 + (b.x1 - b.x0) * k + j, b.y0 + (b.y1 - b.y0) * k + j * 0.4]); }
    ctx.save(); ctx.lineJoin = 'miter'; ctx.globalAlpha = 1 - b.t / 0.2;
    [[5, 0.25, b.perf ? '#ffd84a' : '#3ef2ff'], [2.2, 0.7, b.perf ? '#ff4fd8' : '#3ef2ff'], [0.9, 1, '#ffffff']].forEach(function(L){
      ctx.globalAlpha = (1 - b.t / 0.2) * L[1]; ctx.strokeStyle = L[2]; ctx.lineWidth = L[0];
      ctx.beginPath(); pts.forEach(function(q, n){ if (n) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke();
    });
    ctx.restore();
  }
  // 충격파
  JUICE.rings.forEach(function(r){
    if (r.t < 0) return; var k = r.t / 0.42, rad = (r.big ? 30 : 18) * (1 - Math.pow(1 - k, 3));
    ctx.save(); ctx.globalAlpha = (1 - k) * 0.6; ctx.strokeStyle = r.c; ctx.lineWidth = (1 - k) * 1.5 + 0.4;   // 얇고 옅게 (다음 목표를 가리지 않게)
    ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  });
  // 불꽃 파편 (빛줄기 · 별)
  JUICE.parts.forEach(function(p){   // 사각형으로 그린 빛줄기: 머리(밝게) + 꼬리 2점(옅게)
    var k = p.life / p.max; ctx.globalAlpha = Math.min(1, k * 1.6);
    if (p.star) { var r = 1.5 + k * 2.5; R(p.x - r, p.y - 0.5, r * 2, 1, p.c); R(p.x - 0.5, p.y - r, 1, r * 2, p.c); return; }
    R(p.x - 0.7, p.y - 0.7, 1.6, 1.6, p.c);
    ctx.globalAlpha *= 0.6; R(p.x - p.vx * 0.02 - 0.5, p.y - p.vy * 0.02 - 0.5, 1.2, 1.2, p.c);
    ctx.globalAlpha *= 0.6; R(p.x - p.vx * 0.04 - 0.5, p.y - p.vy * 0.04 - 0.5, 1, 1, p.c);
  });
  ctx.globalAlpha = 1;
  // 색종이 (전투 화면 안)
  JUICE.confetti.forEach(function(p){ if (p.y < 19) return; ctx.globalAlpha = Math.min(1, p.life);   // 위쪽 HUD(타이머)는 가리지 않음
    var w = Math.abs(Math.cos(p.r)) * 3 + 0.6; R(Math.round(p.x - w / 2), Math.round(p.y), Math.round(w) || 1, 2, p.c); });
  ctx.globalAlpha = 1;
  // 코인 · 점수 날아가기
  JUICE.coins.forEach(function(c){
    if (c.t < 0) return; var k = Math.min(1, c.t / 0.42), e = 1 - Math.pow(1 - k, 2);
    var x = c.x0 + (290 - c.x0) * e, y = c.y0 + (146 - c.y0) * e - Math.sin(k * Math.PI) * 34;
    R(Math.round(x) - 2, Math.round(y) - 2, 5, 5, '#b8860b'); R(Math.round(x) - 1, Math.round(y) - 2, 3, 4, '#ffd84a'); R(Math.round(x), Math.round(y) - 1, 1, 2, '#fff1a0');
  });
  JUICE.flies.forEach(function(f){
    var k = Math.min(1, f.t / 0.45), e = k * k, x = f.x0 + (30 - f.x0) * e, y = f.y0 + (140 - f.y0) * e - Math.sin(k * Math.PI) * 26;
    ctx.globalAlpha = 1; juiceNum(f.text, Math.round(x), Math.round(y), f.perf ? 7 : 6, f.perf ? '#ffd84a' : '#7be3a0');
  });
  // 몬스터 위 피해 숫자 (CRITICAL!)
  JUICE.dmg.forEach(function(d){
    var k = d.t / 0.8, s = popScale(d.t), a = k > 0.6 ? (1 - k) / 0.4 : 1, yy = d.y - k * 14;
    if (d.perf) { ctx.save(); ctx.globalAlpha = a; ctx.translate(d.x, yy - 7); ctx.rotate(0.08); ctx.scale(s, s); juiceText('CRITICAL!', 0, 0, 9, '#ff5a3a', '#11152a'); ctx.restore(); }
    ctx.globalAlpha = a; juiceNum(d.text, Math.round(d.x), Math.round(yy + (d.perf ? 4 : 0)), d.perf ? 9 : 7.5, d.perf ? '#ffd84a' : '#ffffff'); ctx.globalAlpha = 1;
  });
  // 판정 도장 (패널 안, 짧게)
  JUICE.stamps.forEach(function(s){
    var k = s.t / 0.55;
    ctx.save(); ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1; ctx.translate(s.x, s.y - k * 8); ctx.rotate(s.perf ? -0.12 : 0); var sc = popScale(s.t); ctx.scale(sc, sc);
    juiceText(s.perf ? 'PERFECT!' : 'GOOD', 0, 0, s.perf ? 11 : 8.5, s.perf ? FLASH2[Math.floor(T * 12) % 2] : '#7be3a0', '#11152a');
    ctx.restore();
  });
  // 5콤보 알림 (콤보 글자 근처, 작게)
  if (JUICE.comboTick) { var ct = JUICE.comboTick.t; ctx.save(); ctx.globalAlpha = ct > 0.4 ? (0.6 - ct) / 0.2 : 1; ctx.translate(250, 118 - ct * 10); var cs = popScale(ct); ctx.scale(cs, cs); juiceText(JUICE.comboTick.n + ' COMBO', 0, 0, 7, '#9ad8ff', '#11152a'); ctx.restore(); }
  // 큰 배너: 10콤보 · 연속 PERFECT (전투 화면 가운데)
  var big = JUICE.combo || JUICE.streakBanner;
  if (big) {
    var t = big.t, k2 = t, a = k2 > 0.7 ? (1 - k2) / 0.3 : 1, pop = popScale(t) * 1.05, isCombo = big === JUICE.combo;
    ctx.save(); ctx.globalAlpha = a * 0.35;
    ctx.lineWidth = 1;
    for (var cc = 0; cc < 5; cc++) {   // 색별로 한 번에 그음 (32줄 → 5번)
      ctx.strokeStyle = RAINBOW[cc]; ctx.beginPath();
      for (i = cc; i < 30; i += 5) { var an = i / 30 * Math.PI * 2 + t * 0.8, r0 = 36 + hash(i + Math.floor(t * 14)) * 14;
        ctx.moveTo(160 + Math.cos(an) * r0, 64 + Math.sin(an) * r0 * 0.55); ctx.lineTo(160 + Math.cos(an) * 220, 64 + Math.sin(an) * 120); }
      ctx.stroke();
    }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a; ctx.translate(160, 64); ctx.rotate(-0.06 + Math.sin(t * 30) * 0.01); ctx.scale(pop, pop);
    juiceText(isCombo ? big.n + ' COMBO!' : 'PERFECT ×' + big.n, 0, 0, isCombo ? 20 : 16, FLASH2[Math.floor(T * 10) % 2], '#11152a');
    if (!isCombo) juiceText('연속 퍼펙트!', 0, 14, 7, '#ffffff', '#11152a');
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // 화면 가장자리 번쩍 (PERFECT는 무지개)
  if (JUICE.edge > 0) {
    var ec = JUICE.edgePerf ? RAINBOW[Math.floor(T * 24) % 5] : '#3ef2ff', ea = JUICE.edge / (JUICE.edgePerf ? 0.4 : 0.22);
    for (var e2 = 0; e2 < 3; e2++) { ctx.globalAlpha = ea * (0.7 - e2 * 0.2); boxBorder(e2, e2, W - e2 * 2, H - e2 * 2, ec); }
    ctx.globalAlpha = 1;
  }
}
