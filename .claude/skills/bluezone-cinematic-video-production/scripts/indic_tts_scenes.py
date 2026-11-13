import sys, json
from TTS.utils.synthesizer import Synthesizer
M, scenes_json, outdir, spk, ls = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5])
syn = Synthesizer(tts_checkpoint=f'{M}/fastpitch/best_model.pth', tts_config_path=f'{M}/fastpitch/config_local.json',
                  tts_speakers_file=f'{M}/fastpitch/speakers.pth', vocoder_checkpoint=f'{M}/hifigan/best_model.pth',
                  vocoder_config=f'{M}/hifigan/config.json', use_cuda=False)
syn.tts_model.length_scale = ls  # native duration control (cleaner than time-stretching afterwards)
for k, t in json.load(open(scenes_json)).items():
    wav = syn.tts(t, speaker_name=spk, split_sentences=True)
    syn.save_wav(wav, f'{outdir}/scene{k}_{spk}_ls.wav'); print('scene', k, round(len(wav) / syn.output_sample_rate, 2), 's', flush=True)
