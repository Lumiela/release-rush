// 난이도 점검용 사람 흉내 봇 (게임 안에 넣어 한 판을 화면 없이 끝까지 돌림)
// 반응 · 실수 모델은 게임의 데모 봇(demoTick)을 그대로 따른 '보통'과, 반응 0.6배 · 실수 절반인 '숙련' 두 가지.
// 루트는 정책으로 고정(safe: 모두 검증된 방식, risk: 모두 신기술). 카드 · 아이템은 봇 난수로 고르고 상점은 그냥 나감.
window.SIM = (function () {
  var R = window.__RR;
  var PROFILES = {
    normal: { react: 1, err: 1, mashGap: [0.09, 0.15] },
    skilled: { react: 0.6, err: 0.5, mashGap: [0.07, 0.1] }
  };
  function run(opts) {
    var P = Object.assign({}, PROFILES[opts.profile || 'normal']), policy = opts.policy || 'safe';
    if (opts.mash) P.mashGap = [0.85 / opts.mash, 1.15 / opts.mash];   // 초당 연타 횟수 지정 (사람 실측에 맞춤, #41 보정)
    var s = (opts.seed || 1) * 7919 + 13;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    R.freeze(true);
    var dt = 1 / 60, clock = 0, sceneClock = 0, lastScene = null, cool = 0, wait = 0;
    var aim = null, react = null, think = null, mashT = 0;
    var M = { layerTasks: [], layerTime: [], timeAtBoss: null, bossHpMax: null, riskTasksSeen: [] };
    var layerStartT = null, curLayer = -1;
    for (var n = 0; n < 60 * 600; n++) {
      R.upd(dt); clock += dt;
      var sc = R.scene, G = R.G;
      if (sc !== lastScene) { lastScene = sc; sceneClock = 0; cool = 0.15; } else sceneClock += dt;
      if (cool > 0) { cool -= dt; continue; }
      if (sc === 'result') {
        var r = G.record;
        return { cleared: !!G.cleared, score: r ? r.score : Math.round(G.score), stage: G.maxStage, reachedBoss: !!G.reachedBoss,
          bossHpLeft: G.reachedBoss ? Math.ceil(G.bossHp) : null, bossHpMax: M.bossHpMax, groggy: G.groggyCount, mistakes: G.mistakes,
          routes: G.routes.join(''), book: { mg: Math.round(G.book.mg), mash: Math.round(G.book.mash), settle: Math.round(G.book.settle), luck: Math.round(G.book.luck) }, party: (G.owned && G.owned.party) || 0, left: G.leftAtClear != null ? G.leftAtClear : null, riskCount: G.riskCount, layerTasks: M.layerTasks, layerTime: M.layerTime, timeAtBoss: M.timeAtBoss, playTime: Math.round(G.playTime) };
      }
      if (sc === 'idle') { R.key('Enter'); cool = 0.5; continue; }
      if (sc === 'nickname') { var inp = document.getElementById('nick'); if (inp) { inp.value = 'SIM'; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true })); } cool = 0.5; continue; }
      if (sc === 'pick') { if (sceneClock > 0.8) { R.key('Digit' + (1 + Math.floor(rnd() * R.choice.offers.length))); cool = 0.5; } continue; }
      if (sc === 'route') { if (sceneClock > 0.8) { R.key(policy === 'risk' ? 'Digit2' : 'Digit1'); cool = 0.5; } continue; }
      if (sc === 'itempick') { if (sceneClock > 0.8) { R.key('Digit' + (1 + Math.floor(rnd() * 3))); cool = 0.5; } continue; }
      if (sc === 'mystery') { if (sceneClock > 0.8) { R.key(R.EV.picked < 0 ? 'Digit' + (1 + Math.floor(rnd() * 3)) : 'Enter'); cool = 0.6; } continue; }
      if (sc === 'shop') { if (sceneClock > 0.8) { R.key('Enter'); cool = 0.5; } continue; }
      if (sc === 'roulette') { if (R.RL.revealed) { R.key('Enter'); cool = 0.5; } continue; }
      if (sc === 'launch') continue;
      if (sc === 'ending') { if (R.END && R.END.shown >= R.END.rows.length && sceneClock > 1) { R.key('Enter'); cool = 1; } continue; }
      if (sc !== 'play' || !G) continue;
      if (G.paused) { R.key('Space'); cool = 0.1; continue; }
      if (G.ready) {
        if (sceneClock > 0.3) { R.key('Space'); cool = 0.2; }
        // 층 기록: 룰 카드가 뜬 층의 작업 수 · 시작 시각
        if (!G.isMid && !G.isBoss && G.layer !== curLayer) { curLayer = G.layer; M.layerTasks[G.layer] = G.total - G.pre; layerStartT = G.time; }
        if (G.isBoss && M.timeAtBoss == null) { M.timeAtBoss = Math.round(G.time * 10) / 10; M.bossHpMax = G.bossHpMax || 180; if (curLayer >= 0 && M.layerTime[curLayer] == null) M.layerTime[curLayer] = null; }
        continue;
      }
      if (G.tally) { if (G.tally.done && sceneClock > 0.3) { R.key('Enter'); cool = 0.3; } if (!G.isMid && !G.isBoss && layerStartT != null && M.layerTime[G.layer] == null) M.layerTime[G.layer] = Math.round((layerStartT - G.time) * 10) / 10; continue; }
      if (G.feverT > 0) { mashT -= dt; if (mashT <= 0) { R.key('Space'); mashT = P.mashGap[0] + rnd() * (P.mashGap[1] - P.mashGap[0]); } continue; }
      var t = G.task; if (!t || G.banner > 0 || G.clearing > 0 || G.finished) continue;
      if (wait > 0) { wait -= dt; continue; }
      if (t.mg === 'timing') {
        if (t.lock > 0) continue;
        var half = R.mg.zoneWidth(t) / 2, dist = Math.abs(t.cur - R.mg.zoneCenter(t));
        if (aim == null) aim = rnd() < 0.5 ? half * 0.25 : half * 0.85;
        if (dist <= aim) { R.input('Space'); aim = null; wait = 0.3 * P.react; }
        else if (rnd() < 0.004 * P.err) { R.input('Space'); aim = null; wait = 0.4; }
      } else if (t.mg === 'command') {
        var a = t.arrows[t.progress]; if (!a) continue;
        var OPP = [2, 3, 0, 1], CODES = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
        var expect = a.type === 'rev' ? OPP[a.dir] : a.dir;
        if (rnd() < 0.07 * P.err) { R.input(CODES[(expect + 1 + Math.floor(rnd() * 3)) % 4]); wait = 0.55; continue; }
        R.input(CODES[expect]);
        wait = (0.22 + rnd() * 0.2 + (a.type === 'rev' ? 0.3 : 0) + (a.type === 'hid' ? 0.25 : 0)) * P.react;
      } else if (t.mg === 'alert') {
        if (t.state === 'go') { if (react == null) react = (0.12 + rnd() * 0.22) * P.react; if (t.goT >= react) { R.input('Space'); react = null; wait = 0.2; } }
        else if (rnd() < 0.0015 * P.err) { R.input('Space'); wait = 0.4; }
      } else if (t.mg === 'sort') {
        if (think == null) think = (0.25 + rnd() * 0.45) * P.react;
        if (t.el >= think) { var ok = t.card === 'ok'; if (rnd() < 0.08 * P.err) ok = !ok; R.input(ok ? 'ArrowRight' : 'ArrowLeft'); think = null; wait = 0.15; }
      } else if (t.mg === 'charge') {
        if (!t.hold) { if (t.lock <= 0) { R.input('Space'); aim = t.zc + (rnd() - 0.5) * t.zone * 1.1 * P.err; } }
        else if (t.g >= aim) { R.keyup('Space'); aim = null; wait = 0.25; }
      } else if (t.mg === 'mole') {
        if (t.state === 'show') {
          if (react == null) react = (0.25 + rnd() * 0.2) * P.react;
          if (t.el >= react) { if (!t.trap || rnd() < 0.1 * P.err) R.input(['ArrowLeft', 'ArrowDown', 'ArrowRight'][rnd() < 0.06 * P.err ? Math.floor(rnd() * 3) : t.lane]); react = null; wait = t.trap ? 0.6 : 0.15; }
        }
      }
    }
    return { error: 'timeout', scene: R.scene };
  }
  return { run: run };
})();
