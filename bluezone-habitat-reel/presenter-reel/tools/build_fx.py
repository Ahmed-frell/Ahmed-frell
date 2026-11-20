#!/usr/bin/env python3
"""Single source of truth for the motion-graphics revision: designed text elements, B-roll transitions and SFX cues.
Writes render/src/data/fx.json (read by Remotion) and work/sfx_cues.json (read by the mixer).
All times are seconds on the edit timeline and come from spoken words (render/src/data/beats.json); the reference
technique each element reproduces is noted in `ref` (see analysis/08-reference-motion-text-sfx.md)."""
import json, sys
root = sys.argv[1] if len(sys.argv) > 1 else '.'
beats = json.load(open(f'{root}/render/src/data/beats.json'))
plan = json.load(open(f'{root}/analysis/broll_plan.json'))
IVORY, PIST, HOLLY, OLIVE, GOLD = '#FFF8EC', '#B4F4A5', '#013408', '#6B7A2E', '#E3C98F'

def word(txt, line=None, after=0.0):
    for w in beats['words']:
        if w['w'].rstrip('.,…').startswith(txt) and w['t0'] >= after and (line is None or w['line'] == line): return round(w['t0'], 3)
    raise SystemExit(f'word not found: {txt} {line} {after}')

T = []   # text elements
def text(id, txt, at, dur, **k):
    e = dict(id=id, text=txt, start=round(at, 3), dur=round(dur, 3), font='serif', size=96, weight=700, color=IVORY, tracking=0,
             x=90, y=600, w=900, align='center', enter='rise', exit='rise', stagger=2, enterDur=8, exitDur=5, ease='expo',
             blur=True, box=None, layer='front', italic=False, sfx=None, sfxAt=None, sfxGain=0, ref='')
    e.update(k); T.append(e); return e

C = []   # extra cues (transitions, headers, outro)
def cue(name, at, gain=0.0, why=''): C.append(dict(sfx=name, at=round(at, 3), gain=gain, why=why))

# ---------------------------------------------------------------- B-roll transitions (reference X-map)
TR = {'B01': 'imageText', 'B02': 'cut', 'B03': 'cut', 'B04': 'cut', 'B05': 'whipL', 'B06': 'tear', 'B07': 'cut', 'B08': 'whipR',
      'B09': 'maskDoors', 'B10': 'pip', 'B11': 'whipL', 'B12': 'whipR', 'B13': 'maskDoors', 'B14': 'whipL', 'B15': 'maskDoors',
      'B16': 'whipR', 'B17': 'whipL', 'B18': 'whipR', 'B19': 'cut', 'B20': 'maskDoors', 'B21': 'whipL', 'B22': 'whipR', 'B23': 'maskDoors'}
SFX_TR = {'whipL': ('whoosh_whip', -2), 'whipR': ('whoosh_whip', -2), 'maskDoors': ('reveal_arch', -1), 'tear': ('tear', 0),
          'imageText': ('swish_text', 0), 'pip': ('whoosh_whip', -6)}
for p in plan['picks']:
    tr = TR[p['id']]; p['tr'] = tr
    if tr in SFX_TR and p['id'] != 'B01':
        n, g = SFX_TR[tr]; cue(n, p['rec'][0] + (0.06 if tr.startswith('whip') else 0.0), g, f"{p['id']} {tr} transition")

# ---------------------------------------------------------------- designed typography (speech-locked)
# B01 "Blue Zone Habitat": letters filled with the gate render (image through text) -> zoom through the letters -> full frame
b = word('Blue', 1); z = word('Zone', 1); h = word('Habitat', 1)
text('bz_habitat', 'HABITAT', h, 2.30 - h, font='sans', size=40, weight=600, tracking=22, y=1180, enter='track', exit='fade', enterDur=14,
     sfx='airy', sfxAt=h, ref='tracking expansion (premium headline)')
cue('swish_text', b, 0, 'B01 BLUE ZONE letters type on (T2)'); cue('reveal_arch', b + 0.55, -2, 'B01 zoom through letters to full frame')
# B02-B04 editorial montage: phrase-to-phrase morph (text-to-text, T9/T11 continuity)
for i, (k, a, nxt) in enumerate([('better living', word('better', 1), word('healthier', 1)),
                                  ('healthier lifestyle', word('healthier', 1), word('and', 1, 5.5)),
                                  ('future of homes', word('and', 1, 5.5), 6.71)]):
    text(f'mont{i}', k, a, nxt - a, size=118, italic=True, weight=600, y=760, enter='rise', exit='rise' if i < 2 else 'fade', stagger=3, enterDur=9,
         sfx='swish_text' if i == 0 else 'sweep_tonal', sfxAt=a, sfxGain=-2 if i else 0, ref='masked rise + text-to-text morph')
# 3 key USPs list items
for i, l in enumerate(['Work from Nature Office', 'Shared Maid Quarters', 'Internal Cloud Kitchen']):
    text(f'usp_item{i}', l, 8.5 + i * 0.22, 9.86 - (8.5 + i * 0.22), font='sans', size=36, weight=600, x=150, y=1310 + i * 92, w=800, align='left',
         enter='box', exit='none', box=HOLLY, stagger=1, enterDur=6, ref='highlight box wipe, knocked-out text (T10)')
text('usp_key', 'KEY USPs', word('key', 2), 9.86 - word('key', 2), size=120, y=1130, enter='fly', exit='none', stagger=1, enterDur=8, ease='back',
     sfx='swish_text', sfxAt=word('key', 2), ref='letter fly-in with motion blur (T9)')
# USP headers: small label + headline (typewriter letters)
HDR = [(9.86, 'USP 01', 'THE FIRST ONE IS…', 9.96, 11.08),
       (45.43, 'USP 02', 'SHARED MAID QUARTERS', word('shared', 9), 48.03),
       (87.13, 'USP 03', 'INTERNAL CLOUD KITCHEN', word('Internal', 16), 90.50)]
for i, (at, lab, head, hat, end) in enumerate(HDR):
    text(f'hdr_lab{i}', lab, at + 0.12, end - at - 0.12, font='sans', size=30, weight=600, tracking=14, color=PIST, y=1110, enter='track', exit='fade', enterDur=10)
    text(f'hdr{i}', head, hat, end - hat, size=104 if len(head) > 16 else 112, y=1170, enter='type', exit='rise', stagger=1, enterDur=4, w=940,
         sfx='tick', sfxAt=hat, sfxGain=-4, ref='typewriter letters (T2/T8)')
    cue('riser', at, -3, f'riser into {lab}'); cue('flash_hit', at, 0, f'{lab} silhouette flash (X4)'); cue('impact_soft', at + 0.1, -1, f'{lab} giant numeral lands (T11)')
cue('impact_soft', word('മൂന്ന്', 2) + 0.1, -3, 'giant 3 lands'); cue('flash_hit', 0.0, -2, 'opening silhouette flash (X1)')
# Gen Z / Alpha / Beta (B05): box knock-out chips, one per spoken word
for i, (k, w_) in enumerate([('GEN Z', 'Gen'), ('GEN ALPHA', 'Alpha'), ('GEN BETA', 'Beta')]):
    at = word(w_, 3, 13.0 if i == 0 else 13.9)
    if i == 2: at = word('Gen', 3, 14.6)
    text(f'gen{i}', k, at, 15.9 - at, font='sans', size=54, weight=700, tracking=6, x=120, y=420 + i * 120, w=840, align='left', enter='box', exit='rise',
         box=HOLLY, stagger=1, enterDur=6, sfx='swish_text' if i != 1 else None, sfxAt=at, sfxGain=-3, ref='box wipe (T10)')
# 51 villas -> 51 workspaces: the numeral persists across the cut; the word morphs (text-to-text)
v51 = word('51', 4); w51 = word('51', 4, v51 + 0.5)
text('n51_villas', 'SIGNATURE VILLAS', v51 + 0.25, w51 - v51 - 0.25, font='sans', size=34, weight=600, tracking=10, y=560, enter='track', exit='morph', enterDur=10)
text('n51_ws', 'WORKSPACES · PLANNED', w51, 21.7 - w51, font='sans', size=34, weight=600, tracking=10, y=560, enter='morph', exit='fade', enterDur=8,
     sfx='sweep_tonal', sfxAt=w51, sfxGain=-1, ref='text-to-text morph across the cut')
cue('accent_num', v51 + 0.82, -2, '51 counter lands')
# Work from Nature Office (B08)
wk = word('Work', 6)
text('wfn1', 'Work from', wk, 28.33 - wk, size=96, y=380, enter='rise', exit='rise', stagger=2)
text('wfn2', 'Nature', word('Nature', 6), 28.33 - word('Nature', 6), size=150, italic=True, weight=600, color=PIST, y=470, enter='fly', stagger=1, enterDur=8, ease='back',
     sfx='swish_text', sfxAt=word('Nature', 6), ref='letter fly-in (T9)')
text('wfn3', 'OFFICE', word('Office', 6), 28.33 - word('Office', 6), font='sans', size=46, weight=600, tracking=24, y=650, enter='track', enterDur=12, sfx='airy', sfxAt=word('Office', 6))
# own workspace (B11)
ow = word('സ്വന്തമായിട്ട്', 8)
text('own_ws', 'സ്വന്തമായിട്ട് ഒരു workspace', max(41.46, ow), 43.4 - max(41.46, ow), font='mlSerif', size=74, y=420, enter='rise', exit='rise', stagger=4,
     ref='masked rise (Malayalam animated per word: no letter splitting)')
# USP card
text('card_lab', 'OUR USP · 01', 44.4, 1.0, font='sans', size=30, weight=600, tracking=12, color=PIST, y=1600, enter='track', exit='none', enterDur=10)
cue('accent_num', 44.06, -3, 'USP card push (X7)')
# Manjeri (B12)
text('manjeri', 'MANJERI · MALAPPURAM', 49.62, 51.6 - 49.62, font='sans', size=44, weight=700, tracking=8, x=90, y=420, align='left', enter='track', enterDur=12,
     sfx='airy', sfxAt=49.62, sfxGain=2)
text('manjeri2', 'our culture, our roots', 50.0, 51.6 - 50.0, size=72, italic=True, weight=600, color=GOLD, x=90, y=490, align='left', enter='rise', stagger=3)
cue('accent_num', 49.55, -4, 'map pin drop')
# privacy (B14)
pv = word('privacy', 11)
text('privacy', 'privacy', pv, 64.4 - pv, size=170, italic=True, weight=600, y=520, enter='fly', stagger=1, enterDur=8, ease='back', marker=True,
     sfx='marker', sfxAt=pv + 0.25, sfxGain=2, ref='word + marker scribble (T6)')
text('privacy2', 'ISSUES', word('issues', 11), 64.4 - word('issues', 11), font='sans', size=40, weight=600, tracking=20, y=740, enter='track', enterDur=10)
# clubhouse floating architectural label (B15)
text('club_lab', 'CLUBHOUSE', 76.12, 77.6 - 76.12, font='sans', size=40, weight=700, tracking=10, x=560, y=380, w=440, align='left', enter='track', enterDur=10,
     leader=True, ref='floating architectural label')
# shared maid quarters (B16)
sm = word('shared', 13)
text('smq', 'Shared maid quarters', sm, 79.9 - sm, size=96, y=380, enter='rise', stagger=3, sfx='swish_text', sfxAt=sm, sfxGain=-2)
text('smq2', 'PLANNED · INSIDE THE CLUBHOUSE', sm + 0.5, 79.9 - sm - 0.5, font='sans', size=26, weight=600, tracking=6, color=PIST, y=520, enter='track', enterDur=10)
# 2-3 villas · 1 maid (B17): icons (component) + label
text('maid_lab', '2–3 VILLAS · 1 SHARED MAID', 81.9, 83.2 - 81.9, font='sans', size=50, weight=700, tracking=2, y=440, enter='box', box=HOLLY, stagger=1, enterDur=6,
     sfx='swish_text', sfxAt=81.9, sfxGain=-3)
for k in range(3): cue('accent_num', 80.9 + k * 0.18, -9, 'house icon pop')
cue('accent_num', 81.6, -6, 'maid icon pop')
# morning hectic (B19)
mo = word('morning', 17); he = word('hectic', 17)
text('morning', 'MORNING', mo, 100.5 - mo, size=150, y=470, enter='fly', stagger=1, enterDur=7, ease='back', sfx='swish_text', sfxAt=mo)
text('hectic', 'hectic', he, 100.5 - he, size=130, italic=True, weight=600, color=GOLD, y=620, enter='type', stagger=1, enterDur=3)
# breakfast concept (B20)
fd = word('food', 19)
text('bfast', 'Breakfast to every villa', fd - 0.4, 110.78 - fd + 0.4, size=88, y=400, enter='rise', stagger=3)
text('bfast2', 'CONCEPT', fd, 110.78 - fd, font='sans', size=26, weight=600, tracking=14, color=PIST, y=520, enter='track', enterDur=10)
# cloud kitchen (B21)
ck = word('cloud', 20)
text('ck1', 'collaborate', 116.3, ck - 116.3, size=96, italic=True, weight=600, color=GOLD, y=420, enter='type', exit='morph', stagger=1, enterDur=3)
text('ck2', 'Internal cloud kitchen', ck, 118.86 - ck, size=96, y=420, enter='morph', stagger=2, sfx='sweep_tonal', sfxAt=ck, sfxGain=-2, ref='text-to-text morph')
text('ck3', 'PLANNED · ASSOCIATION-RUN', ck + 0.35, 118.86 - ck - 0.35, font='sans', size=26, weight=600, tracking=6, color=PIST, y=540, enter='track', enterDur=10)
# closing (B23)
ins = word('inside', 22)
text('close1', 'inside our', ins, 131.73 - ins, size=84, italic=True, weight=600, y=420, enter='rise', stagger=3)
text('close2', 'VILLA PROJECT', word('villa', 22), 131.73 - word('villa', 22), size=118, y=520, enter='fly', stagger=1, enterDur=8, ease='back',
     sfx='swish_text', sfxAt=word('villa', 22))
cue('riser', 131.73 + 1.15, -6, 'into logo'); cue('logo_signature', 131.73 + 1.15, 0, 'logo resolves'); cue('swish_text', 131.73 + 2.0, -6, 'tagline')

# caption-hidden windows = designed-text moments
HID = [[0.0, 0.2], [0.86, 2.30], [3.37, 6.71], [8.08, 11.08], [13.18, 15.9], [18.57, 21.7], [25.91, 28.33], [41.46, 43.4], [43.98, 48.03],
       [49.5, 51.6], [62.5, 64.4], [77.6, 79.9], [80.76, 83.2], [87.13, 90.5], [98.99, 100.5], [108.27, 110.78], [116.23, 118.86], [129.99, 131.73]]

# caption SFX: selective (emphasis beat starts only, >=1.6 s from any other cue, never inside hidden windows)
allc = [c['at'] for c in C] + [e['sfxAt'] for e in T if e['sfx']]
cap = []
for bt in beats['beats']:
    w0 = bt['words'][0]
    if w0['style'] != 'em' or any(a <= bt['t0'] < b_ for a, b_ in HID): continue
    if all(abs(bt['t0'] - x) >= 1.6 for x in allc + [c['at'] for c in cap]): cap.append(dict(sfx='swish_text', at=round(bt['t0'], 3), gain=-6, why=f"caption emphasis '{w0['w']}'"))
cues = C + [dict(sfx=e['sfx'], at=e['sfxAt'], gain=e['sfxGain'], why=f"text {e['id']}") for e in T if e['sfx']] + cap
cues.sort(key=lambda c: c['at'])
json.dump({'texts': T, 'hidden': HID, 'picks': plan['picks'], 'cues': cues}, open(f'{root}/render/src/data/fx.json', 'w'), ensure_ascii=False, indent=1)
json.dump(cues, open(f'{root}/work/sfx_cues.json', 'w'), indent=1)
print(len(T), 'text elements,', len(cues), 'sfx cues (', len(cap), 'caption)')
