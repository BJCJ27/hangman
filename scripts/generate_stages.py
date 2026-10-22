"""Generate the six hangman stage images (0-5 wrong guesses).

Run from the project root:  python3 scripts/generate_stages.py
Writes src/assets/stages/stage-0.svg ... stage-5.svg
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "stages"

CHALK = "#F2EFE6"
RED = "#F4A28C"
BG = "#234536"

GALLOWS = f"""
  <g fill="none" stroke="{CHALK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <line x1="20" y1="265" x2="160" y2="265"/>
    <line x1="60" y1="265" x2="60" y2="20"/>
    <line x1="60" y1="20" x2="170" y2="20"/>
    <line x1="60" y1="62" x2="102" y2="20"/>
    <line x1="170" y1="20" x2="170" y2="55"/>
  </g>"""

# One body part is added per wrong guess. With 5 lives, the 5th miss
# finishes the figure (both legs) and the game is lost.
PARTS = [
    '<circle cx="170" cy="80" r="25"/>',                      # 1 head
    '<line x1="170" y1="105" x2="170" y2="175"/>',            # 2 body
    '<line x1="170" y1="125" x2="138" y2="157"/>',            # 3 left arm
    '<line x1="170" y1="125" x2="202" y2="157"/>',            # 4 right arm
    '<line x1="170" y1="175" x2="143" y2="228"/>'             # 5 both legs
    '<line x1="170" y1="175" x2="197" y2="228"/>',
]

FACE_ALIVE = f"""
  <g fill="{CHALK}"><circle cx="161" cy="76" r="3"/><circle cx="179" cy="76" r="3"/></g>
  <path d="M160 90 q10 6 20 0" fill="none" stroke="{CHALK}" stroke-width="3" stroke-linecap="round"/>"""

FACE_DEAD = f"""
  <g stroke="{RED}" stroke-width="3" stroke-linecap="round">
    <line x1="157" y1="72" x2="165" y2="80"/><line x1="165" y1="72" x2="157" y2="80"/>
    <line x1="175" y1="72" x2="183" y2="80"/><line x1="183" y1="72" x2="175" y2="80"/>
  </g>
  <path d="M160 94 q10 -6 20 0" fill="none" stroke="{RED}" stroke-width="3" stroke-linecap="round"/>"""


def stage(n: int) -> str:
    color = RED if n == 5 else CHALK
    body = "".join(PARTS[:n])
    face = ""
    if n >= 1:
        face = FACE_DEAD if n == 5 else FACE_ALIVE
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" width="240" height="280">
  <rect width="240" height="280" rx="16" fill="{BG}"/>{GALLOWS}
  <g fill="none" stroke="{color}" stroke-width="6" stroke-linecap="round">{body}</g>{face}
</svg>
"""


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for i in range(6):
        (OUT / f"stage-{i}.svg").write_text(stage(i), encoding="utf-8")
        print(f"wrote stage-{i}.svg")
