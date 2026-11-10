// Real mouse-click regression test for rule-card skipping.
// usage: node clicktest.mjs <game.html> [shotDir]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME = process.argv[2], SHOTS = process.argv[3];
const PORT = 9340 + Math.floor(Math.random() * 50);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'rr-click-'));   // 점검용 브라우저 프로필은 임시 폴더에
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`,
  '--window-size=1600,900', '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) { await sleep(200); try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); wsUrl = l.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} }
const ws = new WebSocket(wsUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
const BOT = fs.readFileSync(path.join(HERE, 'bot.js'), 'utf8');
const url = 'file:///' + GAME.replace(/\\/g, '/') + '?seed=7';

async function fresh() { await send('Page.navigate', { url }); await sleep(1000); await ev(BOT + '; BOT.setup({mode:"good",seen:{}}); 1'); }
async function runUntil(capKey) { for (let n = 0; n < 2000; n++) { const r = await ev('BOT.tick(0.5)'); if (r.cap) { await ev(`BOT.mark(${JSON.stringify(r.cap)})`); if (r.cap === capKey) return true; } } return false; }
async function click(sel) {
  const b = await ev(`(function(){var r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(150);
}
const state = () => ev(`(function(){var R=__RR,G=R.G;return {scene:R.scene, ready:!!(G&&G.ready), kind:G?(G.isBoss?'boss':G.isMid?G.midKind:'L'+G.layer):null, task:!!(G&&G.task)}})()`);
async function shot(name) { if (!SHOTS) return; await sleep(250); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.mkdirSync(SHOTS, { recursive: true }); fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.result.data, 'base64')); }
const results = [];
function report(name, s, expectReady) { const ok = s.ready === expectReady; results.push({ name, ...s, ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(s)); }

// A. 닉네임 「시작하기」 버튼 클릭 → 1층 룰 카드가 보여야 함
await fresh(); await runUntil('nickname'); await shot('A0-nickname');
await click('[data-act=nickOk]'); await ev('__RR.step(0.3); 1'); await shot('A1-after-start-click');
report('A nickname 시작하기 click -> L1 rule card', await state(), true);

// B. 시작 카드 클릭 → WARNING 룰 카드가 보여야 함
await fresh(); await runUntil('pick-start');
await click('[data-act=pick][data-i="0"]'); await ev('__RR.step(0.3); 1'); await shot('B1-after-card-click');
report('B start card click -> WARNING rule card', await state(), true);

// C. 루트 클릭 → 2층 룰 카드가 보여야 함
await fresh(); await runUntil('route');
await click('[data-act=route][data-k="risk"]'); await ev('__RR.step(0.3); 1'); await shot('C1-after-route-click');
report('C route click -> layer rule card', await state(), true);

// D. 회귀: 룰 카드 화면을 클릭하면 시작되어야 함 (기존 기능 유지)
await click('#stage'); await ev('__RR.step(0.8); 1');
report('D click on rule card -> stage starts', await state(), false);

// E. 회귀: 키보드 Enter로 닉네임 제출 → 룰 카드
await fresh(); await runUntil('nickname');
await ev(`document.getElementById('nick').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true})); __RR.step(0.3); 1`);
report('E nickname Enter key -> L1 rule card', await state(), true);

console.log(results.every(r => r.ok) ? 'ALL PASS' : 'SOME FAILED');
ws.close(); proc.kill(); await sleep(300);
try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
process.exit(0);
