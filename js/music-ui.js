

(function () {
  function $(id) { return document.getElementById(id); }
  function loadJSON(k, fallback) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  var KEY_M = 'xinsu.v1.music', MU = window.XinsuMusic;
  var mpref = loadJSON(KEY_M, null) || { on: false, vol: 0.5 };
  if (typeof mpref.vol !== 'number') mpref.vol = 0.5;
  function saveM() { try { localStorage.setItem(KEY_M, JSON.stringify(mpref)); } catch (e) {} }
  function renderMusic(pending) {
    $('music-btn').setAttribute('aria-pressed', String(!!mpref.on));
    $('music-label').textContent = mpref.on ? '背景音樂：開' : '背景音樂：關';
    $('music-hint').textContent = mpref.on
      ? '慢慢吸氣…心靜了再開始問。'
      : '問事前，先打開音樂聽一下，深呼吸、讓心靜下來。';
    $('music-vol').value = Math.round(mpref.vol * 100);
    $('music-volv').textContent = Math.round(mpref.vol * 100) + '%';
    $('music-note').hidden = !pending;
    $('music-note').textContent = pending ? '上次開著音樂，點畫面任一處就會開始播放。' : '';
  }
  $('music-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    mpref.on = !mpref.on;
    if (mpref.on && !MU.start(mpref.vol)) {
      mpref.on = false; saveM(); renderMusic(false);
      $('music-note').hidden = false;
      $('music-note').textContent = '這個瀏覽器不支援播放音樂。';
      return;
    }
    if (!mpref.on) MU.stop();
    saveM(); renderMusic(false);
  });
  $('music-vol').addEventListener('input', function () {
    mpref.vol = (+$('music-vol').value) / 100;
    MU.setVol(mpref.vol); saveM(); renderMusic(false);
  });
  if (mpref.on) {
    var resume = function () {
      document.removeEventListener('pointerdown', resume, true);
      if (mpref.on && !MU.playing()) MU.start(mpref.vol);
      renderMusic(false);
    };
    document.addEventListener('pointerdown', resume, true);
  }

  document.addEventListener('visibilitychange', function () {
    if (!MU) return;
    if (document.hidden) {
      if (MU.playing()) MU.stop();
    } else if (mpref.on) {
      MU.start(mpref.vol);
    }
  });
  renderMusic(!!mpref.on);
})();


