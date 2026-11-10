// [미스] 지정한 층(LAYER: 0 기획 · 1 개발 · 2 QA · 3 보스)까지 봇으로 간 뒤 남은 시간을 TIME으로 맞추고 1/15초마다 화면을 찍음
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
// 커맨드 입력에서 틀린 방향(필요한 방향과 수직)을 눌러 미스를 내고, 그 뒤 8프레임 촬영
await ev('__RR.step(0.5); 1');
const key = await ev(`(function(){ var t = __RR.G.task; if (t.mg !== 'command') return null; var a = t.arrows[t.progress]; return ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][(a.dir + 1) % 4]; })()`);
if (!key) { console.log('not command'); process.exit(1); }
await ev(`__RR.G.linterLeft = 0; __RR.G.shield = 0; __RR.key('${key}'); 1`);   // 촬영용: 미스 막기(린터 · 보험)를 끔
for (let f = 0; f < 8; f++) {
  await ev('__RR.step(1/30); 1');
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1600, height: 900, scale: +(process.env.SCALE || 0.5) } });
  fs.writeFileSync(path.join(OUT, `m${f}.png`), Buffer.from(r.result.data, 'base64'));
}
console.log('miss done', JSON.stringify(await ev('({ time: __RR.G.time, combo: __RR.G.combo })')));
ws.close(); proc.kill(); await sleep(300); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(0);
