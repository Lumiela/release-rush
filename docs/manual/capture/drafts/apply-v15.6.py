# #59 (v15.6): 「급박한 3분」 시안(#58) 적용 + 10콤보부터 콤보마다 점점 커지는 콤보 이펙트
import os
H = os.path.dirname(os.path.abspath(__file__))
P = r'C:/Users/PHANTOM/Desktop/2026 11 09 mini-game/game/release-rush.html'
s = open(P, encoding='utf-8').read()
hype = open(os.path.join(H, 'hype.js'), encoding='utf-8').read()
combo = open(os.path.join(H, 'combo.js'), encoding='utf-8').read()
def rep(s, a, b):
    assert s.count(a) == 1, a[:70]
    return s.replace(a, b, 1)

# 시안 → 본편: 머리 주석, 패턴 · 테두리도 미리 준비
hype = rep(hype, "// [시안 #58] 급박한 3분: 움직이는 층별 배경 + 남은 시간 긴장 단계 + 성공에 반응하는 배경",
           "// #59 급박한 3분 (#58 시안 적용): 움직이는 층별 배경 + 남은 시간 긴장 단계 + 성공에 반응하는 배경")
hype = rep(hype, "  for (var n = 1; n <= 5; n++) juiceSprite(String(n), 46, '#ff3b3b', '#11152a');\n}",
           "  for (var n = 1; n <= 5; n++) juiceSprite(String(n), 46, '#ff3b3b', '#11152a');\n"
           "  for (var k in HYPE_COL) hypeStripe(HYPE_COL[k][0], 16, 4);   // 무늬 · 붉은 테두리도 미리 (처음 쓸 때 멈추지 않게)\n"
           "  hypeStripe('#ff3b3b', 16, 4); hypeStripe('tape', 8, 4); hypeVignette('rgba(255,30,40,A)');\n}")
hype = hype.replace("HYPE = { g:null, lv:0, shown:{}, banner:null, sec:-1, secPulse:0, kick:0, lastFlash:0, clockT:false, warm:false };",
                    "HYPE = { g:null, lv:0, shown:{}, banner:null, sec:-1, secPulse:0, kick:0, lastFlash:0, clockT:false, warm:false };   // clockT: 점검용 캡처에서 박자를 게임 시간으로")

s = rep(s, "function drawPlayRest(px, pw){", combo + "\n" + hype + "\nfunction drawPlayRest(px, pw){")
# 성공 이펙트(JUICE)에 콤보 표시 추가
s = rep(s, "  scoreFlash:0, coinFlash:0, edge:0, edgePerf:false, punch:0, punchX:160, punchY:150, streak:0 };",
           "  scoreFlash:0, coinFlash:0, edge:0, edgePerf:false, punch:0, punchX:160, punchY:150, streak:0, comboRun:null };")
s = rep(s, "  if (G.combo > 0 && G.combo % 10 === 0) { JUICE.combo = { n:G.combo, t:0 }; juiceConfetti(40); fx.shake = Math.max(fx.shake, 0.18); }\n"
           "  else if (G.combo > 0 && G.combo % 5 === 0) JUICE.comboTick = { n:G.combo, t:0 };",
           "  // #59 10마다 큰 배너(콤보가 클수록 크게), 그 사이 10콤보부터는 콤보마다 점점 커지는 「N COMBO!」\n"
           "  if (G.combo > 0 && G.combo % 10 === 0) { var heat = comboHeat(G.combo); JUICE.combo = { n:G.combo, t:0 }; JUICE.comboRun = null; juiceConfetti(40 + Math.round(heat * 40)); fx.shake = Math.max(fx.shake, 0.18 + heat * 0.15); }\n"
           "  else if (G.combo > 10) comboRunStart(G.combo);\n"
           "  else if (G.combo > 0 && G.combo % 5 === 0) JUICE.comboTick = { n:G.combo, t:0 };")
s = rep(s, "function juiceMiss(){ JUICE.streak = 0; }", "function juiceMiss(){ JUICE.streak = 0; JUICE.comboRun = null; }")
s = rep(s, "  ['combo', 'streakBanner', 'comboTick'].forEach(function(k){ var o = JUICE[k]; if (o) { o.t += dt; if (o.t > (k === 'comboTick' ? 0.6 : 1)) JUICE[k] = null; } });",
           "  ['combo', 'streakBanner', 'comboTick', 'comboRun'].forEach(function(k){ var o = JUICE[k]; if (o) { o.t += dt; if (o.t > (k === 'comboTick' ? 0.6 : (k === 'comboRun' ? 0.7 : 1))) JUICE[k] = null; } });")
s = rep(s, "  var big = JUICE.combo || JUICE.streakBanner;", "  comboRunDraw();   // #59 10콤보부터 콤보마다\n  var big = JUICE.combo || JUICE.streakBanner;")
s = rep(s, "pop = popScale(t) * 1.05, isCombo = big === JUICE.combo;",
           "isCombo = big === JUICE.combo, pop = popScale(t) * 1.05 * (isCombo ? 1 + comboHeat(big.n) * 0.5 : 1);   // #59 콤보가 클수록 큰 배너")
s = rep(s, "  if (JUICE_WARM) return; JUICE_WARM = true;\n",
           "  if (JUICE_WARM) return; JUICE_WARM = true;\n  comboWarm(); hypeWarm();   // #59 콤보 · 긴장 연출 글자 이미지와 무늬도 미리\n")
# 게임 루프에 연결
s = rep(s, "  juiceUpdate(dt);   // #57\n", "  juiceUpdate(dt);   // #57\n  hypeUpdate(dt);   // #59 긴장 단계 · 경고 띠\n")
s = rep(s, "  drawBg(bgKey, scene === 'play');\n", "  drawBg(bgKey, scene === 'play');\n  if (scene === 'play' && G) hypeBack(bgKey);   // #59 움직이는 층별 배경 · 남은 시간 색\n")
s = rep(s, "  juiceDraw();   // #57 성공 이펙트\n", "  hypeFront();   // #59 붉은 테두리 · 경고 테이프 · 타이머 · 카운트다운 · 경고 띠\n  juiceDraw();   // #57 성공 이펙트\n")
# 점검용 훅
s = rep(s, "  get demo(){ return demoActive; }, startDemo:startDemo,",
           "  get demo(){ return demoActive; }, startDemo:startDemo,\n  HYPE:HYPE, JUICE:JUICE, hypeLevel:hypeLevel,   // #59 캡처용")
open(P, 'w', encoding='utf-8').write(s)
print('applied')
