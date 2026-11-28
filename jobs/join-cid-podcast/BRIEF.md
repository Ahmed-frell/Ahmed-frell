# JOIN CID podcast edit: brief (paste into a new session on the "Video edits - Drive and ASR" environment, branch ccr-1a47f790-548ytu)

Use the skill `podcast-redword-kinetic-edit` (`.claude/skills/podcast-redword-kinetic-edit/`; read SKILL.md and references/reference-breakdown.md first).

**Step 1 only right now: a ROUGH CUT.** Stop after it and wait for the user's transcript.

## Inputs
- **Raw take:** Drive `IMG_2376.MOV`, id `1VvRlPh6jm67ERgWdplCkhJEMZ-nOhNdo` (228,410,843 bytes, link-shared), folder https://drive.google.com/drive/folders/1aj4XxBHxaIYHv47ciwjPhyY7llvbMAgX.
  Download it directly: `curl -L -o IMG_2376.MOV "https://drive.usercontent.google.com/download?id=1VvRlPh6jm67ERgWdplCkhJEMZ-nOhNdo&export=download&confirm=t"`. Verify the size and check rotation.
- **Reference:** Drive folder https://drive.google.com/drive/folders/1nuw0kVr_ImuKYqUmHRmZb4myAKJCW9dr (`VID_20261127_200232_220.mp4`). It is already analysed in the skill references.
- **End logo:** `jobs/join-cid-podcast/join-cid-logo-end.mp4` (JOIN CID 3D logo on black, 1920x1080, 10.5 s, silent). It must END the video and replaces the skill's generic end card.
- **Output: 1080 x 566 px**, 30 fps. Cover-fit (scale and crop) with the face in the upper third.

## Rough cut
1. Transcribe offline with faster-whisper (word timestamps; auto-detect Malayalam/English; say so if Malayalam ASR is poor).
2. Remove unwanted conversation: off-topic and crew chatter, false starts and restarts, repeated takes (keep the best), pauses over about 0.6 s, coughs and dead air.
   Cuts only, with 10–20 ms audio crossfades. Never alter the voice or invent words.
3. Render one continuous `roughcut_1080x566.mp4` (H.264 CRF 18, AAC 192k) with no grade, text or effects.
4. Write `roughcut_edl.md` with the kept segments (source to timeline), the removed parts with their reasons, and the ASR draft transcript labelled as a machine draft.
5. Deliver it to the user and ask for the transcript.

## Later (after the transcript)
- Apply the reference grade (warm natural podcast look, amber/tungsten mids, deep blacks, natural skin), the reference text animations
  (letterbox open, line/side captions, red key words behind the speaker, chrome script hero word, editorial stack, HUD), subtle punch-in
  camera moves on key words, and the reference SFX (whoosh-impact, sub boom, ticks).
- Confirm "same background voice as the reference": the reference has no music bed, only dialogue plus tail SFX.
- NO Instagram or social watermark anywhere. Ask for the handle and show title. End on the JOIN CID logo clip, with a sub boom on its first frame.
- Re-lay the skill's layout for 1080x566 and run a `--preview` before the full render.
