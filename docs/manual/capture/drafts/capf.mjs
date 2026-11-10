// [피버] 지정한 층(LAYER: 0 기획 · 1 개발 · 2 QA · 3 보스)까지 봇으로 간 뒤 남은 시간을 TIME으로 맞추고 1/15초마다 화면을 찍음
// node caph.mjs <게임.html> <출력폴더> <LAYER> <TIME> [프레임 수=60] [콤보=0] [연속퍼펙트=0]
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const [FILE, OUT, LAYER, TIME, N, COMBO, STREAK] = [process.argv[2], process.argv[3], +process.argv[4], +process.argv[5], +(process.argv[6] || 60), +(process.argv[7] || 0), +(process.argv[8] || 0)];
fs.mkdirSync(OUT, { recursive: true });
const PORT = 9700 + Math.floor(Math.random() * 200), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'rr-h-'));
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--window-size=1600,900', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let u;
for (let i = 0; i < 50 && !u; i++) { await sleep(200); try { u = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} }
const ws = new WebSocket(u); await new Promise(r => ws.addEventListener('open', r)); let id = 0; const pend = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value; };
await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'file:///' + FILE.split(path.sep).join('/') + '?seed=' + (process.env.SEED || 7) }); await sleep(900);
await ev(fs.readFileSync(path.join(HERE, '..', 'bot.js'), 'utf8') + '; BOT.setup({mode:"good",seen:{}}); 1');
const ready = `(function(){ var G = __RR.G; return !!(G && __RR.scene === 'play' && G.layer === ${LAYER} && G.task && !G.ready && !G.tally && !G.isMid && !(G.banner > 0) && !(G.clearing > 0) && !(G.feverT > 0)); })()`;
let ok = false;
for (let n = 0; n < 6000 && !ok; n++) {
  const r = await ev('BOT.tick(0.1)');
  if (r.cap) await ev(`BOT.mark(${JSON.stringify(r.cap)})`);
  if (r.done) break;
  ok = await ev(ready);
}
if (!ok) { console.log('layer not reached'); process.exit(1); }
await ev(`(function(){ var G = __RR.G; G.time = ${TIME}; G.combo = ${COMBO}; var JU = __RR.JUICE || window.JUICE, HY = __RR.HYPE || window.HYPE, HL = __RR.hypeLevel || window.hypeLevel; if (JU) JU.streak = ${STREAK};
  if (HY) { var HYPE = HY; HYPE.clockT = true; HYPE.g = G; HYPE.lv = HL(); HYPE.shown = {}; for (var i = 1; i <= HYPE.lv; i++) HYPE.shown[i] = 1; HYPE.sec = Math.ceil(G.time); } })(); 1`);
// 피버(층) 또는 그로기(보스)를 일으키고, 1/15초마다 연타 2번(초당 30회)하며 촬영. 끝난 뒤 25프레임 더
await ev(`(function(){ var G = __RR.G; if (G.isBoss) { G.groggyN = 3; if (${process.env.HP || 0}) G.bossHp = Math.max(G.bossHp, ${process.env.HP || 0}); } else G.fever = 0.999; for (var i = 0; i < 12 && !(G.feverT > 0); i++) __RR.cheat(); })(); 1`);
let f = 0, after = 0;
while (f < 140) {
  const st = await ev('(function(){ var G = __RR.G; return { fev: G.feverT > 0, p: G.feverPresses, combo: G.combo }; })()');
  if (st.fev) { await ev("__RR.key('KeyJ'); __RR.keyup && __RR.keyup('KeyJ'); __RR.key('KeyK'); __RR.keyup && __RR.keyup('KeyK'); 1"); }
  else if (f > 5) after++;
  if (after > 40) break;
  await ev('__RR.step(1/15); 1');
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1600, height: 900, scale: +(process.env.SCALE || 0.5) } });
  fs.writeFileSync(path.join(OUT, `f${String(f).padStart(3, '0')}.png`), Buffer.from(r.result.data, 'base64')); f++;
}
console.log('frames', f, JSON.stringify(await ev('(function(){ var G = __RR.G; return { presses: G.feverPressTotal, combo: G.combo, max: G.maxCombo }; })()')));
ws.close(); proc.kill(); await sleep(300); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(0);
