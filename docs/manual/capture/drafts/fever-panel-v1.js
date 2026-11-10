// [시안 #63] 피버 · 그로기 중에는 미니게임 패널 자리를 피버 패널로 바꿈 (시선이 머무는 곳에 지시)
//   위쪽 안내 띠 · 그로기 상자와 패널 위 게이지를 없애고, 패널 안에 제목 · HIT · 남은 시간 게이지를 모음
function drawFeverPanel(px, pw){
  var gro = G.groggy, dur = gro ? groggyDuration() : feverDuration();
  var ratio = Math.max(0, Math.min(1, G.feverT / dur)), el = dur - G.feverT;
  var ease = 1 - Math.pow(1 - Math.min(1, el / 0.18), 3);          // 시작 0.18초 동안 패널이 살짝 커지며 등장
  var hot = feverHot(), edge = hot[Math.floor(T * 6) % 2], pulse = 0.5 + 0.5 * Math.sin(T * 12);
  var gy = 124 - Math.round(3 * ease), gh = 52 + Math.round(3 * ease);
  drawFeverBurst(px, pw, gy, gh);   // #47 외침 말풍선 테두리를 패널 둘레로
  for (var k = 3; k >= 1; k--) { ctx.globalAlpha = (0.42 - k * 0.11) * (0.55 + 0.45 * pulse); R(px - k, gy - k, pw + k * 2, gh + k * 2, edge); }
  ctx.globalAlpha = 1;
  R(px, gy, pw, gh, gro ? '#1a1406' : '#1a0820');
  // 제목
  txt(gro ? 'GROGGY! 아무 키나 연타!' : 'FEVER TIME! 아무 키나 연타!', 160, gy + 8, 8, pulse > 0.5 ? hot[0] : hot[2], 'center');
  // HIT (#60 단계 연출, 패널 안에 맞게 0.8배)
  ctx.save(); ctx.translate(160, gy + 22); ctx.scale(0.8, 0.8); feverHitDraw(0, 0, false); ctx.restore();
  // 안내 한 줄
  txt('제한 시간 정지 · 끝나면 연타 10회당 +1콤보', 160, gy + gh - 18, 5, '#ff8ad8', 'center');
  // 남은 시간 게이지 (줄어듦)
  var bx = px + 6, bw = pw - 12, by = gy + gh - 13, bh = 9, fw = Math.max(0, Math.round((bw - 2) * ratio));
  R(bx, by, bw, bh, '#0b0f1e');
  R(bx + 1, by + 1, fw, bh - 2, gro ? '#e0a020' : '#e03fc0');
  if (fw > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(bx + 1, by + 1, fw, bh - 2); ctx.clip();
    ctx.globalAlpha = 0.28; ctx.fillStyle = hypeStripe('#ffffff', 10, 4); ctx.translate((T * 36) % 10, 0); ctx.fillRect(bx - 10, by, fw + 20, bh); ctx.restore();
    ctx.globalAlpha = 0.5; R(bx + 1, by + 1, fw, 2, hot[2]); ctx.globalAlpha = 1;
    R(bx + fw, by - 1, 2, bh + 2, '#ffffff');
  }
  boxBorder(bx, by, bw, bh, edge);
  var sub = gro ? '체력 −' + (Math.round(G.feverPresses * bossDamage() * 10) / 10) : '+' + fmt(G.feverGain) + '점';
  txt(sub, bx + 4.5, by + bh / 2 + 0.9, 5.5, '#000000'); txt(sub, bx + 4, by + bh / 2 + 0.3, 5.5, '#ffffff');
  txt(G.feverT.toFixed(1) + '초', bx + bw - 3.5, by + bh / 2 + 0.9, 5.5, '#000000', 'right'); txt(G.feverT.toFixed(1) + '초', bx + bw - 4, by + bh / 2 + 0.3, 5.5, '#ffffff', 'right');
  boxBorder(px, gy, pw, gh, edge);
}
