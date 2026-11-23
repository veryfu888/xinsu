
/* 心訴 — 存成圖片、我的資料、結構化紀錄與匯出 */
(function (root) {
  'use strict';
  var KEY_P = 'xinsu.v1.profiles', KEY_R = 'xinsu.v1.records', PMAX = 10, RMAX = 50;
  function sget(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { root.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function load(k) { try { var v = JSON.parse(sget(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function nowStr() { var E = root.XinsuEngines, t = E.taipeiNow(); return E.fmtDT(t); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // ---------- 我的資料 ----------
  var Profiles = {
    list: function () { return load(KEY_P); },
    save: function (data) {
      var list = load(KEY_P), label = data.name || (data.gender + ' ' + data.y + '/' + data.m + '/' + data.d + (data.cal === 'lunar' ? '（農曆）' : ''));
      var i = -1; list.forEach(function (p, k) { if (p.label === label) i = k; });
      var rec = { id: i >= 0 ? list[i].id : uid(), label: label, data: data };
      if (i >= 0) list[i] = rec; else list.unshift(rec);
      if (list.length > PMAX) list = list.slice(0, PMAX);
      sset(KEY_P, JSON.stringify(list)); fire(); return rec;
    },
    remove: function (id) { sset(KEY_P, JSON.stringify(load(KEY_P).filter(function (p) { return p.id !== id; }))); fire(); },
    get: function (id) { return load(KEY_P).filter(function (p) { return p.id === id; })[0] || null; }
  };
  function fire() { try { document.dispatchEvent(new Event('xinsu-profiles')); } catch (e) { /* 舊瀏覽器 */ } }

  // ---------- 結構化紀錄（第二階段 AI 解讀可直接使用） ----------
  var Records = {
    add: function (method, input, output) {
      var rec = { schema: 'xinsu.record.v1', id: uid(), method: method, at: nowStr() + '（台北時間）', input: input, output: output };
      root.XinsuLast = root.XinsuLast || {}; root.XinsuLast[method] = rec;
      var list = load(KEY_R); list.unshift(rec); if (list.length > RMAX) list = list.slice(0, RMAX);
      sset(KEY_R, JSON.stringify(list));
      return rec;
    },
    list: function () { return load(KEY_R); },
    clear: function () { sset(KEY_R, '[]'); }
  };
  function exportAll() {
    var hist = []; try { hist = JSON.parse(sget('xinsu.v1.history') || '[]'); } catch (e) { hist = []; }
    return { app: '心訴', version: '1.2', exportedAt: nowStr() + '（台北時間）', liuyaoHistory: hist, records: Records.list(), profiles: Profiles.list() };
  }

  // ---------- 存成圖片（一個按鈕直接存檔） ----------
  var dlNS = null;
  try { if (root.claude && typeof root.claude.use === 'function') root.claude.use('downloads').then(function (ns) { dlNS = ns; }, function () { dlNS = null; }); } catch (e) { dlNS = null; }
  function toast(msg, ms) {
    var t = document.getElementById('xtoast');
    if (!t) { document.body.insertAdjacentHTML('beforeend', '<div id="xtoast" class="xtoast" role="status" aria-live="polite"></div>'); t = document.getElementById('xtoast'); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._h);
    if (ms) t._h = setTimeout(function () { t.classList.remove('on'); }, ms);
  }
  function deliver(blob, filename) {
    // 網頁版（claude.ai 內嵌框）：交給平台存檔；離線檔：直接下載
    if (dlNS) {
      return dlNS.save({ filename: filename, data: blob }).then(function () { toast('已存檔', 2500); }, function (err) {
        var c = err && err.code;
        if (c === 'declined') toast('已取消存檔', 2500);
        else if (c === 'rate_limited') toast('存檔視窗已開啟，請稍候', 2500);
        else directDownload(blob, filename);
      });
    }
    directDownload(blob, filename);
    return Promise.resolve();
  }
  function directDownload(blob, filename) {
    try {
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display = 'none'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
      toast('已存成 ' + filename, 3000);
    } catch (e) { toast('這裡無法存檔，請改用截圖', 4000); }
  }
  function toBase64(buf) {
    var bytes = new Uint8Array(buf), chunk = 0x8000, bin = '';
    for (var i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(bin);
  }
  function ensureFontEmbedCSS() {
    if (window.XINSU_FONT_EMBED_CSS) return Promise.resolve(window.XINSU_FONT_EMBED_CSS);
    if (window.XINSU_FONT_EMBED_CSS_P) return window.XINSU_FONT_EMBED_CSS_P;
    var base = (document.querySelector('script[src$="js/save.js"]') && document.querySelector('script[src$="js/save.js"]').src.replace(/js\/save\.js.*$/, '')) || '';
    window.XINSU_FONT_EMBED_CSS_P = Promise.all([
      fetch(base + 'fonts/lxgw-wenkai-tc-xinsu.woff2').then(function (r) { if (!r.ok) throw new Error('font'); return r.arrayBuffer(); }),
      fetch(base + 'fonts/xinsu-supplement.woff2').then(function (r) { if (!r.ok) throw new Error('font'); return r.arrayBuffer(); })
    ]).then(function (bufs) {
      var css = '@font-face{font-family:"LXGW WenKai TC Xinsu";src:url(data:font/woff2;base64,' + toBase64(bufs[0]) + ') format("woff2");font-weight:400;font-style:normal;font-display:swap;}'
        + '@font-face{font-family:"Xinsu Supplement";src:url(data:font/woff2;base64,' + toBase64(bufs[1]) + ') format("woff2");font-weight:400;font-style:normal;font-display:swap;unicode-range:U+7A0A,U+80CF;}';
      window.XINSU_FONT_EMBED_CSS = css;
      return css;
    });
    return window.XINSU_FONT_EMBED_CSS_P;
  }
  function waitImages(node) {
    var imgs = Array.prototype.slice.call(node.querySelectorAll('img'));
    return Promise.all(imgs.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (res) {
        var done = function () { img.removeEventListener('load', done); img.removeEventListener('error', done); res(); };
        img.addEventListener('load', done);
        img.addEventListener('error', done);
        setTimeout(done, 8000);
      });
    }));
  }
  if (typeof document !== 'undefined') {
    var warm = function () { ensureFontEmbedCSS().catch(function () { /* 第一次存圖時再試 */ }); };
    if (document.readyState === 'complete') setTimeout(warm, 800);
    else window.addEventListener('load', function () { setTimeout(warm, 800); });
  }
  var busy = false;
  function saveImage(node, name, btn) {
    if (busy) return; busy = true;
    if (!root.htmlToImage) { busy = false; toast('這個瀏覽器無法產生圖片，請改用截圖', 4000); return; }
    if (btn) { btn.disabled = true; btn.textContent = '產生圖片中…'; }
    toast('產生圖片中…');
    node.classList.add('capturing');
    var saveOpts = { pixelRatio: 2, backgroundColor: '#FAF6F0', filter: function (n) { return !(n.classList && n.classList.contains('noimg')); } };
    function attempt(useKai) {
      var opts = { pixelRatio: saveOpts.pixelRatio, backgroundColor: saveOpts.backgroundColor, filter: saveOpts.filter };
      if (useKai) opts.fontEmbedCSS = window.XINSU_FONT_EMBED_CSS || '';
      else { opts.fontEmbedCSS = ''; opts.skipFonts = true; }
      return root.htmlToImage.toBlob(node, opts);
    }
    Promise.resolve()
      .then(function () { return waitImages(node); })
      .then(function () { return ensureFontEmbedCSS().catch(function () { return ''; }); })
      .then(function () { return attempt(true); })
      .then(function (blob) { if (!blob) throw new Error('empty'); return blob; })
      .catch(function () { toast('改用系統字型再試一次…'); return attempt(false); })
      .then(function (blob) {
        node.classList.remove('capturing');
        if (!blob) throw new Error('empty');
        return deliver(blob, '心訴_' + (name || '結果') + '_' + nowStr().replace(/[\/: ]/g, '') + '.png');
      })
      .catch(function () { node.classList.remove('capturing'); toast('產生圖片失敗，請改用截圖', 4000); })
      .then(function () { busy = false; if (btn) { btn.disabled = false; btn.textContent = '存成圖片'; } });
  }
  function saveBtnHTML(target, name) { return '<button type="button" class="btn ghost noimg savebtn" data-save="' + target + '" data-name="' + name + '">存成圖片</button>'; }
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-save]');
      if (b) { var n = document.getElementById(b.getAttribute('data-save')); if (n) saveImage(n, b.getAttribute('data-name'), b); }
    });
  }

  // ---------- 說明頁：匯出 ----------
  function initExport() {
    var host = document.getElementById('export-box');
    if (!host) return;
    host.innerHTML = '<p class="muted small" style="margin:0 0 8px">包含六爻問事紀錄、其他術數最近 ' + RMAX + ' 筆排盤的結構化資料與「我的資料」。只存在這台裝置。</p>' +
      '<div class="btn-row"><button type="button" class="btn ghost" id="ex-show">匯出資料（JSON）</button><button type="button" class="btn ghost" id="ex-clear">清除排盤紀錄</button></div><div id="ex-out"></div>';
    document.getElementById('ex-show').addEventListener('click', function () {
      var data = JSON.stringify(exportAll(), null, 2);
      document.getElementById('ex-out').innerHTML = '<p class="small" style="margin:10px 0 4px">共 ' + Records.list().length + ' 筆排盤紀錄、' + Profiles.list().length + ' 筆我的資料。</p><textarea class="inp mono" id="ex-ta" rows="8" readonly></textarea>' +
        '<div class="btn-row"><button type="button" class="btn ghost" id="ex-copy">複製</button>' + '<button type="button" class="btn ghost" id="ex-dl">存成檔案</button>' + '</div><p class="muted small" id="ex-msg"></p>';
      document.getElementById('ex-ta').value = data;
      document.getElementById('ex-dl').addEventListener('click', function () { deliver(new Blob([data], { type: 'application/json' }), '心訴資料_' + nowStr().replace(/[\/: ]/g, '') + '.json'); });
      document.getElementById('ex-copy').addEventListener('click', function () {
        var ta = document.getElementById('ex-ta'), msg = document.getElementById('ex-msg');
        try { navigator.clipboard.writeText(ta.value).then(function () { msg.textContent = '已複製。'; }, function () { ta.select(); msg.textContent = '請手動全選複製。'; }); }
        catch (e) { ta.select(); msg.textContent = '請手動全選複製。'; }
      });
    });
    var cb = document.getElementById('ex-clear');
    cb.addEventListener('click', function () {
      if (cb.getAttribute('data-confirm') !== '1') { cb.setAttribute('data-confirm', '1'); cb.textContent = '確定清除？'; setTimeout(function () { cb.removeAttribute('data-confirm'); cb.textContent = '清除排盤紀錄'; }, 3000); return; }
      Records.clear(); cb.removeAttribute('data-confirm'); cb.textContent = '已清除'; document.getElementById('ex-out').innerHTML = '';
    });
  }
  if (typeof document !== 'undefined') { if (document.readyState !== 'loading') setTimeout(initExport, 0); else document.addEventListener('DOMContentLoaded', initExport); }

  root.XinsuExtras = { Profiles: Profiles, Records: Records, exportAll: exportAll, saveImage: saveImage, saveBtnHTML: saveBtnHTML };
})(typeof window !== 'undefined' ? window : globalThis);

