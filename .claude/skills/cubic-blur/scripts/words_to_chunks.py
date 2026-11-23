#!/usr/bin/env python3
"""Turn word timestamps into a starter captions.json for render_cubic_blur.py.

usage: words_to_chunks.py words.json captions.json [--x 0.9 --y 0.12 --align right]

words.json: whisper / faster-whisper style, either
  [{"word": "one", "start": 0.10, "end": 0.32}, ...]   or
  {"segments": [{"words": [...]}, ...]}
The output is a STARTING POINT: review key words, stacks and placement per shot by hand.
"""
import argparse, json, re

FUNCTION = set("""a an the of on in at to for from by with as is are was were be been being am i i'm i've
my your our their his her its me you we they he she it this that these those and or but so if then than
just how do does did what which who when where why can could would should will shall may might must
have has had not no all some any into onto over up out about like there here very really
most more these those our its it's i'll i'd let's""".split())


def load_words(path):
    j = json.load(open(path))
    if isinstance(j, dict):
        j = [w for s in j.get("segments", []) for w in s.get("words", [])]
    out = []
    for w in j:
        text = (w.get("word") or w.get("text") or "").strip()
        clean = re.sub(r"[^\w'’-]", "", text)
        if clean:
            out.append({"w": clean, "s": float(w["start"]), "e": float(w["end"]),
                        "punct": bool(re.search(r"[.,!?;:]$", text))})
    return out


def is_key(w):
    return w.lower().strip("'’") not in FUNCTION


def norm(w):
    return "I" if w.lower() == "i" else ("I" + w[1:].lower() if w.lower().startswith("i'") else w.lower())


def phrases(words, pause=0.12):
    cur = []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        if nxt is None or w["punct"] or nxt["s"] - w["e"] >= pause:
            yield cur
            cur = []


def chunk_phrase(ph):
    chunks, cur = [], []
    for w in ph:
        has_key = any(is_key(x["w"]) for x in cur)
        if is_key(w["w"]) and has_key:
            # a short run (<=2) of filler words before this key belongs to it ("on my / page");
            # a longer run stays under the previous key ("one / of the most")
            ki = max(i for i, x in enumerate(cur) if is_key(x["w"]))
            tail = cur[ki + 1:]
            if 0 < len(tail) <= 2:
                chunks.append(cur[:ki + 1]); cur = tail
            else:
                chunks.append(cur); cur = []
        elif len(cur) >= 4:
            chunks.append(cur); cur = []
        cur.append(w)
    if cur:
        # a short trailing run of function words joins the previous chunk
        if chunks and not any(is_key(x["w"]) for x in cur) and len(cur) <= 2 and len(chunks[-1]) + len(cur) <= 4:
            chunks[-1] += cur
        else:
            chunks.append(cur)
    return chunks


def to_caption(ch, idx, a):
    ki = next((i for i, w in enumerate(ch) if is_key(w["w"])), None)
    lines = []
    if ki is None:
        lines.append({"text": " ".join(norm(w["w"]) for w in ch)})
    else:
        before, key, after = ch[:ki], ch[ki], ch[ki + 1:]
        t0 = ch[0]["s"]
        if before:
            lines.append({"text": " ".join(norm(w["w"]) for w in before)})
        lines.append({"text": norm(key["w"]), "key": True, "delay": round(max(0.0, key["s"] - t0 - 0.03), 3) if before else 0})
        if after:
            lines.append({"text": " ".join(norm(w["w"]) for w in after),
                          "delay": round(max(0.0, after[0]["s"] - t0 - 0.03), 3)})
        if before:
            lines[0]["delay"] = 0
    return {"start": round(ch[0]["s"] - 0.03, 3), "end": round(ch[-1]["e"], 3),
            "x": a.x, "y": a.y, "align": a.align, "lines": lines}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("words"); ap.add_argument("out")
    ap.add_argument("--x", type=float, default=0.90)
    ap.add_argument("--y", type=float, default=0.12)
    ap.add_argument("--align", default="right", choices=["left", "right", "center"])
    a = ap.parse_args()
    words = load_words(a.words)
    caps = []
    for ph in phrases(words):
        for ch in chunk_phrase(ph):
            caps.append(to_caption(ch, len(caps), a))
    json.dump({"chunks": caps}, open(a.out, "w"), indent=2)
    print(f"{len(words)} words -> {len(caps)} chunks -> {a.out}")


if __name__ == "__main__":
    main()
