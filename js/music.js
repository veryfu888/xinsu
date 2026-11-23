

/* 心訴 v1.2 — 背景音樂：瀏覽器即時合成（Web Audio），不使用任何外部音樂檔 */
(function (root) {
  'use strict';
  var AC = null, MASTER = null, VERB = null, DRONES = [], T = null, PLAYING = false, VOL = 0.5;
  var NOTES = [293.66, 329.63, 440, 493.88, 587.33, 659.25, 880];
  function ctx() {
    if (AC) return AC;
    try {
      var C = root.AudioContext || root.webkitAudioContext; if (!C) return null;
      AC = new C();
      MASTER = AC.createGain(); MASTER.gain.value = 0; MASTER.connect(AC.destination);
      var d = AC.createDelay(2); d.delayTime.value = 0.42;
      var fb = AC.createGain(); fb.gain.value = 0.38;
      var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      VERB = AC.createGain(); VERB.gain.value = 0.5;
      VERB.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(MASTER);
      return AC;
    } catch (e) { return null; }
  }
  function bell(f, when, level, dur) {
    if (!AC) return;
    [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(function (p) {
      var o = AC.createOscillator(), g = AC.createGain(), end = when + dur / Math.sqrt(p[0]);
      o.type = 'sine'; o.frequency.value = f * p[0];
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(level * p[1], when + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      o.connect(g); g.connect(MASTER); g.connect(VERB);
      o.start(when); o.stop(end + 0.1);
    });
  }
  function pluck() {
    if (!PLAYING || !AC) return;
    var now = AC.currentTime + 0.05, f = NOTES[Math.floor(Math.random() * NOTES.length)];
    bell(f, now, 0.08, 5.5);
    if (Math.random() < 0.3) bell(f * 1.5, now + 0.6 + Math.random(), 0.04, 4.5);
    T = setTimeout(pluck, 3500 + Math.random() * 5000);
  }
  function start(vol) {
    if (typeof vol === 'number') VOL = vol;
    var c = ctx(); if (!c) return false;
    if (c.state === 'suspended' && c.resume) c.resume();
    var now = c.currentTime;
    MASTER.gain.cancelScheduledValues(now); MASTER.gain.setValueAtTime(MASTER.gain.value, now);
    MASTER.gain.linearRampToValueAtTime(VOL * 0.6, now + 2.5);
    if (PLAYING) return true;
    PLAYING = true;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.connect(MASTER);
    [[73.42, 'sine', 0.22], [110, 'sine', 0.14], [146.83, 'triangle', 0.05], [220.5, 'sine', 0.04]].forEach(function (v, i) {
      var o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      o.type = v[1]; o.frequency.value = v[0]; g.gain.value = v[2];
      l.frequency.value = 0.04 + i * 0.023; lg.gain.value = v[2] * 0.6;
      l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(lp);
      o.start(now); l.start(now); DRONES.push(o, l);
    });
    T = setTimeout(pluck, 1200);
    return true;
  }
  function stop() {
    PLAYING = false; if (T) { clearTimeout(T); T = null; }
    if (!AC) return;
    var now = AC.currentTime, old = DRONES; DRONES = [];
    MASTER.gain.cancelScheduledValues(now); MASTER.gain.setValueAtTime(MASTER.gain.value, now);
    MASTER.gain.linearRampToValueAtTime(0, now + 0.8);
    old.forEach(function (o) { try { o.stop(now + 1); } catch (e) {} });
  }
  function setVol(v) { VOL = v; if (AC && PLAYING) MASTER.gain.setTargetAtTime(v * 0.6, AC.currentTime, 0.2); }
  function coin() {
    if (!PLAYING || !AC) return;
    for (var i = 0; i < 3; i++) {
      var t = AC.currentTime + 0.02 + i * 0.07 + Math.random() * 0.03, o = AC.createOscillator(), g = AC.createGain();
      o.type = 'triangle'; o.frequency.value = 2200 + Math.random() * 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.08, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + 0.12);
    }
  }
  function chime() { if (PLAYING && AC) { var n = AC.currentTime + 0.05; bell(587.33, n, 0.1, 6); bell(880, n + 0.35, 0.06, 5); } }
  root.XinsuMusic = { start: start, stop: stop, setVol: setVol, coin: coin, chime: chime, playing: function () { return PLAYING; } };
})(window);

