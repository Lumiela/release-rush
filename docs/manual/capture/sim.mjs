// 난이도 시뮬레이션: 버전 · 루트 정책 · 실력별로 여러 판을 화면 없이 돌려 핵심 수치를 모음
// usage: node sim.mjs <out.json> <label=game.html> [<label=game.html> ...]   (환경변수 SEEDS=15)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2];
const GAMES = process.argv.slice(3).map(a => { const i = a.indexOf('='); return { label: a.slice(0, i), file: a.slice(i + 1) }; });
const SEEDS = +(process.env.SEEDS || 15);
const PORT = 9400 + Math.floor(Math.random() * 50);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'rr-sim-'));
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--mute-audio', '--no-first-run', '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) { await sleep(200); try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); wsUrl = l.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} }
const ws = new WebSocket(wsUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return r.result?.result?.value; };
await send('Page.enable');
const BOT = fs.readFileSync(path.join(HERE, 'simbot.js'), 'utf8');
const rows = [];
const POLICIES = (process.env.POLICIES || 'safe,risk').split(','), PROFS = (process.env.PROFILES || 'normal,skilled').split(','), MASHES = (process.env.MASH || '0').split(',').map(Number);
for (const g of GAMES) for (const policy of POLICIES) for (const profile of PROFS) for (const mash of MASHES) {
  for (let seed = 1; seed <= SEEDS; seed++) {
    await send('Page.navigate', { url: 'file:///' + g.file.replace(/\\/g, '/') + '?seed=' + seed });
    await sleep(700);
    const r = await ev(BOT + `; SIM.run(${JSON.stringify({ policy, profile, seed, mash })})`);
    rows.push({ version: g.label, policy, profile, mash, seed, ...r });
  }
  const sub = rows.filter(r => r.version === g.label && r.policy === policy && r.profile === profile && r.mash === mash);
  const clr = sub.filter(r => r.cleared).length;
  console.log(g.label, policy, profile, 'mash' + (mash || 'default'), `clear ${clr}/${sub.length}`, 'avgScore', Math.round(sub.reduce((a, r) => a + (r.score || 0), 0) / sub.length));
}
fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
ws.close(); proc.kill(); await sleep(300);
try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
process.exit(0);
