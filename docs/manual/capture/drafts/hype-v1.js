// [시안 #58] 급박한 3분: 움직이는 층별 배경 + 남은 시간 긴장 단계 + 성공에 반응하는 배경
// 긴장 단계: 0 (30초 초과) · 1 HURRY (30초 이하) · 2 DANGER (15초 이하) · 3 LAST (5초 이하). WARNING·보너스 중에는 0
var HYPE = { g:null, lv:0, shown:{}, banner:null, sec:-1, secPulse:0, kick:0, lastFlash:0, clockT:false, warm:false };
var HYPE_COL = { plan:['#3ef2ff', '#4a7dff'], dev:['#7be3a0', '#3ef2ff'], qa:['#ffd84a', '#ff8a5c'], boss:['#ff3b3b', '#ff4fd8'] };
var HYPE_BAN = [null, ['HURRY UP!', '#ffd84a', '30초 남음 · 서둘러!'], ['DANGER!', '#ff5a5a', '15초 남음 · 1초가 아깝다'], ['LAST 5!', '#ff3b3b', '5초 · 끝까지 몰아쳐!']];
var HYPE_PAT = {}, HYPE_VIG = {};

function hypeTicking(){ return G && scene === 'play' && !G.ready && !G.tally && !G.isMid && !G.finished && !(G.banner > 0) && !(G.clearing > 0) && !inFever(); }
function hypeLevel(){ if (!G || G.isMid) return 0; var t = G.time; return t <= 5 ? 3 : (t <= 15 ? 2 : (t <= 30 ? 1 : 0)); }
// 박자: 지금 곡의 BPM에 맞춤 (곡이 없거나 점검용 캡처면 게임 시간으로)
function hypeBeat(){
  var bpm = BGM.key === 'boss' ? 150 : 140;
  if (!HYPE.clockT && SND.ctx && SND.ctx.state === 'running' && BGM.t0 != null && BGM.key) return Math.max(0, SND.ctx.currentTime - BGM.t0 + 0.06) * bpm / 60;
  return T * bpm / 60;
}
// 몰입도 0~1: 콤보 · 연속 퍼펙트 · 피버
function hypeEnergy(){ if (inFever()) return 1; return Math.min(1, (G.combo || 0) / 30) * 0.6 + Math.min(1, (JUICE.streak || 0) / 8) * 0.4; }
// 심장 박동 모양 (쿵-쿵 · 쉼)
function hypeHeart(rate){ var p = (T * rate) % 1; return Math.exp(-p * 16) + (p > 0.2 ? 0.75 * Math.exp(-(p - 0.2) * 16) : 0); }

function hypeStripe(c, n, on){   // 대각선 줄무늬 무늬 (n칸마다 on칸 칠함, 한 번 만들어 재사용)
  var key = c + n + on; if (HYPE_PAT[key]) return HYPE_PAT[key];
  var cv = document.createElement('canvas'); cv.width = n; cv.height = n; var g = cv.getContext('2d');
  var tape = c === 'tape';   // 'tape': 노랑 · 검정 경고 테이프
  if (tape) { g.fillStyle = '#11152a'; g.fillRect(0, 0, n, n); }
  g.fillStyle = tape ? '#ffd84a' : c;
  for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if ((x + y) % n < on) g.fillRect(x, y, 1, 1);
  return HYPE_PAT[key] = ctx.createPattern(cv, 'repeat');
}
function hypeFillPat(pat, off, x, y, w, h, n){ ctx.save(); ctx.translate(off % n, 0); ctx.fillStyle = pat; ctx.fillRect(x - n, y, w + n * 2, h); ctx.restore(); }
function hypeVignette(c){   // 가장자리가 짙어지는 붉은 테두리 (작게 만들어 부드럽게 늘림)
  if (HYPE_VIG[c]) return HYPE_VIG[c];
  var cv = document.createElement('canvas'); cv.width = 160; cv.height = 90; var g = cv.getContext('2d');
  var gr = g.createRadialGradient(80, 45, 30, 80, 45, 98);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, c.replace('A', '0.25')); gr.addColorStop(1, c.replace('A', '1'));
  g.fillStyle = gr; g.fillRect(0, 0, 160, 90);
  return HYPE_VIG[c] = cv;
}
function hypeWarm(){
  if (HYPE.warm) return; HYPE.warm = true;
  for (var i = 1; i <= 3; i++) juiceSprite(HYPE_BAN[i][0], 18, HYPE_BAN[i][1], '#11152a');
  for (var n = 1; n <= 5; n++) juiceSprite(String(n), 46, '#ff3b3b', '#11152a');
}

function hypeUpdate(dt){
  if (!G || scene !== 'play') { HYPE.banner = null; return; }
  if (HYPE.g !== G) { HYPE.g = G; HYPE.lv = 0; HYPE.shown = {}; HYPE.banner = null; HYPE.sec = -1; }
  if (JUICE.scoreFlash > HYPE.lastFlash + 0.05) HYPE.kick = 1;   // 미니게임 성공 순간 배경도 함께 번쩍
  HYPE.lastFlash = JUICE.scoreFlash;
  HYPE.kick = Math.max(0, HYPE.kick - dt * 3);
  HYPE.secPulse = Math.max(0, HYPE.secPulse - dt * 2.2);
  if (HYPE.banner) { HYPE.banner.t += dt; if (HYPE.banner.t > 1.3) HYPE.banner = null; }
  if (!hypeTicking()) return;
  var lv = hypeLevel();
  if (lv > HYPE.lv && !HYPE.shown[lv]) {   // 단계가 올라가는 순간: 경고 띠 + 번쩍 + 흔들림 (한 판에 단계마다 한 번)
    HYPE.shown[lv] = 1; HYPE.banner = { lv:lv, t:0 };
    fx.flash = Math.max(fx.flash, 0.6); fx.flashColor = lv === 1 ? '#ffd84a' : '#ff3b3b'; fx.shake = Math.max(fx.shake, 0.25);
  }
  HYPE.lv = lv;
  var s = Math.ceil(G.time);
  if (lv >= 2 && s !== HYPE.sec) HYPE.secPulse = 1;   // 15초부터 1초마다 쿵
  HYPE.sec = s;
}

// 배경 위 · 전투 아래
function hypeBack(key){
  hypeWarm();
  var cols = HYPE_COL[key] || HYPE_COL.plan, beat = hypeBeat(), bi = Math.floor(beat), bp = beat - bi, b = Math.exp(-bp * 5);
  var lv = HYPE.lv, E = hypeEnergy(), sp = 1 + lv * 0.6 + E * 1.4, k = HYPE.kick;
  // 1) 벽을 흐르는 대각선 줄무늬: 긴장 · 몰입할수록 빨라지고 진해짐. 성공하면 번쩍
  ctx.globalAlpha = Math.min(0.32, 0.05 + b * 0.05 + lv * 0.025 + E * 0.06 + k * 0.12);
  hypeFillPat(hypeStripe(lv >= 2 ? '#ff3b3b' : cols[0], 16, 4), T * 22 * sp, 0, 18, W, 98, 16);
  ctx.globalAlpha = 1;
  // 2) 층별로 움직이는 소품
  if (key === 'plan') {   // 화이트보드 진행 막대가 차오르고 · 박자마다 메모지 하나가 번쩍 · 상승 그래프
    [[34, 60, '#3ef2ff'], [42, 90, '#ff8a5c'], [50, 40, '#3ef2ff']].forEach(function(L, i){ var f = ((beat / 4 + i * 0.3) % 1); R(82, L[0], Math.round(L[1] * f), 3, L[2]); });
    var nts = [[190, 32], [208, 32], [226, 32], [190, 50], [208, 50]], nt = nts[bi % 5];
    ctx.globalAlpha = b * 0.8; R(nt[0], nt[1], 14, 14, '#ffffff'); ctx.globalAlpha = 1;
    var gp = (beat / 2) % 1; ctx.save(); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.beginPath();
    for (var q = 0; q <= 12 * gp; q++) { var gx = 82 + q * 12, gy = 88 - q * 3.2 - (q % 2) * 5; if (q === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy); }
    ctx.stroke(); ctx.restore();
  } else if (key === 'dev') {   // 벽에 쏟아지는 코드 비 · 모니터 코드가 위로 스크롤
    for (var c = 0; c < 22; c++) {
      var cx = 3 + c * 14.5 + Math.round(hash(c) * 6), v = 30 + hash(c + 9) * 40, hy = ((T * v * sp + hash(c + 3) * 200) % 120) + 8;
      for (var tr = 0; tr < 7; tr++) { var yy = hy - tr * 4; if (yy < 19 || yy > 114) continue; ctx.globalAlpha = (tr === 0 ? 0.75 : 0.4 - tr * 0.05) * (0.6 + E * 0.4); R(cx, Math.round(yy), 2, 2, tr === 0 ? '#e8fff0' : cols[c % 2]); }
    }
    ctx.globalAlpha = 1;
    var mons = [[92, 52], [132, 46], [184, 52]], off = Math.floor(T * 7 * sp);
    for (var m = 0; m < 3; m++) {
      var mx = mons[m][0], my = mons[m][1]; R(mx + 2, my + 2, 40, 26, '#0e1226');
      for (var l = 0; l < 5; l++) { var li = l + off + m * 3; R(mx + 5 + (li % 2) * 4, my + 5 + l * 4, 10 + Math.floor(hash(m * 9 + li) * 22), 2, ['#7be3a0', '#3ef2ff', '#ff8ad8', '#ffd84a', '#9aa2c7'][li % 5]); }
      ctx.globalAlpha = b * 0.35; R(mx + 2, my + 2, 40, 26, cols[0]); ctx.globalAlpha = 1;
    }
  } else if (key === 'qa') {   // 버그들이 게시판 위를 기어다님 · 오른쪽 위 경광등
    for (var g = 0; g < 7; g++) {
      var ph = T * (0.35 + hash(g) * 0.3) * sp + g * 1.7, bx = 160 + Math.sin(ph) * 110 * (0.6 + hash(g + 4) * 0.4), by = 58 + Math.sin(ph * 1.7 + g) * 32;
      var leg = Math.floor(T * 14 + g) % 2; bx = Math.round(bx); by = Math.round(by);
      R(bx - 2, by - 1, 5, 3, '#d33a3a'); R(bx - 1, by - 2, 3, 1, '#ff6a5a'); R(bx + 3, by, 1, 1, '#11152a');
      R(bx - 3, by - 1 + leg, 1, 1, '#11152a'); R(bx + 2, by - 1 + leg, 1, 1, '#11152a'); R(bx - 3, by + 1 - leg, 1, 1, '#11152a'); R(bx + 2, by + 1 - leg, 1, 1, '#11152a');
    }
    var on = Math.floor(T * 4) % 2; R(288, 19, 10, 5, on ? '#ff3b3b' : '#7a2020');
    ctx.save(); ctx.globalAlpha = 0.16 + b * 0.1; ctx.fillStyle = '#ff3b3b'; var a0 = T * 5;
    ctx.beginPath(); ctx.moveTo(293, 21); ctx.lineTo(293 + Math.cos(a0 - 0.2) * 90, 21 + Math.abs(Math.sin(a0 - 0.2)) * 90); ctx.lineTo(293 + Math.cos(a0 + 0.2) * 90, 21 + Math.abs(Math.sin(a0 + 0.2)) * 90); ctx.fill(); ctx.restore();
  } else if (key === 'boss') {   // 붉은 탐조등 두 개가 훑고 · 4박마다 번개
    ctx.save(); ctx.fillStyle = '#ff4a4a';
    for (var s = 0; s < 2; s++) {
      var ox = s ? 300 : 20, an = Math.PI / 2 + Math.sin(T * 0.9 * sp + s * 2.1) * 0.75, L2 = 130;
      ctx.globalAlpha = 0.12 + b * 0.06 + lv * 0.03;
      ctx.beginPath(); ctx.moveTo(ox, 18); ctx.lineTo(ox + Math.cos(an - 0.13) * L2, 18 + Math.sin(an - 0.13) * L2); ctx.lineTo(ox + Math.cos(an + 0.13) * L2, 18 + Math.sin(an + 0.13) * L2); ctx.fill();
    }
    ctx.restore();
    if (bi % 4 === 0 && bp < 0.2) {
      var la = 1 - bp / 0.2, lx = 40 + hash(bi) * 240, ly = 20;
      ctx.save(); ctx.globalAlpha = la * 0.12; R(0, 18, W, 98, '#ffffff');
      ctx.lineJoin = 'miter'; [[3, 0.35, '#ff4fd8'], [1.2, 1, '#fff0f0']].forEach(function(st){
        ctx.globalAlpha = la * st[1]; ctx.strokeStyle = st[2]; ctx.lineWidth = st[0]; ctx.beginPath(); ctx.moveTo(lx, ly);
        for (var z = 1; z <= 7; z++) ctx.lineTo(lx + (hash(bi * 7 + z) - 0.5) * 22, ly + z * 13);
        ctx.stroke();
      });
      ctx.restore();
    }
  }
  // 3) 몰입하면 화면을 가로지르는 속도선
  if (E > 0.25) {
    var nL = Math.round(E * 14);
    for (var i = 0; i < nL; i++) {
      var ly2 = 22 + hash(i * 3) * 90, lw = 20 + hash(i * 5) * 40, lx2 = W - ((T * (260 + hash(i) * 200) + hash(i * 7) * 400) % (W + 80));
      ctx.globalAlpha = 0.18 + E * 0.2; R(Math.round(lx2), Math.round(ly2), Math.round(lw), 1, i % 3 ? '#ffffff' : cols[1]);
    }
    ctx.globalAlpha = 1;
  }
  // 4) 바닥선: 박자마다 빛나고, 불빛이 달려감 (빨라질수록 급함)
  ctx.globalAlpha = 0.35 + b * 0.5 + k * 0.3; R(0, 116, W, 2, lv >= 2 ? '#ff3b3b' : cols[0]); ctx.globalAlpha = 1;
  for (var d = 0; d < 20; d++) { var dx = Math.round((d * 16 + T * 40 * sp) % W); R(dx, 116, 3, 2, '#ffffff'); }
  // 5) 남은 시간 색: HURRY 주황 박자 · DANGER 붉은 심장 박동 · LAST 매초 붉은 번쩍
  if (lv === 1) { ctx.globalAlpha = 0.04 + b * 0.07; R(0, 18, W, 98, '#ff8a3a'); }
  else if (lv === 2) { ctx.globalAlpha = 0.06 + hypeHeart(1.3) * 0.1; R(0, 18, W, 98, '#ff2a2a'); }
  else if (lv === 3) { ctx.globalAlpha = 0.1 + HYPE.secPulse * 0.2; R(0, 18, W, 98, '#ff2a2a'); }
  ctx.globalAlpha = 1;
}

// 패널 · 피버 위, 성공 이펙트 아래
function hypeFront(){
  var lv = HYPE.lv, tick = hypeTicking();
  // 붉은 테두리 (심장 박동)
  if (lv >= 2) {
    var hb = lv === 3 ? Math.max(hypeHeart(2), HYPE.secPulse) : hypeHeart(1.3);
    ctx.globalAlpha = Math.min(0.95, (lv === 3 ? 0.5 : 0.3) + hb * 0.4); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(hypeVignette('rgba(255,30,40,A)'), 0, 0, W, H); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1;
    // 위 · 아래 경고 테이프가 흐름
    hypeFillPat(hypeStripe('tape', 8, 4), T * 30, 0, 18, W, 3, 8);
    hypeFillPat(hypeStripe('tape', 8, 4), -T * 30, 0, 177, W, 3, 8);
  }
  // 타이머: 1초마다 크게 튀어오름
  if (lv >= 1 && tick && G.timeHit <= 0) {
    var ss = Math.ceil(Math.max(0, G.time)), str = '00:' + (ss < 10 ? '0' : '') + ss;   // 올림: 큰 카운트다운 숫자와 맞춤
    var p = lv === 1 ? Math.exp(-(hypeBeat() % 1) * 5) * 0.12 : HYPE.secPulse * 0.45;
    var col = lv === 1 ? '#ffd84a' : (HYPE.secPulse > 0.6 ? '#ffffff' : '#ff5a5a');
    ctx.globalAlpha = 1; R(126, 0, 68, 16, '#0a0c16');
    ctx.save(); ctx.translate(160, 8.5); ctx.scale(1 + p, 1 + p); juiceText(str, 0, 0, 10, col, '#11152a'); ctx.restore();
  }
  // 마지막 5초: 거대한 카운트다운 숫자
  if (lv === 3 && tick) {
    var n = Math.max(1, Math.ceil(G.time)), sp = HYPE.secPulse, sc = 1 + sp * sp * 1.3;
    ctx.save(); ctx.globalAlpha = 0.38 + sp * 0.55; ctx.translate(160, 66); ctx.scale(sc, sc); juiceText(String(n), 0, 0, 46, '#ff3b3b', '#11152a'); ctx.restore();
  }
  // 단계가 올라갈 때 경고 띠가 가로질러 지나감
  if (HYPE.banner) {
    var bt = HYPE.banner.t, info = HYPE_BAN[HYPE.banner.lv];
    var ox = bt < 0.18 ? (1 - bt / 0.18) * W : (bt < 1.05 ? 0 : -(bt - 1.05) / 0.25 * W);
    ctx.save(); ctx.translate(Math.round(ox), 0);
    ctx.globalAlpha = 0.88; R(0, 74, W, 28, '#0a0c16'); ctx.globalAlpha = 1;   // 안내 메시지 줄(48~66)과 겹치지 않게 아래쪽
    hypeFillPat(hypeStripe('tape', 8, 4), T * 60, 0, 72, W, 4, 8); hypeFillPat(hypeStripe('tape', 8, 4), -T * 60, 0, 100, W, 4, 8);
    var pop = popScale(bt), sh = bt < 0.4 ? (Math.random() - 0.5) * 2 : 0;
    ctx.save(); ctx.translate(160 + sh, 85); ctx.rotate(-0.04); ctx.scale(pop, pop); juiceText(info[0], 0, 0, 18, info[1], '#11152a'); ctx.restore();
    txt(info[2], 160, 97.5, 6, '#ffffff', 'center');
    ctx.restore();
  }
}
