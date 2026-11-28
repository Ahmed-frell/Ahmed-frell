#!/usr/bin/env python3
"""Render a podcast clip in the "red-word kinetic" style from an edit JSON (see templates/edit.example.json).

Usage:  python3 render_reel.py edit.json [--preview START-END] [--no-tail]

Pipeline: (1) concat + cover-fit the A-roll/B-roll segments to the output size/fps (aroll.mp4),
(2) pipe every frame through PIL and draw the layers in this order:
    footage -> layers marked behind (red word fill, behind captions) -> person matte (optional)
    -> red-word outline over the person -> front layers (script word, stack, captions) -> HUD
    -> letterbox bars. No social watermark/handle badge is drawn on the clip or the title card.
(3) append the grunge title card and the social end card, (4) mix dialogue + synthetic SFX, encode H.264/AAC.
Only PIL, numpy and ffmpeg are needed. Fonts come from ../assets (all SIL OFL).
"""
import json, math, os, random, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
INTER = '/usr/share/fonts/opentype/inter'


def font_path(name):
    cands = {
        'red': [f'{ASSETS}/Anton-Regular.ttf', f'{INTER}/Inter-Black.otf'],
        'script': [f'{ASSETS}/GreatVibes-Regular.ttf', f'{INTER}/InterDisplay-ThinItalic.otf'],
        'caps': [f'{INTER}/Inter-BlackItalic.otf', f'{ASSETS}/Anton-Regular.ttf'],
        'body': [f'{INTER}/Inter-Regular.otf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'],
        'bold': [f'{INTER}/Inter-Bold.otf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
        'thin': [f'{INTER}/Inter-Light.otf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'],
        'title': [f'{ASSETS}/Michroma-Regular.ttf', f'{INTER}/Inter-Regular.otf'],
        'handle': [f'{ASSETS}/BebasNeue-Regular.ttf', f'{INTER}/Inter-Bold.otf'],
        'mono': ['/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf', f'{INTER}/Inter-Regular.otf'],
    }[name]
    for c in cands:
        if os.path.exists(c):
            return c
    return cands[-1]


_FC = {}
def F(name, size):
    k = (name, int(size))
    if k not in _FC:
        _FC[k] = ImageFont.truetype(font_path(name), max(6, int(size)))
    return _FC[k]


def ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def text_img(text, font, fill=(255, 255, 255, 255), spacing=0, stroke=0, stroke_fill=None, pad=None):
    """Render text tightly to an RGBA image (letter-spacing in px)."""
    pad = pad if pad is not None else max(4, stroke * 2 + 4)
    widths = [font.getlength(ch) for ch in text]
    w = int(sum(widths) + spacing * max(0, len(text) - 1) + pad * 2)
    asc, desc = font.getmetrics()
    h = asc + desc + pad * 2
    im = Image.new('RGBA', (max(1, w), h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if spacing == 0:
        d.text((pad, pad), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    else:
        x = pad
        for ch, cw in zip(text, widths):
            d.text((x, pad), ch, font=font, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
            x += cw + spacing
    bb = im.getbbox()
    return im.crop(bb) if bb else im


def gradient_fill(mask_img, stops):
    """Fill an RGBA image's alpha with a vertical colour gradient. stops: list of (pos, (r,g,b))."""
    w, h = mask_img.size
    ys = np.linspace(0, 1, h)[:, None]
    out = np.zeros((h, w, 3), np.float32)
    for c in range(3):
        out[..., c] = np.interp(ys, [s[0] for s in stops], [s[1][c] for s in stops]).repeat(w, 1)
    g = Image.fromarray(out.astype(np.uint8), 'RGB').convert('RGBA')
    g.putalpha(mask_img.split()[3])
    return g


def paste(base, im, x, y, alpha=1.0):
    if alpha < 1.0:
        a = im.split()[3].point(lambda v: int(v * alpha))
        im = im.copy(); im.putalpha(a)
    base.alpha_composite(im, (int(x), int(y)))


def ig_glyph(size, colour='white', grad_t=0.0):
    """Generic camera-glyph (rounded square + lens + dot). grad_t 0..1 blends white -> warm gradient."""
    s = int(size); im = Image.new('RGBA', (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    lw = max(2, s // 11)
    d.rounded_rectangle([lw // 2, lw // 2, s - lw // 2 - 1, s - lw // 2 - 1], radius=s * 0.28, outline=(255, 255, 255, 255), width=lw)
    r = s * 0.22; c = s / 2
    d.ellipse([c - r, c - r, c + r, c + r], outline=(255, 255, 255, 255), width=lw)
    dr = max(1.5, s * 0.055); dx, dy = s * 0.74, s * 0.26
    d.ellipse([dx - dr, dy - dr, dx + dr, dy + dr], fill=(255, 255, 255, 255))
    if grad_t > 0:
        g = gradient_fill(im, [(0, (250, 160, 60)), (0.45, (230, 40, 110)), (1, (140, 50, 220))])
        im = Image.blend(im, g, min(1, grad_t))
    return im


class Hud:
    """Tracking-data overlay: drifting points with 'x: y:' readouts, dotted links, thin red boxes."""
    def __init__(self, W, H, seed=3, n=5):
        self.W, self.H, self.n = W, H, n
        rnd = random.Random(seed)
        self.pts = [(rnd.uniform(0.45, 0.85), rnd.uniform(0.08, 0.95), rnd.uniform(0, 6.28), rnd.uniform(0.3, 0.9)) for _ in range(n)]
        self.boxes = [(rnd.uniform(0.45, 0.7), rnd.uniform(0.3, 0.7), rnd.uniform(0.12, 0.22), rnd.uniform(0.08, 0.16), rnd.uniform(0, 6.28)) for _ in range(2)]

    def draw(self, img, t, alpha=1.0):
        W, H = self.W, self.H
        d = ImageDraw.Draw(img)
        f = F('mono', max(9, H * 0.014))
        P = []
        for (x, y, ph, sp) in self.pts:
            px = (x + 0.03 * math.sin(t * sp + ph)) * W
            py = (y + 0.025 * math.cos(t * sp * 1.3 + ph)) * H
            P.append((px, py))
        a = int(200 * alpha)
        for (x0, y0), (x1, y1) in zip(P, P[1:]):
            L = math.hypot(x1 - x0, y1 - y0); n = int(L / 6)
            for i in range(0, n, 2):
                u0, u1 = i / n, min(1, (i + 1) / n)
                d.line([(x0 + (x1 - x0) * u0, y0 + (y1 - y0) * u0), (x0 + (x1 - x0) * u1, y0 + (y1 - y0) * u1)], fill=(255, 255, 255, a // 2), width=1)
        for px, py in P:
            d.ellipse([px - 2, py - 2, px + 2, py + 2], fill=(255, 255, 255, a))
            d.text((px + 6, py - 6), f'x: {int(px * 1.5)}  y: {int(py * 1.5)}', font=f, fill=(255, 255, 255, a))
        for (x, y, w, h, ph) in self.boxes:
            bx = (x + 0.02 * math.sin(t * 0.7 + ph)) * W; by = (y + 0.02 * math.cos(t * 0.5 + ph)) * H
            d.rectangle([bx, by, bx + w * W, by + h * H], outline=(220, 30, 40, int(150 * alpha)), width=1)


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def probe_size(path):
    o = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
    w, h = o.split(',')[:2]; return int(w), int(h)


# Named grades (ffmpeg filter chains). "reference_warm" matches the reference reel: warm amber/tungsten mids, slightly
# cooled shadows, gentle S-curve, a touch less saturation, soft vignette. Skin stays natural.
GRADES = {
    'reference_warm': "eq=contrast=1.06:saturation=0.93:gamma=0.98,"
                      "colorbalance=rs=-0.02:bs=0.02:rm=0.05:gm=0.01:bm=-0.05:rh=0.02:bh=-0.03,"
                      "curves=all='0/0.02 0.25/0.22 0.75/0.78 1/0.98',vignette=PI/5",
    # Closer to the reference's dark amber set when the footage is a bright/white room: darker mids, strong warm
    # mids/highs, cooled-out blues, deeper vignette. Tested on the JOIN CID take (face stays readable).
    'reference_moody': "eq=contrast=1.12:saturation=1.05:gamma=0.85,"
                       "colorbalance=rs=0.04:gs=-0.01:bs=-0.06:rm=0.12:gm=0.0:bm=-0.12:rh=0.06:gh=0.0:bh=-0.10,"
                       "curves=all='0/0 0.25/0.16 0.6/0.5 1/0.92',vignette=PI/4.5",
    # Same warm look, one stop lighter: for wide or dimmer takes where reference_moody crushes the speaker.
    'reference_moody_light': "eq=contrast=1.08:saturation=1.05:gamma=1.0,"
                             "colorbalance=rs=0.03:gs=-0.01:bs=-0.05:rm=0.10:gm=0.0:bm=-0.10:rh=0.05:gh=0.0:bh=-0.08,"
                             "curves=all='0/0 0.25/0.21 0.6/0.6 1/0.96',vignette=PI/5",
}


def build_aroll(cfg, base, W, H, fps):
    out = os.path.join(base, cfg.get('work_dir', 'work'), 'aroll.mp4'); os.makedirs(os.path.dirname(out), exist_ok=True)
    segs = cfg['segments']; args = []; fc = []
    grade = cfg.get('grade') or ''
    grade = (',' + GRADES.get(grade, grade)) if grade else ''
    # iPhone HDR (HLG, bt2020 10-bit) must be tonemapped to SDR bt709 first or it looks washed out/grey
    tm = ('zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,'
          'zscale=t=bt709:m=bt709:r=tv,format=yuv420p,') if cfg.get('hdr_tonemap') else ''
    for i, s in enumerate(segs):
        args += ['-ss', str(s['in']), '-to', str(s['out']), '-i', os.path.join(base, s['src'])]
        hold = max(0.0, s.get('video_in', s['in']) - s['in'])  # skip an in-camera move: video starts later, first good frame held
        hv = f"trim=start={hold:.3f},setpts=PTS-STARTPTS,tpad=start_duration={hold:.3f}:start_mode=clone," if hold else ''
        fc.append(f"[{i}:v]{hv}{tm}scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={fps},setsar=1{grade}[v{i}];"
                  f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo[a{i}];")
    fc.append(''.join(f'[v{i}][a{i}]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=1[v][a]')
    run(['ffmpeg', '-y', '-v', 'error', *args, '-filter_complex', ''.join(fc), '-map', '[v]', '-map', '[a]',
         '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', '-c:a', 'pcm_s16le', out.replace('.mp4', '.mov')])
    return out.replace('.mp4', '.mov')


class Composer:
    def __init__(self, cfg, W, H, fps):
        self.cfg, self.W, self.H, self.fps = cfg, W, H, fps
        self.ev = cfg.get('events', [])
        self.hud = Hud(W, H, **cfg.get('hud', {}).get('params', {})) if cfg.get('hud', {}).get('enabled', True) else None
        self.handle = cfg.get('handle', '@your.handle')
        self.matte_dir = cfg.get('matte_dir')
        self._cache = {}

    def active(self, t, types):
        return [e for e in self.ev if e['type'] in types and e['t'] <= t < e['end']]

    def zoom(self, t):
        """Camera moves on the footage: {type: zoom, t, end, from, to, ramp (s, default whole span), cx, cy}.
        A short ramp (0.15 s) is a punch-in; ramp = span is a slow push. Footage only, overlays stay put."""
        for e in self.active(t, ['zoom']):
            ramp = e.get('ramp', e['end'] - e['t'])
            p = ease_out((t - e['t']) / ramp) if ramp > 0 else 1
            return e.get('from', 1.0) + (e.get('to', 1.08) - e.get('from', 1.0)) * p, e.get('cx', 0.5), e.get('cy', 0.4)
        return None

    def matte(self, fi):
        if not self.matte_dir:
            return None
        p = os.path.join(self.matte_dir, f'f{fi:05d}.png')
        return Image.open(p).convert('RGBA') if os.path.exists(p) else None

    # ---- layers -------------------------------------------------------------------------
    def red_word(self, e, t):
        W, H = self.W, self.H; k = int((t - e['t']) * self.fps)
        key = ('red', e['text'])
        if key not in self._cache:
            hgt = e.get('height', 0.56) * H
            im = text_img(e['text'].upper(), F('red', hgt * 1.25), fill=tuple(e.get('colour', [215, 12, 18])) + (255,))
            im = im.resize((im.width, int(hgt)), Image.LANCZOS)
            maxw = e.get('max_width', 0.9) * W
            if im.width > maxw:
                im = im.resize((int(maxw), im.height), Image.LANCZOS)  # horizontal squash, like DISTRIBUTIONS
            outline = im.split()[3].filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
            ol = Image.new('RGBA', im.size, tuple(e.get('colour', [215, 12, 18])) + (0,)); ol.putalpha(outline.filter(ImageFilter.MaxFilter(3)))
            flash = text_img(e['text'].upper(), F('thin', H * 0.11), spacing=H * 0.03)
            self._cache[key] = (im, ol, flash)
        im, ol, flash = self._cache[key]
        if k == 0 and e.get('flash', True):
            return ('front', flash, (W - flash.width) / 2, e.get('y', 0.02) * H + im.height * 0.25), None
        s = 1 + 0.06 * (1 - ease_out(k / 5))
        imr = im if s == 1 else im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
        olr = ol if s == 1 else ol.resize(imr.size, Image.LANCZOS)
        x = (W - imr.width) / 2 + e.get('dx', 0) * W; y = e.get('y', 0.02) * H - (imr.height - im.height) / 2
        return ('behind', imr, x, y), (olr, x, y)

    def script_word(self, e, t):
        W, H = self.W, self.H; k = int((t - e['t']) * self.fps)
        key = ('script', e['text'])
        if key not in self._cache:
            base = text_img(e['text'], F('script', e.get('size', 0.5) * H), pad=20)
            chrome = gradient_fill(base, [(0, (235, 245, 255)), (0.35, (150, 190, 240)), (0.5, (255, 255, 255)), (0.75, (120, 160, 215)), (1, (240, 248, 255))])
            shadow = base.split()[3].filter(ImageFilter.GaussianBlur(6))
            sh = Image.new('RGBA', base.size, (0, 0, 0, 0)); sh.putalpha(shadow.point(lambda v: v // 2))
            red = text_img(e['text'], F('script', e.get('size', 0.5) * H), fill=(0, 0, 0, 0), stroke=3, stroke_fill=(215, 20, 25, 255), pad=20)
            self._cache[key] = (chrome, sh, red)
        chrome, sh, red = self._cache[key]
        x = e.get('x', 0.5) * W - chrome.width / 2; y = e.get('y', 0.58) * H - chrome.height / 2
        if k < 2:
            return [('front', red, x, y)] if k == 0 else []
        a = ease_out((k - 2) / 3)
        return [('front', sh, x + 4, y + 6, a), ('front', chrome, x, y, a)]

    def stack(self, e, t):
        """Editorial stacked block: lines of (word, style, time). Caps words wipe in right-to-left."""
        W, H = self.W, self.H; out = []
        sz = e.get('size', 0.045) * H; x0 = e.get('x', 0.06) * W; y = e.get('y', 0.1) * H
        for line in e['lines']:
            x = x0 + line[0][3] * W if len(line[0]) > 3 else x0; lh = 0
            for w in line:
                word, style, wt = w[0], w[1], w[2]
                f = F('script', sz * 1.7) if style == 'script' else F('caps', sz)
                im = text_img(word if style == 'script' else word.upper(), f, pad=2)
                lh = max(lh, im.height if style != 'script' else im.height * 0.62)
                if t >= wt:
                    p = ease_out((t - wt) * self.fps / 5)
                    if p < 1 and style != 'script':
                        cut = int(im.width * (1 - p)); im = im.copy(); ImageDraw.Draw(im).rectangle([0, 0, cut, im.height], fill=(0, 0, 0, 0))
                    yy = y - (im.height * 0.38 if style == 'script' else 0)
                    if e.get('shadow', False):  # soft dark halo so the stack reads over busy backgrounds
                        sh = Image.new('RGBA', (im.width + 24, im.height + 24), (0, 0, 0, 0)); sh.paste(im, (12, 12), im)
                        a_ = sh.split()[3].filter(ImageFilter.GaussianBlur(7)).point(lambda v: min(255, int(v * 1.6)))
                        shd = Image.new('RGBA', sh.size, (0, 0, 0, 0)); shd.putalpha(a_)
                        out.append(('front', shd, x - 12, yy - 10, 0.75 * (p if style == 'script' else 1)))
                    out.append(('front', im, x, yy, p if style == 'script' else 1))
                x += im.width + sz * 0.15
            y += lh * e.get('line_gap', 1.06)
        return out

    def caption(self, e, t):
        """style line: words accumulate along a baseline; side: one word at a time; center: bold single word."""
        W, H = self.W, self.H; style = e.get('style', 'side'); layer = 'behind' if e.get('behind') else 'front'
        said = [w for w in e['words'] if w[1] <= t]
        if not said:
            return []
        if style == 'line':
            f = F('body', e.get('size', 0.042) * H); out = []
            x, y = e.get('x', 0.03) * W, e.get('y', 0.5) * H; gap = e.get('gap', 0.09) * W
            for i, (wd, wt) in enumerate(said):
                im = text_img(wd, f)
                if x + im.width > W * 0.97:
                    x, y = e.get('x', 0.03) * W + gap * 2.5, y + im.height * 1.8
                out.append((layer, im, x, y, ease_out((t - wt) * self.fps / 3)))
                x += im.width + gap
            return out
        wd, wt = said[-1]
        if style == 'center':
            f = F('bold', e.get('size', 0.075) * H); im = text_img(wd, f, stroke=1, stroke_fill=(0, 0, 0, 90))
            k = (t - wt) * self.fps; s = 1 + 0.12 * (1 - ease_out(k / 4))
            if s != 1:
                im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
            return [(layer, im, e.get('x', 0.5) * W - im.width / 2, e.get('y', 0.47) * H - im.height / 2)]
        f = F('body', e.get('size', 0.05) * H); im = text_img(wd, f)
        return [(layer, im, e.get('x', 0.66) * W, e.get('y', 0.32) * H, ease_out((t - wt) * self.fps / 2))]

    def frame(self, fr, fi):
        W, H, fps = self.W, self.H, self.fps; t = fi / fps
        img = Image.fromarray(fr, 'RGB')
        z = self.zoom(t); box = None
        if z is not None:
            sc, cx, cy = z; cw, ch = W / sc, H / sc
            x0 = min(max(cx * W - cw / 2, 0), W - cw); y0 = min(max(cy * H - ch / 2, 0), H - ch)
            box = (x0, y0, x0 + cw, y0 + ch)
            img = img.resize((W, H), Image.BICUBIC, box=box)
        for e in self.active(t, ['shake']):  # decaying camera shake (footage only)
            k = 1 - (t - e['t']) / (e['end'] - e['t']); amp = e.get('px', 8) * k
            dx = amp * math.sin(t * 90); dy = amp * math.cos(t * 77)
            img = img.resize((int(W * 1.03), int(H * 1.03)), Image.BICUBIC).crop((int(W * 0.015 + dx), int(H * 0.015 + dy), int(W * 0.015 + dx) + W, int(H * 0.015 + dy) + H))
        img = img.convert('RGBA'); layers = []; outlines = []
        for e in self.active(t, ['red_word']):
            L, o = self.red_word(e, t); layers.append(L)
            if o: outlines.append(o)
        for e in self.active(t, ['script_word']):
            layers += self.script_word(e, t)
        for e in self.active(t, ['stack']):
            layers += self.stack(e, t)
        for e in self.active(t, ['caption']):
            layers += self.caption(e, t)
        m = self.matte(fi)
        if m is not None and box is not None:  # the matte must follow the same camera move as the footage
            m = m.resize((W, H), Image.BICUBIC, box=box)
        for L in [l for l in layers if l[0] == 'behind']:
            paste(img, *L[1:])
        if m is not None:
            img.alpha_composite(m)
            for ol, x, y in outlines:
                paste(img, ol, x, y, 0.85)
        for L in [l for l in layers if l[0] == 'front']:
            paste(img, *L[1:])
        if self.hud:
            self.hud.draw(img, t)
        for e in self.active(t, ['flash']):  # white flash, fades out
            a_ = 1 - (t - e['t']) / (e['end'] - e['t'])
            img.alpha_composite(Image.new('RGBA', (W, H), (255, 255, 255, int(255 * e.get('peak', 0.9) * a_))))
        lb = self.cfg.get('letterbox_open')
        if lb and t < lb['dur']:
            vis = H * (0.06 + 0.94 * ease_out(t / lb['dur'])) if fi > 0 else 0
            band = (H - vis) / 2; d = ImageDraw.Draw(img)
            d.rectangle([0, 0, W, band], fill=(0, 0, 0, 255)); d.rectangle([0, H - band, W, H], fill=(0, 0, 0, 255))
        return np.asarray(img.convert('RGB'))

    # ---- tail cards ---------------------------------------------------------------------
    def title_card(self, k, n):
        W, H = self.W, self.H; rnd = random.Random(k // 2)
        yy, xx = np.mgrid[0:H, 0:W]; r = np.hypot((xx - W / 2) / W, (yy - H / 2) / H)
        base = (34 - 30 * r).clip(6, 40)
        base = base + np.random.default_rng(k).normal(0, 4, (H, W))
        img = Image.fromarray(np.dstack([base] * 3).clip(0, 255).astype(np.uint8)).convert('RGBA'); d = ImageDraw.Draw(img)
        for _ in range(rnd.randint(4, 9)):
            x0, y0 = rnd.uniform(0, W), rnd.uniform(0, H); ang = rnd.uniform(0, 6.28); L = rnd.uniform(0.03, 0.25) * W
            d.line([(x0, y0), (x0 + math.cos(ang) * L, y0 + math.sin(ang) * L)], fill=(200, 200, 200, rnd.randint(60, 160)), width=1)
        title = text_img(self.cfg.get('title', 'YOUR SHOW').upper(), F('title', H * 0.03), spacing=H * 0.018, fill=(225, 225, 225, 255))
        paste(img, title, (W - title.width) / 2, H * 0.47)
        fade = min(1, max(0, (n - k) / (self.fps * 1.2)))
        return (np.asarray(img.convert('RGB')).astype(np.float32) * fade).astype(np.uint8)

    def end_card(self, k, n):
        W, H = self.W, self.H; t = k / self.fps
        img = Image.new('RGBA', (W, H), (0, 0, 0, 255))
        pop = 1 - 0.08 * math.sin(min(1, max(0, (t - 0.25) / 0.35)) * math.pi)
        g = ig_glyph(H * 0.13 * pop, grad_t=ease_out((t - 0.45) / 0.6))
        paste(img, g, (W - g.width) / 2, H * 0.37 - g.height / 2)
        txt = text_img(self.handle.upper(), F('handle', H * 0.05)); paste(img, txt, (W - txt.width) / 2, H * 0.5, ease_out(t / 0.3))
        return np.asarray(img.convert('RGB'))


def synth_sfx(cues, total, sr=48000):
    """Original synthetic SFX. cues: list of {kind, t, gain_db}. Kinds: whoosh_impact, sub_boom, tick."""
    out = np.zeros(int(total * sr) + sr, np.float32); rng = np.random.default_rng(7)
    for c in cues:
        i = int(c['t'] * sr); g = 10 ** (c.get('gain_db', -8) / 20)
        if c['kind'] == 'whoosh_impact':
            n = int(0.55 * sr); noise = rng.normal(0, 1, n); env = np.linspace(0, 1, n) ** 2.5
            k = np.ones(40) / 40; wh = np.convolve(noise, k, 'same') * env
            s = max(0, i - n); out[s:s + n] += 0.6 * g * wh[-(i - s):] if i - s < n else 0.6 * g * wh
            m = int(1.2 * sr); tt = np.arange(m) / sr
            imp = (np.sin(2 * math.pi * (60 - 20 * tt) * tt) * np.exp(-tt * 4) + 0.4 * rng.normal(0, 1, m) * np.exp(-tt * 30))
            out[i:i + m] += g * imp[:len(out) - i]
        elif c['kind'] == 'sub_boom':
            m = int(1.4 * sr); tt = np.arange(m) / sr
            out[i:i + m] += g * np.sin(2 * math.pi * (48 - 12 * tt) * tt) * np.exp(-tt * 3)[:len(out) - i]
        elif c['kind'] == 'whoosh':  # short swish that peaks ON t (for text slams)
            n = int(0.32 * sr); noise = rng.normal(0, 1, n); tt = np.linspace(0, 1, n)
            env = np.sin(np.pi * tt) ** 2; sw = np.convolve(noise, np.ones(12) / 12, 'same') * env
            s0 = max(0, i - int(0.24 * sr)); seg = sw[:len(out) - s0]; out[s0:s0 + len(seg)] += 0.9 * g * seg
        elif c['kind'] == 'pop':  # soft pop for words landing
            m = int(0.09 * sr); tt = np.arange(m) / sr
            out[i:i + m] += (g * np.sin(2 * math.pi * (900 - 5000 * tt) * tt) * np.exp(-tt * 55))[:len(out) - i]
        elif c['kind'] == 'flash_hit':  # bright impact for a white flash
            m = int(0.6 * sr); tt = np.arange(m) / sr
            hit = rng.normal(0, 1, m) * np.exp(-tt * 18) * 0.5 + np.sin(2 * math.pi * (80 - 30 * tt) * tt) * np.exp(-tt * 6)
            out[i:i + m] += (g * hit)[:len(out) - i]
        elif c['kind'] == 'tick':
            m = int(0.05 * sr); tt = np.arange(m) / sr
            out[i:i + m] += g * np.sin(2 * math.pi * 2200 * tt) * np.exp(-tt * 120)
    return out


def main():
    cfg_path = sys.argv[1]; base = os.path.dirname(os.path.abspath(cfg_path))
    cfg = json.load(open(cfg_path)); preview = None; tail = '--no-tail' not in sys.argv
    if '--preview' in sys.argv:
        a, b = sys.argv[sys.argv.index('--preview') + 1].split('-'); preview = (float(a), float(b)); tail = False
    fps = cfg.get('fps', 30)
    W, H = cfg['size'] if cfg.get('size') else probe_size(os.path.join(base, cfg['segments'][0]['src']))
    W -= W % 2; H -= H % 2
    aroll = build_aroll(cfg, base, W, H, fps); work = os.path.dirname(aroll)
    comp = Composer(cfg, W, H, fps)
    dec_args = ['-ss', str(preview[0]), '-to', str(preview[1])] if preview else []
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', *dec_args, '-i', aroll, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    silent = os.path.join(work, 'video_noaudio.mp4')
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                            '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', silent], stdin=subprocess.PIPE)
    fi = int(preview[0] * fps) if preview else 0; nbytes = W * H * 3; nmain = 0
    while True:
        buf = dec.stdout.read(nbytes)
        if len(buf) < nbytes:
            break
        enc.stdin.write(comp.frame(np.frombuffer(buf, np.uint8).reshape(H, W, 3), fi).tobytes()); fi += 1; nmain += 1
    main_dur = nmain / fps
    tc = cfg.get('title_card', {'dur': 2.4}) or {'dur': 0}
    end_clip = cfg.get('end_clip')  # {"src": "logo.mp4", "fit": "contain"|"cover"}: replaces the generic end card
    ec = cfg.get('end_card', {'dur': 4.3}) or {'dur': 0}
    tail_dur = 0
    if tail:
        n = int(tc['dur'] * fps)
        for k in range(n):
            enc.stdin.write(comp.title_card(k, n).tobytes())
        tail_dur += n / fps
        if end_clip:
            fit = 'force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2:black' % (W, H) if end_clip.get('fit', 'contain') == 'contain' \
                else 'force_original_aspect_ratio=increase,crop=%d:%d' % (W, H)
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(base, end_clip['src']), '-vf', f'scale={W}:{H}:{fit},fps={fps},setsar=1',
                                  '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
            enc.stdin.write(raw); tail_dur += len(raw) / (W * H * 3) / fps
        else:
            n2 = int(ec['dur'] * fps)
            for k in range(n2):
                enc.stdin.write(comp.end_card(k, n2).tobytes())
            tail_dur += n2 / fps
    enc.stdin.close(); enc.wait(); dec.wait()
    total = main_dur + tail_dur
    cues = list(cfg.get('sfx', []))
    if tail and cfg.get('auto_tail_sfx', True):
        if tc['dur'] > 0:
            cues.append({'kind': 'whoosh_impact', 't': main_dur, 'gain_db': -6})
        cues.append({'kind': 'sub_boom', 't': main_dur + tc['dur'] + 0.05, 'gain_db': -5})
    if preview:
        cues = [dict(c, t=c['t'] - preview[0]) for c in cues if preview[0] <= c['t'] < preview[1]]
    sfx = synth_sfx(cues, total); sfx_wav = os.path.join(work, 'sfx.wav')
    pcm = (np.clip(sfx, -1, 1) * 32767).astype(np.int16)
    run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', '48000', '-ac', '1', '-i', '-', sfx_wav], input=pcm.tobytes())
    out = os.path.join(base, cfg.get('out', 'out.mp4') if not preview else 'preview.mp4')
    music = cfg.get('music')  # {src, start, gain_db, duck_db, fade_in, fade_out}: licensed track supplied by the user
    m_in, m_fc = [], ''
    if music:
        mstart = music.get('start', 0.0) + (preview[0] if preview else 0.0)
        mdelay = max(0.0, -mstart); mstart = max(0.0, mstart)  # negative start = the song comes in later on the timeline
        fo = music.get('fade_out', 2.0)
        m_in = ['-ss', f'{mstart:.3f}', '-i', os.path.join(base, music['src'])]
        g = music.get('gain_db', -18); duck = music.get('duck_db', 8)
        # music sits at gain_db; while the speaker talks it is pulled down a further ~duck_db (sidechain on the dialogue)
        m_fc = (f'[3:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total:.3f},asetpts=PTS-STARTPTS,'
                f'adelay={int(mdelay * 1000)}:all=1,volume={g}dB,afade=t=in:st={mdelay:.3f}:d={music.get("fade_in", 0.6)},afade=t=out:st={max(0, total - fo):.3f}:d={fo}[m0];'
                f'[d]asplit=2[d][sc];[m0][sc]sidechaincompress=threshold=0.03:ratio={max(2, duck)}:attack=15:release=350[m];')
    mix = '[d][2:a][m]amix=inputs=3:normalize=0' if music else '[d][2:a]amix=inputs=2:normalize=0'
    run(['ffmpeg', '-y', '-v', 'error', '-i', silent, *dec_args, '-i', aroll, '-i', sfx_wav, *m_in, '-filter_complex',
         f'[1:a]apad,atrim=0:{total:.3f}[d];' + m_fc + f'{mix},loudnorm=I=-14:TP=-1:LRA=11[a]',
         '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', out])
    print('wrote', out, f'{total:.2f}s', f'{W}x{H}@{fps}')


if __name__ == '__main__':
    main()
