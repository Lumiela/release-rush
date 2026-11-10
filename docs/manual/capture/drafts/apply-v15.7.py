# #60 (v15.7): 피버도 콤보로 — A. 피버(그로기 포함)가 끝나면 연타 10회마다 +1콤보 / B. 피버 중 HIT 숫자도 단계별로 커지고 화려하게
P = r'C:/Users/PHANTOM/Desktop/2026 11 09 mini-game/game/release-rush.html'
s = open(P, encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b, 1)

# ---------- A. 피버 끝 콤보 보너스 ----------
rep("function endFever(){\n  G.feverT = 0; G.fever = 0;\n",
    "// #60 피버 · 그로기가 끝나면 연타 10회마다 +1콤보 (연타 수를 그대로 콤보로 세면 피버 한 번에 150콤보가 되어 콤보 단계가 무의미해짐)\n"
    "var FEVER_COMBO_PER = 10;\n"
    "function feverComboBonus(){\n"
    "  var n = Math.floor(G.feverPresses / FEVER_COMBO_PER); if (n <= 0) return 0;\n"
    "  G.combo += n; if (G.combo > G.maxCombo) G.maxCombo = G.combo;\n"
    "  JUICE.feverBonus = { n:n, t:0 };\n"
    "  if (G.combo > 10) comboRunStart(G.combo); else JUICE.comboTick = { n:G.combo, t:0 };\n"
    "  juiceConfetti(30); sfx('clear');\n"
    "  return n;\n"
    "}\n"
    "function endFever(){\n  var bonus = feverComboBonus();   // #60\n  G.feverT = 0; G.fever = 0;\n")
rep("showMsg('그로기 종료! 연타 ' + G.feverPresses + '회 · 남은 체력 '",
    "showMsg('그로기 종료! 연타 ' + G.feverPresses + '회' + (bonus ? ' · +' + bonus + '콤보' : '') + ' · 남은 체력 '")
rep("showMsg('피버 종료! 연타 ' + G.feverPresses + '회 +' + fmt(G.feverGain) + '점', '#ff8ad8', 1.4);",
    "showMsg('피버 종료! 연타 ' + G.feverPresses + '회 +' + fmt(G.feverGain) + '점' + (bonus ? ' · +' + bonus + '콤보' : ''), '#ff8ad8', 1.4);")

# ---------- B. 연타마다 HIT 숫자 튐 + 단계 도달 번쩍 ----------
rep("  addScore('mash', pts); G.feverGain += pts; G.feverSum += pts; G.feverPresses++; G.feverPressTotal++;\n",
    "  addScore('mash', pts); G.feverGain += pts; G.feverSum += pts; G.feverPresses++; G.feverPressTotal++;\n"
    "  JUICE.hitPop = 1;   // #60 HIT 숫자가 튐\n"
    "  if (FEVER_HIT_STEP.indexOf(G.feverPresses) >= 0) { fx.flash = Math.max(fx.flash, 0.35); fx.flashColor = '#ffd84a'; juiceConfetti(18); }   // 30 · 60 · 100 · 150 HIT 도달\n")
rep("  scoreFlash:0, coinFlash:0, edge:0, edgePerf:false, punch:0, punchX:160, punchY:150, streak:0, comboRun:null };",
    "  scoreFlash:0, coinFlash:0, edge:0, edgePerf:false, punch:0, punchX:160, punchY:150, streak:0, comboRun:null, feverBonus:null, hitPop:0 };")
rep("  ['combo', 'streakBanner', 'comboTick', 'comboRun'].forEach(function(k){ var o = JUICE[k]; if (o) { o.t += dt; if (o.t > (k === 'comboTick' ? 0.6 : (k === 'comboRun' ? 0.7 : 1))) JUICE[k] = null; } });",
    "  ['combo', 'streakBanner', 'comboTick', 'comboRun', 'feverBonus'].forEach(function(k){ var o = JUICE[k]; if (o) { o.t += dt; if (o.t > (k === 'comboTick' ? 0.6 : (k === 'comboRun' ? 0.7 : (k === 'feverBonus' ? 1.3 : 1)))) JUICE[k] = null; } });\n"
    "  JUICE.hitPop = Math.max(0, JUICE.hitPop - dt * 6);")

# 글자 함수: 뒤에 붙는 단어를 고를 수 있게 (COMBO! · HIT)
rep("function juiceComboText(n, col){", "function juiceComboText(n, col, word0){")
rep("  var word = juiceSprite('COMBO!', 20, col, '#11152a'); w += word.cw + 1;",
    "  var word = juiceSprite(word0 || 'COMBO!', 20, col, '#11152a'); w += word.cw + 1;")

# 피버 HIT 단계 연출 함수 + 피버 끝 보너스 배너 그리기
rep("function comboWarm(){",
"""// #60 피버 중 HIT 숫자: 연타가 쌓일수록 크고 화려하게 (150 HIT에서 최대)
//   30~ 집중선 · HOT! / 60~ 가시 폭발 · ON FIRE! / 100~ 무지개 글자 · BURNING! / 150~ MAX POWER!
var FEVER_HIT_STEP = [30, 60, 100, 150];
var FEVER_HIT_LABEL = [[150, 'MAX POWER!'], [100, 'BURNING!'], [60, 'ON FIRE!'], [30, 'HOT!']];
function feverHitDraw(x, y, small){
  var n = G.feverPresses, I = Math.min(1, n / 150), pop = JUICE.hitPop, i;
  ctx.save(); ctx.translate(x, y);
  if (n >= 30) {   // 집중선
    var nR = 8 + Math.round(I * 22), L = (small ? 24 : 34) + I * (small ? 20 : 60);
    ctx.globalAlpha = 0.2 + I * 0.3; ctx.lineWidth = 1;
    for (var cc = 0; cc < 5; cc++) {
      ctx.strokeStyle = RAINBOW[cc]; ctx.beginPath();
      for (i = cc; i < nR; i += 5) { var an = i / nR * Math.PI * 2 + T * 2, r0 = 9 + hash(i + n) * 4;
        ctx.moveTo(Math.cos(an) * r0 * 2, Math.sin(an) * r0 * 0.5); ctx.lineTo(Math.cos(an) * L * 2, Math.sin(an) * L * 0.5); }
      ctx.stroke();
    }
  }
  if (n >= 60 && !small) {   // 가시 폭발 (띠 안에 들어가게 납작하게)
    var sp = 12 + Math.round(8 * I), R1 = (7 + 5 * I) * (1 + 0.2 * pop), R0 = R1 * 0.6;
    ctx.beginPath();
    for (var q = 0; q < sp * 2; q++) { var an2 = q / (sp * 2) * Math.PI * 2 - T * 2, rr = q % 2 ? R0 : R1 * (0.85 + hash(q + n) * 0.35), x2 = Math.cos(an2) * rr * 2.8, y2 = Math.sin(an2) * rr * 0.7; if (q) ctx.lineTo(x2, y2); else ctx.moveTo(x2, y2); }
    ctx.closePath(); ctx.globalAlpha = 0.9; ctx.fillStyle = '#11152a'; ctx.fill();
    ctx.globalAlpha = 1; ctx.lineJoin = 'miter'; ctx.lineWidth = 1.2 + I * 0.6; ctx.strokeStyle = RAINBOW[Math.floor(T * 12) % 5]; ctx.stroke();
  }
  var sc = (small ? 0.3 + 0.1 * I : 0.45 + 0.25 * I) * (1 + 0.22 * pop);
  ctx.globalAlpha = 1; ctx.rotate(n >= 100 ? Math.sin(T * 40) * 0.03 : 0); ctx.scale(sc, sc);
  juiceComboText(n, n >= 100 ? RAINBOW[Math.floor(T * 14) % 5] : (n >= 30 ? FLASH2[Math.floor(T * 10) % 2] : '#ffffff'), 'HIT');
  ctx.restore();
  if (!small) for (i = 0; i < FEVER_HIT_LABEL.length; i++) if (n >= FEVER_HIT_LABEL[i][0]) {
    ctx.save(); ctx.translate(x + 66, y - 2); ctx.rotate(-0.12); var ls = popScale(Math.max(0, (n - FEVER_HIT_LABEL[i][0]) * 0.05)); ctx.scale(ls, ls);
    juiceText(FEVER_HIT_LABEL[i][1], 0, 0, 7, '#ffd84a', '#11152a'); ctx.restore(); break;
  }
}
function feverBonusDraw(){   // 피버가 끝나는 순간 「FEVER BONUS +N COMBO」 (안내 메시지 줄 아래)
  var fb = JUICE.feverBonus; if (!fb) return;
  var t = fb.t, a = t > 1 ? Math.max(0, (1.3 - t) / 0.3) : 1, sc = popScale(t);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(160, 84); ctx.rotate(-0.05); ctx.scale(sc, sc);
  juiceText('FEVER BONUS', 0, -9, 8, '#ff4fd8', '#11152a');
  ctx.scale(0.55, 0.55); juiceComboText('+' + fb.n, FLASH2[Math.floor(T * 10) % 2]);
  ctx.restore(); ctx.globalAlpha = 1;
}
function comboWarm(){""")
rep("  COMBO_LABEL.forEach(function(L){ juiceSprite(L[1], 7, L[0] >= 30 ? '#ffd84a' : '#ffffff', '#11152a'); });",
    "  COMBO_LABEL.forEach(function(L){ juiceSprite(L[1], 7, L[0] >= 30 ? '#ffd84a' : '#ffffff', '#11152a'); });\n"
    "  // #60 피버 HIT · 보너스 글자\n"
    "  ['#ffffff'].concat(FLASH2, RAINBOW).forEach(function(c){ juiceSprite('HIT', 20, c, '#11152a'); juiceSprite('+', 20, c, '#11152a'); });\n"
    "  for (var d2 = 0; d2 < 10; d2++) juiceSprite(String(d2), 20, '#ffffff', '#11152a');\n"
    "  FEVER_HIT_LABEL.forEach(function(L){ juiceSprite(L[1], 7, '#ffd84a', '#11152a'); }); juiceSprite('FEVER BONUS', 8, '#ff4fd8', '#11152a');")
rep("  comboRunDraw();   // #59 10콤보부터 콤보마다\n", "  comboRunDraw();   // #59 10콤보부터 콤보마다\n  feverBonusDraw();   // #60 피버 끝 콤보 보너스\n")

# 피버 화면의 HIT 표시를 단계 연출로 교체
rep("    txt(G.feverPresses + ' HIT  ·  체력 −' + (Math.round(G.feverPresses * bossDamage() * 10) / 10), 132, 52, 7, '#ffffff', 'center');\n"
    "    txt('남은 ' + G.feverT.toFixed(1) + '초 · 제한 시간 정지 중', 132, 63, 5, '#ffd8a0', 'center');",
    "    feverHitDraw(132, 51, true);   // #60\n"
    "    txt('체력 −' + (Math.round(G.feverPresses * bossDamage() * 10) / 10) + ' · 남은 ' + G.feverT.toFixed(1) + '초 · 시간 정지', 132, 63, 5, '#ffd8a0', 'center');")
rep("    txt(G.feverPresses + ' HIT', 160, 46, 12, '#ffffff', 'center');",
    "    feverHitDraw(160, 46, false);   // #60 연타가 쌓일수록 크고 화려하게")
rep("+ '점 · 남은 ' + G.feverT.toFixed(1) + '초 · 제한 시간 정지 중', 160, 58, 5.5, '#ff8ad8', 'center');",
    "+ '점 · 남은 ' + G.feverT.toFixed(1) + '초 · 끝나면 연타 10회당 +1콤보', 160, 58.5, 5.5, '#ff8ad8', 'center');")
open(P, 'w', encoding='utf-8').write(s)
print('applied #60')
