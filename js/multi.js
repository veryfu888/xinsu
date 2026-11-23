
/* 心訴 多術數版 — 切換列、共用出生表單與六種術數畫面 */
(function () {
  'use strict';
  var E = window.XinsuEngines, Z = window.iztro, GL = window.XinsuGloss, PL = window.XinsuPlain, T = GL.t, X = window.XinsuExtras;
  var KEY = 'xinsu.v1.method';
  var DISC = '僅供娛樂與自我反思，非專業建議。本服務適合滿 18 歲使用者。';
  var METHODS = [
    ['liuyao', '六爻', '六爻問事', '寫下心事，用三枚銅錢起一卦，看卦象與爻辭。'],
    ['bazi', '八字', '八字命盤', '用出生年月日時排四柱，看十神、五行字數與大運。'],
    ['ziwei', '紫微', '紫微斗數', '依出生時辰排十二宮命盤，看主星亮度與生年四化。'],
    ['qimen', '奇門', '奇門遁甲', '以起局時辰排九宮，看星、門、神與天地盤干。'],
    ['hehun', '合婚', '姻緣合婚', '對照兩人的四柱，看干支合沖刑害與五行互補。'],
    ['fengshui', '風水', '風水坐向', '依房子坐向排玄空飛星與八宅，對照家人命卦。'],
    ['tarot', '塔羅', '塔羅抽牌', '靜心想一件事，從 78 張牌中依牌陣抽牌參考。']
  ];
  var IDS = METHODS.map(function (m) { return m[0]; });
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sget(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* 無痕或停用時略過 */ } }
  function isRisk(s) { return window.XinsuIsRisk ? window.XinsuIsRisk(s || '') : false; }
  var REFERRAL = '<div class="referral"><h3>先停一下，好好照顧自己</h3><p style="margin:0">你寫下的內容讓人有點擔心，這次不排盤。先找人聊聊會更好：</p>' +
    '<div class="hotlines"><a href="tel:1925"><span>衛福部安心專線（24 小時）</span><b>1925</b></a><a href="tel:1995"><span>生命線</span><b>1995</b></a><a href="tel:1980"><span>張老師</span><b>1980</b></a></div>' +
    '<a class="btn callbtn" href="tel:1925">我想找人聊聊（撥打 1925）</a>' +
    '<p class="small" style="margin:0">若有立即危險，請撥 119 或 110。</p></div>';
  var ELC = { 木: 'el-mu', 火: 'el-huo', 土: 'el-tu', 金: 'el-jin', 水: 'el-shui' };
  function elTag(e) { return '<i class="el ' + ELC[e] + '">' + T(e, e) + '</i>'; }
  function rulesHTML(items) { return '<details class="card rules"><summary>取法說明</summary><ul class="notes">' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></details>'; }
  function discHTML() { return '<p class="disclaimer">' + DISC + '</p>'; }

  // ---------- 切換列 ----------
  var cur = IDS.indexOf(sget(KEY)) >= 0 ? sget(KEY) : 'liuyao';
  var bar = $('mtabs');
  var TABICON = window.XINSU_ASSETS && window.XINSU_ASSETS.icons || {};
  bar.innerHTML = METHODS.map(function (m) {
    var ic = TABICON[m[0]] ? '<img src="' + TABICON[m[0]] + '" width="22" height="22" alt="">' : '';
    return '<button type="button" role="tab" id="mt-' + m[0] + '" data-m="' + m[0] + '" aria-label="' + m[2] + '" aria-controls="' + (m[0] === 'liuyao' ? 'v-ask' : 'm-' + m[0]) + '">' + ic + m[1] + '</button>';
  }).join('');
  function paintTabs() {
    Array.prototype.forEach.call(bar.children, function (b) {
      var on = b.getAttribute('data-m') === cur;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
    });
    var m = METHODS[IDS.indexOf(cur)];
    $('intro').innerHTML = '<b>' + m[2] + '</b>　' + m[3];
    if (cur === 'liuyao') {
      if (window.XinsuApp && window.XinsuApp.renderQuota) window.XinsuApp.renderQuota();
    } else paintQuota(cur);
    if (window.XinsuAdvice) window.XinsuAdvice.prefetch(cur);
  }
  function hideAllMethodViews() { IDS.forEach(function (id) { if (id !== 'liuyao') $('m-' + id).hidden = true; }); }
  function showMethod(m) {
    ['ask', 'shake', 'result', 'history', 'about'].forEach(function (x) { $('v-' + x).hidden = true; });
    hideAllMethodViews(); $('m-' + m).hidden = false;
    Array.prototype.forEach.call($('tabs').children, function (b) {
      if (b.getAttribute('data-tab') === 'ask') b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  function setMethod(m, focus) {
    cur = m; sset(KEY, m); paintTabs();
    if (m === 'liuyao') window.XinsuApp.show('ask'); else showMethod(m);
    if (focus) $('mt-' + m).focus();
  }
  bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setMethod(b.getAttribute('data-m')); });
  bar.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    var i = IDS.indexOf(cur);
    i = e.key === 'ArrowLeft' ? (i + 6) % 7 : e.key === 'ArrowRight' ? (i + 1) % 7 : e.key === 'Home' ? 0 : 6;
    setMethod(IDS[i], true);
  });
  window.XM = {
    current: function () { return cur; },
    showMethod: showMethod,
    syncLiuyao: function () { if (cur !== 'liuyao') { cur = 'liuyao'; sset(KEY, cur); } paintTabs(); hideAllMethodViews(); }
  };

  // ---------- 共用：分段按鈕 ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.mview .seg button, .mview .chips button'); if (!b) return;
    var g = b.parentNode;
    if (g.hasAttribute('data-multi')) { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); }
    else Array.prototype.forEach.call(g.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    g.dispatchEvent(new Event('change', { bubbles: true }));
  });
  function segVal(el) { var b = el.querySelector('[aria-pressed=true]'); return b ? b.getAttribute('data-v') : ''; }
  function seg(attr, opts, def) {
    return '<div class="seg seg' + opts.length + '" ' + attr + '>' + opts.map(function (o) { var v = o[0] || o, t = o[1] || o; return '<button type="button" data-v="' + v + '" aria-pressed="' + (v === def) + '">' + t + '</button>'; }).join('') + '</div>';
  }
  function chips(attr, opts, def) {
    return '<div class="chips" ' + attr + '>' + opts.map(function (o) { return '<button type="button" class="chip" data-v="' + o + '" aria-pressed="' + (o === def) + '">' + o + '</button>'; }).join('') + '</div>';
  }
  function opt(v, t, sel) { return '<option value="' + v + '"' + (sel ? ' selected' : '') + '>' + t + '</option>'; }

  // ---------- 共用：出生資料表單 ----------
  function BirthForm(host, id, o) {
    o = o || {};
    var thisYear = E.taipeiNow().y, yrs = opt('', '年');
    for (var y = thisYear; y >= 1901; y--) yrs += opt(y, y + ' 年');
    var sc = opt('', '請選擇時辰'); E.SHICHEN.forEach(function (s, i) { sc += opt(i, s); });
    host.insertAdjacentHTML('beforeend',
      '<div class="card bf" id="' + id + '">' + (o.title ? '<h3>' + o.title + '</h3>' : '') +
      '<div class="prof"><select class="inp" data-f="prof" aria-label="帶入我的資料"></select><button type="button" class="linkbtn" data-f="psave">存為我的資料</button><button type="button" class="linkbtn" data-f="pdel" hidden>刪除這筆</button></div><p class="hint" data-f="pmsg"></p>' +
      '<label class="label" for="' + id + '-name">姓名或暱稱（選填）</label><input class="inp" id="' + id + '-name" data-f="name" maxlength="20" placeholder="只用來顯示">' +
      '<span class="label">性別（必填）</span>' + seg('data-f="gender"', ['男', '女'], '') +
      '<span class="label">曆法</span>' + seg('data-f="cal"', [['solar', '國曆'], ['lunar', '農曆']], 'solar') +
      '<label class="chk" data-show="lunar" hidden><input type="checkbox" data-f="leap"> 閏月</label>' +
      '<span class="label">出生日期</span><div class="ymd"><select class="inp" data-f="y" aria-label="出生年">' + yrs + '</select><select class="inp" data-f="m" aria-label="出生月"></select><select class="inp" data-f="d" aria-label="出生日"></select></div>' +
      '<p class="hint" data-f="conv"></p>' +
      '<span class="label">出生時間</span><div class="radios">' +
      '<label><input type="radio" name="' + id + '-tm" value="exact" checked> 知道幾點幾分</label>' +
      '<label><input type="radio" name="' + id + '-tm" value="shichen"> 只知道時辰</label>' +
      (o.noUnknown ? '' : '<label><input type="radio" name="' + id + '-tm" value="unknown"> 不知道</label>') + '</div>' +
      '<div data-tm="exact"><input type="time" class="inp" data-f="time" aria-label="出生時間"></div>' +
      '<div data-tm="shichen" hidden><select class="inp" data-f="shichen" aria-label="時辰">' + sc + '</select></div>' +
      '<label class="chk"><input type="checkbox" data-f="dst"> 出生時為夏令時間（先減 1 小時；台灣 1945–1979 年部分年份實施）</label>' +
      '<label class="label" for="' + id + '-place">出生地（選填）</label><input class="inp" id="' + id + '-place" data-f="place" maxlength="30" placeholder="例如：台中市（不做真太陽時校正）">' +
      '</div>');
    var root = $(id);
    function f(n) { return root.querySelector('[data-f="' + n + '"]'); }
    function cal() { return segVal(f('cal')); }
    function fillMD() {
      var lunar = cal() === 'lunar', mv = f('m').value, dv = f('d').value, mh = opt('', '月'), dh = opt('', '日');
      for (var m = 1; m <= 12; m++) mh += opt(m, lunar ? E.LUNAR_MONTHS[m - 1] : m + ' 月', String(m) === mv);
      var nd = lunar ? 30 : 31;
      for (var d = 1; d <= nd; d++) dh += opt(d, lunar ? E.LUNAR_DAYS[d - 1] : d + ' 日', String(d) === dv);
      f('m').innerHTML = mh; f('d').innerHTML = dh;
      root.querySelector('[data-show="lunar"]').hidden = !lunar;
    }
    function conv() {
      var y = +f('y').value, m = +f('m').value, d = +f('d').value, out = '';
      if (y && m && d) {
        if (cal() === 'lunar') {
          var r = E.lunarToSolar(y, m, d, f('leap').checked);
          out = r.ok ? '＝ 國曆 ' + E.fmtD(r.y, r.m, r.d) : '<span class="bad">' + esc(r.err) + '</span>';
        } else {
          out = E.solarValid(y, m, d) ? '＝ ' + E.solarToLunar(y, m, d).text : '<span class="bad">國曆 ' + y + ' 年 ' + m + ' 月沒有 ' + d + ' 日。</span>';
        }
      }
      f('conv').innerHTML = out;
    }
    function tm() { var r = root.querySelector('input[type=radio]:checked'); return r ? r.value : ''; }
    function paintTm() { var t = tm(); Array.prototype.forEach.call(root.querySelectorAll('[data-tm]'), function (x) { x.hidden = x.getAttribute('data-tm') !== t; }); }
    root.addEventListener('change', function (e) {
      if (e.target === f('prof')) return;
      if (e.target === f('cal')) fillMD();
      paintTm(); conv();
    });
    function setSeg(el, v) { Array.prototype.forEach.call(el.children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); }); }
    function apply(d) {
      f('name').value = d.name || ''; setSeg(f('gender'), d.gender || ''); setSeg(f('cal'), d.cal || 'solar'); fillMD();
      f('leap').checked = !!d.leap; f('y').value = d.y || ''; f('m').value = d.m || ''; f('d').value = d.d || '';
      var r = root.querySelector('input[type=radio][value="' + d.timeMode + '"]') || root.querySelector('input[type=radio][value=exact]'); r.checked = true;
      f('time').value = d.time || ''; f('shichen').value = (d.shichen === '' || d.shichen == null) ? '' : String(d.shichen);
      f('dst').checked = !!d.dst; f('place').value = d.place || ''; paintTm(); conv();
    }
    function fillProf() {
      var list = X.Profiles.list(), sel = f('prof'), keep = sel.value;
      sel.innerHTML = opt('', list.length ? '帶入我的資料（' + list.length + ' 筆）' : '尚未儲存我的資料') + list.map(function (p) { return opt(p.id, esc(p.label), p.id === keep); }).join('');
      f('pdel').hidden = !sel.value;
    }
    f('prof').addEventListener('change', function () {
      var pr = X.Profiles.get(this.value); f('pdel').hidden = !pr; f('pmsg').textContent = '';
      if (pr) { apply(pr.data); f('pmsg').textContent = '已帶入「' + pr.label + '」。'; }
    });
    f('psave').addEventListener('click', function () {
      var d = read();
      if (!d.gender || !d.y || !d.m || !d.d) { f('pmsg').innerHTML = '<span class="bad">請先填性別與出生日期再儲存。</span>'; return; }
      var pr = X.Profiles.save(d); f('prof').value = pr.id; fillProf(); f('pmsg').textContent = '已存為「' + pr.label + '」（只存在這台裝置）。';
    });
    f('pdel').addEventListener('click', function () { var id = f('prof').value; if (id) { X.Profiles.remove(id); f('prof').value = ''; fillProf(); f('pmsg').textContent = '已刪除。'; } });
    document.addEventListener('xinsu-profiles', fillProf);
    function read() {
      return { name: f('name').value.trim(), gender: segVal(f('gender')), cal: cal(), y: f('y').value, m: f('m').value, d: f('d').value, leap: f('leap').checked,
        timeMode: tm(), time: f('time').value, shichen: f('shichen').value, dst: f('dst').checked, place: f('place').value.trim() };
    }
    fillMD(); fillProf();
    return {
      apply: apply,
      read: read,
      el: root
    };
  }
  function birthHeader(b, label) {
    var i = b.input, t;
    if (b.timeMode === 'exact') t = i.time; else if (b.timeMode === 'shichen') t = E.SHICHEN[+i.shichen].split(' ')[0]; else t = '時辰不詳';
    var lun = E.solarToLunar(b.solar.y, b.solar.m, b.solar.d).text;
    return '<p class="bh">' + (label ? '<span class="tag">' + esc(label) + '</span> ' : '') + '<b>' + esc(b.name || '') + '</b>' + (b.name ? '・' : '') + b.gender +
      '<br><span class="muted small">國曆 ' + E.fmtD(b.solar.y, b.solar.m, b.solar.d) + ' ' + t + (b.timeMode === 'unknown' ? '' : '（台北時間）') + '｜' + lun + (i.place ? '｜' + esc(i.place) : '') + '</span></p>';
  }
  function notesHTML(arr) { return arr && arr.length ? '<ul class="notes">' + arr.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : ''; }
  function formShell(id, inner, btn) {
    var A = window.XINSU_ASSETS || {};
    var banner = (A.banners && A.banners[id]) ? '<img class="mbanner" src="' + A.banners[id] + '" width="750" height="200" alt="">' : '';
    var credit = id === 'tarot' ? '<p class="credit">Pamela Colman Smith 1909 原畫（公有領域）</p>' : '';
    $('m-' + id).innerHTML = banner + '<div class="today"><span id="' + id + '-quota" class="pill">今日剩餘 2 次</span></div>' +
      '<p id="' + id + '-quota-msg" class="msg" hidden></p>' +
      '<div id="' + id + '-form">' + inner + '</div><p class="msg" id="' + id + '-msg"></p><div id="' + id + '-ref"></div>' +
      '<button type="button" class="btn" id="' + id + '-go">' + btn + '</button>' + credit + discHTML() + '<div id="' + id + '-out" class="mout"></div>';
    paintQuota(id);
  }
  function paintQuota(id) {
    var Q = window.XinsuQuota;
    if (!Q) return;
    Q.paint(id, $(id + '-quota'), $(id + '-quota-msg'), $(id + '-go'));
  }
  function gate(id) {
    var Q = window.XinsuQuota;
    if (!Q) return true;
    if (Q.remaining(id) <= 0) {
      paintQuota(id);
      $(id + '-msg').textContent = Q.BLOCK;
      return false;
    }
    return true;
  }
  function finish(id, html, adviceCtx) {
    var Q = window.XinsuQuota;
    if (Q) { Q.consume(id); paintQuota(id); }
    showOut(id, html, adviceCtx);
  }
  function fail(id, errs) { $(id + '-msg').innerHTML = errs.map(esc).join('<br>'); $(id + '-out').innerHTML = ''; }
  function clear(id) { $(id + '-msg').innerHTML = ''; $(id + '-ref').innerHTML = ''; }
  var NAMES = { bazi: '八字', ziwei: '紫微', qimen: '奇門', hehun: '合婚', fengshui: '風水', tarot: '塔羅' };
  function showOut(id, html, adviceCtx) {
    $(id + '-out').innerHTML = html + '<div id="' + id + '-advice"></div>' + discHTML() + '<p class="muted small noimg" style="text-align:center">結果只在這台裝置計算；可按「存成圖片」保留或分享。</p>' + X.saveBtnHTML(id + '-out', NAMES[id]);
    if (window.XinsuAdvice) window.XinsuAdvice.mount(id + '-advice', id, adviceCtx || {});
    if (id === 'tarot') {
      var pack = (window.XINSU_ASSETS && window.XINSU_ASSETS.tarot) || {};
      Array.prototype.forEach.call($(id + '-out').querySelectorAll('img[data-tid]'), function (img) {
        var src = pack.faces && pack.faces[img.getAttribute('data-tid')];
        if (src) { img.loading = 'lazy'; img.decoding = 'async'; img.src = src; }
      });
    }
    $(id + '-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- 八字 ----------
  formShell('bazi', '', '排八字');
  var bzForm = BirthForm($('bazi-form'), 'bz-b', {});
  function pillarTable(r, compact) {
    var P = r.pillars, h = '<table class="bz"><thead><tr><th></th>' + ['年柱', '月柱', '日柱', '時柱'].map(function (l) { return '<th>' + l + '</th>'; }).join('') + '</tr></thead><tbody>';
    function rowF(name, fn) { return '<tr><th>' + T(name, name) + '</th>' + P.map(function (p) { return '<td>' + (p ? fn(p) : '<span class="muted">—</span>') + '</td>'; }).join('') + '</tr>'; }
    h += rowF('十神', function (p) { return '<b class="' + (p.god === '日主' ? 'dm' : '') + '">' + T(p.god, p.god, 'bz') + '</b>'; });
    h += rowF('天干', function (p) { return '<span class="gz">' + p.stem + '</span>' + elTag(p.stemEl); });
    h += rowF('地支', function (p) { return '<span class="gz">' + p.branch + '</span>' + elTag(p.branchEl); });
    if (!compact) h += rowF('藏干', function (p) { return p.hidden.map(function (x) { return '<div class="hg" title="' + x.kind + '"><s>' + x.kind.charAt(0) + '</s>' + x.stem + x.el + ' ' + T(x.god, x.god, 'bz') + '</div>'; }).join(''); });
    h += rowF('納音', function (p) { return '<span class="small">' + p.nayin + '</span>'; });
    return h + '</tbody></table>';
  }
  function countHTML(r) {
    var max = 1; E.ELS.forEach(function (e) { max = Math.max(max, r.count[e]); });
    return '<div class="wx">' + E.ELS.map(function (e) { return '<div><span>' + elTag(e) + '</span><i class="wxbar ' + ELC[e] + '" style="width:' + (r.count[e] / max * 100) + '%"></i><b>' + r.count[e] + '</b></div>'; }).join('') + '</div>';
  }
  function baziOut(r) {
    return { pillars: r.pillars.map(function (p) { return p && { label: p.label, gz: p.gz, god: p.god, stemEl: p.stemEl, branchEl: p.branchEl, hidden: p.hidden, nayin: p.nayin }; }),
      fiveElementCount: r.count, dayun: { forward: r.forward, startYears: r.startYears, startMonths: r.startMonths, smallLuck: r.smallLuck, steps: r.dayun },
      liunian: r.liunian, shensha: r.shensha, dayKong: r.kong, notes: r.birth.notes.concat(r.warnings) };
  }
  var BZ_RULES = [
    '年柱以立春精確時刻、月柱以十二節精確時刻分界；日柱 23:00 起算次日；時柱五鼠遁。',
    '大運：陽年男、陰年女順排，反之逆排；出生到下一個（或上一個）節的天數 ÷ 3 為起運歲數，餘數按比例折月。',
    '天乙貴人：以日干、年干查。甲戊見丑未，乙己見子申，丙丁見亥酉，壬癸見卯巳，庚辛見午寅。',
    '天德、月德、天醫、血刃：以月支查。天德：寅丁、卯申、辰壬、巳辛、午亥、未甲、申癸、酉寅、戌丙、亥乙、子巳、丑庚；月德：寅午戌丙、申子辰壬、亥卯未甲、巳酉丑庚；天醫：月支前一位；血刃：寅丑、卯未、辰寅、巳申、午卯、未酉、申辰、酉戌、戌巳、亥亥、子午、丑子。',
    '文昌、學堂（長生）、詞館（臨官）、祿神、金輿、羊刃：以日干查。羊刃：甲卯、乙辰、丙戊午、丁己未、庚酉、辛戌、壬子、癸丑。',
    '將星、華蓋、驛馬、劫煞、災煞、亡神、桃花：以年支、日支的三合局查，本柱自身也算。',
    '孤辰、寡宿、元辰：以年支查；元辰陽男陰女取沖支後一位，陰男陽女取前一位。旬空：以日柱所在旬查年、月、時支。'
  ];
  $('bazi-go').addEventListener('click', function () {
    clear('bazi');
    var b = E.resolveBirth(bzForm.read());
    if (!b.ok) return fail('bazi', b.errs);
    if (!gate('bazi')) return;
    var r = E.bazi(b), h = '';
    h += '<div class="card">' + birthHeader(b) + notesHTML(b.notes.concat(r.warnings)) + pillarTable(r) + '</div>';
    h += '<div class="card"><h3>五行字數</h3>' + countHTML(r) + '<p class="muted small" style="margin:6px 0 0">天干加地支本氣，共 ' + r.countTotal + ' 字。這只是字數統計，不等於五行旺衰。</p></div>';
    var dy = r.dayun.map(function (d) {
      return '<div class="dy"><b>' + d.gz + '</b><span class="small">' + T(d.god, d.god, 'bz') + '</span><span class="small">' + d.fromAge + '歲' + (d.months ? d.months + '月' : '') + '<br>～' + d.toAge + '歲' + (d.months ? d.months + '月' : '') + '</span><span class="muted small">' + d.startYear + '/' + E.pad(d.startMonth) + '</span></div>';
    }).join('');
    h += PL.box('白話說明', PL.bazi(r));
    h += '<div class="card"><h3>' + T('大運', '大運') + '</h3><p class="small" style="margin:0 0 8px">' + (r.forward ? '順排' : '逆排') + '，' + r.startYears + ' 歲 ' + r.startMonths + ' 個月起運（出生' + (r.forward ? '後' : '前') + '約 ' + r.startDays.toFixed(1) + ' 天交' + r.jie.name + '，三天折一年）。起運前以月柱 ' + r.smallLuck + ' 為小運。每格：干支、十神、歲數範圍、起運年月。</p><div class="dygrid">' + dy + '</div>' +
      '<p class="small" style="margin:10px 0 0">今年' + T('流年', '流年') + '：<b>' + r.liunian.year + ' 年 ' + r.liunian.gz + '</b>（天干對日主為' + E.shishen(r.pillars[2].stem, r.liunian.gz.charAt(0)) + '，以立春分年）</p></div>';
    h += '<div class="card"><h3>神煞（只列命中的）</h3>' + (r.shensha.length ? '<div class="ssl">' + r.shensha.map(function (s) { return '<span class="ss"><b>' + T(s.name, s.name, 'ss') + '</b>' + s.pillars.join('、') + '柱</span>'; }).join('') + '</div>' : '<p class="muted">本命盤未命中所列神煞。</p>') +
      '<p class="muted small" style="margin:8px 0 0">日柱旬空：' + r.kong.join('、') + '。神煞各家取法不一，取法列在下方。</p></div>';
    h += rulesHTML(BZ_RULES);
    X.Records.add('bazi', b.input, baziOut(r));
    finish('bazi', h, { result: r });
  });

  // ---------- 紫微 ----------
  formShell('ziwei', '', '排紫微命盤');
  var zwForm = BirthForm($('ziwei-form'), 'zw-b', { noUnknown: true });
  $('ziwei-form').insertAdjacentHTML('beforeend', '<details class="card adv"><summary>進階選項</summary>' +
    '<span class="label">23:00 後出生</span>' + seg('id="zw-late"', [['next', '算次日子時（預設）'], ['same', '日期仍算當天']], 'next') +
    '<span class="label">農曆閏月</span>' + seg('id="zw-leap"', [['split', '十五以前本月、十六起下月（預設）'], ['whole', '整月按本月']], 'split') + '</details>');
  var MUT = { 祿: 'mu-lu', 權: 'mu-quan', 科: 'mu-ke', 忌: 'mu-ji' };
  var ZW_POS = { 巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4], 辰: [2, 1], 酉: [2, 4], 卯: [3, 1], 戌: [3, 4], 寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4] };
  function pname(n) { return n === '命宮' ? '命宮' : n + '宮'; }
  $('ziwei-go').addEventListener('click', function () {
    clear('ziwei');
    var b = E.resolveBirth(zwForm.read(), { requireTime: true });
    if (!b.ok) return fail('ziwei', b.errs);
    if (!gate('ziwei')) return;
    if (!Z) return fail('ziwei', ['紫微程式庫載入失敗。']);
    var dt = b.dt, y = dt.y, m = dt.m, d = dt.d, idx, notes = b.notes.slice();
    if (dt.h === 23) {
      if (segVal($('zw-late')) === 'next') { var t = new Date(Date.UTC(y, m - 1, d + 1)); y = t.getUTCFullYear(); m = t.getUTCMonth() + 1; d = t.getUTCDate(); notes.push('23:00 後出生，按次日子時排盤（日期 ' + E.fmtD(y, m, d) + '）。'); }
      else notes.push('23:00 後出生，日期仍算當天、以子時排盤。');
      idx = 0;
    } else idx = Math.floor((dt.h + 1) / 2);
    var fix = segVal($('zw-leap')) !== 'whole';
    var lu = E.solarToLunar(y, m, d); if (lu.leap) notes.push('生於農曆閏月，' + (fix ? '十五以前按本月、十六起按下月' : '整月按本月') + '排盤。');
    var a;
    try { a = Z.astro.bySolar(y + '-' + m + '-' + d, idx, b.gender, fix, 'zh-TW'); } catch (e) { return fail('ziwei', ['排盤失敗：' + e.message]); }
    var g = '<div class="zw">';
    var hua = [];
    a.palaces.forEach(function (p) {
      var pos = ZW_POS[p.earthlyBranch], all = p.majorStars.concat(p.minorStars);
      all.forEach(function (s) { if (s.mutagen) hua.push([s.mutagen, s.name, pname(p.name)]); });
      g += '<div class="zp' + (p.name === '命宮' ? ' ming' : '') + '" style="grid-row:' + pos[0] + ';grid-column:' + pos[1] + '">' +
        '<div class="zmaj">' + (p.majorStars.length ? p.majorStars.map(function (s) { return '<span>' + T(s.name, s.name, 'zw') + (s.brightness ? '<s>' + T(s.brightness, s.brightness, 'zw') + '</s>' : '') + (s.mutagen ? '<i class="mu ' + MUT[s.mutagen] + '">' + T(s.mutagen, s.mutagen, 'zw') + '</i>' : '') + '</span>'; }).join('') : '<span class="muted">（無主星）</span>') + '</div>' +
        '<div class="zmin">' + p.minorStars.map(function (s) { return T(s.name, s.name, 'zw') + (s.mutagen ? '<i class="mu ' + MUT[s.mutagen] + '">' + T(s.mutagen, s.mutagen, 'zw') + '</i>' : ''); }).join(' ') + '</div>' +
        '<div class="zadj">' + p.adjectiveStars.slice(0, 4).map(function (s) { return s.name; }).join(' ') + '</div>' +
        '<div class="zft"><b>' + T(pname(p.name), pname(p.name), 'zw') + '</b>' + (p.isBodyPalace ? '<i class="body">' + T('身', '身宮', 'zw') + '</i>' : '') + '<span>' + p.heavenlyStem + p.earthlyBranch + '</span><span class="muted">' + p.decadal.range[0] + '–' + p.decadal.range[1] + '</span></div></div>';
    });
    g += '<div class="zc"><p><b>' + esc(b.name || '紫微命盤') + '</b>　' + b.gender + '</p><p>國曆 ' + E.fmtD(b.solar.y, b.solar.m, b.solar.d) + ' ' + (b.timeMode === 'exact' ? b.input.time : '') + '</p><p>農曆 ' + esc(a.lunarDate) + ' ' + esc(a.time) + '</p><p>四柱 ' + esc(a.chineseDate) + '</p><p>' + T(esc(a.fiveElementsClass), '五行局', 'zw') + '</p><p>' + T('命主', '命主', 'zw') + ' ' + esc(a.soul) + '・' + T('身主', '身主', 'zw') + ' ' + esc(a.body) + '</p><p>命宮在' + a.earthlyBranchOfSoulPalace + '・身宮在' + a.earthlyBranchOfBodyPalace + '</p></div></div>';
    var order = '祿權科忌';
    hua.sort(function (x, y2) { return order.indexOf(x[0]) - order.indexOf(y2[0]); });
    var h = '<div class="card">' + notesHTML(notes) + g + '<p class="legend">亮度：廟旺得利平不陷；四化：<i class="mu mu-lu">祿</i><i class="mu mu-quan">權</i><i class="mu mu-ke">科</i><i class="mu mu-ji">忌</i>；宮名下方為宮干支與大限（虛歲）。</p></div>';
    h += PL.box('白話說明', PL.ziwei(a));
    h += '<div class="card"><h3>生年四化在哪一宮</h3><ul class="notes">' + hua.map(function (x) { return '<li><i class="mu ' + MUT[x[0]] + '">' + x[0] + '</i> ' + x[1] + '化' + x[0] + '：' + x[2] + '</li>'; }).join('') + '</ul></div>';
    X.Records.add('ziwei', { birth: b.input, lateZi: segVal($('zw-late')), leapRule: segVal($('zw-leap')) }, {
      solarDateUsed: y + '/' + m + '/' + d, timeIndex: idx, lunarDate: a.lunarDate, chineseDate: a.chineseDate, fiveElementsClass: a.fiveElementsClass, soul: a.soul, body: a.body,
      soulBranch: a.earthlyBranchOfSoulPalace, bodyBranch: a.earthlyBranchOfBodyPalace,
      palaces: a.palaces.map(function (p) { function st(x) { return { name: x.name, brightness: x.brightness || '', mutagen: x.mutagen || '' }; } return { name: p.name, gz: p.heavenlyStem + p.earthlyBranch, isBody: p.isBodyPalace, major: p.majorStars.map(st), minor: p.minorStars.map(st), adjective: p.adjectiveStars.map(function (x) { return x.name; }), decadal: p.decadal.range }; }),
      notes: notes });
    h += rulesHTML(['排盤由 iztro 程式庫完成（預設通行派安星法），主星亮度、四化、雜曜依該庫設定。', '23:00 後出生：' + (segVal($('zw-late')) === 'next' ? '算次日子時' : '日期仍算當天') + '；閏月：' + (fix ? '十五日以前按本月、十六日起按下月' : '整月按本月') + '。', '大限歲數為虛歲。']);
    finish('ziwei', h, { result: a });
  });

  // ---------- 奇門 ----------
  var QM_CATS = ['事業', '財運', '感情', '考試', '健康', '出行', '訴訟', '尋物', '其他'];
  var QM_AIM = ['能不能成', '什麼時候動', '選哪邊', '要避開什麼', '整體趨勢'];
  formShell('qimen', '<div class="card"><label class="label" for="qm-q">問題（必填）</label><textarea id="qm-q" maxlength="120" placeholder="一次只問一件事，例如：這週談的合作能不能成？"></textarea>' +
    '<span class="label">類別</span>' + chips('id="qm-cat"', QM_CATS, '事業') +
    '<span class="label">最想判斷什麼</span>' + chips('id="qm-aim"', QM_AIM, '能不能成') +
    '<span class="label">起局時間</span>' + seg('id="qm-when"', [['now', '現在（台北時間）'], ['set', '指定時間']], 'now') +
    '<div id="qm-setbox" hidden><input type="datetime-local" class="inp" id="qm-dt" aria-label="起局時間"></div></div>', '起局排盤');
  $('qm-when').addEventListener('change', function () { $('qm-setbox').hidden = segVal($('qm-when')) !== 'set'; });
  var QM_GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  $('qimen-go').addEventListener('click', function () {
    clear('qimen');
    var q = $('qm-q').value.trim(), errs = [];
    if (isRisk(q)) { $('qimen-ref').innerHTML = REFERRAL; $('qimen-out').innerHTML = ''; return; }
    if (q.length < 2) errs.push('請寫下想問的事（至少 2 個字）。');
    var t;
    if (segVal($('qm-when')) === 'set') {
      var v = $('qm-dt').value, mm = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (!mm) errs.push('請指定起局的日期與時間。'); else t = { y: +mm[1], m: +mm[2], d: +mm[3], h: +mm[4], mi: +mm[5] };
      if (t && (t.y < 1901 || t.y > 2099)) errs.push('起局年份請在 1901–2099 之間。');
    } else t = E.taipeiNow();
    if (errs.length) return fail('qimen', errs);
    if (!gate('qimen')) return;
    var c = E.qimen(t), cat = segVal($('qm-cat')) || '其他', fo = E.qimenFocus(c, cat);
    var g = '<div class="qm">';
    QM_GRID.forEach(function (p) {
      var x = c.cells[p], tags = '';
      if (c.kongPalaces.indexOf(p) >= 0) tags += '<i class="qtag">空</i>';
      if (c.horsePalace === p) tags += '<i class="qtag horse">馬</i>';
      if (p === 5) { g += '<div class="qc mid"><div class="qn">中五宮</div><div class="qe">地盤 ' + x.earth + '</div><div class="muted small">寄坤二宮，<br>隨天芮同行</div></div>'; return; }
      g += '<div class="qc' + (fo.hits[p] ? ' hit' : '') + '"><div class="qn">' + E.PALACE[p] + tags + '</div><div class="qgod">' + T(x.god, x.god, 'qm') + '</div><div class="qstar">' + x.stars.map(function (s) { return T(s, s, 'qm'); }).join('＋') + '</div><div class="qdoor">' + T(x.door, x.door, 'qm') + '</div><div class="qst"><b>' + x.heaven.join('') + '</b><span>／' + x.earth + '</span></div></div>';
    });
    g += '</div>';
    var P = c.pillars, info = '<dl class="qinfo">' +
      '<dt>起局時間</dt><dd>' + E.fmtDT(t) + '（台北時間）</dd><dt>四柱</dt><dd>' + P.join(' ') + '</dd>' +
      '<dt>節氣</dt><dd>' + c.term + '（' + E.fmtDT(c.termStart) + ' 起，至 ' + c.nextTerm + ' ' + E.fmtDT(c.nextStart) + '）</dd>' +
      '<dt>' + T('局數', '局數', 'qm') + '</dt><dd>' + T(c.yang ? '陽遁' : '陰遁', c.yang ? '陽遁' : '陰遁', 'qm') + ' ' + c.ju + ' 局・' + T(c.yuan, '三元', 'qm') + '</dd><dt>' + T('旬首', '旬首', 'qm') + '</dt><dd>' + c.xun + '（遁' + c.xunYi + '）</dd>' +
      '<dt>' + T('值符', '值符', 'qm') + '</dt><dd>' + c.zhifu + '，落' + E.PALACE[c.zhifuPalace] + '</dd><dt>' + T('值使', '值使', 'qm') + '</dt><dd>' + c.zhishi + '，落' + E.PALACE[c.zhishiPalace] + '</dd>' +
      '<dt>' + T('時旬空', '空亡', 'qm') + '</dt><dd>' + c.kong.join('、') + '（' + c.kongPalaces.map(function (p) { return E.PNAME[p]; }).join('、') + '宮）</dd><dt>' + T('驛馬', '驛馬星', 'qm') + '</dt><dd>' + c.horse + '（' + E.PNAME[c.horsePalace] + '宮）</dd></dl>';
    var hitList = Object.keys(fo.hits).map(function (p) { return '<li>' + E.PALACE[p] + '：' + fo.hits[p].join('、') + '</li>'; }).join('');
    var h = '<div class="card"><span class="tag">' + cat + '</span> <span class="muted small">想判斷：' + esc(segVal($('qm-aim'))) + '</span><p class="q-echo">「' + esc(q) + '」</p></div>' +
      '<div class="card">' + g + '<p class="legend">上南下北。每宮由上而下：八神、九星、八門、天盤干／地盤干；框線為用神相關宮位。</p></div>' +
      '<div class="card"><h3>用神提示</h3><p style="margin:0 0 6px">' + fo.text + '</p>' + (hitList ? '<ul class="notes">' + hitList + '</ul>' : '<p class="muted">本局未找到對應的門、神或干。</p>') + '<p class="muted small" style="margin:6px 0 0">這裡只排盤和標示，不自動論吉凶。</p></div>' +
      PL.box('符號白話', PL.qimen(c, fo)) +
      (X.Records.add('qimen', { question: q, category: cat, aim: segVal($('qm-aim')), time: E.fmtDT(t) }, { chart: c, focus: fo }) && '') +
      '<div class="card"><h3>基本資訊</h3>' + info + '</div>' +
      rulesHTML(['陰陽遁看當下節氣（含中氣）：冬至到芒種陽遁，夏至到大雪陰遁。', '三元：日柱（23:00 起算次日）在六十甲子的序號 ÷ 5 取整數再 mod 3。', '值符星轉到時干落宮，八星與天盤干沿 1→8→3→4→9→2→7→6 整體旋轉；值使從旬首儀地盤宮起每時辰走一宮，落五寄坤。', '用神框選：事業看開門、值符；財運看生門、天盤戊；感情看六合、天盤乙庚；考試看景門、天盤丁；健康看天芮、天心（以上依開發說明）。出行看開門與驛馬、訴訟看驚門與值符、尋物看時干落宮與六合、其他看值符、值使與時干（以上為本站補充，請自行斟酌）。']);
    finish('qimen', h, { result: c, focus: fo, cat: cat });
  });

  // ---------- 合婚 ----------
  formShell('hehun', '', '對照兩人命盤');
  var hhA = BirthForm($('hehun-form'), 'hh-a', { title: '甲方' }), hhB = BirthForm($('hehun-form'), 'hh-b', { title: '乙方' });
  $('hehun-form').insertAdjacentHTML('beforeend', '<div class="card"><span class="label">目前關係</span>' + chips('id="hh-rel"', ['曖昧', '交往', '同居', '訂婚', '已婚', '分開', '其他'], '交往') + '</div>');
  $('hehun-go').addEventListener('click', function () {
    clear('hehun');
    var a = E.resolveBirth(hhA.read()), b = E.resolveBirth(hhB.read()), errs = [];
    if (!a.ok) errs = errs.concat(a.errs.map(function (x) { return '甲方：' + x; }));
    if (!b.ok) errs = errs.concat(b.errs.map(function (x) { return '乙方：' + x; }));
    if (errs.length) return fail('hehun', errs);
    if (!gate('hehun')) return;
    var A = E.bazi(a), B = E.bazi(b), r = E.hehun(A, B), na = a.name || '甲方', nb = b.name || '乙方';
    function rel(x) { return x.rel.length ? x.rel.join('、') : '無合沖刑害'; }
    var h = '<div class="card"><p class="small" style="margin:0">目前關係：<span class="tag">' + esc(segVal($('hh-rel'))) + '</span></p></div>';
    h += '<div class="card">' + birthHeader(a, '甲方') + notesHTML(a.notes) + pillarTable(A, true) + '</div>';
    h += '<div class="card">' + birthHeader(b, '乙方') + notesHTML(b.notes) + pillarTable(B, true) + '</div>';
    h += '<div class="card"><h3>干支對照</h3><table class="cmp"><tbody>' +
      '<tr><th>年干</th><td>' + r.yearStem.a + '・' + r.yearStem.b + '</td><td>' + rel(r.yearStem) + '</td></tr>' +
      '<tr><th>日干</th><td>' + r.dayStem.a + '・' + r.dayStem.b + '</td><td>' + rel(r.dayStem) + '</td></tr>' +
      '<tr><th>年支（生肖）</th><td>' + r.yearBranch.a + '・' + r.yearBranch.b + '</td><td>' + rel(r.yearBranch) + '</td></tr>' +
      '<tr><th>日支（配偶宮）</th><td>' + r.dayBranch.a + '・' + r.dayBranch.b + '</td><td>' + rel(r.dayBranch) + '</td></tr></tbody></table></div>';
    h += '<div class="card"><h3>日主關係</h3><ul class="notes"><li>對' + esc(nb) + '而言，' + esc(na) + '的日主 ' + r.dayStem.a + ' 是「' + T(r.dayMaster.aToB, r.dayMaster.aToB, 'bz') + '」</li><li>對' + esc(na) + '而言，' + esc(nb) + '的日主 ' + r.dayStem.b + ' 是「' + T(r.dayMaster.bToA, r.dayMaster.bToA, 'bz') + '」</li><li>五行：' + r.dayMaster.el + '</li></ul></div>';
    h += '<div class="card"><h3>五行互補</h3><table class="cmp wxt"><thead><tr><th></th>' + E.ELS.map(function (e) { return '<th>' + elTag(e) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      '<tr><th>' + esc(na) + '</th>' + E.ELS.map(function (e) { return '<td>' + A.count[e] + '</td>'; }).join('') + '</tr>' +
      '<tr><th>' + esc(nb) + '</th>' + E.ELS.map(function (e) { return '<td>' + B.count[e] + '</td>'; }).join('') + '</tr></tbody></table>' +
      (r.lack.length ? '<ul class="notes">' + r.lack.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p class="small">兩人五行皆不缺。</p>') + '<p class="muted small" style="margin:4px 0 0">字數統計（天干加地支本氣），不等於旺衰。</p></div>';
    h += '<div class="card"><h3>年柱納音</h3><p style="margin:0">' + esc(na) + ' ' + A.pillars[0].gz + ' ' + r.nayin.a + '；' + esc(nb) + ' ' + B.pillars[0].gz + ' ' + r.nayin.b + '</p><p class="small" style="margin:4px 0 0">納音五行：' + r.nayin.rel + '</p></div>';
    X.Records.add('hehun', { a: a.input, b: b.input, relation: segVal($('hh-rel')) }, { a: baziOut(A), b: baziOut(B), compare: r });
    h += '<div class="notice">本頁不打分數、不給姻緣指數：手邊參考資料只有各項的權重，沒有可重現的計分細則，硬算分數等於編造。請把以上當作彼此了解的話題。</div>';
    finish('hehun', h, { result: r });
  });

  // ---------- 風水 ----------
  var thisY = E.taipeiNow().y, yrOpts = opt('', '年'), lnOpts = '';
  for (var yy = thisY; yy >= 1864; yy--) yrOpts += opt(yy, yy + ' 年');
  for (var ly = thisY - 5; ly <= thisY + 10; ly++) lnOpts += opt(ly, ly + ' 年', ly === thisY);
  var moOpts = opt('', '月份不確定'); for (var mo = 1; mo <= 12; mo++) moOpts += opt(mo, mo + ' 月');
  var mtOpts = opt('', '請選擇坐山'); E.MOUNTAINS.forEach(function (m) { mtOpts += opt(m, '坐' + m + '（向' + E.MOUNTAINS[(E.MOUNTAINS.indexOf(m) + 12) % 24] + '）'); });
  formShell('fengshui', '<div class="card"><span class="label">坐向</span>' + seg('id="fs-mode"', [['deg', '向首羅盤度數'], ['mt', '從 24 山選坐山']], 'deg') +
    '<div id="fs-degbox"><input type="number" class="inp" id="fs-deg" min="0" max="359.9" step="0.1" inputmode="decimal" placeholder="0–359.9（向首方向）"><p class="hint" id="fs-deginfo"></p></div>' +
    '<div id="fs-mtbox" hidden><select class="inp" id="fs-mt">' + mtOpts + '</select></div>' +
    '<label class="chk"><input type="checkbox" id="fs-ti"> 兼向，用替卦</label>' +
    '<span class="label">入住（或大修完工）年月</span><div class="ymd two"><select class="inp" id="fs-my">' + yrOpts + '</select><select class="inp" id="fs-mm">' + moOpts + '</select></div>' +
    '<label class="label" for="fs-built">建成年份（選填，只顯示）</label><input type="number" class="inp" id="fs-built" min="1800" max="' + thisY + '" placeholder="例如 1998">' +
    '<span class="label">流年</span><select class="inp" id="fs-ln">' + lnOpts + '</select></div>' +
    '<div class="card"><h3>居住者（最多 6 人，選填）</h3><select class="inp" id="fs-prof" aria-label="從我的資料加入居住者" style="margin-bottom:10px"></select><div id="fs-people"></div><button type="button" class="btn ghost small-btn" id="fs-add">＋ 新增居住者</button></div>' +
    '<div class="card"><label class="label" for="fs-focus">想看的重點</label><input class="inp" id="fs-focus" maxlength="40" placeholder="例如：財位、睡房方位、讀書">' +
    '<label class="label" for="fs-note">格局備註（原樣附上，不判讀）</label><textarea id="fs-note" maxlength="300" placeholder="例如：大門在東南、廚房在西"></textarea>' +
    '<p class="muted small" style="margin:6px 0 0">平面圖判讀：即將推出。</p></div>', '排飛星盤');
  function addPerson() {
    var box = $('fs-people'); if (box.children.length >= 6) return;
    box.insertAdjacentHTML('beforeend', '<div class="person"><input class="inp" data-p="name" maxlength="12" placeholder="稱呼"><select class="inp" data-p="g"><option value="">性別</option><option>男</option><option>女</option></select><input type="date" class="inp" data-p="bd" min="1901-01-01" aria-label="國曆生日"><button type="button" class="linkbtn" data-p="del" aria-label="移除">移除</button></div>');
    $('fs-add').hidden = box.children.length >= 6;
  }
  addPerson();
  function fillFsProf() { var list = X.Profiles.list(); $('fs-prof').innerHTML = opt('', list.length ? '從我的資料加入居住者…' : '（尚未儲存我的資料）') + list.map(function (p) { return opt(p.id, esc(p.label)); }).join(''); }
  fillFsProf(); document.addEventListener('xinsu-profiles', fillFsProf);
  $('fs-prof').addEventListener('change', function () {
    var pr = X.Profiles.get(this.value); this.value = ''; if (!pr) return;
    var d = pr.data, y = +d.y, m = +d.m, dd = +d.d;
    if (d.cal === 'lunar') { var r = E.lunarToSolar(y, m, dd, d.leap); if (!r.ok) return; y = r.y; m = r.m; dd = r.d; }
    var rows = Array.prototype.filter.call($('fs-people').children, function (row) { return !row.querySelector('[data-p=name]').value && !row.querySelector('[data-p=bd]').value; });
    if (!rows.length) { if ($('fs-people').children.length >= 6) return; addPerson(); rows = [$('fs-people').lastElementChild]; }
    var row = rows[0]; row.querySelector('[data-p=name]').value = d.name || pr.label; row.querySelector('[data-p=g]').value = d.gender; row.querySelector('[data-p=bd]').value = y + '-' + E.pad(m) + '-' + E.pad(dd);
  });
  $('fs-add').addEventListener('click', addPerson);
  $('fs-people').addEventListener('click', function (e) { var b = e.target.closest('[data-p=del]'); if (b) { b.parentNode.remove(); $('fs-add').hidden = false; } });
  $('fs-mode').addEventListener('change', function () { var d = segVal($('fs-mode')) === 'deg'; $('fs-degbox').hidden = !d; $('fs-mtbox').hidden = d; });
  function degText() {
    var v = $('fs-deg').value, n = parseFloat(v), out = '';
    if (v !== '') {
      if (isNaN(n) || n < 0 || n > 359.9) out = '<span class="bad">度數請在 0 到 359.9 之間。</span>';
      else { var di = E.degreeInfo(n); out = '向' + di.facing + '、坐' + di.sitting + '，偏離中線 ' + (di.offset >= 0 ? '+' : '') + di.offset.toFixed(1) + '°' + (di.note ? '<br><span class="warnline">' + esc(di.note) + '</span>' : ''); }
    }
    $('fs-deginfo').innerHTML = out;
  }
  $('fs-deg').addEventListener('input', degText);
  var FS_GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  function fsGrid(f) {
    var g = '<div class="fsg">';
    FS_GRID.forEach(function (p) {
      var mark = p === f.sp ? '<i class="qtag zuo">坐' + f.sitting + '</i>' : p === f.fp ? '<i class="qtag xiang">向' + f.facing + '</i>' : '';
      g += '<div class="fc' + (p === f.sp ? ' sp' : '') + (p === f.fp ? ' fp' : '') + '"><div class="fstop"><span class="ms" title="山星">' + T(String(f.mtn[p]), GL.fsStar(f.mtn[p]), 'fs') + '</span><span class="ws" title="向星">' + T(String(f.wat[p]), GL.fsStar(f.wat[p]), 'fs') + '</span></div>' +
        '<div class="fy" title="運星">' + f.yun[p] + '</div><div class="fbot"><span>' + (p === 5 ? '中宮' : E.TRI[p] + '・' + E.DIR[p]) + '</span><span class="fa" title="流年星">年' + f.ann[p] + '</span></div>' + mark + '</div>';
    });
    return g + '</div>';
  }
  function fsChartHTML(f, title) {
    var ms = f.mStar, ws = f.fStar;
    var line = function (s, nm) { return nm + ' ' + s.orig + (s.replaced ? '→替星 ' + s.center : '') + ' 入中，' + (s.fwd ? '順飛' : '逆飛') + '（依' + s.basis + '山' + (E.MT_YANG[s.basis] ? '陽' : '陰') + '）'; };
    return '<div class="card"><h3>' + title + '</h3><p class="small" style="margin:0 0 8px">坐' + f.sitting + '向' + f.facing + '・' + f.period + ' 運・' + (f.useTi ? '替卦' : '下卦') + '<br>' + line(ms, '山星') + '<br>' + line(ws, '向星') + '<br>' + f.year + ' 流年 ' + f.yearStar + ' 入中順飛</p>' + fsGrid(f) +
      '<p class="legend">每宮：左上山星、右上向星、中間運星、右下流年星；上南下北。</p>' +
      '<p style="margin:8px 0 0"><b>格局：</b>' + (f.patterns.length ? f.patterns.map(function (x) { var k = x.replace(/^(山星|向星)/, '').replace('與運星', ''); return T(x, GL.lookup(x, 'fs') ? x : k, 'fs'); }).join('、') : '未見所列特殊格局') + '</p></div>';
  }
  $('fengshui-go').addEventListener('click', function () {
    clear('fengshui');
    var errs = [], sitting, di = null;
    var note = $('fs-note').value.trim(), focus = $('fs-focus').value.trim();
    if (isRisk(note) || isRisk(focus)) { $('fengshui-ref').innerHTML = REFERRAL; $('fengshui-out').innerHTML = ''; return; }
    if (segVal($('fs-mode')) === 'deg') {
      var v = $('fs-deg').value, n = parseFloat(v);
      if (v === '' || isNaN(n) || n < 0 || n > 359.9) errs.push('向首度數請填 0 到 359.9 之間。');
      else { di = E.degreeInfo(n); sitting = di.sitting; }
    } else { sitting = $('fs-mt').value; if (!sitting) errs.push('請選擇坐山。'); }
    var my = +$('fs-my').value, mm = +$('fs-mm').value;
    if (!my) errs.push('請選擇入住（或大修完工）年份。');
    var people = [];
    Array.prototype.forEach.call($('fs-people').children, function (row, i) {
      var nm = row.querySelector('[data-p=name]').value.trim(), g = row.querySelector('[data-p=g]').value, bd = row.querySelector('[data-p=bd]').value;
      if (!nm && !g && !bd) return;
      var label = nm || '居住者' + (i + 1), mt = bd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!g) errs.push(label + '：請選擇性別。');
      if (!mt || +mt[1] < 1901) errs.push(label + '：請填國曆生日。');
      else if (g) people.push({ name: label, g: g, y: +mt[1], m: +mt[2], d: +mt[3] });
    });
    if (errs.length) return fail('fengshui', errs);
    if (!gate('fengshui')) return;
    var py = mm === 1 ? my - 1 : my, pnotes = [];
    if (mm === 1) pnotes.push('一月入住在立春前，元運以 ' + py + ' 年計。');
    if ((mm === 2 || !mm) && E.periodOf(my - 1) !== E.periodOf(my)) pnotes.push(my + ' 年是換運年；' + (mm === 2 ? '二月' : '月份不確定') + '時以立春後計為 ' + E.periodOf(my) + ' 運，若在立春前入住應為 ' + E.periodOf(my - 1) + ' 運。');
    var period = E.periodOf(py), year = +$('fs-ln').value, useTi = $('fs-ti').checked;
    var h = '<div class="card"><p style="margin:0"><b>坐' + sitting + '向' + E.MOUNTAINS[(E.MOUNTAINS.indexOf(sitting) + 12) % 24] + '</b>' + (di ? '　向首 ' + di.deg.toFixed(1) + '°（偏離中線 ' + (di.offset >= 0 ? '+' : '') + di.offset.toFixed(1) + '°）' : '') +
      '</p><p class="small" style="margin:4px 0 0">入住 ' + my + (mm ? '/' + E.pad(mm) : '（月份不確定）') + '・' + period + ' 運' + ($('fs-built').value ? '・建成 ' + esc($('fs-built').value) + ' 年' : '') + '・流年 ' + year + '</p>' +
      notesHTML(pnotes.concat(di && di.note ? [di.note] : [])) + '</div>';
    var showBoth = di && di.jian;
    var f1 = E.flyingStars(sitting, period, useTi, year);
    h += fsChartHTML(f1, useTi ? '替卦飛星盤' : '下卦飛星盤');
    if (showBoth) h += fsChartHTML(E.flyingStars(sitting, period, !useTi, year), (useTi ? '下卦' : '替卦') + '飛星盤（兼向，兩盤並參）');
    else if (useTi) h += '<p class="muted small">提醒：偏離中線未超過 3°，一般用下卦即可；此處依你的勾選排替卦。</p>';
    h += '<div class="card"><h3>' + period + ' 運各星旺衰</h3><div class="ssl">' + f1.states.map(function (s) { return '<span class="ss"><b>' + T(String(s.star), GL.fsStar(s.star), 'fs') + '</b>' + T(s.state, s.state, 'fs') + '</span>'; }).join('') + '</div></div>';
    var bz = E.bazhai(sitting);
    h += '<div class="card"><h3>八宅遊年（' + bz.gua + '宅・' + bz.group + '）</h3><table class="cmp"><thead><tr><th>遊年</th><th>卦</th><th>方位</th><th>等級</th></tr></thead><tbody>' +
      bz.you.map(function (x) { return '<tr><td>' + T(x.star, x.star, 'fs') + '</td><td>' + x.gua + '</td><td>' + x.dir + '</td><td>' + x.rank + '</td></tr>'; }).join('') + '</tbody></table></div>';
    if (people.length) {
      h += '<div class="card"><h3>居住者命卦</h3>' + people.map(function (p) {
        var mg = E.mingGua(p.y, p.m, p.d, p.g), good = mg.you.filter(function (x) { return /吉/.test(x.rank); }), bad = mg.you.filter(function (x) { return /凶/.test(x.rank); });
        var match = (mg.group === '東四命') === (bz.group === '東四宅');
        return '<div class="pm"><p style="margin:0"><b>' + esc(p.name) + '</b>（' + p.g + '，' + E.fmtD(p.y, p.m, p.d) + (mg.year !== p.y ? '，立春前算 ' + mg.year + ' 年' : '') + '）：' + mg.num + ' ' + mg.gua + '・' + T(mg.group, mg.group, 'fs') + '　<span class="tag">' + T(match ? '宅命同組' : '宅命不同組', match ? '宅命同組' : '宅命不同組', 'fs') + '</span></p>' +
          '<p class="small" style="margin:2px 0 0">四吉方：' + good.map(function (x) { return x.star + x.dir; }).join('、') + '<br>四凶方：' + bad.map(function (x) { return x.star + x.dir; }).join('、') + '</p></div>';
      }).join('') + '</div>';
    }
    h += PL.box('白話說明', PL.fengshui(f1, bz, people.map(function (p) { var mg = E.mingGua(p.y, p.m, p.d, p.g); return { name: p.name, group: mg.group, match: (mg.group === '東四命') === (bz.group === '東四宅') }; })));
    if (focus || note) h += '<div class="card"><h3>你的備註（原樣附上，不判讀）</h3>' + (focus ? '<p class="small" style="margin:0">想看的重點：' + esc(focus) + '</p>' : '') + (note ? '<p class="small pre" style="margin:4px 0 0">' + esc(note) + '</p>' : '') + '<p class="muted small" style="margin:6px 0 0">平面圖判讀：即將推出。</p></div>';
    h += '<div class="notice">本頁只排盤與標示格局，不自動論斷吉凶。</div>';
    X.Records.add('fengshui', { degree: di ? di.deg : null, sitting: sitting, useTi: useTi, moveIn: my + (mm ? '/' + mm : ''), built: $('fs-built').value, year: year, focus: focus, note: note, people: people },
      { chart: f1, degreeInfo: di, bazhai: bz, people: people.map(function (p) { var mg = E.mingGua(p.y, p.m, p.d, p.g); return { name: p.name, num: mg.num, gua: mg.gua, group: mg.group, you: mg.you }; }) });
    h += rulesHTML(['24 山每山 15°，子山中線 0°；偏離中線 ≥6° 提示大／小空亡，>3° 提示兼向並兩盤並參。', '元運：1864 年起每 20 年一運，以立春分年。', '山星、向星：取運盤落在坐宮、向宮的數入中；以該數洛書本宮內與坐山（向首）同元龍那一山的陰陽定順逆，5 入中用坐山（向首）本身陰陽。', '替卦：子癸甲申→1；坤壬乙卯未→2；戌乾亥辰巽巳→6；艮丙辛酉丑→7；寅午庚丁→9；5 不替，順逆不變。', '旺衰：當運星為當旺，後兩運為生氣，前一運為退氣，五黃另列，其餘為衰死。', '流年星：(11 − 年 mod 9) mod 9，0 當 9。八宅：宅卦依坐山；命卦依立春分年。']);
    finish('fengshui', h, { flying: f1, bz: bz, people: people.map(function (p) { var mg = E.mingGua(p.y, p.m, p.d, p.g); return { name: p.name, group: mg.group, match: (mg.group === '東四命') === (bz.group === '東四宅') }; }), focus: focus });
  });

  // ---------- 塔羅 ----------
  var spOpts = Object.keys(E.SPREADS).map(function (k) { var s = E.SPREADS[k]; return [k, s.name + '（' + s.pos.length + '張）']; });
  formShell('tarot', '<div class="card"><label class="label" for="tr-q">問題（必填）</label><textarea id="tr-q" maxlength="120" placeholder="靜下心，寫下想釐清的一件事"></textarea>' +
    '<span class="label">牌陣</span><select class="inp" id="tr-sp">' + spOpts.map(function (s) { return opt(s[0], s[1], s[0] === 'three'); }).join('') + '</select>' +
    '<p class="hint" id="tr-pos"></p>' +
    '<details class="adv"><summary>進階：種子</summary><input class="inp" id="tr-seed" maxlength="10" placeholder="例如 1A2B3C4D-N（留空自動產生）"><p class="muted small" style="margin:4px 0 0">同一個種子＋同一個牌陣會抽出同一組牌。尾碼 M／A／N 代表上午、下午、其他時段的加權。</p></details></div>' +
    '<div class="notice">一事一抽，不急著重抽。</div>', '洗牌抽牌');
  function trPos() { var s = E.SPREADS[$('tr-sp').value]; $('tr-pos').textContent = '牌位：' + s.pos.join('、'); }
  $('tr-sp').addEventListener('change', trPos); trPos();
  var REV = '逆位：可讀成阻塞、過度、內化、延遲或反轉。';
  $('tarot-go').addEventListener('click', function () {
    clear('tarot');
    var q = $('tr-q').value.trim(), sd = $('tr-seed').value.trim(), now = E.taipeiNow();
    if (isRisk(q)) { $('tarot-ref').innerHTML = REFERRAL; $('tarot-out').innerHTML = ''; return; }
    var errs = [];
    if (q.length < 2) errs.push('請寫下想問的事（至少 2 個字）。');
    if (sd && !E.parseSeed(sd, now.h)) errs.push('種子格式不正確：請填 1–8 位英數（0–9、A–F），可加 -M／-A／-N。');
    if (errs.length) return fail('tarot', errs);
    if (!gate('tarot')) return;
    var code = sd || E.newSeed(now.h), r = E.drawTarot($('tr-sp').value, code, now.h);
    var btn = $('tarot-go'); btn.disabled = true;
    $('tarot-out').innerHTML = '<div class="shuffle" aria-label="洗牌中"><i></i><i></i><i></i><i></i><i></i></div><p class="progress">洗牌中…</p>';
    setTimeout(function () {
      var h = '<div class="card"><span class="tag">' + r.spread + '</span><p class="q-echo">「' + esc(q) + '」</p><p class="muted small" style="margin:4px 0 0">種子 <b class="mono">' + r.seed + '</b>（' + E.fmtDT(now) + ' 台北時間）</p></div>';
      h += r.cards.map(function (c, i) {
        var k = c.card;
        return '<div class="tc"><div class="tcard' + (c.upright ? '' : ' rev') + (k.major ? ' major' : '') + '"><img alt="' + esc(k.name) + '" width="70" height="121" data-tid="' + k.id + '" loading="lazy" decoding="async"></div>' +
          '<div class="tinfo"><p class="tpos">' + (i + 1) + '．' + c.pos + (c.key ? ' <i class="qtag">重點</i>' : '') + '</p><p class="tt"><b>' + k.name + '</b>・' + T(c.upright ? '正位' : '逆位', c.upright ? '正位' : '逆位') + '</p>' +
          '<p class="muted small">' + (k.major ? T('大阿卡納', '大阿卡納') : T('小阿卡納', '小阿卡納') + '・' + T(k.suit, k.suit) + '・元素' + k.el) + '</p><p class="small">' + k.cue + (c.upright ? '' : '<br>' + REV) + '</p></div></div>';
      }).join('');
      X.Records.add('tarot', { question: q, spread: r.spreadKey, seed: r.seed }, { spread: r.spread, cards: r.cards.map(function (c) { return { position: c.pos, key: c.key, card: c.card.name, major: c.card.major, element: c.card.el, upright: c.upright, cue: c.card.cue }; }) });
      h += '<p class="muted small">牌義只提供通則線索：花色、數字、宮廷與大阿卡納階段，請對照自己的問題思考。</p>';
      finish('tarot', h, { question: q, cards: r.cards, spread: r.spreadKey });
    }, 1200);
  });

  // ---------- 說明頁：多術數驗算 ----------
  var rt = $('run-tests');
  if (rt) rt.addEventListener('click', function () {
    var r = E.selfTest(Z), ok = r.filter(function (t) { return t.pass; }).length;
    $('test-out').insertAdjacentHTML('beforeend', '<p style="margin:12px 0 4px;font-weight:700">多術數驗算：' + ok + '／' + r.length + ' 項通過</p><ul class="tests">' +
      r.map(function (t) { return '<li class="' + (t.pass ? 'ok' : 'ng') + '">' + (t.pass ? '✓ ' : '✗ ') + esc(t.name) + (t.detail ? '：' + esc(t.detail) : '') + '</li>'; }).join('') + '</ul>');
  });

  // ---------- 啟動 ----------
  paintTabs();
  if (cur !== 'liuyao') showMethod(cur);
})();

