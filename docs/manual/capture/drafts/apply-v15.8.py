# #64 (v15.8): 피버 · 그로기 동안 미니게임 패널 자리를 피버 패널로 (#63 시안) + 좌우 가시 줄이기 + 끝나면 0.4초 「다시 시작!」
import os
H = os.path.dirname(os.path.abspath(__file__))
P = r'C:/Users/PHANTOM/Desktop/2026 11 09 mini-game/game/release-rush.html'
s = open(P, encoding='utf-8').read()
fp = open(os.path.join(H, 'fp.js'), encoding='utf-8').read()
def rep(a, b, src=None):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b, 1)

# 1) 말풍선 테두리: 패널 모드에서는 좌우 가시 · 파편 · 별이 점수 · 코인 칸을 가리지 않게
rep("function drawFeverBurst(px, pw, gy, gh){", "function drawFeverBurst(px, pw, gy, gh, panel){   // panel: #64 패널 둘레 모드 (좌우를 짧게)")
rep("    if (e[3] === 1) len = tip ? Math.min(len, 3) : 0.5;   // 아래쪽(미니게임 글자)은 거의 평평하게\n",
    "    if (e[3] === 1) len = tip ? Math.min(len, 3) : 0.5;   // 아래쪽(미니게임 글자)은 거의 평평하게\n"
    "    if (panel && e[2] !== 0) len = tip ? Math.min(len, 3) : 0.5;   // #64 좌우(점수 · 코인 칸 쪽)도 거의 평평하게\n"
    "    if (panel && tip && (e[0] + u[0] * len < px || e[0] + u[0] * len > px + pw) && e[1] + u[1] * len > gy - 2) len = Math.min(len, 4);   // 모서리 가시가 옆 칸으로 들어가지 않게\n")
rep("      if (e2[3] === 1) continue;\n", "      if (e2[3] === 1 || (panel && e2[2] !== 0)) continue;\n")
rep("var e3 = edgePt(hash(s * 23 + cy2 * 3) * (2 * pw + gh - 4) - gh); if (e3[3] === 1) continue;",
    "var e3 = edgePt(hash(s * 23 + cy2 * 3) * (2 * pw + gh - 4) - gh); if (e3[3] === 1 || (panel && e3[2] !== 0)) continue;")

# 2) 피버 패널 함수 (#63 시안 → 본편)
fp = fp.replace("// [시안 #63] 피버 · 그로기 중에는 미니게임 패널 자리를 피버 패널로 바꿈 (시선이 머무는 곳에 지시)",
                "// #64 피버 · 그로기 중에는 미니게임 패널 자리를 피버 패널로 바꿈 (시선이 머무는 곳에 지시, #63 시안 · 유저 피드백)")
fp = fp.replace("drawFeverBurst(px, pw, gy, gh);   // #47 외침 말풍선 테두리를 패널 둘레로", "drawFeverBurst(px, pw, gy, gh, true);   // #47 외침 말풍선 테두리를 패널 둘레로 (좌우는 짧게)")
fp += """// #64 피버가 끝나면 0.4초 동안 「다시 시작!」 — 미니게임 · 시간이 멈춰 있고 입력은 무시 (연타하던 손으로 바로 미스하지 않게)
var RESUME_T = 0.4;
function drawResumeCue(px, pw){
  var t = RESUME_T - G.resumeT, a = G.resumeT < 0.1 ? G.resumeT / 0.1 : 1;
  ctx.globalAlpha = 0.55 * a; R(px, 124, pw, 52, '#05060c'); ctx.globalAlpha = a;
  boxBorder(px, 124, pw, 52, Math.floor(T * 16) % 2 ? '#3ef2ff' : '#ffffff');
  ctx.save(); ctx.translate(160, 148); var sc = popScale(t); ctx.scale(sc, sc); juiceText('다시 시작!', 0, 0, 12, '#3ef2ff', '#11152a'); ctx.restore();
  ctx.globalAlpha = 1;
}
"""
rep("function drawPlayRest(px, pw){", fp + "function drawPlayRest(px, pw){")

# 3) 패널 위 두꺼운 게이지 대신 → 패널 자리
rep("  } else if (fev) {\n    drawFeverGaugeHot(px, pw);   // 피버·그로기 중: 두꺼운 게이지 + 형광 강조\n",
    "  } else if (fev) {\n    // #64 피버 · 그로기 게이지는 패널 자리로 (drawPlayRest → drawFeverPanel). 예전 패널 위 두꺼운 게이지는 drawFeverGaugeHot에 남겨 둠\n")
a = s.index("  if (inFever() && G.groggy) {   // 그로기"); b = s.index("  if (inFever()) drawFeverAuraFront();")
s = s[:a] + "  if (inFever()) drawFeverPanel(px, pw);   // #64 위쪽 안내 띠 · 그로기 상자 대신 패널 자리에 (제목 · HIT · 남은 시간)\n  else if (G.resumeT > 0) drawResumeCue(px, pw);   // #64 피버 끝 「다시 시작!」\n" + s[b:]

# 4) 피버 끝 → 0.4초 멈춤 · 입력 무시
rep("function endFever(){\n  var bonus = feverComboBonus();   // #60\n", "function endFever(){\n  var bonus = feverComboBonus();   // #60\n  G.resumeT = RESUME_T;   // #64\n")
rep("    if (G.feverT > 0) { G.feverT -= dt; if (G.feverT <= 0) endFever(); return; }\n",
    "    if (G.feverT > 0) { G.feverT -= dt; if (G.feverT <= 0) endFever(); return; }\n    if (G.resumeT > 0) { G.resumeT -= dt; return; }   // #64 「다시 시작!」 동안 미니게임 · 제한 시간 정지\n")
rep("G.banner <= 0 && G.clearing <= 0 && !G.finished && !inFever(); }", "G.banner <= 0 && G.clearing <= 0 && !G.finished && !inFever() && !(G.resumeT > 0); }")
# 5) 글자 이미지 미리
rep("juiceSprite('FEVER BONUS', 8, '#ff4fd8', '#11152a');", "juiceSprite('FEVER BONUS', 8, '#ff4fd8', '#11152a'); juiceSprite('다시 시작!', 12, '#3ef2ff', '#11152a');   // #64")
open(P, 'w', encoding='utf-8').write(s)
print('applied #64')
