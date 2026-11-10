# 03. 기술 구조

> 게임이 어떻게 만들어져 있고, 어떻게 점검했는지 정리한 문서입니다.

---

## 파일 구성

```
2026 11 09 mini-game/
├─ game/
│  ├─ release-rush.html          ← 게임 본체 (HTML·CSS·JS 한 파일)
│  └─ backup/
│     ├─ release-rush-v1-arrows.html   ← 방향키 커맨드 기반 버전
│     ├─ release-rush-v2-timing.html   ← 타이밍 원버튼 전환 직후 버전
│     ├─ release-rush-v3-battle.html   ← 전투 연출 추가 버전 (미니게임 랜덤 배정 전)
│     ├─ release-rush-v4-minigames.html · v5-cards · v6-items
│     ├─ release-rush-v7-ready.html    ← 룰 카드 추가 버전 (엔딩 화면 전)
│     ├─ … v8 ~ v14.2
│     ├─ release-rush-v14.3-bgm.html ~ v14.9-mole-fix.html   ← 수정 직전 버전 (수정마다 하나)
│     └─ submit/                      ← 옛 제출물 (v1 첫 제출본 · v2 설명서 통합본)
├─ submit/                        ← **배포용만**: 릴리즈러시/(게임실행.html · 게임설명서.pdf · 매뉴얼.pdf · 매뉴얼.txt) + ZIP. 백업은 두지 않음
├─ docs/                          ← 이 문서들 (Velog 초안 자료)
│  ├─ images/                     ← 화면 캡처, 변경 전/후 비교 이미지
│  └─ manual/                     ← 게임설명서.html · 매뉴얼.html(→ PDF) · manual.css, 화면(images/), 캡처 · 점검 · 시뮬레이션 도구(capture/), 옛 통합본(old/)
├─ game-plan.html                 ← 첫 기획서 (방향 수정 전)
├─ game-direction.html            ← 방향성 탐구
├─ entry-strategy.html            ← 출품 전략
├─ game-design.html               ← 게임 설계서 (v1 기준, 갱신 필요)
└─ .claude/launch.json            ← 점검용 로컬 서버 실행 설정
```

## 왜 HTML 파일 하나인가

| 요구 | 선택 | 이유 |
|---|---|---|
| 인터넷 없이 Windows에서 실행 | 외부 CDN·웹폰트·이미지 파일 없음 | 오프라인에서도 그대로 동작 |
| 압축 풀고 더블클릭 | `<script type="module">` 사용 안 함 | 더블클릭(file://) 실행에서는 ES 모듈이 막힘 |
| 기록 유지 | localStorage | SQLite(sql.js)는 WASM 로딩이 더블클릭 실행에서 막히기 쉬움 |
| 폰트 | 맑은 고딕 (시스템 폰트) | Windows 기본 탑재 |

## 화면 구성

- **캔버스:** 내부 해상도 320×180을 4배(1280×720)로 그린 뒤 화면 크기에 맞춰 확대합니다. 도트는 선명하게, 글자는 부드럽게 보입니다.
- **DOM 오버레이:** 닉네임 입력, 카드, 루트, 룰렛, 결과·랭킹처럼 글이 많은 화면은 HTML로 그립니다.
- 16:9 비율을 유지하고 남는 부분은 검은 여백으로 둡니다.

## 코드 구성 (`release-rush.html` 안)

| 구역 | 내용 |
|---|---|
| 기본 설정 | 제한 시간, 저장 키, 테스트용 시드 난수(`?seed=숫자`) |
| 게임 데이터 | `MG_INFO`·`MG_DIFF`·`MG_COUNT`(미니게임), `LAYERS`, `TIMING`, `MID`, `BOSS`, `BONUS`, `FEVER`, `ROUTES`, `CARDS`, `SPECIALS` — **밸런스 수치는 모두 여기** |
| 미니게임 공통 틀 | `MGX[미니게임].input / update` + `drawTimingBar`·`drawArrowRow`·`drawAlert`·`drawSort`. 새 미니게임은 이 틀에 하나씩 추가 |
| 기록 저장 | 저장 후 다시 읽어서 확인, 실패하면 메모리 보관 + 화면 경고 |
| 상태·흐름 | `scene`: idle → nickname → pick → route → play(층 · WARNING · 보스) → bonus → roulette → itempick · mystery · shop → ending(게임 로그) → result. 판이 끝나면 `finish` → `fadeTo(openEnding)`로 페이드 전환, 로그는 `G.log`에 `logAdd`·`logStage`로 쌓음. 층 흐름은 `startLayer` → `afterClear` → `startMid` → `afterStageEvents` |
| 판정 | 공통 `taskInput` → `taskSuccess` / `taskMiss`, 보너스(`bonusDir`), 피버(`feverPress`) |
| 데모 플레이 | 실제 게임 로직에 입력만 자동으로 넣는 봇 (`demoTick`) |
| 룰 카드 시범 플레이 | 룰 카드가 떠 있는 동안 지금 작업의 복제본을 미니게임별 대본으로 자동 플레이(`demoPlayUpdate` · `drawDemoPlayOverlay`), 룰 카드 키 캡을 `.kbig.on`으로 점등. 복제본 · 자체 난수만 써서 실제 판에 영향 없음 (#40) |
| 전투 연출 | 판정과 분리된 보여 주기용 레이어 (`battle*`, `drawHero`, `drawEnemy`) |
| 성공 이펙트 | `juiceSuccess`(성공 순간 효과 만들기) · `juiceUpdate` · `juiceDraw` · `juicePunch`(줌), 글자는 이미지로 저장해 늘림(`juiceSprite` · `juiceNum` · `juiceWarm`). 장식 난수는 `Math.random`이라 게임 난수와 무관 (#57) |
| 피버 패널 (#64) | `drawFeverPanel`(패널 자리, `drawFeverBurst(…, panel=true)`로 좌우 가시 · 파편 · 별 줄임) · `drawResumeCue` · `G.resumeT`(`RESUME_T` 0.4초, `update`에서 정지, `taskReady`에서 입력 무시). 예전 패널 위 게이지 `drawFeverGaugeHot`는 쓰지 않지만 남겨 둠 |
| 피버 콤보 (#60) | 피버 · 그로기 끝 `endFever` → `feverComboBonus`(연타 ÷ `FEVER_COMBO_PER`), 「N COMBO!」는 `JUICE.pendingRun` 뒤로 미룸. 피버 중 HIT 단계는 `feverHitDraw`(작은 모드 = 그로기 상자), 보너스 배너 `feverBonusDraw`, 연타 튐 `JUICE.hitPop`. `juiceComboText(n, 색, 단어)`로 COMBO! · HIT 공용 |
| 콤보 · 긴장 연출 (#59) | 콤보마다 「N COMBO!」(`comboRunStart` · `comboRunDraw` · `comboHeat` 0~1 · `juiceComboText` 글자별 이미지 · `comboWarm`). 남은 시간 긴장 단계 · 층별 움직이는 배경(`HYPE`, `hypeUpdate` · `hypeBack` 배경 위 · `hypeFront` 패널 위 · `hypeWarm`), 박자는 BGM 오디오 시계(`hypeBeat`), 무늬는 `createPattern` 한 장으로 |
| 피버 연출 | 외침 말풍선 폭발 테두리(`drawFeverBurst`, #47), 두꺼운 형광 게이지(`drawFeverGaugeHot`, #39), 화면 테두리 · 속도선 · 충격파(`drawFeverAuraBack` · `drawFeverAuraFront`, #40). 보여 주기용 |
| 그리기 | 배경 4종(기획·개발·테스트·서버실), HUD, 타이밍 바, 화살표, 보너스, 피버 |
| 점검용 훅 | `window.__RR` — 시간 빨리 감기, 키 입력, 상태 조회, `HYPE` · `JUICE` · `hypeLevel`(캡처용, #59) |

## 저장 데이터

| 키 | 내용 |
|---|---|
| `releaseRush.records.v1` | 기록 배열 (닉네임, 점수, 출시 여부, 도달 층, 루트, 실수, 남은 시간, 날짜) |
| `releaseRush.lastName.v1` | 마지막 닉네임 |

- 기록은 **같은 PC, 같은 브라우저**에서만 이어집니다. 설명서에 적어야 합니다.

---

## 점검 방법

### 1. 로컬 서버
브라우저 창은 파일을 직접 열면 저장소가 막혀서, 점검할 때는 `python -m http.server 5173`으로 `game/` 폴더를 띄웁니다(#37에서 Node 임시 스크립트 → Python으로 변경). 설정은 `.claude/launch.json`에 있습니다.

### 2. 자동 점검 (`window.__RR`)
```js
__RR.step(1.0)        // 게임 시간 1초 빨리 감기
__RR.key('Space')     // 키 입력 보내기
__RR.task()           // 현재 작업 (미니게임 종류·상태)
__RR.input(code)      // 현재 미니게임에 입력
__RR.cheat()          // 현재 작업을 정답으로 처리 (흐름 점검용)
__RR.zone()           // 타이밍 커서·구간 위치
__RR.records()        // 저장된 기록
__RR.startDemo()      // 데모 시작
```

### 3. 가상 플레이어 시뮬레이션
실력이 다른 가상 플레이어로 수십 판을 자동으로 돌려 출시 성공률, 점수 분포, 입력 시간을 봅니다.

| 유형 | 타이밍 오차 | 반응 지연 | 방향키 간격 | 방향키 실수 |
|---|---|---|---|---|
| 숙련 | 0.03 | 0.15초 | 0.3초 | 5% |
| 보통 | 0.07 | 0.25초 | 0.45초 | 10% |
| 초보 | 0.12 | 0.35초 | 0.8초 | 18% |

> **한계:** 가상 플레이어는 빠른 커서나 빨간 화살표에서도 정확도가 거의 같습니다. 위험 루트의 체감 난이도는 사람이 직접 해 봐야 압니다.

### 4. 화면 캡처 · 실제 클릭 점검 (`docs/manual/capture/`)
헤드리스 Chrome을 DevTools 프로토콜로 조종합니다(Node 24 기본 기능만 사용, 설치 없음). 브라우저 프로필은 임시 폴더에 만들고 끝나면 지웁니다.

| 파일 | 하는 일 | 실행 |
|---|---|---|
| `bot.js` | 게임 안에 넣는 자동 플레이어. `__RR.freeze`로 화면을 멈추고 시간을 빨리 감으며 장면마다 "찍을 순간" 키를 알려 줌 | (run · clicktest가 사용) |
| `run.mjs` | 시드별로 한 판씩 끝까지 플레이하며 장면마다 1600×900 PNG 저장. 설명서 그림(#37 · #62)을 이걸로 찍음. 여러 판을 동시에 돌릴 때는 `PORT=9341`처럼 판마다 다른 포트(#62) | `node run.mjs <게임.html> <저장 폴더> '[{"seed":7,"mode":"good"}]'` (`mode:"fail"`은 2층부터 일부러 틀려 시간 종료) |
| `clicktest.mjs` | **실제 마우스 이벤트**로 버튼을 눌러 룰 카드가 건너뛰어지지 않는지 5항목 점검(#38) | `node clicktest.mjs <게임.html> [화면 저장 폴더]` → `ALL PASS` |
| `records.json` | 캡처용 예시 랭킹 기록 8개 | |
| `simbot.js` | 난이도 측정용 사람 흉내 봇. 데모 봇과 같은 반응 · 실수 모델(보통)과 숙련, 루트 정책(모두 안전 / 모두 신기술)을 고정해 화면 없이 한 판 끝까지 | (sim이 사용) |
| `sim.mjs` | 버전 · 루트 · 실력 · 연타 속도 · 시드별로 여러 판을 돌려 출시율 · 점수 · 층 소요 시간 · 보스 남은 체력 · 점수 출처를 JSON으로 저장(#41 · #42). **사람 연타는 초당 약 30회**(사용자 실제 판으로 보정) | `SEEDS=20 PROFILES=skilled MASH=20,30 node sim.mjs out.json v14.6=<옛 파일> v14.7=<새 파일>` |
| `drafts/caph.mjs` | 봇으로 지정한 층(0~3)까지 간 뒤 남은 시간 · 콤보를 맞추고 1/15초마다 촬영. 긴장 단계 · 층별 배경 GIF(#58 · #59) | `node drafts/caph.mjs <게임.html> <폴더> <층> <남은 초> [프레임] [콤보] [연속퍼펙트]` (`NOCHEAT=1`이면 성공 처리 없이) |
| `drafts/capm.mjs` | 지정한 층의 커맨드 입력에서 틀린 방향을 눌러 미스 장면(−2초 · 붉은 번쩍)을 찍음. 촬영용으로 린터 · 보험을 끔(#62) | `node drafts/capm.mjs <게임.html> <폴더> 1 40 0 12` (`SCALE=1`이면 1600×900) |
| `drafts/capf.mjs` | 지정한 층에서 피버(보스면 그로기, 체력 3000으로)를 일으키고 초당 30회 연타하며 촬영, 끝난 뒤 40프레임 더(#60) | `node drafts/capf.mjs <게임.html> <폴더> <층> <남은 초> 0 <콤보>` |
| `drafts/capc.mjs` | 콤보 값을 차례로 맞추며 성공 처리 → 콤보마다 8프레임 촬영(#59) | `COMBOS=9,11,15,… node drafts/capc.mjs <게임.html> <폴더> 0 50` |

> `__RR.key()`는 키보드 이벤트만 보내서 마우스 클릭 문제(#38)를 잡지 못했습니다. 클릭으로 진행하는 화면을 바꾸면 `clicktest.mjs`를 함께 돌립니다.

### 5. 데모 플레이
대기 화면에서 15초가 지나거나 주소 끝에 `?demo`를 붙이면 게임이 스스로 한 판을 플레이합니다. 흐름 확인용이자 부스 홍보용입니다.
