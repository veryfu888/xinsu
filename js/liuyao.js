
/* 心訴 v1 — 六爻起卦與京房八宮納甲排盤（純函式，可單元測試） */
(function (root) {
  'use strict';

  // 經卦：爻由下往上，1＝陽、0＝陰
  var TRI_BITS = { 乾: [1, 1, 1], 兌: [1, 1, 0], 離: [1, 0, 1], 震: [1, 0, 0], 巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0] };
  var TRI_IMG = { 乾: '天', 兌: '澤', 離: '火', 震: '雷', 巽: '風', 坎: '水', 艮: '山', 坤: '地' };
  var TRI_ELEM = { 乾: '金', 兌: '金', 震: '木', 巽: '木', 坤: '土', 艮: '土', 坎: '水', 離: '火' };
  var PALACES = ['乾', '坎', '艮', '震', '巽', '離', '坤', '兌'];

  // 納甲：地支（初→上，內卦取前三、外卦取後三）與天干
  var BRANCH_SEQ = { 乾: '子寅辰午申戌', 震: '子寅辰午申戌', 坤: '未巳卯丑亥酉', 巽: '丑亥酉未巳卯', 坎: '寅辰午申戌子', 離: '卯丑亥酉未巳', 艮: '辰午申戌子寅', 兌: '巳卯丑亥酉未' };
  var STEM_IN = { 乾: '甲', 坤: '乙', 震: '庚', 巽: '辛', 坎: '戊', 離: '己', 艮: '丙', 兌: '丁' };
  var STEM_OUT = { 乾: '壬', 坤: '癸', 震: '庚', 巽: '辛', 坎: '戊', 離: '己', 艮: '丙', 兌: '丁' };
  var BRANCH_ELEM = { 子: '水', 亥: '水', 寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金', 辰: '土', 戌: '土', 丑: '土', 未: '土' };
  var GEN = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };   // A 生 GEN[A]
  var CTRL = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };  // A 克 CTRL[A]

  var STEMS = '甲乙丙丁戊己庚辛壬癸';
  var BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  var SPIRITS = ['青龍', '朱雀', '勾陳', '螣蛇', '白虎', '玄武'];
  var SPIRIT_START = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5]; // 依日干
  var POS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

  // 文王卦序：[卦名, 下卦, 上卦]
  var KW = [
    ['乾', '乾', '乾'], ['坤', '坤', '坤'], ['屯', '震', '坎'], ['蒙', '坎', '艮'], ['需', '乾', '坎'], ['訟', '坎', '乾'], ['師', '坎', '坤'], ['比', '坤', '坎'], ['小畜', '乾', '巽'], ['履', '兌', '乾'],
    ['泰', '乾', '坤'], ['否', '坤', '乾'], ['同人', '離', '乾'], ['大有', '乾', '離'], ['謙', '艮', '坤'], ['豫', '坤', '震'], ['隨', '震', '兌'], ['蠱', '巽', '艮'], ['臨', '兌', '坤'], ['觀', '坤', '巽'],
    ['噬嗑', '震', '離'], ['賁', '離', '艮'], ['剝', '坤', '艮'], ['復', '震', '坤'], ['无妄', '震', '乾'], ['大畜', '乾', '艮'], ['頤', '震', '艮'], ['大過', '巽', '兌'], ['坎', '坎', '坎'], ['離', '離', '離'],
    ['咸', '艮', '兌'], ['恆', '巽', '震'], ['遯', '艮', '乾'], ['大壯', '乾', '震'], ['晉', '坤', '離'], ['明夷', '離', '坤'], ['家人', '離', '巽'], ['睽', '兌', '離'], ['蹇', '艮', '坎'], ['解', '坎', '震'],
    ['損', '兌', '艮'], ['益', '震', '巽'], ['夬', '乾', '兌'], ['姤', '巽', '乾'], ['萃', '坤', '兌'], ['升', '巽', '坤'], ['困', '坎', '兌'], ['井', '巽', '坎'], ['革', '離', '兌'], ['鼎', '巽', '離'],
    ['震', '震', '震'], ['艮', '艮', '艮'], ['漸', '艮', '巽'], ['歸妹', '兌', '震'], ['豐', '離', '震'], ['旅', '艮', '離'], ['巽', '巽', '巽'], ['兌', '兌', '兌'], ['渙', '坎', '巽'], ['節', '兌', '坎'],
    ['中孚', '兌', '巽'], ['小過', '艮', '震'], ['既濟', '離', '坎'], ['未濟', '坎', '離']
  ];

  function key(bits) { return bits.join(''); }

  var HEX_BY_KEY = {}, HEX_LIST = [];
  KW.forEach(function (r, i) {
    var lo = r[1], up = r[2];
    var bits = TRI_BITS[lo].concat(TRI_BITS[up]);
    var full = lo === up ? lo + '為' + TRI_IMG[lo] : TRI_IMG[up] + TRI_IMG[lo] + r[0];
    var h = { num: i + 1, short: r[0], name: full, lower: lo, upper: up, bits: bits, key: key(bits) };
    HEX_BY_KEY[h.key] = h;
    HEX_LIST.push(h);
  });

  // 八宮：本宮→一世…五世→遊魂→歸魂（翻轉的爻位，0＝初爻）
  var GEN_LABEL = ['本宮', '一世', '二世', '三世', '四世', '五世', '遊魂', '歸魂'];
  var SHI = [6, 1, 2, 3, 4, 5, 4, 3];
  var FLIPS = [[], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2, 4], [4]];
  PALACES.forEach(function (p) {
    var base = TRI_BITS[p].concat(TRI_BITS[p]);
    FLIPS.forEach(function (f, g) {
      var b = base.slice();
      f.forEach(function (i) { b[i] = 1 - b[i]; });
      var h = HEX_BY_KEY[key(b)];
      if (h.palace) h.palaceConflict = true;
      h.palace = p;
      h.palaceElem = TRI_ELEM[p];
      h.gen = g;
      h.genLabel = GEN_LABEL[g];
      h.shi = SHI[g];
      h.ying = ((SHI[g] - 1 + 3) % 6) + 1;
    });
  });

  function relation(me, other) {
    if (me === other) return '兄弟';
    if (GEN[me] === other) return '子孫';
    if (CTRL[me] === other) return '妻財';
    if (CTRL[other] === me) return '官鬼';
    if (GEN[other] === me) return '父母';
    return '?';
  }

  function najia(h, i) {
    var tri = i < 3 ? h.lower : h.upper;
    var branch = BRANCH_SEQ[tri].charAt(i);
    var stem = i < 3 ? STEM_IN[tri] : STEM_OUT[tri];
    return { stem: stem, branch: branch, elem: BRANCH_ELEM[branch] };
  }

  // 日柱：2000/01/01＝戊午（六十甲子序 54，0 起算），依公曆逐日推
  function dayIndex(y, m, d) {
    var days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / 86400000);
    return (((54 + days) % 60) + 60) % 60;
  }
  function dayPillar(y, m, d) {
    var i = dayIndex(y, m, d);
    var xunBranch = (i - (i % 10)) % 12;
    return {
      idx: i,
      stemIdx: i % 10,
      stem: STEMS.charAt(i % 10),
      branch: BRANCHES.charAt(i % 12),
      gz: STEMS.charAt(i % 10) + BRANCHES.charAt(i % 12),
      xun: '甲' + BRANCHES.charAt(xunBranch),
      void: [BRANCHES.charAt((xunBranch + 10) % 12), BRANCHES.charAt((xunBranch + 11) % 12)]
    };
  }
  function spiritsFor(stemIdx) {
    var s = SPIRIT_START[stemIdx], out = [];
    for (var i = 0; i < 6; i++) out.push(SPIRITS[(s + i) % 6]);
    return out;
  }

  // 銅錢：背＝陽。三背 9、二背一字 8、一背二字 7、三字 6
  function coinsToValue(backs) { return { 3: 9, 2: 8, 1: 7, 0: 6 }[backs]; }
  var VALUE_NAME = { 9: '老陽', 8: '少陰', 7: '少陽', 6: '老陰' };
  function getCrypto() {
    var c = root.crypto || (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
    if (!c || !c.getRandomValues) throw new Error('此瀏覽器不支援安全亂數');
    return c;
  }
  // 回傳 [true/false ×3]，true＝背
  function tossThree() {
    var a = new Uint8Array(3);
    getCrypto().getRandomValues(a);
    return [a[0] & 1, a[1] & 1, a[2] & 1].map(function (x) { return x === 1; });
  }
  function countBacks(t) { return t.filter(Boolean).length; }

  function mkHex(h, elem, values, mv, day, spirits, isMain) {
    var lines = [];
    for (var i = 0; i < 6; i++) {
      var nj = najia(h, i);
      lines.push({
        pos: i, posLabel: POS[i], yang: h.bits[i] === 1,
        value: isMain ? values[i] : null,
        moving: isMain ? mv[i] : false,
        stem: nj.stem, branch: nj.branch, elem: nj.elem,
        qin: relation(elem, nj.elem),
        spirit: spirits[i],
        isVoid: day.void.indexOf(nj.branch) >= 0,
        isShi: isMain && h.shi === i + 1,
        isYing: isMain && h.ying === i + 1
      });
    }
    return { hex: h, lines: lines };
  }

  // values：六個 6/7/8/9（初→上）；date：{y,m,d}（台北日期）
  function buildChart(values, date) {
    var bits = values.map(function (v) { return (v === 7 || v === 9) ? 1 : 0; });
    var mv = values.map(function (v) { return v === 6 || v === 9; });
    var main = HEX_BY_KEY[key(bits)];
    var day = dayPillar(date.y, date.m, date.d);
    var sp = spiritsFor(day.stemIdx);
    var moving = [];
    mv.forEach(function (m, i) { if (m) moving.push(i); });
    var chart = { main: mkHex(main, main.palaceElem, values, mv, day, sp, true), changed: null, moving: moving, day: day };
    if (moving.length) {
      var cbits = bits.map(function (b, i) { return mv[i] ? 1 - b : b; });
      // 變卦六親沿用本宮五行
      chart.changed = mkHex(HEX_BY_KEY[key(cbits)], main.palaceElem, values, mv, day, sp, false);
    }
    return chart;
  }

  function lineLabel(i, yang) {
    var n = yang ? '九' : '六';
    if (i === 0) return '初' + n;
    if (i === 5) return '上' + n;
    return n + '二三四五'.charAt(i - 1);
  }

  // 台北時間（無日光節約，固定 UTC+8）
  function taipeiNow(ms) {
    var d = new Date((ms == null ? Date.now() : ms) + 8 * 3600000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hh: d.getUTCHours(), mi: d.getUTCMinutes() };
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(y, m, d) { return y + '/' + pad(m) + '/' + pad(d); }

  function byName(name) { for (var i = 0; i < 64; i++) if (HEX_LIST[i].name === name) return HEX_LIST[i]; return null; }

  // ===== 驗收測試 =====
  function selfTest() {
    var out = [];
    function eq(name, got, exp) {
      var g = JSON.stringify(got), e = JSON.stringify(exp);
      out.push({ name: name, pass: g === e, detail: g === e ? '' : '得到 ' + g + '，應為 ' + e });
    }
    var D0 = { y: 2026, m: 11, d: 20 };
    function chk(title, vals, palace, elem, gen, shi, ying, nj, qin) {
      var c = buildChart(vals, D0).main;
      eq(title + '：卦名', c.hex.name, title);
      eq(title + '：宮行世應', [c.hex.palace, c.hex.palaceElem, c.hex.genLabel, c.hex.shi, c.hex.ying], [palace, elem, gen, shi, ying]);
      eq(title + '：納甲', c.lines.map(function (l) { return l.stem + l.branch; }), nj);
      eq(title + '：六親', c.lines.map(function (l) { return l.qin; }), qin);
    }
    chk('乾為天', [7, 7, 7, 7, 7, 7], '乾', '金', '本宮', 6, 3,
      ['甲子', '甲寅', '甲辰', '壬午', '壬申', '壬戌'], ['子孫', '妻財', '父母', '官鬼', '兄弟', '父母']);
    chk('天風姤', [8, 7, 7, 7, 7, 7], '乾', '金', '一世', 1, 4,
      ['辛丑', '辛亥', '辛酉', '壬午', '壬申', '壬戌'], ['父母', '子孫', '兄弟', '官鬼', '兄弟', '父母']);
    chk('地天泰', [7, 7, 7, 8, 8, 8], '坤', '土', '三世', 3, 6,
      ['甲子', '甲寅', '甲辰', '癸丑', '癸亥', '癸酉'], ['妻財', '官鬼', '兄弟', '兄弟', '妻財', '子孫']);
    chk('火水未濟', [8, 7, 8, 7, 8, 7], '離', '火', '三世', 3, 6,
      ['戊寅', '戊辰', '戊午', '己酉', '己未', '己巳'], ['父母', '子孫', '兄弟', '妻財', '子孫', '兄弟']);
    var jin = byName('火地晉'), dy = byName('火天大有');
    eq('火地晉＝乾宮遊魂世四', [jin.palace, jin.genLabel, jin.shi], ['乾', '遊魂', 4]);
    eq('火天大有＝乾宮歸魂世三', [dy.palace, dy.genLabel, dy.shi], ['乾', '歸魂', 3]);
    eq('銅錢：三背/二背一字/一背二字/三字', [coinsToValue(3), coinsToValue(2), coinsToValue(1), coinsToValue(0)], [9, 8, 7, 6]);
    var t = buildChart([7, 7, 9, 8, 8, 8], D0);
    eq('泰三爻動：本卦／變卦', [t.main.hex.name, t.changed && t.changed.hex.name, t.moving], ['地天泰', '地澤臨', [2]]);
    eq('變卦六親依坤宮土', t.changed.lines.map(function (l) { return l.qin; }), ['父母', '官鬼', '兄弟', '兄弟', '妻財', '子孫']);
    eq('無動爻不出變卦', buildChart([7, 7, 7, 8, 8, 8], D0).changed, null);
    eq('2000/01/01 日柱＝戊午', dayPillar(2000, 1, 1).gz, '戊午');
    var d1 = dayPillar(2026, 11, 20);
    eq('2026/11/20＝戊戌、甲午旬、空辰巳', [d1.gz, d1.xun, d1.void], ['戊戌', '甲午', ['辰', '巳']]);
    eq('戊日六神自勾陳起', spiritsFor(d1.stemIdx), ['勾陳', '螣蛇', '白虎', '玄武', '青龍', '朱雀']);
    eq('甲日六神自青龍起', spiritsFor(0)[0], '青龍');
    var count = {}, okAll = true, names = {};
    HEX_LIST.forEach(function (h) {
      if (!h.palace || h.palaceConflict || !h.shi || !h.ying || !h.name) okAll = false;
      count[h.palace] = (count[h.palace] || 0) + 1;
      names[h.name] = 1;
    });
    eq('六十四卦皆能定名、定宮、安世應', [okAll, Object.keys(HEX_BY_KEY).length, Object.keys(names).length, PALACES.map(function (p) { return count[p]; })],
      [true, 64, 64, [8, 8, 8, 8, 8, 8, 8, 8]]);
    return out;
  }

  var api = {
    TRI_IMG: TRI_IMG, HEX_LIST: HEX_LIST, HEX_BY_KEY: HEX_BY_KEY, POS: POS, VALUE_NAME: VALUE_NAME,
    buildChart: buildChart, dayPillar: dayPillar, spiritsFor: spiritsFor, relation: relation,
    coinsToValue: coinsToValue, tossThree: tossThree, countBacks: countBacks, lineLabel: lineLabel,
    taipeiNow: taipeiNow, fmtDate: fmtDate, pad: pad, byName: byName, selfTest: selfTest
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LiuYao = api;
})(typeof window !== 'undefined' ? window : globalThis);

