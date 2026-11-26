(() => {
  const S = window.SITE;
  const $ = (s, el = document) => el.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "style") n.style.cssText = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null) n.append(kid);
    return n;
  };

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmt = (y) => {
    const yr = Math.floor(y + 1e-6);
    const m = Math.min(11, Math.round((y - yr) * 12));
    return `${MONTHS[m]} ${yr}`;
  };
  const span = (c) => `${fmt(c.start)} – ${c.end == null ? "Present" : fmt(c.end)}`;
  const endOf = (c) => (c.end == null ? S.now : c.end);

  const trackById = Object.fromEntries(S.tracks.map((t) => [t.id, t]));
  const [R0, R1] = S.range;
  const pct = (y) => ((y - R0) / (R1 - R0)) * 100;

  /* ── mute / solo state ─────────────────────────────── */
  const muted = new Set();
  const soloed = new Set();
  const audible = (id) => !muted.has(id) && (soloed.size === 0 || soloed.has(id));

  /* ── seeded random for clip textures ───────────────── */
  function rng(seed) {
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
  }

  function texture(kind, seed, years) {
    const r = rng(seed);
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 20");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "clip-tex");
    svg.setAttribute("aria-hidden", "true");
    const rect = (x, y, w, h, extra = "") => {
      const n = document.createElementNS(NS, "rect");
      n.setAttribute("x", x); n.setAttribute("y", y);
      n.setAttribute("width", w); n.setAttribute("height", h);
      if (extra) n.setAttribute("class", extra);
      svg.append(n);
    };
    const density = Math.max(8, Math.min(90, Math.round(years * 40)));
    if (kind === "wave" || kind === "pulse") {
      const step = 100 / density;
      for (let i = 0; i < density; i++) {
        const env = kind === "pulse" ? (i % 4 === 0 ? 1 : 0.35) : 0.5 + 0.5 * Math.sin(i / 3);
        const h = Math.max(1.2, (0.25 + r() * 0.75) * env * 18);
        rect(i * step, 10 - h / 2, step * 0.6, h);
      }
    } else if (kind === "film") {
      const n = Math.max(3, Math.round(density / 3));
      const w = 100 / n;
      for (let i = 0; i < n; i++) rect(i * w + 0.6, 4, w - 1.2, 12, "frame");
    } else {
      const notes = Math.max(4, Math.round(density / 2));
      for (let i = 0; i < notes; i++) {
        const x = (i / notes) * 100 + r() * 2;
        rect(x, 2 + Math.floor(r() * 7) * 2.3, 100 / notes * (0.5 + r() * 0.9), 2);
      }
    }
    return svg;
  }

  /* ── arrangement ───────────────────────────────────── */
  const grid = $("#arr-grid");
  const clipEls = [];
  const trackRows = {};

  function packLanes(clips) {
    const lanes = [];
    const sorted = [...clips].sort((a, b) => a.start - b.start);
    for (const c of sorted) {
      const visEnd = Math.max(endOf(c), c.start + 0.42); // room for label
      let lane = lanes.findIndex((end) => end <= c.start);
      if (lane === -1) { lane = lanes.length; lanes.push(0); }
      lanes[lane] = visEnd;
      c._lane = lane;
    }
    return Math.max(1, lanes.length);
  }

  function renderArrangement() {
    grid.style.gridTemplateRows = `34px repeat(${S.tracks.length}, auto)`;

    // corner + ruler
    grid.append(el("div", { class: "corner" }, el("span", {}, "Tracks")));
    const ruler = el("div", { class: "ruler", title: "Click to move the playhead" });
    for (let y = Math.ceil(R0); y <= Math.floor(R1); y++) {
      ruler.append(el("span", { class: "ruler-year", style: `left:${pct(y)}%` }, String(y)));
    }
    for (let y = Math.ceil(R0 * 4) / 4; y < R1; y += 0.25) {
      if (Math.abs(y - Math.round(y)) < 1e-6) continue;
      ruler.append(el("i", { class: "ruler-tick", style: `left:${pct(y)}%` }));
    }
    ruler.addEventListener("pointerdown", (e) => {
      const r = ruler.getBoundingClientRect();
      seek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    });
    grid.append(ruler);

    // tracks
    S.tracks.forEach((t, i) => {
      const clips = S.clips.filter((c) => c.track === t.id);
      const lanes = packLanes(clips);

      const mBtn = el("button", { class: "ms ms-m", "aria-pressed": "false", "aria-label": `Mute ${t.name}`, title: "Mute" }, "M");
      const sBtn = el("button", { class: "ms ms-s", "aria-pressed": "false", "aria-label": `Solo ${t.name}`, title: "Solo" }, "S");
      mBtn.addEventListener("click", () => toggle(muted, t.id));
      sBtn.addEventListener("click", (e) => toggleSolo(t.id, e.shiftKey || e.metaKey || e.ctrlKey));

      const meter = el("span", { class: "head-meter", "aria-hidden": "true" }, el("i"), el("i"), el("i"), el("i"), el("i"));
      const head = el("div", { class: "track-head", style: `--c:${t.color};grid-row:${i + 2}` },
        el("span", { class: "track-color" }),
        el("div", { class: "track-meta" },
          el("span", { class: "track-name" }, t.name),
          el("span", { class: "track-stem" }, `♪ ${t.stem}`)),
        meter,
        el("div", { class: "ms-group" }, mBtn, sBtn));

      const lane = el("div", { class: "lane", style: `--c:${t.color};--lanes:${lanes};grid-row:${i + 2}` });
      for (const c of clips) {
        const left = pct(c.start);
        const width = Math.max(pct(endOf(c)) - left, 0.5);
        const btn = el("button", {
          class: `clip${c.ghost ? " ghost" : ""}${c.end == null ? " ongoing" : ""}`,
          style: `left:${left}%;width:${width}%;--lane:${c._lane}`,
          "aria-label": `${c.title}, ${c.sub}, ${span(c)}. Open details`,
          "data-id": c.id,
        },
          el("span", { class: "clip-title" }, c.title),
          el("span", { class: "clip-sub" }, c.sub));
        if (!c.ghost) btn.prepend(texture(t.texture, c.id, endOf(c) - c.start));
        if (c.markers) {
          for (const m of c.markers) {
            const mx = ((m.at - c.start) / (endOf(c) - c.start)) * 100;
            btn.append(el("i", { class: "marker", style: `left:${mx}%`, title: m.label }));
          }
        }
        btn.addEventListener("click", () => openInspector(c));
        lane.append(btn);
        clipEls.push({ c, btn, track: t.id });
      }
      grid.append(head, lane);
      trackRows[t.id] = { head, lane, mBtn, sBtn, meter };
    });

    // overlay: gridlines, now line, future zone, playhead
    const overlay = el("div", { class: "overlay", style: `grid-row:1 / ${S.tracks.length + 2}` });
    for (let y = Math.ceil(R0); y <= Math.floor(R1); y++) {
      overlay.append(el("i", { class: "gridline", style: `left:${pct(y)}%` }));
    }
    overlay.append(el("div", { class: "future", style: `left:${pct(S.now)}%` }));
    overlay.append(el("div", { class: "nowline", style: `left:${pct(S.now)}%` }, el("span", {}, "now")));
    playheadEl = el("div", { class: "playhead", style: `left:${pct(S.now)}%` });
    overlay.append(playheadEl);
    grid.append(overlay);
  }

  /* ── mute / solo wiring ────────────────────────────── */
  function toggle(set, id) {
    set.has(id) ? set.delete(id) : set.add(id);
    applyMix();
  }
  function toggleSolo(id, additive) {
    if (additive) toggle(soloed, id);
    else {
      const only = soloed.size === 1 && soloed.has(id);
      soloed.clear();
      if (!only) soloed.add(id);
      applyMix();
    }
  }
  function clearMix() { muted.clear(); soloed.clear(); applyMix(); }

  function applyMix() {
    for (const t of S.tracks) {
      const row = trackRows[t.id];
      const on = audible(t.id);
      row.mBtn.setAttribute("aria-pressed", muted.has(t.id));
      row.sBtn.setAttribute("aria-pressed", soloed.has(t.id));
      row.head.classList.toggle("silent", !on);
      row.lane.classList.toggle("silent", !on);
      window.Studio.setTrackGain(t.id, on);
    }
    $("#clear-solo").hidden = muted.size === 0 && soloed.size === 0;
    renderFilters();
    renderTracklist();
  }

  /* ── transport ─────────────────────────────────────── */
  let playheadEl;
  let pausedFrac = null; // set when user seeks while stopped
  let raf = null;
  const btnPlay = $("#btn-play");
  const lcdPos = $("#lcd-pos"), lcdDate = $("#lcd-date"), npText = $("#np-text");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fracToYear(f) { return R0 + f * (R1 - R0); }
  function yearToFrac(y) { return (y - R0) / (R1 - R0); }

  function setPlayhead(frac) {
    const y = fracToYear(frac);
    playheadEl.style.left = `${frac * 100}%`;
    const totalBeats = window.Studio.BARS * 4;
    const beat = Math.floor(frac * totalBeats);
    lcdPos.textContent = `${String(Math.floor(beat / 4) + 1).padStart(3, "0")}.${(beat % 4) + 1}`;
    lcdDate.textContent = fmt(Math.min(y, R1 - 0.01));

    const live = [];
    for (const { c, btn, track } of clipEls) {
      const on = y >= c.start && y <= endOf(c) && !c.ghost;
      btn.classList.toggle("live", on && window.Studio.playing);
      if (on && audible(track)) live.push(c.title);
    }
    for (const t of S.tracks) {
      const any = clipEls.some(({ c, track }) => track === t.id && y >= c.start && y <= endOf(c) && !c.ghost);
      trackRows[t.id].meter.classList.toggle("on", any && window.Studio.playing && audible(t.id));
    }
    if (window.Studio.playing) {
      npText.textContent = y > S.now ? "The future: Summer 2027 internship?" : live.length ? live.join(" · ") : "…";
    }
  }

  function loop() {
    const p = window.Studio.position();
    if (p != null) setPlayhead(p);
    raf = requestAnimationFrame(loop);
  }

  function play() {
    const from = pausedFrac ?? 0;
    if (!window.Studio.play(from)) {
      toast("Your browser doesn't support Web Audio, but the clips still work!");
      return;
    }
    pausedFrac = null;
    btnPlay.setAttribute("aria-pressed", "true");
    btnPlay.setAttribute("aria-label", "Pause session");
    document.body.classList.add("is-playing");
    cancelAnimationFrame(raf);
    loop();
  }
  function pause() {
    pausedFrac = window.Studio.position();
    window.Studio.stop();
    cancelAnimationFrame(raf);
    btnPlay.setAttribute("aria-pressed", "false");
    btnPlay.setAttribute("aria-label", "Play session");
    document.body.classList.remove("is-playing");
    clipEls.forEach(({ btn }) => btn.classList.remove("live"));
    Object.values(trackRows).forEach((r) => r.meter.classList.remove("on"));
  }
  function stopRewind() {
    pause();
    pausedFrac = null;
    setPlayhead(yearToFrac(S.now));
    npText.textContent = "Press play";
  }
  function seek(frac) {
    if (window.Studio.playing) window.Studio.play(frac);
    else { pausedFrac = frac; setPlayhead(frac); }
  }

  btnPlay.addEventListener("click", () => (window.Studio.playing ? pause() : play()));
  $("#btn-stop").addEventListener("click", stopRewind);
  $("#hero-play").addEventListener("click", () => {
    if (!window.Studio.playing) play();
    $("#session").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });
  $("#clear-solo").addEventListener("click", clearMix);

  /* ── inspector ─────────────────────────────────────── */
  const insp = $("#inspector");
  function openInspector(c) {
    const t = trackById[c.track];
    insp.style.setProperty("--c", t.color);
    $("#insp-track").textContent = c.ghost ? "Open slot" : t.name;
    $("#insp-title").textContent = c.title;
    $("#insp-meta").textContent = `${c.sub} · ${span(c)}`;
    $("#insp-summary").textContent = c.summary || "";
    const ul = $("#insp-bullets");
    ul.replaceChildren(...(c.bullets || []).map((b) => el("li", {}, b)));
    $("#insp-tags").replaceChildren(
      ...(c.award ? [el("span", { class: "tag tag-award" }, c.award)] : []),
      ...(c.tags || []).map((x) => el("span", { class: "tag" }, x)));
    const links = [...(c.links || [])];
    if (c.ghost) links.push({ label: "Let's talk →", href: "#connect", internal: true });
    $("#insp-links").replaceChildren(...links.map((l) => {
      const a = el("a", { class: "btn btn-small", href: l.href, target: l.internal ? null : "_blank", rel: l.internal ? null : "noopener" }, l.label);
      if (l.internal) a.addEventListener("click", () => insp.close());
      return a;
    }));
    insp.showModal();
  }
  insp.addEventListener("click", (e) => { if (e.target === insp) insp.close(); });

  /* ── tracklist ─────────────────────────────────────── */
  const featured = S.clips.filter((c) => c.featured).sort((a, b) => a.featured - b.featured);

  function renderFilters() {
    const wrap = $("#filters");
    const allOn = soloed.size === 0 && muted.size === 0;
    const mk = (label, pressed, onClick, color) =>
      el("button", { class: "chip", "aria-pressed": String(pressed), style: color ? `--c:${color}` : null, onclick: onClick }, label);
    wrap.replaceChildren(
      mk("All", allOn, clearMix),
      ...S.tracks.filter((t) => featured.some((c) => c.track === t.id)).map((t) =>
        mk(t.name, soloed.size === 1 && soloed.has(t.id), () => { muted.clear(); toggleSolo(t.id, false); }, t.color)));
  }

  function renderTracklist() {
    const ol = $("#tracks");
    const items = featured.filter((c) => audible(c.track));
    ol.replaceChildren(...items.map((c, idx) => {
      const t = trackById[c.track];
      const details = el("div", { class: "trk-body" },
        el("p", {}, c.summary),
        c.bullets.length ? el("ul", {}, c.bullets.map((b) => el("li", {}, b))) : null,
        el("div", { class: "insp-tags" },
          c.award ? el("span", { class: "tag tag-award" }, c.award) : null,
          c.tags.map((x) => el("span", { class: "tag" }, x))));
      const head = el("button", { class: "trk-head", "aria-expanded": "false" },
        el("span", { class: "trk-num" }, String(idx + 1).padStart(2, "0")),
        el("span", { class: "trk-main" },
          el("span", { class: "trk-title" }, c.title, c.award ? el("span", { class: "trk-badge" }, "Winner") : null),
          el("span", { class: "trk-sub" }, c.sub)),
        el("span", { class: "trk-track" }, t.name),
        el("span", { class: "trk-time" }, c.end == null ? `${fmt(c.start).split(" ")[1]}–now` : fmt(c.start)),
        el("span", { class: "trk-chev", "aria-hidden": "true" }, "+"));
      head.addEventListener("click", () => {
        const open = head.getAttribute("aria-expanded") === "true";
        head.setAttribute("aria-expanded", String(!open));
        li.classList.toggle("open", !open);
      });
      const li = el("li", { class: "trk", style: `--c:${t.color}` }, head, details);
      return li;
    }));
    const empty = $("#tracks-empty");
    empty.hidden = items.length > 0;
  }
  $("#tracks-empty [data-clear]").addEventListener("click", clearMix);

  /* ── levels + rack ─────────────────────────────────── */
  function renderLevels() {
    $("#meters").replaceChildren(...S.stats.map((s) => el("div", { class: "meter", style: `--c:${trackById[s.track].color}` },
      el("span", { class: "meter-led", "aria-hidden": "true" }, el("i"), el("i"), el("i"), el("i"), el("i"), el("i"), el("i"), el("i")),
      el("span", { class: "meter-val" }, s.value),
      el("span", { class: "meter-label" }, s.label))));
    $("#rack").replaceChildren(...Object.entries(S.skills).map(([k, list]) => el("div", { class: "rack-unit" },
      el("span", { class: "rack-screw", "aria-hidden": "true" }),
      el("span", { class: "rack-name" }, k),
      el("div", { class: "rack-items" }, list.map((x) => el("span", { class: "rack-item" }, x))),
      el("span", { class: "rack-screw", "aria-hidden": "true" }))));
  }

  /* ── piano + chord detection ───────────────────────── */
  const NOTE = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const LOW = 60, HIGH = 84;
  const KEYMAP = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ";": 76 };
  const LABEL = Object.fromEntries(Object.entries(KEYMAP).map(([k, v]) => [v, k.toUpperCase()]));
  const active = new Map(); // midi -> voice
  const keyEls = {};

  const CHORDS = [
    ["", [0, 4, 7]], ["m", [0, 3, 7]], ["dim", [0, 3, 6]], ["aug", [0, 4, 8]],
    ["sus2", [0, 2, 7]], ["sus4", [0, 5, 7]], ["7", [0, 4, 7, 10]], ["maj7", [0, 4, 7, 11]],
    ["m7", [0, 3, 7, 10]], ["m7♭5", [0, 3, 6, 10]], ["dim7", [0, 3, 6, 9]], ["6", [0, 4, 7, 9]],
    ["m6", [0, 3, 7, 9]], ["add9", [0, 2, 4, 7]], ["madd9", [0, 2, 3, 7]], ["maj9", [0, 2, 4, 7, 11]],
    ["m9", [0, 2, 3, 7, 10]], ["9", [0, 2, 4, 7, 10]], ["mMaj7", [0, 3, 7, 11]],
    ["7", [0, 4, 10]], ["maj7", [0, 4, 11]], ["m7", [0, 3, 10]], ["9", [0, 2, 4, 10]],
    ["m9", [0, 2, 3, 10]], ["maj9", [0, 2, 4, 11]], ["13", [0, 4, 9, 10]], ["13", [0, 2, 4, 9, 10]],
  ];
  const QUALITY = (suf) =>
    /^(m|m7|m9|m6|madd9|mMaj7)$/.test(suf) ? "min" :
    /^(7|9|13)$/.test(suf) ? "dom" :
    /^(|maj7|maj9|6|add9)$/.test(suf) ? "maj" : "other";
  const INTERVALS = ["unison", "minor 2nd", "major 2nd", "minor 3rd", "major 3rd", "perfect 4th", "tritone", "perfect 5th", "minor 6th", "major 6th", "minor 7th", "major 7th"];

  function detect(midis) {
    if (!midis.length) return null;
    const sorted = [...midis].sort((a, b) => a - b);
    const bass = sorted[0] % 12;
    const pcs = [...new Set(sorted.map((m) => m % 12))];
    if (pcs.length === 1) return { name: NOTE[bass], detail: sorted.map((m) => NOTE[m % 12] + (Math.floor(m / 12) - 1)).join(" ") };
    if (pcs.length === 2 && sorted.length >= 2) {
      const iv = (pcs[1] - pcs[0] + 12) % 12;
      const ivl = (sorted[sorted.length - 1] - sorted[0]) % 12;
      return { name: `${NOTE[bass]} + ${NOTE[(bass + ivl) % 12]}`, detail: INTERVALS[ivl] || INTERVALS[iv] };
    }
    const tryRoots = [bass, ...pcs.filter((p) => p !== bass)];
    for (const root of tryRoots) {
      const set = pcs.map((p) => (p - root + 12) % 12).sort((a, b) => a - b).join(",");
      const hit = CHORDS.find(([, iv]) => iv.join(",") === set);
      if (hit) {
        const slash = root !== bass ? `/${NOTE[bass]}` : "";
        return { name: NOTE[root] + hit[0] + slash, root, q: QUALITY(hit[0]), detail: sorted.map((m) => NOTE[m % 12]).join(" · ") };
      }
    }
    return { name: "?", detail: sorted.map((m) => NOTE[m % 12]).join(" · ") };
  }

  const history = [];
  const SECRETS = [
    { steps: [[0, "min"], [5, "dom"], [10, "maj"]], msg: "ii–V–I detected. A person of culture. 🎷 Let's jam: scroll to Connect." },
    { steps: [[0, "maj"], [7, "maj"], [9, "min"], [5, "maj"]], msg: "I–V–vi–IV: the four chords behind half the Billboard Hot 100. 🎤" },
    { steps: [[0, "min"], [8, "maj"], [3, "maj"], [10, "maj"]], msg: "vi–IV–I–V: the sad-pop progression. You've got taste. 🌧️" },
  ];
  function checkSecrets() {
    for (const s of SECRETS) {
      const n = s.steps.length;
      if (history.length < n) continue;
      const tail = history.slice(-n);
      const r0 = tail[0].root;
      const fits = (q, want) => q === want || (want === "maj" && q === "dom") || (want === "dom" && q === "maj");
      const ok = tail.every((h, i) => (h.root - r0 + 12) % 12 === s.steps[i][0] && fits(h.q, s.steps[i][1]));
      if (ok) { toast(s.msg); history.length = 0; return; }
    }
  }

  let chordTimer = null;
  function updateChord() {
    const res = detect([...active.keys()]);
    $("#chord-name").textContent = res ? res.name : "—";
    $("#chord-notes").textContent = res ? res.detail : "Play something";
    clearTimeout(chordTimer);
    if (res && res.q && res.q !== "other") {
      // commit a chord once it's been held briefly
      chordTimer = setTimeout(() => {
        const last = history[history.length - 1];
        if (!last || last.root !== res.root || last.q !== res.q) {
          history.push({ root: res.root, q: res.q });
          if (history.length > 8) history.shift();
          checkSecrets();
        }
      }, 120);
    }
  }

  function down(m) {
    if (active.has(m) || m < LOW || m > HIGH) return;
    const v = window.Studio.noteOn(m);
    active.set(m, v);
    keyEls[m]?.classList.add("down");
    updateChord();
  }
  function up(m) {
    const v = active.get(m);
    if (v === undefined) return;
    v?.release();
    active.delete(m);
    keyEls[m]?.classList.remove("down");
    updateChord();
  }

  function renderPiano() {
    const piano = $("#piano");
    const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
    const whites = [];
    for (let m = LOW; m <= HIGH; m++) if (!isBlack(m)) whites.push(m);
    const ww = 100 / whites.length;
    let wi = 0;
    for (let m = LOW; m <= HIGH; m++) {
      const black = isBlack(m);
      const name = NOTE[m % 12] + (Math.floor(m / 12) - 1);
      const key = el("button", {
        class: `key ${black ? "black" : "white"}`,
        "aria-label": name, "data-m": m, tabindex: "-1",
        style: black ? `left:calc(${wi * ww}% - var(--bw) / 2)` : null,
      }, LABEL[m] ? el("span", { class: "key-label" }, LABEL[m]) : null,
         m % 12 === 0 ? el("span", { class: "key-c" }, name) : null);
      if (!black) wi++;
      keyEls[m] = key;
      piano.append(key);
    }
    piano.style.setProperty("--ww", `${ww}%`);

    let pointerDown = false;
    const pointerNotes = new Map();
    piano.addEventListener("pointerdown", (e) => {
      const k = e.target.closest(".key"); if (!k) return;
      e.preventDefault();
      pointerDown = true;
      const m = +k.dataset.m;
      pointerNotes.set(e.pointerId, m);
      down(m);
      if (e.target.hasPointerCapture?.(e.pointerId)) e.target.releasePointerCapture(e.pointerId);
    });
    piano.addEventListener("pointerover", (e) => {
      if (!pointerDown || e.pointerType === "touch") return;
      const k = e.target.closest(".key"); if (!k) return;
      const m = +k.dataset.m, prev = pointerNotes.get(e.pointerId);
      if (prev === m) return;
      if (prev != null) up(prev);
      pointerNotes.set(e.pointerId, m);
      down(m);
    });
    const end = (e) => {
      const m = pointerNotes.get(e.pointerId);
      if (m != null) up(m);
      pointerNotes.delete(e.pointerId);
      if (!pointerNotes.size) pointerDown = false;
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    piano.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") end(e); });
  }

  /* ── keyboard shortcuts ────────────────────────────── */
  const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  document.addEventListener("keydown", (e) => {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || insp.open) return;
    if (e.code === "Space" && (e.target === document.body || e.target.closest?.(".arrangement"))) {
      e.preventDefault();
      window.Studio.playing ? pause() : play();
      return;
    }
    const m = KEYMAP[e.key.toLowerCase()];
    if (m != null && !e.repeat) { down(m); }
  });
  document.addEventListener("keyup", (e) => {
    const m = KEYMAP[e.key.toLowerCase()];
    if (m != null) up(m);
  });
  window.addEventListener("blur", () => [...active.keys()].forEach(up));

  /* ── toast ─────────────────────────────────────────── */
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 4200);
  }

  /* ── boot ──────────────────────────────────────────── */
  renderArrangement();
  renderLevels();
  renderPiano();
  applyMix();
  setPlayhead(yearToFrac(S.now));
  // start the arrangement scrolled so "now" is visible on small screens
  const sc = $("#arr-scroll");
  requestAnimationFrame(() => {
    if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = sc.scrollWidth;
  });
})();
