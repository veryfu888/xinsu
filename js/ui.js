
/* 心訴 v1 — 畫面與互動 */
(function () {
  'use strict';
  var L = window.LiuYao, D = window.XinsuData;
  var KEY_H = 'xinsu.v1.history', HMAX = 50;
  var Q = window.XinsuQuota;
  var CATS = ['感情', '事業', '財運', '健康', '人際'];
  var SUGGEST = [
    ['這份工作還要不要繼續？', '事業'],
    ['最近的感情該怎麼看？', '感情'],
    ['這個月手頭會不會寬一點？', '財運'],
    ['我和身邊的人怎麼相處比較好？', '人際'],
    ['最近身體該注意什麼？', '健康'],
    ['這個合作案適合往下談嗎？', '事業']
  ];
  var YS = {
    感情: { t: ['妻財', '官鬼'], text: '看妻財與官鬼。傳統上男測婚姻多看妻財，女測多看官鬼；也可看應爻。', ying: true },
    事業: { t: ['官鬼', '父母'], text: '看官鬼；文書合約兼看父母。' },
    財運: { t: ['妻財'], text: '看妻財；兄弟多或兄弟發動，提醒競爭或分利。' },
    健康: { t: ['官鬼', '子孫', '父母'], text: '官鬼看不適，子孫看醫藥，父母看身體。' },
    人際: { t: ['兄弟'], text: '看兄弟，並看應爻。', ying: true }
  };
  var RISK = ['自殺', '自杀', '想死', '去死', '尋死', '求死', '輕生', '轻生', '不想活', '活不下去', '活著好累', '活著沒意思', '活著沒意義', '結束生命', '结束生命', '結束自己', '了結自己', '了結生命', '一了百了', '離開這個世界', '消失算了', '不如死', '死了算了', '死一死', '割腕', '割手', '跳樓', '跳楼', '跳河', '跳橋', '跳海', '燒炭', '烧炭', '上吊', '吞藥', '吞药', '安眠藥', '農藥', '自殘', '自残', '自傷', '傷害自己', '伤害自己', '傷害他', '傷害她', '殺了', '杀了', '殺死', '杀死', '殺人', '杀人', '砍人', '砍死', '捅死', '弄死', '打死他', '打死她', '同歸於盡', '同归于尽', '報復社會', '想不開', '遺書', '紫砂', '自鯊', 'ㄗˋㄕㄚ', 'ㄗㄕㄚ', '想ㄙ', '去ㄙ', 'suicide', 'killmyself', 'endmylife', 'selfharm', 'wanttodie', 'wannadie', 'killhim', 'killher'];
  var RISK_RE = /\b(kms|kys)\b/i;

  var state = { cat: null, mode: 'auto', q: '', tosses: [], busy: false, view: 'ask', resultFrom: 'ask' };

  // ---------- 儲存 ----------
  var mem = {};
  function sget(k) { try { return window.localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
  function sset(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  function loadJSON(k, def) { try { var s = sget(k); return s ? JSON.parse(s) : def; } catch (e) { return def; } }
  function remaining() { return Q.remaining('liuyao'); }
  function consume() { Q.consume('liuyao'); }
  function history() { var h = loadJSON(KEY_H, []); return Array.isArray(h) ? h : []; }
  function saveHistory(h) { sset(KEY_H, JSON.stringify(h.slice(0, HMAX))); }

  // ---------- 工具 ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtTime(r) { return L.fmtDate(r.y, r.m, r.d) + ' ' + L.pad(r.hh) + ':' + L.pad(r.mi) + '（台北時間）'; }
  var BLOCK = Q.BLOCK;

  // ---------- 導覽 ----------
  function show(v) {
    state.view = v;
    if (window.XM) window.XM.syncLiuyao();
    ['ask', 'shake', 'result', 'history', 'about'].forEach(function (x) { $('v-' + x).hidden = x !== v; });
    var tab = (v === 'history' || (v === 'result' && state.resultFrom === 'history')) ? 'history' : (v === 'about' ? 'about' : 'ask');
    Array.prototype.forEach.call($('tabs').children, function (b) {
      if (b.getAttribute('data-tab') === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (v === 'ask') renderQuota();
    if (v === 'history') renderHistory();
    window.scrollTo(0, 0);
  }
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || state.busy) return;
    var t = b.getAttribute('data-tab');
    if (state.view === 'shake' && state.tosses.length) { if (!leaveShakeOk()) return; }
    if (t === 'ask' && window.XM && window.XM.current() !== 'liuyao') { window.XM.showMethod(window.XM.current()); window.scrollTo(0, 0); return; }
    show(t);
  });

  // ---------- 問事頁 ----------
  function renderQuota() {
    var n = remaining(), t = L.taipeiNow(), d = L.dayPillar(t.y, t.m, t.d);
    $('todayinfo').textContent = '今天 ' + L.fmtDate(t.y, t.m, t.d) + '・' + d.gz + '日';
    Q.paint('liuyao', $('quota'), $('quota-msg'), $('start'));
  }
  function renderCats() {
    $('cats').innerHTML = CATS.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + c + '" aria-pressed="' + (state.cat === c) + '">' + c + '</button>';
    }).join('');
  }
  $('cats').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.cat = b.getAttribute('data-cat'); renderCats(); $('ask-msg').textContent = '';
  });
  function renderMode() {
    Array.prototype.forEach.call($('mode').children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === state.mode)); });
    $('mode-desc').textContent = state.mode === 'auto' ? '由程式以安全亂數模擬三枚銅錢，一次排出六爻。' : '自己點擊六次，每次搖三枚銅錢，由下往上成卦。';
  }
  $('mode').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.mode = b.getAttribute('data-mode'); renderMode();
  });
  $('sugg').innerHTML = SUGGEST.map(function (s, i) { return '<button type="button" data-i="' + i + '">' + esc(s[0]) + '<span>' + s[1] + '</span></button>'; }).join('');
  $('sugg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var s = SUGGEST[+b.getAttribute('data-i')];
    $('q').value = s[0]; state.cat = s[1]; renderCats(); updCount(); $('ask-msg').textContent = '';
  });
  function updCount() { $('qcount').textContent = $('q').value.length; }
  $('q').addEventListener('input', updCount);
  $('ref-close').addEventListener('click', function () { $('referral').hidden = true; });

  window.XinsuIsRisk = function (s) { return isRisk(s); };
  function isRisk(s) {
    s = String(s || '');
    if (RISK_RE.test(s)) return true;
    var t = s.toLowerCase().replace(/[\s\u200b-\u200d\ufeff.,，。、!！?？~～…·・'"「」『』()（）\-_*#@]/g, '');
    for (var i = 0; i < RISK.length; i++) if (t.indexOf(RISK[i]) >= 0) return true;
    return false;
  }

  $('start').addEventListener('click', function () {
    if (state.busy) return;
    var q = $('q').value.trim(), msg = $('ask-msg');
    msg.textContent = '';
    if (isRisk(q)) { $('referral').hidden = false; $('referral').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    $('referral').hidden = true;
    if (remaining() <= 0) { renderQuota(); msg.textContent = BLOCK; return; }
    if (!state.cat) { msg.textContent = '請先選擇問事類別。'; return; }
    if (q.length < 2) { msg.textContent = '請寫下想問的事（至少 2 個字）。'; $('q').focus(); return; }
    state.q = q;
    if (state.mode === 'auto') {
      state.busy = true; $('start').disabled = true; $('start').textContent = '起卦中…';
      var tosses = []; for (var i = 0; i < 6; i++) tosses.push(L.tossThree());
      if (window.XinsuMusic) window.XinsuMusic.coin();
      setTimeout(function () { state.busy = false; finalize(tosses); }, 700);
    } else {
      startManual();
    }
  });

  // ---------- 手動搖卦 ----------
  function startManual() {
    state.tosses = [];
    $('sh-cat').textContent = state.cat;
    $('sh-q').textContent = state.q;
    $('sh-result').textContent = '';
    Array.prototype.forEach.call($('coins').children, function (c) { c.className = 'coin'; c.firstChild.textContent = ''; });
    renderStack(); show('shake');
  }
  function slotLabel(i) { return L.POS[i]; }
  function renderStack() {
    var n = state.tosses.length, h = '';
    for (var i = 0; i < 6; i++) {
      var t = state.tosses[i];
      if (t) {
        var v = L.coinsToValue(L.countBacks(t)), yang = v % 2 === 1, mv = v === 6 || v === 9;
        h += '<div class="slot done"><span>' + slotLabel(i) + '</span>' + barHTML(yang, mv) + '<span>' + L.VALUE_NAME[v] + ' ' + v + (mv ? '・動' : '') + '</span></div>';
      } else {
        h += '<div class="slot"><span>' + slotLabel(i) + '</span>' + barHTML(true, false) + '<span></span></div>';
      }
    }
    $('sh-stack').innerHTML = h;
    $('sh-progress').textContent = n < 6 ? '請默念問題，搖第 ' + (n + 1) + '／6 次（' + slotLabel(n) + '）' : '六爻已成，正在排盤…';
    $('sh-toss').disabled = n >= 6;
  }
  $('sh-toss').addEventListener('click', function () {
    if (state.busy || state.tosses.length >= 6) return;
    state.busy = true; $('sh-toss').disabled = true;
    var t = L.tossThree(), coins = $('coins').children;
    if (window.XinsuMusic) window.XinsuMusic.coin();
    Array.prototype.forEach.call(coins, function (c, i) {
      c.className = 'coin'; void c.offsetWidth; c.className = 'coin spin';
      setTimeout(function () { c.className = 'coin ' + (t[i] ? 'yang' : 'yin'); var s = c.querySelector('span'); if (s) s.textContent = t[i] ? '背' : '字'; }, 300);
    });
    setTimeout(function () {
      state.tosses.push(t);
      var b = L.countBacks(t), v = L.coinsToValue(b);
      var desc = { 3: '三背', 2: '二背一字', 1: '一背二字', 0: '三字' }[b];
      $('sh-result').textContent = desc + '＝' + L.VALUE_NAME[v] + ' ' + v + ((v === 6 || v === 9) ? '（動）' : '');
      renderStack();
      state.busy = false;
      if (state.tosses.length < 6) { $('sh-toss').disabled = false; }
      else { state.busy = true; setTimeout(function () { state.busy = false; finalize(state.tosses.slice()); }, 800); }
    }, 650);
  });
  function leaveShakeOk() { state.tosses = []; return true; }
  $('sh-back').addEventListener('click', function () { if (state.busy) return; state.tosses = []; show('ask'); });

  // ---------- 成卦 ----------
  function finalize(tosses) {
    if (remaining() <= 0) { show('ask'); $('ask-msg').textContent = BLOCK; return; }
    var t = L.taipeiNow();
    var values = tosses.map(function (x) { return L.coinsToValue(L.countBacks(x)); });
    var rec = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      y: t.y, m: t.m, d: t.d, hh: t.hh, mi: t.mi,
      cat: state.cat, q: state.q, mode: state.mode, values: values,
      tosses: tosses.map(function (x) { return x.map(function (b) { return b ? 1 : 0; }).join(''); })
    };
    consume();
    var h = history(); h.unshift(rec); saveHistory(h);
    $('q').value = ''; updCount(); state.q = ''; state.tosses = [];
    state.resultFrom = 'ask';
    renderResult(rec); show('result');
    if (window.XinsuMusic) window.XinsuMusic.chime();
  }

  // ---------- 結果 ----------
  function barHTML(yang, mv, cls) {
    return '<span class="bar' + (mv ? ' mv' : '') + (cls ? ' ' + cls : '') + '">' + (yang ? '<i></i>' : '<i></i><i></i>') + '</span>';
  }
  function T(t, k) { return window.XinsuGloss ? window.XinsuGloss.t(t, k, 'ly') : t; }
  function infoHTML(l) {
    return '<span class="qin">' + T(l.qin, l.qin) + '</span>' + l.stem + l.branch + l.elem + (l.isVoid ? '<em class="kong">' + T('空', '空') + '</em>' : '');
  }
  function boardHTML(ch) {
    var has = !!ch.changed, h = '<div class="board' + (has ? ' has-change' : '') + '">';
    h += '<div class="brow bhead"><span>六神</span><span>本卦</span><span></span><span></span>' + (has ? '<span></span><span>變卦</span>' : '') + '</div>';
    for (var i = 5; i >= 0; i--) {
      var a = ch.main.lines[i];
      h += '<div class="brow' + (a.moving ? ' mv' : '') + '" title="' + a.posLabel + '">';
      h += '<span class="sp">' + T(a.spirit, a.spirit) + '</span>';
      h += '<span class="info">' + infoHTML(a) + '</span>';
      h += '<span class="barcell">' + barHTML(a.yang, a.moving) + '<i class="mvsym">' + (a.moving ? (a.yang ? '○' : '×') : '') + '</i></span>';
      h += '<span class="marks">' + (a.isShi ? '<b class="m shi">' + T('世', '世') + '</b>' : '') + (a.isYing ? '<b class="m ying">' + T('應', '應') + '</b>' : '') + (a.moving ? '<b class="m dong">' + T('動', '動') + '</b>' : '') + '</span>';
      if (has) { var b = ch.changed.lines[i]; h += '<span class="barcell">' + barHTML(b.yang, false, 'c') + '</span><span class="info">' + infoHTML(b) + '</span>'; }
      h += '</div>';
    }
    return h + '</div>';
  }
  function flags(l) {
    var f = [];
    if (l.isShi) f.push('世'); if (l.isYing) f.push('應'); if (l.moving) f.push('動'); if (l.isVoid) f.push('空');
    return f.length ? '（' + f.join('、') + '）' : '';
  }
  function yongshenHTML(cat, ch) {
    var ys = YS[cat], lines = ch.main.lines, out = '<p style="margin:0 0 6px">' + ys.text + '</p><ul class="ys">';
    ys.t.forEach(function (t) {
      var hit = lines.filter(function (l) { return l.qin === t; });
      out += '<li><b>' + t + '</b>：' + (hit.length
        ? hit.map(function (l) { return l.posLabel + ' ' + l.stem + l.branch + l.elem + flags(l); }).join('、')
        : '本卦未見' + t + '（用神不上卦）。第一版不排伏神，這裡不做推論。') + '</li>';
    });
    if (ys.ying) {
      var y = lines[ch.main.hex.ying - 1];
      out += '<li><b>應爻</b>：' + y.posLabel + ' ' + y.qin + ' ' + y.stem + y.branch + y.elem + flags(y) + '</li>';
    }
    if (cat === '財運') {
      var br = lines.filter(function (l) { return l.qin === '兄弟'; }), brm = br.filter(function (l) { return l.moving; });
      out += '<li><b>兄弟</b>：本卦共 ' + br.length + ' 處' + (brm.length ? '，其中 ' + brm.length + ' 處發動' : '') + '。' +
        ((br.length >= 2 || brm.length) ? '兄弟多或發動，提醒留意競爭或分利。' : '兄弟不多也未發動。') + '</li>';
    }
    out += '</ul>';
    if (cat === '健康') out += '<p class="warn">不能取代醫療，身體不適請找醫師。</p>';
    return out;
  }
  function yaoHTML(hex, i, on) {
    var yang = hex.bits[i] === 1;
    return '<div class="yao' + (on ? ' on' : '') + '"><span class="t">' + L.lineLabel(i, yang) + '：</span>' + esc(D.get(hex.num).lines[i]) + '</div>';
  }
  function renderResult(rec) {
    var ch = L.buildChart(rec.values, { y: rec.y, m: rec.m, d: rec.d });
    var M = ch.main.hex, C = ch.changed ? ch.changed.hex : null, dm = D.get(M.num), dc = C ? D.get(C.num) : null, day = ch.day;
    var h = '';
    h += '<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="tag">' + esc(rec.cat) + '</span><span class="muted small">' + fmtTime(rec) + '・' + (rec.mode === 'manual' ? '手動' : '自動') + '</span></div>' +
      '<p class="q-echo">「' + esc(rec.q) + '」</p>' +
      '<p class="daybar">' + day.gz + '日・' + day.xun + '旬・旬空 ' + day.void.join('、') + '</p></div>';

    h += '<div class="card"><div class="hexhead' + (C ? ' two' : '') + '">' +
      '<div><div class="k">本卦</div><div class="n">' + M.name + '</div><div class="p">' + M.palace + '宮' + M.palaceElem + '・' + M.genLabel + '・世' + M.shi + '應' + M.ying + '</div></div>' +
      (C ? '<div><div class="k">變卦</div><div class="n">' + C.name + '</div><div class="p">六親依本宮' + M.palaceElem + '</div></div>' : '') +
      '</div>' + boardHTML(ch) +
      '<p class="legend">爻位由上到下為上爻→初爻。○ 老陽動、× 老陰動；世／應已標示；空＝旬空。' + (C ? '' : '本卦無動爻，無變卦。') + '</p></div>';

    h += '<div class="card"><h3>吉凶傾向</h3><div class="luck"><div><span class="muted small">本卦</span><span class="lk lk-' + dm.luck + '">' + dm.luck + '</span></div>' +
      (C ? '<div><span class="muted small">變卦</span><span class="lk lk-' + dc.luck + '">' + dc.luck + '</span></div>' : '') +
      '</div><p class="muted small" style="margin:8px 0 0">只是傾向，不是定論。</p></div>';

    h += '<div class="card"><h3>白話短註</h3><p class="note-item"><b>本卦・' + M.name + '</b>：' + dm.note + '</p>' +
      (C ? '<p class="note-item"><b>變卦・' + C.name + '</b>：' + dc.note + '</p><p class="notice" style="margin:0">有動爻，宜兩卦合看：本卦看眼前狀況，變卦看事情往哪裡發展；動爻的爻辭是這次的重點。</p>' : '') + '</div>';

    h += '<div class="card classic-card"><h3>經文</h3><p class="muted small" style="margin:0 0 4px">本卦卦辭</p><div class="classic">' + esc(D.judgment(M.num, M.short)) + '</div>';
    if (ch.moving.length) {
      h += '<p class="muted small" style="margin:10px 0 4px">動爻爻辭</p><div class="classic">' + ch.moving.map(function (i) { return yaoHTML(M, i, true); }).join('') + '</div>';
      if (ch.moving.length === 6 && D.use[M.num]) h += '<div class="classic yao on">' + D.use[M.num] + '</div>';
    }
    h += '<details><summary>展開本卦六爻爻辭</summary><div class="classic">';
    for (var i = 5; i >= 0; i--) h += yaoHTML(M, i, ch.moving.indexOf(i) >= 0);
    if (D.use[M.num]) h += '<div class="yao">' + D.use[M.num] + '</div>';
    h += '</div></details>';
    if (C) h += '<p class="muted small" style="margin:12px 0 4px">變卦卦辭</p><div class="classic">' + esc(D.judgment(C.num, C.short)) + '</div>';
    h += '<p class="muted small" style="margin:10px 0 0">經文：《周易》（公有領域）</p></div>';

    h += '<div class="card"><h3>用神提示・' + esc(rec.cat) + '</h3>' + yongshenHTML(rec.cat, ch) + '</div>';
    h += '<div id="liuyao-advice"></div>';
    h += '<p class="disclaimer">僅供娛樂與自我反思，非專業建議。本服務適合滿 18 歲使用者。一事一占，此卦已定案。</p>';
    h += '<div class="btn-row noimg"><button type="button" class="btn ghost" data-go="history">看紀錄</button><button type="button" class="btn" data-go="ask">回問事頁</button></div>';
    if (window.XinsuExtras) h += window.XinsuExtras.saveBtnHTML('result-body', '六爻');
    $('result-body').innerHTML = h;
    if (window.XinsuAdvice) {
      window.XinsuAdvice.mount('liuyao-advice', 'liuyao', {
        num: M.num, name: M.name, note: dm.note, cat: rec.cat, q: rec.q,
        movingCount: ch.moving.length,
        changedName: C ? C.name : '',
        changedNote: dc ? dc.note : ''
      });
    }
  }
  $('result-body').addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]'); if (b) { state.resultFrom = 'ask'; show(b.getAttribute('data-go')); }
  });

  // ---------- 紀錄 ----------
  function renderHistory() {
    var list = history(), box = $('history-list');
    if (!list.length) { box.innerHTML = '<div class="empty">還沒有紀錄。<br>完成一次問事後會出現在這裡。</div>'; return; }
    box.innerHTML = list.map(function (r) {
      var ch; try { ch = L.buildChart(r.values, { y: r.y, m: r.m, d: r.d }); } catch (e) { return ''; }
      return '<div class="hitem"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="tag">' + esc(r.cat) + '</span><span class="muted small">' + fmtTime(r) + '</span></div>' +
        '<p class="hq">' + esc(r.q) + '</p><p class="hhex">' + ch.main.hex.name + (ch.changed ? ' → ' + ch.changed.hex.name : '（無變卦）') + '</p>' +
        '<div class="hact"><button type="button" data-act="view" data-id="' + r.id + '">查看</button><button type="button" data-act="del" data-id="' + r.id + '">刪除</button></div></div>';
    }).join('');
  }
  $('history-list').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var id = b.getAttribute('data-id'), act = b.getAttribute('data-act');
    var list = history(), rec = list.filter(function (r) { return r.id === id; })[0];
    if (!rec) return;
    if (act === 'view') { state.resultFrom = 'history'; renderResult(rec); show('result'); return; }
    if (act === 'del') {
      if (b.getAttribute('data-confirm') !== '1') {
        b.setAttribute('data-confirm', '1'); b.textContent = '確定刪除？'; b.className = 'danger';
        setTimeout(function () { if (b.isConnected) { b.removeAttribute('data-confirm'); b.textContent = '刪除'; b.className = ''; } }, 3000);
        return;
      }
      saveHistory(list.filter(function (r) { return r.id !== id; })); renderHistory();
    }
  });

  // ---------- 自檢 ----------
  $('run-tests').addEventListener('click', function () {
    var r = L.selfTest(), ok = r.filter(function (t) { return t.pass; }).length;
    $('test-out').innerHTML = '<p style="margin:10px 0 4px;font-weight:700">' + ok + '／' + r.length + ' 項通過</p><ul class="tests">' +
      r.map(function (t) { return '<li class="' + (t.pass ? 'ok' : 'ng') + '">' + (t.pass ? '✓ ' : '✗ ') + esc(t.name) + (t.detail ? '：' + esc(t.detail) : '') + '</li>'; }).join('') + '</ul>';
    if (Q && Q.selfTest) {
      var q = Q.selfTest(), qok = q.filter(function (t) { return t.pass; }).length;
      $('test-out').insertAdjacentHTML('beforeend', '<p style="margin:12px 0 4px;font-weight:700">每日次數：' + qok + '／' + q.length + ' 項通過</p><ul class="tests">' +
        q.map(function (t) { return '<li class="' + (t.pass ? 'ok' : 'ng') + '">' + (t.pass ? '✓ ' : '✗ ') + esc(t.name) + (t.detail ? '：' + esc(t.detail) : '') + '</li>'; }).join('') + '</ul>');
    }
    if (window.XinsuAdvice && window.XinsuAdvice.selfTest) {
      window.XinsuAdvice.selfTest().then(function (a) {
        var aok = a.filter(function (t) { return t.pass; }).length;
        $('test-out').insertAdjacentHTML('beforeend', '<p style="margin:12px 0 4px;font-weight:700">規則建議：' + aok + '／' + a.length + ' 項通過</p><ul class="tests">' +
          a.map(function (t) { return '<li class="' + (t.pass ? 'ok' : 'ng') + '">' + (t.pass ? '✓ ' : '✗ ') + esc(t.name) + (t.detail ? '：' + esc(t.detail) : '') + '</li>'; }).join('') + '</ul>');
      });
    }
  });

  window.XinsuApp = { show: show, view: function () { return state.view; }, renderQuota: renderQuota };
  // ---------- 啟動 ----------
  renderCats(); renderMode(); renderQuota(); updCount();
  // 跨過午夜時刷新次數
  setInterval(function () { if (state.view === 'ask') renderQuota(); }, 60000);
})();

