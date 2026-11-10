// Injected into the game page. Drives the game deterministically through window.__RR
// and reports "capture keys" for moments worth screenshotting.
window.BOT = (function () {
  var R = window.__RR;
  R.freeze(true);
  var seen = {}, mode = 'good', NAME = '신입개발자';
  var task = null, taskAge = 0, cool = 0, readyAge = 0, feverAge = 0, flipAge = 0, rlAge = 0, endAge = 0, missed = null;
  var feverHit = 0, tallyAge = 0, bannerAge = 0;
  function sc() { return R.scene; }
  function ctxKey(G) { return G.isBoss ? 'boss' : (G.isMid ? G.midKind : 'L' + G.layer); }
  function describe(dt) {
    var s = sc(), G = R.G;
    if (s === 'idle') return 'idle';
    if (s === 'nickname') { var inp = document.getElementById('nick'); if (inp && inp.value === NAME) return 'nickname'; return null; }
    if (s === 'pick') return R.choice ? 'pick-' + R.choice.ctx : null;
    if (s === 'route') return 'route';
    if (s === 'itempick') return 'itempick';
    if (s === 'shop') return 'shop';
    if (s === 'mystery') return R.EV.picked < 0 ? 'mystery' : (flipAge > 1.4 ? 'mystery-open' : null);
    if (s === 'roulette') return R.RL.revealed ? (rlAge > 0.9 ? 'roulette' : null) : null;
    if (s === 'launch') return null; // handled in tick with time checks
    if (s === 'ending') return (R.END && R.END.shown >= R.END.rows.length && endAge > 1.2) ? 'ending-' + (G.cleared ? 'clear' : 'fail') : null;
    if (s === 'result') return (R.fade.a === 0 && !R.fade.dir) ? 'result-' + (G.cleared ? 'clear' : 'fail') : null;
    if (s === 'play' && G) {
      if (G.paused) return 'pause';
      if (G.ready) return readyAge > 1.0 ? 'ready-' + (G.isBoss ? 'boss' : G.isMid ? G.midKind : G.stages[G.layer]) : null;
      if (G.tally) return (G.tally.done && tallyAge > 0.6) ? (G.tally.kind === 'boss' ? 'tally-boss' : 'tally') : null;
      if (G.feverT > 0) return feverAge > 0.7 ? (G.groggy ? 'groggy' : 'fever') : null;
      if (G.banner > 0) return bannerAge > 0.5 ? 'banner-' + ctxKey(G) : null;
      if (missed && missed.age > 0.12 && missed.age < 0.5) return 'miss';
      if (G.task && G.clearing <= 0) {
        var t = G.task, need = t.mg === 'charge' ? 0.75 : (t.mg === 'mole' || t.mg === 'alert' ? 0.9 : 0.6);
        if (t.mg === 'mole' && t.state !== 'show') return null;
        if (t.mg === 'sort' && t.el < 0.4) return null;
        if (taskAge < need) return null;
        if (G.isBoss) return 'boss-' + t.mg;
        if (G.isMid) return G.midKind + '-' + t.mg;
        return 'task-' + t.mg;
      }
    }
    return null;
  }
  function act(dt) {
    var s = sc(), G = R.G;
    if (cool > 0) { cool -= dt; return; }
    if (s === 'idle') { R.key('Enter'); cool = 0.6; return; }
    if (s === 'nickname') {
      var inp = document.getElementById('nick');
      if (inp && inp.value !== NAME) { inp.value = NAME; return; }
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true })); cool = 0.6; return;
    }
    if (s === 'pick') { if (R.scene && window.__RR) { R.key('Digit' + (1 + Math.floor(Math.random() * R.choice.offers.length))); cool = 0.5; } return; }
    if (s === 'route') { R.key(mode === 'fail' || mode === 'safe' ? 'Digit1' : 'Digit2'); cool = 0.5; return; }   // safe: 출시 화면 캡처용(안전 루트)
    if (s === 'itempick') { R.key('Digit' + (1 + Math.floor(Math.random() * 3))); cool = 0.5; return; }
    if (s === 'shop') { R.key('Enter'); cool = 0.5; return; }
    if (s === 'mystery') { if (R.EV.picked < 0) { R.key('Digit2'); cool = 0.3; } else if (flipAge > 1.6) { R.key('Enter'); cool = 0.5; } return; }
    if (s === 'roulette') { if (R.RL.revealed && rlAge > 1.0) { R.key('Enter'); cool = 0.5; } return; }
    if (s === 'launch') { if (R.LC && R.LC.t > 7) { R.key('Enter'); cool = 0.6; } return; }
    if (s === 'ending') { if (R.END && R.END.shown >= R.END.rows.length && endAge > 1.3) { R.key('Enter'); cool = 0.6; } return; }
    if (s === 'play' && G) {
      if (G.paused) { R.key('Space'); cool = 0.2; return; }
      if (G.ready) { if (readyAge > 1.1) { R.key('Space'); cool = 0.3; } return; }
      if (G.tally) { if (G.tally.done && tallyAge > 0.7) { R.key('Enter'); cool = 0.3; } return; }
      if (G.feverT > 0) { R.key('Space'); cool = 0.07; return; }
      if (G.task && G.clearing <= 0 && G.banner <= 0) {
        var t = G.task;
        // pause screen once, during the 2nd layer
        if (!seen.pause && G.layer === 1 && !G.isMid && taskAge > 0.3) { R.key('Escape'); cool = 0.2; return; }
        if (t.mg === 'charge' && !t.hold && taskAge > 0.15 && taskAge < 0.7 && t.lock <= 0) { R.input('Space'); return; }
        var need = t.mg === 'charge' ? 0.8 : (t.mg === 'mole' || t.mg === 'alert' ? 0.95 : 0.65);
        if (t.mg === 'mole' && t.state !== 'show') return;
        if (t.mg === 'sort' && t.el < 0.45) return;
        if (taskAge < need) return;
        var failNow = mode === 'fail' && (G.layer >= 1 || G.isMid);
        if (failNow) {
          var wrong = { timing: 'Space', command: 'ArrowUp', alert: 'Space', sort: 'ArrowUp', charge: 'Space', mole: 'ArrowUp' }[t.mg];
          if (t.mg === 'timing') { t.cur = (R.mg.zoneCenter(t) + 0.5) % 1; }
          if (t.mg === 'alert') { t.state = 'wait'; }
          if (t.mg === 'charge') { t.hold = false; }
          R.input(wrong); if (t.mg === 'charge') R.keyup('Space');
          missed = { age: 0 }; cool = 0.9; return;
        }
        R.cheat(); cool = 0.12; return;
      }
    }
  }
  function track(dt) {
    var s = sc(), G = R.G;
    var t = G && G.task;
    if (t !== task) { task = t; taskAge = 0; } else taskAge += dt;
    readyAge = (s === 'play' && G && G.ready) ? readyAge + dt : 0;
    feverAge = (s === 'play' && G && G.feverT > 0) ? feverAge + dt : 0;
    tallyAge = (s === 'play' && G && G.tally) ? tallyAge + dt : 0;
    bannerAge = (s === 'play' && G && G.banner > 0) ? bannerAge + dt : 0;
    flipAge = (s === 'mystery' && R.EV && R.EV.picked >= 0) ? flipAge + dt : 0;
    rlAge = (s === 'roulette' && R.RL && R.RL.revealed) ? rlAge + dt : 0;
    endAge = (s === 'ending' && R.END && R.END.shown >= R.END.rows.length) ? endAge + dt : 0;
    if (missed) { missed.age += dt; if (missed.age > 0.6) missed = null; }
  }
  var sceneClock = 0, lastScene = null;
  return {
    setup: function (opts) { seen = opts.seen || {}; mode = opts.mode || 'good'; if (opts.name) NAME = opts.name; },
    mark: function (k) { seen[k] = 1; },
    // run up to `limit` seconds of game time; stop early on a fresh capture key or when finished
    tick: function (limit) {
      var dt = 1 / 30, el = 0;
      while (el < limit) {
        R.step(dt); el += dt; sceneClock += dt; track(dt);
        if (sc() !== lastScene) { lastScene = sc(); sceneClock = 0; }
        var s = sc(), G = R.G;
        if (s === 'launch' && R.LC) {
          var lk = 'launch-' + (G.cleared ? 'clear' : 'fail');
          if (!seen[lk + '-a'] && R.LC.t > 0.9) return { cap: lk + '-a' };
          if (!seen[lk + '-b'] && R.LC.t > 2.6) return { cap: lk + '-b' };
        }
        if (s === 'result' && sceneClock > 3.5 && seen['result-' + (G.cleared ? 'clear' : 'fail')]) return { done: true, score: G.score, cleared: G.cleared };
        if (s === 'result' && sceneClock > 8) return { done: true, stuck: true, fade: [R.fade.a, R.fade.dir, R.fade.hold] };
        if (s === 'result' && sceneClock < 3.5) continue;
        if ((s === 'pick' || s === 'route' || s === 'itempick' || s === 'shop' || s === 'mystery' || s === 'idle') && sceneClock < 1.3) continue;
        var k = describe(dt);
        if (k && !seen[k]) return { cap: k, scene: s };
        act(dt);
      }
      return { scene: sc(), layer: R.G && R.G.layer, time: R.G && R.G.time };
    }
  };
})();
