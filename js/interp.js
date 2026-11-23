
/* 心訴 — 依固定規則產生白話段落（不接 AI；只整理傳統說法，不下斷語） */
(function (root) {
  'use strict';
  var GL = root.XinsuGloss, E = root.XinsuEngines;
  function m(k, ctx) { var s = GL.lookup(k, ctx) || ''; var i = s.indexOf('：'); return (i > 0 ? s.slice(i + 1) : s).replace(/。$/, ''); }
  var DAYMASTER = {
    甲: '甲木像大樹：正直、有擔當，喜歡向上發展，有時不太會轉彎。', 乙: '乙木像花草藤蔓：柔軟有韌性，善於適應環境、借力使力。',
    丙: '丙火像太陽：熱情開朗、樂於付出，存在感強。', 丁: '丁火像燭火：細心溫暖、內斂有光，擅長照亮身邊的人。',
    戊: '戊土像高山：穩重可靠、重信用，給人安全感。', 己: '己土像田園：包容細膩、務實，會默默照顧人。',
    庚: '庚金像刀劍：果斷、講義氣、重原則，行動力強。', 辛: '辛金像珠玉：精緻敏感、重質感與分寸。',
    壬: '壬水像江河：聰明靈活、胸懷大，喜歡流動與變化。', 癸: '癸水像雨露：細膩溫柔、善體察人心，想得深。'
  };
  function ageNow(b) { var n = E.taipeiNow(); return (n.y - b.solar.y) + ((n.m - b.solar.m) * 31 + (n.d - b.solar.d)) / 372; }
  function bazi(r) {
    var P = r.pillars, dm = P[2].stem, out = [];
    out.push('<b>日主 ' + dm + P[2].stemEl + '</b>：' + DAYMASTER[dm]);
    var cnt = {};
    P.forEach(function (p, i) { if (!p) return; if (i !== 2) cnt[p.god] = (cnt[p.god] || 0) + 1; var g = p.hidden[0].god; cnt[g] = (cnt[g] || 0) + 1; });
    var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 2);
    out.push('<b>命盤中較常出現的十神</b>：' + top.map(function (g) { return GL.t(g, g, 'bz') + '（' + cnt[g] + ' 處，含地支本氣）——' + m(g, 'bz'); }).join('；') + '。');
    var els = E.ELS.slice().sort(function (a, b) { return r.count[b] - r.count[a]; }), none = E.ELS.filter(function (e) { return !r.count[e]; });
    out.push('<b>五行字數</b>：最多的是' + els[0] + '（' + r.count[els[0]] + ' 個）' + (none.length ? '，盤中沒有出現' + none.join('、') : '，五行都有出現') + '。字數只是數量，不代表強弱；可當作留意平衡的參考。');
    var age = ageNow(r.birth), start = r.startYears + r.startMonths / 12;
    if (age < start) out.push('<b>目前</b>：尚未起運，仍在月柱 ' + r.smallLuck + ' 小運。');
    else {
      var k = Math.min(7, Math.floor((age - start) / 10)), d = r.dayun[k];
      out.push('<b>目前大運</b>：' + d.gz + '（約 ' + d.fromAge + '–' + d.toAge + ' 歲），天干為' + GL.t(d.god, d.god, 'bz') + '——' + m(d.god, 'bz') + '。');
    }
    var lg = E.shishen(dm, r.liunian.gz.charAt(0));
    out.push('<b>' + r.liunian.year + ' 流年 ' + r.liunian.gz + '</b>：天干對日主為' + GL.t(lg, lg, 'bz') + '——' + m(lg, 'bz') + '。');
    return out;
  }
  function pn(n) { return n === '命宮' ? '命宮' : n + '宮'; }
  function ziwei(a) {
    var out = [], ming = a.palaces.filter(function (p) { return p.name === '命宮'; })[0];
    var ms = ming.majorStars;
    if (ms.length) out.push('<b>命宮主星</b>：' + ms.map(function (s) { return GL.t(s.name, s.name, 'zw') + (s.brightness ? '（' + s.brightness + '）' : '') + '——' + m(s.name, 'zw'); }).join('；') + '。');
    else {
      var qy = a.palaces.filter(function (p) { return p.name === '遷移'; })[0];
      out.push('<b>命宮無主星</b>：傳統上借對宮（遷移宮）的主星參看：' + qy.majorStars.map(function (s) { return GL.t(s.name, s.name, 'zw') + '——' + m(s.name, 'zw'); }).join('；') + '。');
    }
    var body = a.palaces.filter(function (p) { return p.isBodyPalace; })[0];
    if (body) out.push('<b>身宮在' + pn(body.name) + '</b>：' + m(pn(body.name), 'zw') + '。這是後天比較會投入心力的領域。');
    a.palaces.forEach(function (p) {
      p.majorStars.concat(p.minorStars).forEach(function (s) {
        if (s.mutagen) out.push('<b>' + s.name + '化' + s.mutagen + '在' + pn(p.name) + '</b>：' + m(pn(p.name), 'zw') + '。化' + s.mutagen + '代表' + m('化' + s.mutagen, 'zw') + '。');
      });
    });
    return out;
  }
  function qimen(c, fo) {
    var out = [];
    function cellText(p) {
      var x = c.cells[p], parts = [];
      if (x.god) parts.push(GL.t(x.god, x.god, 'qm') + '（' + m(x.god, 'qm') + '）');
      x.stars.forEach(function (s) { parts.push(GL.t(s, s, 'qm') + '（' + m(s, 'qm') + '）'); });
      if (x.door) parts.push(GL.t(x.door, x.door, 'qm') + '（' + m(x.door, 'qm') + '）');
      return parts.join('、');
    }
    Object.keys(fo.hits).forEach(function (p) { out.push('<b>' + E.PALACE[p] + '</b>：' + cellText(+p)); });
    out.push('<b>值符落' + E.PNAME[c.zhifuPalace] + '宮、值使' + c.zhishi + '落' + E.PNAME[c.zhishiPalace] + '宮</b>：值符可看作此時的主導力量，值使可看作事情推進的方式。');
    out.push('以上只解釋符號的傳統含意，不判斷吉凶；請對照自己的問題思考。');
    return out;
  }
  function fengshui(f, bz, people) {
    var out = [], st = {}; f.states.forEach(function (s) { st[s.star] = s.state; });
    function star(n) { var k = GL.fsStar(n); return GL.t(k + '（' + n + '）', k, 'fs') + '，' + f.period + ' 運' + st[n]; }
    out.push('<b>向方（' + E.DIR[f.fp] + '）</b>：' + GL.t('向星', '向星', 'fs') + ' ' + star(f.wat[f.fp]) + '——' + m(GL.fsStar(f.wat[f.fp]), 'fs') + '。向星多用來看財運、事業。');
    out.push('<b>坐方（' + E.DIR[f.sp] + '）</b>：' + GL.t('山星', '山星', 'fs') + ' ' + star(f.mtn[f.sp]) + '——' + m(GL.fsStar(f.mtn[f.sp]), 'fs') + '。山星多用來看健康與人際。');
    f.patterns.forEach(function (p) { var key = p.replace(/^(山星|向星)/, '').replace(/與運星/, ''); out.push('<b>' + p + '</b>：' + (m(p, 'fs') || m(key, 'fs')) + '。'); });
    out.push('<b>' + f.year + ' 流年 ' + GL.fsStar(f.yearStar) + '入中</b>：' + m(GL.fsStar(f.yearStar), 'fs') + '。');
    out.push('<b>' + bz.gua + '宅（' + bz.group + '）</b>：' + bz.you.filter(function (x) { return /上吉/.test(x.rank); }).map(function (x) { return x.star + '在' + x.dir; }).join('、') + '，傳統上是這間房子較好運用的方位。');
    (people || []).forEach(function (p) { out.push('<b>' + p.name + '</b>：' + p.group + '，' + (p.match ? '與房子同組。' : '與房子不同組，傳統上可多利用自己的吉方（例如床頭、書桌方向）。')); });
    out.push('以上只說明星與格局的傳統含意，不判斷吉凶。');
    return out;
  }
  function box(title, arr) { return '<div class="card plain"><h3>' + title + '</h3><ul class="plainl">' + arr.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><p class="muted small" style="margin:6px 0 0">點畫底線的詞可看說明。</p></div>'; }
  root.XinsuPlain = { bazi: bazi, ziwei: ziwei, qimen: qimen, fengshui: fengshui, box: box };
})(typeof window !== 'undefined' ? window : globalThis);

