/*  Benchmark Data — Source: Gladia internal benchmark PDF
    Shared across competitors/benchmarks.html                          */

const BENCH = (() => {

  /* ── STT Providers ── */
  const PROVIDERS_STT = [
    { id: 'solaria3',     name: 'Solaria-3',           short: 'Solaria-3',    color: '#FF630F', highlight: true },
    { id: 'gladia',       name: 'Solaria-1',           short: 'Solaria-1',    color: '#947AFC', highlight: true },
    { id: 'assembly3',    name: 'AssemblyAI',          short: 'AssemblyAI',   color: '#06B6D4' },
    { id: 'elevenlabs',   name: 'ElevenLabs Scribe v2', short: 'ElevenLabs',  color: '#3B82F6' },
    { id: 'assembly2',    name: 'AssemblyAI Univ. 2',  short: 'AssemblyAI v2', color: '#22D3EE' },
    { id: 'deepgram',     name: 'Deepgram Nova-3',     short: 'Deepgram',     color: '#13EF93' },
    { id: 'soniox',       name: 'Soniox v4',           short: 'Soniox',       color: '#6366F1' },
    { id: 'speechmatics', name: 'Speechmatics',        short: 'Speechmatics', color: '#0F766E' },
    { id: 'mistral',      name: 'Mistral Voxtral',     short: 'Mistral',      color: '#F472B6' },
  ];

  /* ── STT Summary (WER % per dataset) ── */
  const DATA_STT = {
    'common-voice-24': {
      solaria3: 6.90, gladia: 8.20, assembly3: 3.90, elevenlabs: 3.90, mistral: 5.10,
      speechmatics: 3.80, assembly2: 5.20, deepgram: 7.90, soniox: 7.20,
    },
    'voxpopuli': {
      solaria3: 2.90, gladia: 2.20, assembly3: 2.10, elevenlabs: 1.70, mistral: 2.10,
      speechmatics: 3.00, assembly2: 2.20, deepgram: 3.20, soniox: null,
    },
    'earnings22-full': {
      gladia: 11.80, assembly3: 11.00, elevenlabs: 9.40, mistral: 11.60,
      speechmatics: 10.00, assembly2: 11.10, deepgram: 14.50, soniox: null,
    },
    'earnings22-cleaned': {
      solaria3: 6.40, gladia: 8.10, assembly3: 6.90, elevenlabs: 7.70, mistral: 7.90,
      speechmatics: 7.80, deepgram: 12.00, assembly2: null, soniox: null,
    },
    'multilingual-librispeech': {
      solaria3: 8.00, gladia: 5.90, assembly3: 4.70, elevenlabs: 3.70, mistral: null,
      speechmatics: null, assembly2: 6.20, deepgram: 7.50, soniox: 5.60,
    },
    'pipecat': {
      gladia: 2.70, assembly3: 2.00, elevenlabs: 2.20, mistral: 2.60,
      speechmatics: 2.70, assembly2: 2.50, deepgram: 3.10, soniox: 2.90,
    },
    'switchboard': {
      solaria3: 33.90, gladia: 37.30, assembly3: 42.30, speechmatics: 46.00,
      mistral: 48.10, deepgram: 49.80, elevenlabs: 55.20,
      assembly2: null, soniox: null,
    },
    'real-customer': {
      solaria3: 9.60, elevenlabs: 9.90, assembly3: 10.00, deepgram: 10.70,
      mistral: 12.20, gladia: 12.90,
      speechmatics: null, assembly2: null, soniox: null,
    },
  };

  /* ── STT Detail per dataset (RTFx, Perfect, High WER) ── */
  const DATA_STT_DETAIL = {
    'common-voice-24': {
      solaria3:     { wer: 6.90,  rtfx: null, perfect: null, highWer: null },
      gladia:       { wer: 8.20,  rtfx: 1,  perfect: 904,  highWer: 2 },
      assembly3:    { wer: 3.90,  rtfx: 0,  perfect: 1041, highWer: 1 },
      elevenlabs:   { wer: 3.90,  rtfx: 6,  perfect: 1059, highWer: 3 },
      mistral:      { wer: 5.10,  rtfx: 6,  perfect: 984,  highWer: 2 },
      speechmatics: { wer: 3.80,  rtfx: 2,  perfect: 1067, highWer: 2 },
      assembly2:    { wer: 5.20,  rtfx: 1,  perfect: 968,  highWer: 2 },
      deepgram:     { wer: 7.90,  rtfx: 2,  perfect: 808,  highWer: 0 },
      soniox:       { wer: 7.20,  rtfx: 1,  perfect: 902,  highWer: 7 },
    },
    'voxpopuli': {
      solaria3:     { wer: 2.90,  rtfx: null, perfect: null, highWer: null },
      gladia:       { wer: 2.20,  rtfx: 3,  perfect: 393, highWer: 0 },
      assembly3:    { wer: 2.10,  rtfx: 2,  perfect: 396, highWer: 0 },
      elevenlabs:   { wer: 1.70,  rtfx: 5,  perfect: 418, highWer: 0 },
      mistral:      { wer: 2.10,  rtfx: 5,  perfect: 394, highWer: 0 },
      speechmatics: { wer: 3.00,  rtfx: 6,  perfect: 326, highWer: 0 },
      assembly2:    { wer: 2.20,  rtfx: 3,  perfect: 377, highWer: 0 },
      deepgram:     { wer: 3.20,  rtfx: 7,  perfect: 363, highWer: 0 },
      soniox:       null,
    },
    'earnings22-full': {
      gladia:       { wer: 11.80, rtfx: 28,  perfect: 0, highWer: 0 },
      assembly3:    { wer: 11.00, rtfx: 71,  perfect: 0, highWer: 0 },
      elevenlabs:   { wer: 9.40,  rtfx: 35,  perfect: 0, highWer: 0 },
      mistral:      { wer: 11.60, rtfx: 135, perfect: 0, highWer: 0 },
      speechmatics: { wer: 10.00, rtfx: 17,  perfect: 0, highWer: 0 },
      assembly2:    { wer: 11.10, rtfx: 82,  perfect: 0, highWer: 0 },
      deepgram:     { wer: 14.50, rtfx: 348, perfect: 0, highWer: 0 },
      soniox:       null,
    },
    'earnings22-cleaned': {
      solaria3:     { wer: 6.40,  rtfx: null, perfect: null, highWer: null },
      gladia:       { wer: 8.10,  rtfx: 39,  perfect: 0, highWer: 0 },
      assembly3:    { wer: 6.90,  rtfx: 64,  perfect: 0, highWer: 0 },
      elevenlabs:   { wer: 7.70,  rtfx: 32,  perfect: 0, highWer: 0 },
      mistral:      { wer: 7.90,  rtfx: 57,  perfect: 0, highWer: 0 },
      speechmatics: { wer: 7.80,  rtfx: 24,  perfect: 0, highWer: 0 },
      deepgram:     { wer: 12.00, rtfx: 234, perfect: 0, highWer: 0 },
      assembly2:    null,
      soniox:       null,
    },
    'multilingual-librispeech': {
      solaria3:     { wer: 8.00,  rtfx: null, perfect: null, highWer: null },
      gladia:       { wer: 5.90,  rtfx: 3,  perfect: 367, highWer: 3 },
      assembly3:    { wer: 4.70,  rtfx: 1,  perfect: 508, highWer: 3 },
      elevenlabs:   { wer: 3.70,  rtfx: 15, perfect: 565, highWer: 3 },
      mistral:      null,
      speechmatics: null,
      assembly2:    { wer: 6.20,  rtfx: 3,  perfect: 369, highWer: 2 },
      deepgram:     { wer: 7.50,  rtfx: 7,  perfect: 270, highWer: 4 },
      soniox:       { wer: 5.60,  rtfx: 6,  perfect: 378, highWer: 3 },
    },
    'pipecat': {
      gladia:       { wer: 2.70,  rtfx: 4, perfect: 482, highWer: 0 },
      assembly3:    { wer: 2.00,  rtfx: 2, perfect: 531, highWer: 0 },
      elevenlabs:   { wer: 2.20,  rtfx: 8, perfect: 512, highWer: 0 },
      mistral:      { wer: 2.60,  rtfx: 5, perfect: 485, highWer: 0 },
      speechmatics: { wer: 2.70,  rtfx: 0, perfect: 476, highWer: 0 },
      assembly2:    { wer: 2.50,  rtfx: 1, perfect: 494, highWer: 0 },
      deepgram:     { wer: 3.10,  rtfx: 8, perfect: 449, highWer: 0 },
      soniox:       { wer: 2.90,  rtfx: 2, perfect: 480, highWer: 0 },
    },
    'switchboard': {
      solaria3:     { wer: 33.90, rtfx: 0, perfect: 27, highWer: 3 },
      gladia:       { wer: 37.30, rtfx: 0, perfect: 27, highWer: 3 },
      assembly3:    { wer: 42.30, rtfx: 1, perfect: 28, highWer: 4 },
      speechmatics: { wer: 46.00, rtfx: 0, perfect: 31, highWer: 7 },
      mistral:      { wer: 48.10, rtfx: 6, perfect: 25, highWer: 6 },
      deepgram:     { wer: 49.80, rtfx: 1, perfect: 26, highWer: 7 },
      elevenlabs:   { wer: 55.20, rtfx: 0, perfect: 31, highWer: 6 },
      assembly2:    null,
      soniox:       null,
    },
    'real-customer': {
      solaria3:   { wer: 9.60, rtfx: null, perfect: null, highWer: null },
      elevenlabs: { wer: 9.90, rtfx: null, perfect: null, highWer: null },
      assembly3:  { wer: 10.00, rtfx: null, perfect: null, highWer: null },
      deepgram:   { wer: 10.70, rtfx: null, perfect: null, highWer: null },
      mistral:    { wer: 12.20, rtfx: null, perfect: null, highWer: null },
      gladia:     { wer: 12.90, rtfx: null, perfect: null, highWer: null },
      speechmatics: null,
      assembly2:  null,
      soniox:     null,
    },
  };

  /* ── Multilingual Librispeech — WER by Language ── */
  const DATA_MLS_LANGUAGES = {
    gladia:     { DE: 5.00, ES: 4.00, FR: 4.80, IT: 9.90, PT: 5.30 },
    assembly3:  { DE: 3.50, ES: 3.20, FR: 2.60, IT: 9.70, PT: 4.40 },
    elevenlabs: { DE: 3.10, ES: 3.20, FR: 2.90, IT: 6.10, PT: 3.00 },
    soniox:     { DE: 5.40, ES: 4.40, FR: 5.00, IT: 8.80, PT: 4.30 },
    assembly2:  { DE: 3.40, ES: 4.00, FR: 5.80, IT: 11.90, PT: 5.90 },
    deepgram:   { DE: 6.90, ES: 4.60, FR: 6.20, IT: 8.80, PT: 11.30 },
  };

  /* ── Diarization Providers ── */
  const PROVIDERS_DIARIZATION = [
    { id: 'gladia',       name: 'Solaria-1',                    short: 'Solaria-1',  color: '#947AFC', highlight: true },
    { id: 'nemo',         name: 'NVIDIA NeMo Sortformer',      short: 'NVIDIA NeMo',  color: '#76B900' },
    { id: 'pyannote',     name: 'pyannoteAI Community-1',      short: 'pyannoteAI Community-1',   color: '#EC4899' },
    { id: 'aws',          name: 'AWS Transcribe',              short: 'AWS',          color: '#FF9900' },
    { id: 'soniox',       name: 'Soniox STT-async-preview-v1', short: 'Soniox',       color: '#6366F1' },
    { id: 'elevenlabs',   name: 'ElevenLabs Scribe-v1',       short: 'ElevenLabs',   color: '#3B82F6' },
    { id: 'openai',       name: 'OpenAI GPT-4o Transcribe',   short: 'OpenAI',       color: '#10A37F' },
    { id: 'assemblyai',   name: 'AssemblyAI Universal',       short: 'AssemblyAI',   color: '#06B6D4' },
    { id: 'deepgram',     name: 'Deepgram v3',            short: 'Deepgram v3',     color: '#13EF93' },
  ];

  /* ── Diarization — DER per DIHARD domain ── */
  const DATA_DIARIZATION = {
    gladia:       { broadcast: 9.4,  meeting: 29.9, webvideo: 44.4, socioField: 12.3, court: 3.9,  clinical: 13.3, restaurant: 41.3, socioLab: 5.5,  cts: 7.7,  maptask: 4.5,  simpleAvg: 17.2, weightedAvg: 16.6 },
    nemo:         { broadcast: 10.3, meeting: 33.0, webvideo: 43.5, socioField: 13.0, court: 24.1, clinical: 14.4, restaurant: 50.9, socioLab: 8.6,  cts: 14.1, maptask: 8.2,  simpleAvg: 22.0, weightedAvg: 20.4 },
    pyannote:     { broadcast: 10.5, meeting: 35.8, webvideo: 48.7, socioField: 17.9, court: 11.6, clinical: 23.8, restaurant: 49.9, socioLab: 13.9, cts: 12.3, maptask: 10.2, simpleAvg: 23.5, weightedAvg: 23.0 },
    speechmatics: { broadcast: 17.2, meeting: 55.6, webvideo: 55.6, socioField: 28.9, court: 15.0, clinical: 24.9, restaurant: 58.4, socioLab: 18.6, cts: 20.1, maptask: 23.4, simpleAvg: 31.8, weightedAvg: 30.1 },
    aws:          { broadcast: 16.4, meeting: 51.4, webvideo: 60.3, socioField: 25.2, court: 16.7, clinical: 27.3, restaurant: 63.1, socioLab: 20.2, cts: 31.2, maptask: 22.9, simpleAvg: 33.5, weightedAvg: 33.8 },
    soniox:       { broadcast: 24.8, meeting: 58.3, webvideo: 57.5, socioField: 30.1, court: 39.3, clinical: 35.1, restaurant: 67.4, socioLab: 28.0, cts: 29.2, maptask: 27.6, simpleAvg: 39.7, weightedAvg: 37.8 },
    elevenlabs:   { broadcast: 25.6, meeting: 50.5, webvideo: 63.4, socioField: 29.7, court: 23.1, clinical: 47.7, restaurant: 57.4, socioLab: 30.3, cts: 22.9, maptask: 45.2, simpleAvg: 39.6, weightedAvg: 39.5 },
    openai:       { broadcast: 26.4, meeting: 57.8, webvideo: 64.1, socioField: 28.8, court: 30.0, clinical: 40.8, restaurant: 59.7, socioLab: 26.5, cts: null,  maptask: 34.8, simpleAvg: 41.0, weightedAvg: 42.8 },
    assemblyai:   { broadcast: 30.9, meeting: 46.4, webvideo: 68.4, socioField: 33.1, court: 24.5, clinical: 51.4, restaurant: 59.4, socioLab: 33.1, cts: 33.1, maptask: 42.1, simpleAvg: 42.2, weightedAvg: 43.9 },
    deepgram:     { broadcast: 27.0, meeting: 59.7, webvideo: 83.0, socioField: 35.5, court: 25.6, clinical: 44.8, restaurant: 75.2, socioLab: 32.2, cts: 35.5, maptask: 45.9, simpleAvg: 46.4, weightedAvg: 46.9 },
  };

  const DIHARD_DOMAINS = [
    { id: 'broadcast',  label: 'Broadcast' },
    { id: 'meeting',    label: 'Meeting' },
    { id: 'webvideo',   label: 'Web Video' },
    { id: 'socioField', label: 'Socio Field' },
    { id: 'court',      label: 'Court' },
    { id: 'clinical',   label: 'Clinical' },
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'socioLab',   label: 'Socio Lab' },
    { id: 'cts',        label: 'CTS' },
    { id: 'maptask',    label: 'Maptask' },
  ];

  /* ── Dataset Descriptions ── */
  const DATASET_INFO = {
    'common-voice-24': {
      name: 'Common Voice 24',
      category: 'stt',
      description: 'Mozilla\'s crowd-sourced multilingual speech corpus. Thousands of volunteers record short sentences covering diverse accents, ages, and recording conditions.',
      insight: 'Tests robustness to accent diversity and non-professional recording environments.',
      source: 'https://bench.k0s.gladia.io/v2/variation/2331/show/1',
    },
    'voxpopuli': {
      name: 'VoxPopuli Cleaned',
      category: 'stt',
      description: 'European Parliament speech recordings cleaned and aligned. Features formal political speech in controlled acoustic conditions.',
      insight: 'Evaluates performance on clear, professional speech with formal vocabulary.',
      source: 'https://bench.k0s.gladia.io/v2/variation/2338/show/1',
    },
    'earnings22-full': {
      name: 'Earnings22 Full',
      category: 'stt',
      description: 'Full earnings call recordings from publicly traded companies. Features multi-speaker financial discussions with domain-specific terminology.',
      insight: 'Challenging real-world scenario with financial jargon, overlapping speakers, and telephone-quality audio.',
      source: 'https://bench.k0s.gladia.io/v2/variation/2313/show/1',
    },
    'earnings22-cleaned': {
      name: 'Earnings22 Cleaned',
      category: 'stt',
      description: 'Cleaned version of Earnings22 with aligned and annotated segments. Removes audio artifacts for fairer WER comparison.',
      insight: 'Isolates transcription accuracy from audio quality issues.',
      source: 'https://bench.k0s.gladia.io/v2/variation/2306/show/1',
    },
    'multilingual-librispeech': {
      name: 'Multilingual Librispeech',
      category: 'stt',
      description: 'Audiobook recordings across 5 European languages (DE, ES, FR, IT, PT). Derived from LibriVox public-domain audiobooks.',
      insight: 'The gold standard for multilingual STT evaluation across Romance and Germanic languages.',
      source: 'https://bench.k0s.gladia.io/v2/variation/2379/show/1',
    },
    'pipecat': {
      name: 'Pipecat STT Benchmark',
      category: 'stt',
      description: 'A curated benchmark by Pipecat focused on real-time STT evaluation. Features diverse, clean speech samples.',
      insight: 'Purpose-built benchmark designed for fair, reproducible STT comparison.',
      source: 'https://bench.k0s.gladia.io/v2/variation/2327/show',
    },
    'switchboard': {
      name: 'Switchboard',
      category: 'stt',
      description: 'Spontaneous telephone conversations between strangers. Features informal speech, interruptions, hesitations, and disfluencies.',
      insight: 'The ultimate conversational AI test — Solaria-3 is the only model under 35% WER.',
      source: 'https://bench.k0s.gladia.io/v2/variation/2311/show/1',
    },
    'real-customer': {
      name: 'Real customer audio — English',
      category: 'stt',
      description: 'Gladia internal production dataset of real customer calls, annotated by humans — not curated benchmarks, but actual production recordings.',
      insight: 'Top of the field on real production calls. −26% vs. Solaria-1.',
      source: null,
    },
  };

  /* ── 3 Key Hero Numbers ── */
  const KEY_NUMBERS = [
    { value: '#1',   label: 'Switchboard',       detail: '33.9% WER — only model under 35%' },
    { value: '#1',   label: 'Diarization',        detail: '16.6 DER — best speaker identification' },
    { value: '7/7',  label: 'Datasets covered',   detail: 'Consistently top 3 across all benchmarks' },
  ];

  /* ── Helpers ── */
  function getProviderSTT(id) { return PROVIDERS_STT.find(p => p.id === id); }
  function getProviderDiar(id) { return PROVIDERS_DIARIZATION.find(p => p.id === id); }

  function getDatasetRanking(datasetId) {
    const data = DATA_STT[datasetId];
    if (!data) return [];
    return PROVIDERS_STT
      .filter(p => data[p.id] != null)
      .map(p => ({ ...p, wer: data[p.id] }))
      .sort((a, b) => a.wer - b.wer);
  }

  function getDiarizationRanking(metric) {
    const key = metric || 'weightedAvg';
    return PROVIDERS_DIARIZATION
      .filter(p => DATA_DIARIZATION[p.id]?.[key] != null)
      .map(p => ({ ...p, der: DATA_DIARIZATION[p.id][key] }))
      .sort((a, b) => a.der - b.der);
  }

  function getSTTChartProviders(dsKey) {
    const data = DATA_STT[dsKey];
    if (!data) return [];
    return PROVIDERS_STT
      .filter(p => data[p.id] != null)
      .map(p => ({ ...p, highlight: p.id === 'solaria3' }))
      .sort((a, b) => data[a.id] - data[b.id]);
  }

  return {
    PROVIDERS_STT,
    PROVIDERS_DIARIZATION,
    DATA_STT,
    DATA_STT_DETAIL,
    DATA_MLS_LANGUAGES,
    DATA_DIARIZATION,
    DIHARD_DOMAINS,
    DATASET_INFO,
    KEY_NUMBERS,
    getProviderSTT,
    getProviderDiar,
    getDatasetRanking,
    getDiarizationRanking,
    getSTTChartProviders,
  };

})();
