/* 心訴 — 規則建議（本機資料庫，不接 AI、不連外網） */
(function (root) {
  'use strict';
  var cache = {}, inflight = {};
  var NOTE = '建議依傳統義理整理，僅供參考';
  var CATS = ['感情', '事業', '財運', '健康', '人際', '其他'];
  var GEN = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var CTRL = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  var CAT_KW = {
    感情: ['感情', '戀愛', '相處', '分手', '複合', '結婚', '伴侶', '喜歡', '曖昧', '前任', '婚姻', '男友', '女友', '對象'],
    事業: ['工作', '事業', '老闆', '同事', '升遷', '面試', '離職', '合作', '職涯', '考試', '職場', '上司', '專案'],
    財運: ['錢', '財', '投資', '薪水', '花費', '貸款', '買賣', '收入', '理財', '負債'],
    健康: ['身體', '健康', '生病', '睡眠', '疼痛', '就醫', '焦慮', '壓力'],
    人際: ['朋友', '家人', '人際', '溝通', '同事', '親戚', '鄰居']
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function baseUrl() {
    var el = root.document && root.document.querySelector('script[src*="js/advice.js"]');
    var src = el && el.src ? el.src : '';
    return src.replace(/js\/advice\.js.*$/, '') || '';
  }
  function load(method) {
    if (cache[method]) return Promise.resolve(cache[method]);
    if (inflight[method]) return inflight[method];
    var url = baseUrl() + 'data/advice-' + method + '.json';
    inflight[method] = (root.fetch ? root.fetch(url, { cache: 'force-cache' }) : Promise.reject(new Error('no fetch')))
      .then(function (r) { if (!r.ok) throw new Error('advice ' + method + ' ' + r.status); return r.json(); })
      .then(function (j) { cache[method] = j; delete inflight[method]; return j; })
      .catch(function (e) { delete inflight[method]; throw e; });
    return inflight[method];
  }
  function prefetch(method) { return load(method).catch(function () { return null; }); }

  function inferCat(q, fallback) {
    var s = String(q || '');
    if (CATS.indexOf(fallback) >= 0 && fallback !== '其他' && fallback !== '考試' && fallback !== '出行') {
      if (fallback) return fallback;
    }
    if (fallback === '考試' || fallback === '出行') return '事業';
    var scores = {}, i, k, words, w;
    for (k in CAT_KW) {
      words = CAT_KW[k];
      for (i = 0; i < words.length; i++) if (s.indexOf(words[i]) >= 0) scores[k] = (scores[k] || 0) + 1;
    }
    var best = fallback && CATS.indexOf(fallback) >= 0 ? fallback : '其他', n = 0;
    for (k in scores) if (scores[k] > n) { n = scores[k]; best = k; }
    return best;
  }

  function box(items, note) {
    var list = (items || []).filter(function (x) { return x && String(x).trim(); }).slice(0, 5);
    if (!list.length) list = ['這次的結果已列於上方，請對照自己的問題思考。'];
    return '<div class="card advice"><h3>給你的建議</h3><ul class="plainl">' +
      list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') +
      '</ul><p class="muted small" style="margin:6px 0 0">' + esc(note || NOTE) + '</p></div>';
  }

  function inv(map, el) { for (var k in map) if (map[k] === el) return k; return ''; }

  function liuyao(data, ctx) {
    var cat = ctx.cat && data.hex[String(ctx.num)] && data.hex[String(ctx.num)].cats[ctx.cat] ? ctx.cat : inferCat(ctx.q, '人際');
    if (!data.hex[String(ctx.num)] || !data.hex[String(ctx.num)].cats[cat]) cat = '人際';
    var rec = data.hex[String(ctx.num)] || {}, items = [];
    if (ctx.note) items.push('本卦「' + ctx.name + '」：' + ctx.note);
    if (rec.cats && rec.cats[cat]) items.push('就「' + cat + '」來看：' + rec.cats[cat]);
    var n = ctx.movingCount | 0;
    items.push((data.moving && data.moving[String(n)]) || data.moving['0']);
    if (n && ctx.changedNote) items.push('變卦「' + ctx.changedName + '」：' + ctx.changedNote);
    else if (!n) items.push('一事一占，先把這次的卦放在心裡幾天，不必急著再問。');
    return box(items, data.note);
  }

  function cardMap(data) {
    var m = {}, i, c;
    for (i = 0; i < (data.cards || []).length; i++) { c = data.cards[i]; m[c.id] = c; if (c.name) m[c.name] = c; }
    return m;
  }
  function tarot(data, ctx) {
    var cat = inferCat(ctx.question, ctx.cat || '其他');
    var map = cardMap(data), cards = ctx.cards || [], items = [], used = {};
    var keyIdx = ctx.key && ctx.key.length ? ctx.key : null;
    function addCard(c) {
      var rec = map[c.id] || map[c.card && c.card.id] || map[c.name] || map[c.card && c.card.name];
      if (!rec) return;
      var k = rec.id;
      if (used[k]) return;
      used[k] = 1;
      var meaning = c.upright !== false ? rec.up : rec.rev;
      var ori = c.upright !== false ? '正位' : '逆位';
      var pos = c.pos || c.position || '';
      items.push((pos ? pos + '・' : '') + rec.name + '（' + ori + '）：' + meaning);
    }
    if (keyIdx) {
      keyIdx.forEach(function (i) { if (cards[i]) addCard(cards[i]); });
    }
    if (items.length < 3) cards.forEach(function (c) { if (items.length < 4) addCard(c); });
    // position advice for 建議 / 結果 / 當前指引 / 核心
    var prefer = ['建議', '結果', '當前指引', '核心', '現在', '當前'];
    var i, c, posAdv, recPos;
    for (i = 0; i < prefer.length; i++) {
      for (var j = 0; j < cards.length; j++) {
        c = cards[j];
        recPos = (c.pos || c.position) === prefer[i] && data.positions && data.positions[prefer[i]];
        if (recPos && recPos[cat]) { posAdv = recPos[cat]; break; }
      }
      if (posAdv) break;
    }
    if (!posAdv && cards[0] && data.positions && data.positions[cards[0].pos || cards[0].position]) {
      posAdv = data.positions[cards[0].pos || cards[0].position][cat];
    }
    if (posAdv && items.length < 5) items.push(posAdv);
    return box(items, data.note);
  }

  function bazi(data, ctx) {
    var r = ctx.result || ctx, P = r.pillars || [], dm = P[2] && P[2].stem, dmEl = P[2] && P[2].stemEl;
    var items = [];
    if (dm && data.dayMaster[dm]) items.push(data.dayMaster[dm]);
    var count = r.count || {}, same = count[dmEl] || 0, printEl = inv(GEN, dmEl), officialEl = inv(CTRL, dmEl);
    var score = same + (count[printEl] || 0) - (count[GEN[dmEl]] || 0) - (count[CTRL[dmEl]] || 0) - (count[officialEl] || 0);
    var st = score >= 2 ? '偏強' : score <= -2 ? '偏弱' : '中和';
    if (data.strength[st]) items.push(data.strength[st]);
    var gods = {}, i, g;
    P.forEach(function (p, idx) {
      if (!p) return;
      if (idx !== 2 && p.god) gods[p.god] = (gods[p.god] || 0) + 1;
      if (p.hidden && p.hidden[0] && p.hidden[0].god) gods[p.hidden[0].god] = (gods[p.hidden[0].god] || 0) + 1;
    });
    g = Object.keys(gods).sort(function (a, b) { return gods[b] - gods[a]; })[0];
    if (g && data.god[g]) items.push(data.god[g]);
    var none = ['木', '火', '土', '金', '水'].filter(function (e) { return !count[e]; });
    var top = ['木', '火', '土', '金', '水'].slice().sort(function (a, b) { return (count[b] || 0) - (count[a] || 0); })[0];
    if (none.length && data.element.缺) items.push(data.element.缺.replace('{el}', none.join('、')));
    else if (top && (count[top] || 0) >= 5 && data.element.多) items.push(data.element.多.replace('{el}', top));
    var luckGod = ctx.luckGod;
    if (!luckGod && r.dayun && r.startYears != null) {
      var E = root.XinsuEngines, n = E && E.taipeiNow ? E.taipeiNow() : null;
      if (n && r.birth && r.birth.solar) {
        var age = (n.y - r.birth.solar.y) + ((n.m - r.birth.solar.m) * 31 + (n.d - r.birth.solar.d)) / 372;
        var start = r.startYears + (r.startMonths || 0) / 12;
        if (age >= start && r.dayun.length) {
          var k = Math.min(7, Math.max(0, Math.floor((age - start) / 10)));
          luckGod = r.dayun[k] && r.dayun[k].god;
        }
      }
    }
    if (luckGod && data.luck) items.push(data.luck.replace('{god}', luckGod));
    return box(items, data.note);
  }

  function palaceKey(name) {
    if (!name) return '';
    var n = String(name).replace(/宮$/, '');
    return n;
  }
  function ziwei(data, ctx) {
    var a = ctx.result || ctx, items = [], ming = (a.palaces || []).filter(function (p) { return p.name === '命宮'; })[0];
    var majors = (ming && ming.majorStars) || [];
    if (majors.length) {
      majors.forEach(function (s) { if (data.stars[s.name] && items.length < 2) items.push(data.stars[s.name]); });
    } else if (data.noMajor) items.push(data.noMajor);
    var seen = {}, body = (a.palaces || []).filter(function (p) { return p.isBodyPalace; })[0];
    (a.palaces || []).forEach(function (p) {
      (p.majorStars || []).concat(p.minorStars || []).forEach(function (s) {
        if (s.mutagen && data.mutagen[s.mutagen] && !seen[s.mutagen]) {
          seen[s.mutagen] = 1;
          items.push(s.name + '化' + s.mutagen + '在' + (p.name === '命宮' ? '命宮' : p.name + '宮') + '：' + data.mutagen[s.mutagen]);
        }
      });
    });
    if (body) {
      var pk = palaceKey(body.name);
      items.push((data.palaces && (data.palaces[pk] || data.palaces[body.name])) || data.body.replace('{palace}', body.name === '命宮' ? '命宮' : body.name + '宮'));
    }
    return box(items, data.note);
  }

  function qimen(data, ctx) {
    var c = ctx.result || ctx, items = [];
    var fp = root.XinsuEngines && root.XinsuEngines.PNAME ? root.XinsuEngines.PNAME[c.zhifuPalace] : c.zhifuPalace;
    var sp = root.XinsuEngines && root.XinsuEngines.PNAME ? root.XinsuEngines.PNAME[c.zhishiPalace] : c.zhishiPalace;
    if (data.zhifu) items.push(data.zhifu.replace('{fp}', fp || '').replace('{shi}', c.zhishi || '').replace('{sp}', sp || ''));
    if (c.zhishi && data.doors[c.zhishi]) items.push(data.doors[c.zhishi]);
    if (c.zhifu && data.stars[c.zhifu]) items.push(data.stars[c.zhifu]);
    var fo = ctx.focus, hitDoor;
    if (fo && fo.hits && c.cells) {
      Object.keys(fo.hits).some(function (p) {
        var cell = c.cells[+p];
        if (cell && cell.door && data.doors[cell.door] && cell.door !== c.zhishi) { hitDoor = data.doors[cell.door]; return true; }
        if (cell && cell.god && data.gods[cell.god]) { items.push(data.gods[cell.god]); return true; }
        return false;
      });
    }
    if (hitDoor) items.push(hitDoor);
    else if (c.cells) {
      var godCell = c.cells[c.zhifuPalace];
      if (godCell && godCell.god && data.gods[godCell.god] && godCell.god !== '值符') items.push(data.gods[godCell.god]);
      else if (data.gods['值符']) items.push(data.gods['值符']);
    }
    return box(items, data.note);
  }

  function hehun(data, ctx) {
    var r = ctx.result || ctx, keys = ['yearStem', 'dayStem', 'yearBranch', 'dayBranch'], he = 0, chong = 0;
    keys.forEach(function (k) {
      var rel = ((r[k] && r[k].rel) || []).join('');
      if (/合/.test(rel)) he++;
      if (/沖|衝|刑|害/.test(rel)) chong++;
    });
    var band = (he > chong && he >= 2) ? '相合較多' : (chong > he && chong >= 2) ? '衝克較顯' : (he && chong) ? '有合有衝' : '關係平淡';
    var items = [data.bands[band]];
    var lack = r.lack || [];
    var both = lack.filter(function (x) { return /兩人都缺/.test(x); });
    var one = lack.filter(function (x) { return !/兩人都缺/.test(x); });
    if (one.length) items.push(data.wuxing['可互補']);
    else if (both.length) items.push(data.wuxing['同有缺']);
    else items.push(data.wuxing['大致齊']);
    if (r.dayMaster && r.dayMaster.el && data.day) items.push(data.day.replace('{el}', r.dayMaster.el));
    return box(items, data.note);
  }

  function fengshui(data, ctx) {
    var f = ctx.flying || ctx.result || ctx, bz = ctx.bz, people = ctx.people || [], items = [];
    if (data.generic) items.push(data.generic.replace('{sitting}', f.sitting || '').replace('{facing}', f.facing || '').replace('{period}', f.period || ''));
    (f.patterns || []).forEach(function (p) { if (data.patterns[p] && items.length < 3) items.push(data.patterns[p]); });
    var st = {};
    (f.states || []).forEach(function (s) { st[s.star] = s.state; });
    var fs = f.wat && f.fp != null ? f.wat[f.fp] : f.fStar && f.fStar.center;
    if (fs && st[fs] && data.states[st[fs]]) items.push('向方星為' + st[fs] + '：' + data.states[st[fs]]);
    var match = ctx.match;
    if (match == null && bz && bz.group) match = true;
    if (people && people.length) {
      var same = people.filter(function (p) { return p.match; }).length;
      var diff = people.length - same;
      if (diff && data.house['不同組']) items.push(data.house['不同組']);
      else if (same && data.house['同組']) items.push(data.house['同組']);
    } else if (bz && data.house['同組']) {
      /* 僅宅卦時給一則方位建議 */
      items.push('此宅為' + (bz.gua || '') + '宅（' + (bz.group || '') + '）。' + data.house['同組']);
    }
    return box(items, data.note);
  }

  var BUILD = { liuyao: liuyao, tarot: tarot, bazi: bazi, ziwei: ziwei, qimen: qimen, hehun: hehun, fengshui: fengshui };

  function render(method, ctx) {
    return load(method).then(function (data) {
      var fn = BUILD[method];
      if (!fn) return box(['這次的結果已列於上方，請對照自己的問題思考。'], NOTE);
      return fn(data, ctx || {});
    });
  }

  function mount(id, method, ctx) {
    var el = typeof id === 'string' ? root.document.getElementById(id) : id;
    if (!el) return Promise.resolve();
    el.innerHTML = '<div class="card advice"><p class="muted small" style="margin:0">整理建議中…</p></div>';
    return render(method, ctx).then(function (html) { el.innerHTML = html; }, function () {
      el.innerHTML = box(['這次的結果已列於上方，請對照自己的問題思考。'], NOTE);
    });
  }

  function selfTest() {
    var methods = ['liuyao', 'tarot', 'bazi', 'ziwei', 'qimen', 'hehun', 'fengshui'];
    return Promise.all(methods.map(function (m) { return load(m).then(function (d) { return { m: m, d: d }; }); })).then(function (all) {
      var out = [], cover = {};
      function eq(name, ok, detail) { out.push({ name: name, pass: !!ok, detail: ok ? '' : (detail || '') }); }
      all.forEach(function (x) { cover[x.m] = x.d; });
      var hx = cover.liuyao.hex, nHex = 0, missHex = [];
      CATS.slice(0, 5).forEach(function () {});
      for (var i = 1; i <= 64; i++) {
        var rec = hx[String(i)];
        if (!rec || !rec.cats) { missHex.push(i); continue; }
        var ok = ['事業', '感情', '財運', '健康', '人際'].every(function (c) { return rec.cats[c] && rec.cats[c].length >= 8; });
        if (ok) nHex++; else missHex.push(i);
      }
      eq('六爻 64 卦皆有五類建議', nHex === 64, '缺少 ' + missHex.slice(0, 8).join('、') + (missHex.length > 8 ? '…' : ''));
      eq('六爻 動爻規則 0–6', [0, 1, 2, 3, 4, 5, 6].every(function (n) { return cover.liuyao.moving[String(n)]; }));
      var cards = cover.tarot.cards || [], nUp = 0, missC = [];
      cards.forEach(function (c) {
        if (c.up && c.rev && c.up.length >= 8 && c.rev.length >= 8) nUp++; else missC.push(c.name || c.id);
      });
      eq('塔羅 78 張皆有正逆位建議', nUp === 78 && cards.length === 78, '有 ' + cards.length + ' 張，完整 ' + nUp + (missC[0] ? '，缺 ' + missC[0] : ''));
      var posNeed = ['當前指引', '過去', '現在', '未來', '核心', '根源', '阻力', '潛力', '建議', '新月', '上弦', '滿月', '下弦', '遠期過去', '近期過去', '當前', '近期未來', '外部影響', '結果', '交叉', '意識目標', '根基過去', '自我', '環境', '希望與恐懼'];
      var missP = posNeed.filter(function (p) {
        var d = cover.tarot.positions[p];
        return !d || !CATS.every(function (c) { return d[c] && d[c].length >= 8; });
      });
      eq('塔羅 ' + posNeed.length + ' 個位置皆有六類建議', missP.length === 0, missP.join('、'));
      eq('八字 十日主與十神', Object.keys(cover.bazi.dayMaster).length === 10 && Object.keys(cover.bazi.god).length === 10);
      eq('紫微 十四主星與四化', Object.keys(cover.ziwei.stars).length === 14 && Object.keys(cover.ziwei.mutagen).length === 4);
      eq('奇門 八門、八神、九星', Object.keys(cover.qimen.doors).length === 8 && Object.keys(cover.qimen.gods).length === 8 && Object.keys(cover.qimen.stars).length === 9);
      eq('合婚 四種關係帶與五行帶', Object.keys(cover.hehun.bands).length === 4 && Object.keys(cover.hehun.wuxing).length === 3);
      eq('風水 十二格局', Object.keys(cover.fengshui.patterns).length === 12);
      out._cover = { gua: nHex, cards: nUp, positions: posNeed.length - missP.length, positionTotal: posNeed.length };
      return out;
    });
  }

  root.XinsuAdvice = {
    load: load, prefetch: prefetch, render: render, mount: mount, selfTest: selfTest, inferCat: inferCat, NOTE: NOTE
  };
})(typeof window !== 'undefined' ? window : globalThis);
