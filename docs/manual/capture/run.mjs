// Drive release-rush.html in headless Chrome via CDP and save screenshots per capture key.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME = process.argv[2];
const OUT = process.argv[3];
const PORT = +(process.env.PORT || 9333);   // 여러 판을 동시에 돌릴 때는 PORT를 다르게 (#62)
const RUNS = JSON.parse(process.argv[4] || '[{"seed":1,"mode":"good"}]');
const W = 1600, H = 900;
fs.mkdirSync(OUT, { recursive: true });

const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'rr-cap-'));   // 점검용 브라우저 프로필은 임시 폴더에
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`,
  `--window-size=${W},${H}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  await sleep(200);
  try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); wsUrl = l.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {}
}
const ws = new WebSocket(wsUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJS = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 800)); return r.result?.result?.value; };

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const BOT = fs.readFileSync(path.join(HERE, 'bot.js'), 'utf8');
const SAMPLE = fs.readFileSync(path.join(HERE, 'records.json'), 'utf8');
const seen = {};
const fileUrl = 'file:///' + GAME.replace(/\\/g, '/');

async function load(seed) {
  await send('Page.navigate', { url: `${fileUrl}?seed=${seed}` });
  await sleep(1200);
}
async function shot(key) {
  await sleep(350);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, key + '.png'), Buffer.from(r.result.data, 'base64'));
  console.log('captured', key);
}

let first = true;
for (const run of RUNS) {
  await load(run.seed);
  if (first) { await evalJS(`localStorage.setItem('releaseRush.records.v1', ${JSON.stringify(SAMPLE)}); 1`); await load(run.seed); first = false; }
  await evalJS(BOT + `; BOT.setup(${JSON.stringify({ seen, mode: run.mode, name: run.name })}); 1`);
  const only = run.only ? new RegExp(run.only) : null;
  for (let n = 0; n < 6000; n++) {
    const r = await evalJS('BOT.tick(1)');
    if (r.cap) {
      if (!only || only.test(r.cap)) await shot(r.cap + (run.suffix || ''));
      seen[r.cap] = 1; await evalJS(`BOT.mark(${JSON.stringify(r.cap)})`);
    }
    if (r.done) { console.log('run done', JSON.stringify(run), JSON.stringify(r)); break; }
    if (n % 50 === 0 && !r.cap) console.log('..', JSON.stringify(r));
  }
  // allow the same end-of-run keys to be captured again in a later run with a different suffix
  for (const k of Object.keys(seen)) if (/^(launch|ending|result)/.test(k)) delete seen[k];
}
ws.close(); proc.kill(); await sleep(300);
try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
process.exit(0);
