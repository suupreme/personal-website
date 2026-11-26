/*
 * Tiny Web Audio groove engine. No samples, everything is synthesized.
 * Each track in the session is a stem:
 *   code → hi-hats · research → bass · visuals → snare · people → kick · music → chords
 * Progression: Dm9 – G13 – Cmaj9 – Am9 (ii–V–I–vi in C), two bars each.
 */
window.Studio = (() => {
  const BPM = 88;
  const STEPS_PER_BAR = 16;
  const BARS = 8;
  const TOTAL_STEPS = STEPS_PER_BAR * BARS;
  const stepDur = 60 / BPM / 4;
  const loopLen = TOTAL_STEPS * stepDur;

  const PROG = [
    { bass: 38, notes: [53, 57, 60, 64] }, // Dm9
    { bass: 43, notes: [53, 59, 64, 69] }, // G13
    { bass: 36, notes: [52, 55, 59, 62] }, // Cmaj9
    { bass: 45, notes: [55, 60, 64, 71] }, // Am9
  ];

  let ctx = null, master, keysBus, noise;
  const buses = {};
  const gains = { code: 1, research: 1, visuals: 1, people: 1, music: 1 };
  let playing = false, timer = null, step = 0, nextTime = 0, startTime = 0;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(comp);
    comp.connect(ctx.destination);
    for (const id of Object.keys(gains)) {
      buses[id] = ctx.createGain();
      buses[id].gain.value = gains[id];
      buses[id].connect(master);
    }
    keysBus = ctx.createGain();
    keysBus.gain.value = 0.9;
    keysBus.connect(master);
    // white-noise buffer for drums
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  /* ── instruments ─────────────────────────────── */
  function kick(t, out) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.95, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + 0.4);
  }

  function noiseHit(t, out, { type, freq, q = 1, vol, dur }) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise;
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  function snare(t, out) {
    noiseHit(t, out, { type: "bandpass", freq: 1900, q: 0.8, vol: 0.55, dur: 0.2 });
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.value = 185;
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + 0.1);
  }

  function hat(t, out, vol) {
    noiseHit(t, out, { type: "highpass", freq: 7500, vol, dur: 0.045 });
  }

  function bass(t, out, midi, dur) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = mtof(midi);
    o2.type = "triangle"; o2.frequency.value = mtof(midi);
    f.type = "lowpass"; f.frequency.value = 420;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.42, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.2, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); o2.connect(f); f.connect(g).connect(out);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  /* Electric-piano-ish voice; returns a handle with release(). */
  function ep(midi, t, vel, out) {
    const f = mtof(midi);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    const g2 = ctx.createGain(), env = ctx.createGain(), lp = ctx.createBiquadFilter();
    o1.type = "sine"; o1.frequency.value = f;
    o2.type = "triangle"; o2.frequency.value = f * 2; o2.detune.value = 5;
    g2.gain.value = 0.14;
    lp.type = "lowpass"; lp.frequency.value = 2600;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(vel, t + 0.006);
    env.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 5);
    o1.connect(env); o2.connect(g2).connect(env);
    env.connect(lp).connect(out);
    o1.start(t); o2.start(t); o1.stop(t + 5.1); o2.stop(t + 5.1);
    return {
      release(rt = ctx.currentTime) {
        const p = env.gain;
        if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(rt);
        else { p.cancelScheduledValues(rt); p.setValueAtTime(Math.max(p.value, 0.0001), rt); }
        p.exponentialRampToValueAtTime(0.0001, rt + 0.35);
        o1.stop(rt + 0.4); o2.stop(rt + 0.4);
      },
    };
  }

  /* ── sequencer ───────────────────────────────── */
  const KICK = new Set([0, 10]), KICK_B = new Set([0, 7, 10]);
  const SNARE = new Set([4, 12]);

  function scheduleStep(s, t) {
    const bar = Math.floor(s / STEPS_PER_BAR);
    const i = s % STEPS_PER_BAR;
    const chord = PROG[Math.floor(bar / 2) % PROG.length];
    const swing = i % 4 === 2 ? stepDur * 0.28 : 0;
    const tt = t + swing;

    if ((bar % 2 ? KICK_B : KICK).has(i)) kick(t, buses.people);
    if (SNARE.has(i)) snare(t, buses.visuals);
    if (i % 2 === 0) hat(tt, buses.code, i % 4 === 0 ? 0.11 : 0.06);
    if (i === 15 && bar % 2) hat(t, buses.code, 0.05);
    if (i === 0) bass(t, buses.research, chord.bass, stepDur * 6);
    if (i === 10) bass(tt, buses.research, chord.bass, stepDur * 3);
    if (i === 14) bass(tt, buses.research, chord.bass + 12, stepDur * 2);
    if (i === 0 && bar % 2 === 0) {
      chord.notes.forEach((n, k) => {
        const v = ep(n, t + k * 0.012, 0.09, buses.music);
        v.release(t + stepDur * 30);
      });
    }
    if (i === 8 && bar % 2 === 1) {
      // little top-note "stab" on the second bar of each chord
      const v = ep(chord.notes[chord.notes.length - 1] + 12, tt, 0.05, buses.music);
      v.release(tt + stepDur * 4);
    }
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.12) {
      scheduleStep(step, nextTime);
      nextTime += stepDur;
      step = (step + 1) % TOTAL_STEPS;
    }
  }

  function play(fromFrac = 0) {
    if (!init()) return false;
    if (ctx.state === "suspended") ctx.resume();
    stop();
    step = Math.floor(fromFrac * TOTAL_STEPS) % TOTAL_STEPS;
    nextTime = ctx.currentTime + 0.06;
    startTime = nextTime - step * stepDur;
    playing = true;
    tick();
    timer = setInterval(tick, 25);
    return true;
  }

  function stop() {
    playing = false;
    clearInterval(timer);
    timer = null;
  }

  /* Position in the loop, 0..1 */
  function position() {
    if (!ctx || !playing) return null;
    const e = ctx.currentTime - startTime;
    if (e < 0) return (step * stepDur) / loopLen;
    return (e % loopLen) / loopLen;
  }

  function setTrackGain(id, on) {
    gains[id] = on ? 1 : 0;
    if (ctx && buses[id]) buses[id].gain.setTargetAtTime(gains[id], ctx.currentTime, 0.015);
  }

  /* Live keyboard */
  function noteOn(midi) {
    if (!init()) return null;
    if (ctx.state === "suspended") ctx.resume();
    return ep(midi, ctx.currentTime, 0.22, keysBus);
  }

  return {
    play, stop, position, setTrackGain, noteOn,
    get playing() { return playing; },
    BPM, BARS, STEPS_PER_BAR, loopLen,
  };
})();
