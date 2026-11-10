"""Velog 외전 01편 이미지 3장을 만든다.

사용법: (PIL이 있는 파이썬) python make-images-01.py
결과:   docs/images/velog/
  - velog-01-cover.png      표지(썸네일) 1600×840
  - velog-01-flow.png       「한눈에 보는 시작」 6단계 흐름 2400×1500
  - velog-01-then-now.jpg   첫 초안 ↔ 지금 비교 1328×432 (비교 이미지 양식)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

DOCS = Path(__file__).resolve().parent.parent
IMG = DOCS / "images"
OUT = IMG / "velog"
FONT_R = "C:/Windows/Fonts/malgun.ttf"
FONT_B = "C:/Windows/Fonts/malgunbd.ttf"

BG = "#0c0f1e"
CARD = "#161a2e"
LINE = "#2a3050"
INK = "#f1f3f5"
SUB = "#a5adc6"
ORANGE = "#ff922b"
TEAL = "#38d9a9"
YELLOW = "#ffd43b"
PINK = "#f783ac"


def font(size, bold=False):
    return ImageFont.truetype(FONT_B if bold else FONT_R, size)


def cover_crop(img, w, h, anchor_y=0.0):
    """비율을 맞춰 잘라 낸 뒤 w×h로 줄인다. anchor_y=0이면 위쪽 기준."""
    sw, sh = img.size
    scale = max(w / sw, h / sh)
    nw, nh = round(sw * scale), round(sh * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - w) // 2
    top = round((nh - h) * anchor_y)
    return img.crop((left, top, left + w, top + h))


def rounded_paste(base, img, xy, radius=14):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *img.size), radius, fill=255)
    base.paste(img, xy, mask)


def pill(d, xy, text, f, fg, bg):
    x, y = xy
    tw = d.textlength(text, font=f)
    pad_x, h = 22, f.size + 22
    d.rounded_rectangle((x, y, x + tw + pad_x * 2, y + h), h // 2, fill=bg)
    d.text((x + pad_x, y + h / 2), text, font=f, fill=fg, anchor="lm")
    return x + tw + pad_x * 2


# ---------------------------------------------------------------- 1. 표지
def make_cover():
    W, H = 1600, 840
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)

    shot = Image.open(DOCS / "manual/images/combo.jpg").convert("RGB")
    shot = cover_crop(shot, 760, 428, 0.0)
    rounded_paste(im, shot, (W - 760 - 70, 206), 18)
    d.rounded_rectangle((W - 760 - 70, 206, W - 70, 206 + 428), 18, outline=LINE, width=3)

    x = 80
    nx = pill(d, (x, 96), "외전", font(34, True), BG, YELLOW)
    d.text((nx + 22, 96 + 28), "하루 만에 게임 만들기 #1", font=font(36, True), fill=INK, anchor="lm")

    title = ["마감 하루 전,", "기획서부터", "다시 썼다"]
    y = 230
    for i, line in enumerate(title):
        d.text((x, y), line, font=font(88, True), fill=YELLOW if i == 2 else INK)
        y += 118

    d.text((x, 640), "공모전 마감 24시간 · HTML 파일 하나", font=font(32), fill=SUB)
    d.text((x, 690), "AI와 함께 만든 게임 「릴리즈 러시」", font=font(32), fill=SUB)
    d.text((W - 70, 660), "지금의 「릴리즈 러시」", font=font(26), fill=SUB, anchor="ra")

    im.save(OUT / "velog-01-cover.png", optimize=True)


# ------------------------------------------------------------ 2. 흐름도
STEPS = [
    ("첫 기획서", "images/0-plan/plan-01-first-mockups.jpg", 0.0,
     "게임 하나가 정해진 스펙이 나왔다", "다시 요청", ORANGE),
    ("방향부터 펼치기", "images/0-plan/plan-02-direction-cards.jpg", 0.3,
     "장르 8 · 방향 축 6 · 조합 6", "탐구", TEAL),
    ("출품 전략", "images/0-plan/plan-05-strategy-matrix.jpg", 0.08,
     "아는 조작 + 행사 맞춤 소재", "결정", TEAL),
    ("공모 요강 확인", "images/0-plan/plan-06-contest-rules.jpg", 0.05,
     "처음 조건 4개 중 3개가 바뀌었다", "전환", ORANGE),
    ("「릴리즈 러시」 설계", "images/0-plan/plan-07-design-route-map.jpg", 0.0,
     "프로젝트 공정 3층 + 출시 보스", "결정", TEAL),
    ("첫 초안", "images/v1-arrows/game-v1-play.jpg", 0.0,
     "HTML 파일 하나로 한 판이 끝까지 돈다", "구현", YELLOW),
]


def make_flow():
    W, H = 2400, 1500
    cols, rows = 3, 2
    mx, top = 90, 210
    gap_x, gap_y = 120, 80
    cw = (W - mx * 2 - gap_x * (cols - 1)) // cols
    ch = (H - top - 70 - gap_y) // rows
    thumb_h = 380

    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    nx = pill(d, (mx, 62), "외전 · 하루 만에 게임 만들기 #1", font(30, True), BG, YELLOW)
    d.text((nx + 26, 62 + 26), "한눈에 보는 시작 — 기획서에서 첫 초안까지", font=font(46, True), fill=INK, anchor="lm")

    boxes = []
    for i, (title, path, ay, note, tag, color) in enumerate(STEPS):
        r, c = divmod(i, cols)
        x = mx + c * (cw + gap_x)
        y = top + r * (ch + gap_y)
        boxes.append((x, y))
        d.rounded_rectangle((x, y, x + cw, y + ch), 22, fill=CARD, outline=LINE, width=3)

        # 번호 + 제목
        cx, cy = x + 52, y + 50
        d.ellipse((cx - 30, cy - 30, cx + 30, cy + 30), fill=color)
        d.text((cx, cy), str(i + 1), font=font(34, True), fill=BG, anchor="mm")
        d.text((x + 100, cy), title, font=font(38, True), fill=INK, anchor="lm")
        tf = font(24, True)
        tw = d.textlength(tag, font=tf)
        d.rounded_rectangle((x + cw - tw - 64, cy - 22, x + cw - 24, cy + 22), 22, outline=color, width=3)
        d.text((x + cw - 44 - tw / 2, cy), tag, font=tf, fill=color, anchor="mm")

        # 썸네일
        shot = Image.open(DOCS / path).convert("RGB")
        shot = cover_crop(shot, cw - 48, thumb_h, ay)
        rounded_paste(im, shot, (x + 24, y + 100), 12)

        # 한 줄 결과
        d.text((x + cw / 2, y + 100 + thumb_h + 50), note, font=font(32, True), fill=color if color != TEAL else INK, anchor="mm")

    # 화살표: 1→2→3, 3→4(줄 바꿈), 4→5→6
    def arrow_h(x1, x2, y):
        d.line((x1, y, x2 - 18, y), fill=SUB, width=8)
        d.polygon([(x2, y), (x2 - 30, y - 20), (x2 - 30, y + 20)], fill=SUB)

    mid = top + 100 + thumb_h // 2
    for c in range(cols - 1):
        for r in range(rows):
            x1 = mx + c * (cw + gap_x) + cw + 18
            arrow_h(x1, x1 + gap_x - 36, mid + r * (ch + gap_y))
    # 3 → 4 : 오른쪽 위 카드 아래에서 왼쪽 아래 카드 위로
    x3 = boxes[2][0] + cw // 2
    x4 = boxes[3][0] + cw // 2
    y_mid = top + ch + gap_y // 2
    d.line((x3, top + ch + 6, x3, y_mid), fill=SUB, width=8)
    d.line((x3, y_mid, x4, y_mid), fill=SUB, width=8)
    d.line((x4, y_mid, x4, top + ch + gap_y - 30), fill=SUB, width=8)
    d.polygon([(x4, top + ch + gap_y - 4), (x4 - 20, top + ch + gap_y - 34), (x4 + 20, top + ch + gap_y - 34)], fill=SUB)

    im.save(OUT / "velog-01-flow.png", optimize=True)


# -------------------------------------------------------- 3. 첫 초안 ↔ 지금
def make_then_now():
    W, H = 1328, 432
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    panels = [
        (16, "첫 초안 v1", "120초 · 방향키 커맨드", "images/v1-arrows/game-v1-play.jpg", ORANGE),
        (672, "지금 v15.7", "60초 · 미니게임 6종 · 콤보 · 피버", "manual/images/combo.jpg", TEAL),
    ]
    for x, label, desc, path, color in panels:
        f = font(26, True)
        d.text((x + 4, 36), label, font=f, fill=color, anchor="lm")
        lw = d.textlength(label, font=f)
        d.text((x + 4 + lw + 18, 36), desc, font=font(24, True), fill=INK, anchor="lm")
        shot = cover_crop(Image.open(DOCS / path).convert("RGB"), 640, 360, 0.0)
        im.paste(shot, (x, 60))
    im.save(OUT / "velog-01-then-now.jpg", quality=92)


if __name__ == "__main__":
    make_cover()
    make_flow()
    make_then_now()
    print("saved", *(p.name for p in sorted(OUT.glob("velog-01-*"))))
