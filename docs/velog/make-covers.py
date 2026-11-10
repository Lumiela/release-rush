"""Velog 외전 #2~#7 표지(썸네일) 이미지를 만든다. #1 표지는 make-images-01.py.

사용법: (PIL이 있는 파이썬) python make-covers.py
결과:   docs/images/velog/velog-0N-cover.png (1600×840)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

DOCS = Path(__file__).resolve().parent.parent
OUT = DOCS / "images" / "velog"
FONT_R = "C:/Windows/Fonts/malgun.ttf"
FONT_B = "C:/Windows/Fonts/malgunbd.ttf"
BG, LINE, INK, SUB, YELLOW = "#0c0f1e", "#2a3050", "#f1f3f5", "#a5adc6", "#ffd43b"

# (번호, 제목 3줄(마지막 줄 강조), 아래 설명 2줄, 화면 경로, 화면 설명)
COVERS = [
    (2, ["방향키를 버리고", "버튼 하나만", "남겼다"],
     ["120초 → 60초 · 방향키 → Space 타이밍", "피버 연타 · 직장인 vs 업무 몬스터"],
     "images/v3-battle/game-v3-battle.jpg", "v3 · 전투 연출"),
    (3, ["한 판을", "처음부터 끝까지", "설계했다"],
     ["미니게임 6종 · WARNING · 카드 · 상점", "룰 카드 · 정산표 · 출시 컷신 · 보스 체력"],
     "images/v4-minigames/game-v4-warning-sort.jpg", "v4 · WARNING 중간보스"),
    (4, ["봇 수백 판이", "사람 한 판을", "못 이겼다"],
     ["일반인 반응속도 봇으로 밸런스 측정", "그리고 내 한 판, 67,000점"],
     "images/v13-balance/game-v13-route-compound.jpg", "v13.1 · 신기술 복리"),
    (5, ["마감 전에", "낸 것과", "고친 것"],
     ["완성도 평가 · 효과음도 코드로 · 제출 ZIP", "캡처 봇 설명서 · 알파 테스트 피드백"],
     "docs/manual/images/ready-command.jpg", "v14.6 · 시범 플레이 룰 카드"),
    (6, ["올드한 게임에", "도파민을", "들이부었다"],
     ["피버 말풍선 · 레이저 대기 화면 · 성공 이펙트", "급박한 3분 · 콤보 단계 · 60fps 유지"],
     "docs/manual/images/fever.jpg", "v15.7 · 피버 92 HIT"),
    (7, ["65번 고치고", "두 번 제출했다,", "본질 위에 연출"],
     ["개발 로그 65건 · 버전 36개 · 이미지 181장", "하루 만의 압축 경험, 그리고 조화"],
     "docs/manual/images/ending-clear.jpg", "v15.7 · 첫 제출본 엔딩"),
]


def font(size, bold=False):
    return ImageFont.truetype(FONT_B if bold else FONT_R, size)


def cover_crop(img, w, h):
    sw, sh = img.size
    s = max(w / sw, h / sh)
    img = img.resize((round(sw * s), round(sh * s)), Image.LANCZOS)
    left = (img.width - w) // 2
    return img.crop((left, 0, left + w, h))


def make(num, title, sub, shot_path, shot_note):
    W, H = 1600, 840
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)

    path = DOCS.parent / shot_path if shot_path.startswith("docs/") else DOCS / shot_path
    shot = cover_crop(Image.open(path).convert("RGB"), 760, 428)
    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *shot.size), 18, fill=255)
    im.paste(shot, (W - 830, 206), mask)
    d.rounded_rectangle((W - 830, 206, W - 70, 634), 18, outline=LINE, width=3)
    d.text((W - 70, 660), shot_note, font=font(26), fill=SUB, anchor="ra")

    f = font(34, True)
    tw = d.textlength("외전", font=f)
    d.rounded_rectangle((80, 96, 80 + tw + 44, 152), 28, fill=YELLOW)
    d.text((102, 124), "외전", font=f, fill=BG, anchor="lm")
    d.text((80 + tw + 66, 124), f"하루 만에 게임 만들기 #{num}", font=font(36, True), fill=INK, anchor="lm")

    y = 230
    for i, line in enumerate(title):
        d.text((80, y), line, font=font(84, True), fill=YELLOW if i == len(title) - 1 else INK)
        y += 112
    d.text((80, 640), sub[0], font=font(30), fill=SUB)
    d.text((80, 688), sub[1], font=font(30), fill=SUB)

    out = OUT / f"velog-{num:02d}-cover.png"
    im.save(out, optimize=True)
    return out.name


if __name__ == "__main__":
    print("saved", *(make(*c) for c in COVERS))
