// #59 10콤보부터 콤보마다 「N COMBO!」: 콤보가 쌓일수록 크고 화려하게 (50콤보에서 최대)
//   10~ 글자 + 충격파 + 별 파편 / 15~ 집중선 / 20~ 회전하는 가시 폭발 · 무지개 글자 / 25~ 흔들림 · 무지개 테두리 / 30~ 색종이 / 40~ 글자 떨림
var COMBO_Y = 42;   // 전투 화면 위쪽 가운데 (HUD 아래, 몬스터 위)
var COMBO_LABEL = [[80, 'LEGENDARY!'], [50, 'UNSTOPPABLE!'], [40, 'INCREDIBLE!'], [30, 'AMAZING!'], [20, 'GREAT!'], [10, 'NICE!']];
function comboHeat(c){ return Math.min(1, Math.max(0, (c - 10) / 40)); }
function comboLabel(c){ for (var i = 0; i < COMBO_LABEL.length; i++) if (c >= COMBO_LABEL[i][0]) return COMBO_LABEL[i][1]; return ''; }
function comboColor(c){ return c < 20 ? FLASH2[Math.floor(T * 10) % 2] : RAINBOW[Math.floor(T * 14) % 5]; }
function comboRunStart(c){
  var I = comboHeat(c), n = 4 + Math.round(I * 18);
  JUICE.comboRun = { n:c, t:0, I:I, flip:c % 2 ? 1 : -1 };
  if (JUICE.combo) JUICE.combo.t = Math.max(JUICE.combo.t, 0.7);   // 앞의 큰 배너(10의 배수)는 바로 사라지기 시작
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, sp = 50 + I * 90 + Math.random() * 60;
    JUICE.parts.push({ x:160, y:COMBO_Y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp * 0.6 - 20, life:0.3 + Math.random() * 0.3, max:0.6, c:RAINBOW[i % 5], star:i % 3 === 0 });
  }
  if (c >= 25) { fx.shake = Math.max(fx.shake, 0.05 + I * 0.1); JUICE.edge = Math.max(JUICE.edge, 0.15 + I * 0.25); JUICE.edgePerf = true; }
  if (c >= 30) juiceConfetti(4 + Math.round(I * 12));
}
// 「N COMBO!」: 숫자는 글자별 이미지를 이어 붙이고 COMBO!는 한 장 (콤보마다 새 이미지를 만들지 않게)
function juiceComboText(n, col){
  var s = String(n), cs = [], w = 0, i;
  for (i = 0; i < s.length; i++) { var c = juiceSprite(s[i], 20, col, '#11152a'); cs.push(c); w += c.cw - 3.2; }
  var word = juiceSprite('COMBO!', 20, col, '#11152a'); w += word.cw + 1;
  var x = -w / 2;
  ctx.imageSmoothingEnabled = true;
  for (i = 0; i < cs.length; i++) { ctx.drawImage(cs[i], x - 1.6, -cs[i].ch / 2, cs[i].cw, cs[i].ch); x += cs[i].cw - 3.2; }
  ctx.drawImage(word, x + 1, -word.ch / 2, word.cw, word.ch);
  ctx.imageSmoothingEnabled = false;
}
function comboRunDraw(){
  var cr = JUICE.comboRun; if (!cr) return;
  var t = cr.t, I = cr.I, a = t > 0.5 ? Math.max(0, (0.7 - t) / 0.2) : 1, pop = popScale(t), i;
  ctx.save(); ctx.translate(160, COMBO_Y);
  // 충격파
  var rk = Math.min(1, t / 0.4), rad = (12 + 30 * I) * (1 - Math.pow(1 - rk, 3));
  ctx.globalAlpha = (1 - rk) * 0.7; ctx.strokeStyle = cr.n < 20 ? '#ffd84a' : RAINBOW[cr.n % 5]; ctx.lineWidth = 1 + I;
  ctx.beginPath(); ctx.ellipse(0, 0, rad * 1.6, rad * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
  // 집중선 (15콤보부터, 콤보가 클수록 많고 김)
  if (cr.n >= 15) {
    var nR = 6 + Math.round(I * 24), L = 40 + I * 90;
    ctx.globalAlpha = a * (0.25 + I * 0.3); ctx.lineWidth = 1;
    for (var cc = 0; cc < 5; cc++) {
      ctx.strokeStyle = RAINBOW[cc]; ctx.beginPath();
      for (i = cc; i < nR; i += 5) { var an = i / nR * Math.PI * 2 + t * 1.2 * cr.flip, r0 = 22 + hash(i + cr.n) * 8;
        ctx.moveTo(Math.cos(an) * r0 * 1.6, Math.sin(an) * r0 * 0.6); ctx.lineTo(Math.cos(an) * L * 1.6, Math.sin(an) * L * 0.6); }
      ctx.stroke();
    }
  }
  // 회전하는 가시 폭발 (20콤보부터)
  if (cr.n >= 20) {
    var sp = 12 + Math.round(10 * I), R1 = (16 + 14 * I) * Math.min(1.15, pop), R0 = R1 * 0.6;
    ctx.beginPath();
    for (var q = 0; q < sp * 2; q++) {
      var an2 = q / (sp * 2) * Math.PI * 2 + T * 1.5 * cr.flip, rr = q % 2 ? R0 : R1 * (0.85 + hash(q + cr.n) * 0.35);
      var x2 = Math.cos(an2) * rr * 1.9, y2 = Math.sin(an2) * rr * 0.62;
      if (q) ctx.lineTo(x2, y2); else ctx.moveTo(x2, y2);
    }
    ctx.closePath();
    ctx.globalAlpha = a * 0.85; ctx.fillStyle = '#11152a'; ctx.fill();
    ctx.globalAlpha = a; ctx.lineJoin = 'miter'; ctx.lineWidth = 1.2 + I * 0.8; ctx.strokeStyle = RAINBOW[Math.floor(T * 12) % 5]; ctx.stroke();
  }
  // 글자: 콤보가 클수록 크게, 번갈아 기울고, 40콤보부터 떨림
  var sc = pop * (0.55 + 0.55 * I);
  ctx.globalAlpha = a;
  ctx.rotate(cr.flip * (0.04 + 0.06 * I) + (cr.n >= 40 ? Math.sin(t * 50) * 0.03 : 0));
  ctx.scale(sc, sc);
  juiceComboText(cr.n, comboColor(cr.n));
  var lb = comboLabel(cr.n);
  if (lb) { ctx.scale(1 / sc, 1 / sc); juiceText(lb, 0, 9 + 8 * sc, 7, cr.n >= 30 ? '#ffd84a' : '#ffffff', '#11152a'); }
  ctx.restore(); ctx.globalAlpha = 1;
}
function comboWarm(){   // 콤보 글자 이미지 미리 만들기 (juiceWarm에서 호출)
  FLASH2.concat(RAINBOW).forEach(function(c){ for (var d = 0; d < 10; d++) juiceSprite(String(d), 20, c, '#11152a'); juiceSprite('COMBO!', 20, c, '#11152a'); });
  COMBO_LABEL.forEach(function(L){ juiceSprite(L[1], 7, L[0] >= 30 ? '#ffd84a' : '#ffffff', '#11152a'); });
}
