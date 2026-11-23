
/* 心訴 多術數版 — 計算引擎（八字、曆法、奇門、合婚、風水、塔羅）
   曆法與節氣時刻取自 lunar-javascript（MIT，6tail）；紫微排盤由 iztro（MIT，SylarLong）完成。 */
(function (root) {
  'use strict';
  function lib() {
    if (root.Solar && root.Lunar) return root;
    if (typeof require === 'function') return require('lunar-javascript');
    throw new Error('缺少曆法程式庫');
  }

  var STEMS = '甲乙丙丁戊己庚辛壬癸', BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  var STEM_EL = '木木火火土土金金水水';
  var BR_EL = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var ELS = ['木', '火', '土', '金', '水'];
  var GEN = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }, CTRL = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  var HIDE = { 子: '癸', 丑: '己癸辛', 寅: '甲丙戊', 卯: '乙', 辰: '戊乙癸', 巳: '丙庚戊', 午: '丁己', 未: '己丁乙', 申: '庚壬戊', 酉: '辛', 戌: '戊辛丁', 亥: '壬甲' };
  var NAYIN = ['海中金', '爐中火', '大林木', '路旁土', '劍鋒金', '山頭火', '澗下水', '城頭土', '白蠟金', '楊柳木', '泉中水', '屋上土', '霹靂火', '松柏木', '長流水', '沙中金', '山下火', '平地木', '壁上土', '金箔金', '覆燈火', '天河水', '大驛土', '釵釧金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水'];
  var JQ_TW = { 立春: '立春', 雨水: '雨水', 惊蛰: '驚蟄', 春分: '春分', 清明: '清明', 谷雨: '穀雨', 立夏: '立夏', 小满: '小滿', 芒种: '芒種', 夏至: '夏至', 小暑: '小暑', 大暑: '大暑', 立秋: '立秋', 处暑: '處暑', 白露: '白露', 秋分: '秋分', 寒露: '寒露', 霜降: '霜降', 立冬: '立冬', 小雪: '小雪', 大雪: '大雪', 冬至: '冬至', 小寒: '小寒', 大寒: '大寒',
    DONG_ZHI: '冬至', XIAO_HAN: '小寒', DA_HAN: '大寒', LI_CHUN: '立春', YU_SHUI: '雨水', JING_ZHE: '驚蟄', DA_XUE: '大雪' };
  var LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '臘月'];
  var LUNAR_DAYS = (function () {
    var a = [], t = ['初', '十', '廿', '三'], n = '一二三四五六七八九十';
    for (var d = 1; d <= 30; d++) {
      if (d === 10) a.push('初十'); else if (d === 20) a.push('二十'); else if (d === 30) a.push('三十');
      else a.push(t[Math.floor(d / 10)] + n.charAt(d % 10 - 1));
    }
    return a;
  })();
  var SHICHEN = ['子時 23:00–00:59', '丑時 01:00–02:59', '寅時 03:00–04:59', '卯時 05:00–06:59', '辰時 07:00–08:59', '巳時 09:00–10:59', '午時 11:00–12:59', '未時 13:00–14:59', '申時 15:00–16:59', '酉時 17:00–18:59', '戌時 19:00–20:59', '亥時 21:00–22:59'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtD(y, m, d) { return y + '/' + pad(m) + '/' + pad(d); }
  function fmtDT(o) { return fmtD(o.y, o.m, o.d) + ' ' + pad(o.h) + ':' + pad(o.mi); }
  function gzIndex(gz) { var s = STEMS.indexOf(gz.charAt(0)), b = BRANCHES.indexOf(gz.charAt(1)); for (var i = 0; i < 60; i++) if (i % 10 === s && i % 12 === b) return i; return -1; }
  function gzAt(i) { i = ((i % 60) + 60) % 60; return STEMS.charAt(i % 10) + BRANCHES.charAt(i % 12); }
  function solarObj(s) { return { y: s.getYear(), m: s.getMonth(), d: s.getDay(), h: s.getHour(), mi: s.getMinute(), s: s.getSecond() }; }
  function ms(o) { return Date.UTC(o.y, o.m - 1, o.d, o.h || 0, o.mi || 0, o.s || 0); }
  function fromMs(t) { var d = new Date(t); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() }; }
  function jqName(j) { var n = j.getName(); return JQ_TW[n] || n; }
  function taipeiNow() { var d = new Date(Date.now() + 8 * 3600000); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() }; }

  // ================= 曆法 =================
  function solarValid(y, m, d) { var t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; }
  function leapMonthOf(y) { return lib().LunarYear.fromYear(y).getLeapMonth(); }
  function lunarMonthDays(y, m, leap) { try { return lib().LunarMonth.fromYm(y, leap ? -m : m).getDayCount(); } catch (e) { return 0; } }
  function lunarName(y, m, d, leap) { return '農曆 ' + y + ' 年' + (leap ? '閏' : '') + LUNAR_MONTHS[m - 1] + LUNAR_DAYS[d - 1]; }
  function lunarToSolar(y, m, d, leap) {
    if (leap && leapMonthOf(y) !== m) return { ok: false, err: '農曆 ' + y + ' 年沒有閏' + LUNAR_MONTHS[m - 1].replace('正月', '一月') + '。' };
    var days = lunarMonthDays(y, m, leap);
    if (!days) return { ok: false, err: '農曆日期不存在。' };
    if (d > days) return { ok: false, err: '農曆 ' + y + ' 年' + (leap ? '閏' : '') + LUNAR_MONTHS[m - 1] + '只有 ' + days + ' 天，沒有' + LUNAR_DAYS[d - 1] + '。' };
    var s = lib().Lunar.fromYmd(y, leap ? -m : m, d).getSolar();
    return { ok: true, y: s.getYear(), m: s.getMonth(), d: s.getDay() };
  }
  function solarToLunar(y, m, d) {
    var l = lib().Solar.fromYmd(y, m, d).getLunar(), lm = l.getMonth();
    return { y: l.getYear(), m: Math.abs(lm), d: l.getDay(), leap: lm < 0, text: lunarName(l.getYear(), Math.abs(lm), l.getDay(), lm < 0) };
  }

  // 出生資料 → 國曆日期與鐘錶時間
  // input: {gender:'男'|'女', cal:'solar'|'lunar', y,m,d, leap, timeMode:'exact'|'shichen'|'unknown', time:'HH:MM', shichen:0-11, dst:bool}
  function resolveBirth(inp, opt) {
    opt = opt || {};
    var errs = [], notes = [];
    if (inp.gender !== '男' && inp.gender !== '女') errs.push('請選擇性別。');
    var y = +inp.y, m = +inp.m, d = +inp.d, sol;
    if (!y || !m || !d) errs.push('請選擇完整的出生日期。');
    else if (inp.cal === 'lunar') {
      var r = lunarToSolar(y, m, d, !!inp.leap);
      if (!r.ok) errs.push(r.err); else sol = r;
    } else {
      if (!solarValid(y, m, d)) errs.push('國曆 ' + y + ' 年 ' + m + ' 月沒有 ' + d + ' 日。'); else sol = { y: y, m: m, d: d };
    }
    var mode = inp.timeMode, clock = null;
    if (mode === 'exact') {
      if (!/^\d{1,2}:\d{2}$/.test(inp.time || '')) errs.push('請填寫出生時間（幾點幾分）。');
      else { var p = inp.time.split(':'); clock = { h: +p[0], mi: +p[1] }; }
    } else if (mode === 'shichen') {
      if (inp.shichen === '' || inp.shichen == null || isNaN(+inp.shichen)) errs.push('請選擇時辰。');
      else { var si = +inp.shichen; clock = si === 0 ? { h: 0, mi: 30 } : { h: si * 2, mi: 0 }; notes.push('只知時辰，以時辰中點 ' + pad(clock.h) + ':' + pad(clock.mi) + ' 估算' + (si === 0 ? '（子時按早子時，日柱算當日）' : '') + '。'); }
    } else if (mode === 'unknown') {
      if (opt.requireTime) errs.push('紫微斗數必須有出生時辰。');
    } else errs.push('請選擇出生時間的填法。');
    if (opt.requireTime && mode === 'unknown') { /* 已處理 */ }
    if (errs.length) return { ok: false, errs: errs };
    var dt = { y: sol.y, m: sol.m, d: sol.d, h: clock ? clock.h : 12, mi: clock ? clock.mi : 0 };
    if (clock && inp.dst) { dt = fromMs(ms(dt) - 3600000); notes.push('已扣除夏令時間 1 小時，以 ' + fmtDT(dt) + ' 計算。'); }
    if (mode === 'exact') {
      var mins = dt.h * 60 + dt.mi, best = 999;
      for (var hh = 1; hh <= 23; hh += 2) { var dd = Math.abs(mins - hh * 60); best = Math.min(best, dd, 1440 - dd); }
      if (best <= 15) notes.push('出生時間離時辰交界 ' + best + ' 分鐘內；若做真太陽時校正，可能跨到相鄰時辰。');
    }
    return { ok: true, gender: inp.gender, name: inp.name || '', solar: sol, dt: dt, hasTime: !!clock, timeMode: mode, notes: notes, input: inp };
  }

  // ================= 八字 =================
  function shishen(dayStem, other) {
    var a = STEMS.indexOf(dayStem), b = STEMS.indexOf(other);
    var ea = STEM_EL.charAt(a), eb = STEM_EL.charAt(b), same = (a % 2) === (b % 2);
    if (ea === eb) return same ? '比肩' : '劫財';
    if (GEN[ea] === eb) return same ? '食神' : '傷官';
    if (CTRL[ea] === eb) return same ? '偏財' : '正財';
    if (CTRL[eb] === ea) return same ? '七殺' : '正官';
    return same ? '偏印' : '正印';
  }
  function nayin(gz) { return NAYIN[Math.floor(gzIndex(gz) / 2)]; }
  function elRel(a, b) { // a 對 b
    if (a === b) return a + '與' + b + '比和';
    if (GEN[a] === b) return a + '生' + b;
    if (GEN[b] === a) return b + '生' + a;
    if (CTRL[a] === b) return a + '剋' + b;
    return b + '剋' + a;
  }
  var SAN = { 寅: 0, 午: 0, 戌: 0, 申: 1, 子: 1, 辰: 1, 巳: 2, 酉: 2, 丑: 2, 亥: 3, 卯: 3, 未: 3 };
  function grp(b, arr) { return arr[SAN[b]]; }

  function shensha(P, gender) {
    // P: [{gz}]（年月日時，時可能缺）
    var names = ['年', '月', '日', '時'];
    var br = P.map(function (p) { return p ? p.gz.charAt(1) : null; }), st = P.map(function (p) { return p ? p.gz.charAt(0) : null; });
    var Y = br[0], M = br[1], D = br[2], ds = st[2], ys = st[0];
    var res = {};
    function mark(name, pred) { var hit = []; for (var i = 0; i < 4; i++) if (P[i] && pred(i)) hit.push(names[i]); if (hit.length) res[name] = hit; }
    function brIn(list) { return function (i) { return list.indexOf(br[i]) >= 0; }; }
    function brOrSt(t) { return function (i) { return br[i] === t || st[i] === t; }; }
    var GUI = { 甲: '丑未', 戊: '丑未', 乙: '子申', 己: '子申', 丙: '亥酉', 丁: '亥酉', 壬: '卯巳', 癸: '卯巳', 庚: '午寅', 辛: '午寅' };
    mark('天乙貴人', brIn((GUI[ds] + GUI[ys]).split('')));
    var TD = { 寅: '丁', 卯: '申', 辰: '壬', 巳: '辛', 午: '亥', 未: '甲', 申: '癸', 酉: '寅', 戌: '丙', 亥: '乙', 子: '巳', 丑: '庚' };
    mark('天德', brOrSt(TD[M]));
    mark('月德', brOrSt(grp(M, ['丙', '壬', '庚', '甲'])));
    var WC = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
    mark('文昌', brIn([WC[ds]]));
    var XT = { 甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅', 己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯' };
    mark('學堂', brIn([XT[ds]]));
    var CG = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
    mark('詞館', brIn([CG[ds]]));
    var yd = [Y, D];
    function byYD(arr) { return brIn(yd.map(function (b) { return grp(b, arr); })); }
    mark('將星', byYD(['午', '子', '酉', '卯']));
    mark('華蓋', byYD(['戌', '辰', '丑', '未']));
    mark('驛馬', byYD(['申', '寅', '亥', '巳']));
    mark('天醫', brIn([BRANCHES.charAt((BRANCHES.indexOf(M) + 11) % 12)]));
    var LU = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
    mark('祿神', brIn([LU[ds]]));
    var JY = { 甲: '辰', 乙: '巳', 丙: '未', 丁: '申', 戊: '未', 己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅' };
    mark('金輿', brIn([JY[ds]]));
    var YR = { 甲: '卯', 乙: '辰', 丙: '午', 丁: '未', 戊: '午', 己: '未', 庚: '酉', 辛: '戌', 壬: '子', 癸: '丑' };
    mark('羊刃', brIn([YR[ds]]));
    mark('劫煞', byYD(['亥', '巳', '寅', '申']));
    mark('災煞', byYD(['子', '午', '卯', '酉']));
    mark('亡神', byYD(['巳', '亥', '申', '寅']));
    mark('桃花', byYD(['卯', '酉', '午', '子']));
    var season = Math.floor(((BRANCHES.indexOf(Y) + 1) % 12) / 3); // 亥子丑=0, 寅卯辰=1, 巳午未=2, 申酉戌=3
    mark('孤辰', brIn([['寅', '巳', '申', '亥'][season]]));
    mark('寡宿', brIn([['戌', '丑', '辰', '未'][season]]));
    var di = gzIndex(P[2].gz), xb = (di - di % 10) % 12, kong = [BRANCHES.charAt((xb + 10) % 12), BRANCHES.charAt((xb + 11) % 12)];
    mark('旬空', function (i) { return i !== 2 && kong.indexOf(br[i]) >= 0; });
    var yangY = STEMS.indexOf(ys) % 2 === 0, chong = (BRANCHES.indexOf(Y) + 6) % 12;
    var yc = ((yangY && gender === '男') || (!yangY && gender === '女')) ? (chong + 1) % 12 : (chong + 11) % 12;
    mark('元辰', brIn([BRANCHES.charAt(yc)]));
    var XR = { 寅: '丑', 卯: '未', 辰: '寅', 巳: '申', 午: '卯', 未: '酉', 申: '辰', 酉: '戌', 戌: '巳', 亥: '亥', 子: '午', 丑: '子' };
    mark('血刃', brIn([XR[M]]));
    var order = ['天乙貴人', '天德', '月德', '文昌', '學堂', '詞館', '將星', '華蓋', '驛馬', '天醫', '祿神', '金輿', '羊刃', '劫煞', '災煞', '亡神', '桃花', '孤辰', '寡宿', '旬空', '元辰', '血刃'];
    return { list: order.filter(function (n) { return res[n]; }).map(function (n) { return { name: n, pillars: res[n] }; }), kong: kong };
  }

  function bazi(b) {
    var L = lib(), dt = b.dt;
    var s = L.Solar.fromYmdHms(dt.y, dt.m, dt.d, dt.h, dt.mi, 0), l = s.getLunar();
    var gz = [l.getYearInGanZhiExact(), l.getMonthInGanZhiExact(), l.getDayInGanZhiExact(), b.hasTime ? l.getTimeInGanZhi() : null];
    var dayStem = gz[2].charAt(0), labels = ['年柱', '月柱', '日柱', '時柱'];
    var pillars = gz.map(function (g, i) {
      if (!g) return null;
      var stem = g.charAt(0), brn = g.charAt(1);
      return {
        label: labels[i], gz: g, stem: stem, branch: brn,
        stemEl: STEM_EL.charAt(STEMS.indexOf(stem)), branchEl: BR_EL[brn],
        god: i === 2 ? '日主' : shishen(dayStem, stem),
        hidden: HIDE[brn].split('').map(function (h, k) { return { stem: h, el: STEM_EL.charAt(STEMS.indexOf(h)), god: shishen(dayStem, h), kind: ['本氣', '中氣', '餘氣'][k] }; }),
        nayin: nayin(g)
      };
    });
    var count = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    pillars.forEach(function (p) { if (p) { count[p.stemEl]++; count[p.branchEl]++; } });
    // 大運
    var yangYear = STEMS.indexOf(gz[0].charAt(0)) % 2 === 0;
    var forward = (yangYear && b.gender === '男') || (!yangYear && b.gender === '女');
    var jie = forward ? l.getNextJie(false) : l.getPrevJie(false);
    var jo = solarObj(jie.getSolar());
    var days = Math.abs(ms(jo) - ms(dt)) / 86400000;
    var totalMonths = days * 4, sy = Math.floor(totalMonths / 12), sm = Math.floor(totalMonths - sy * 12);
    var startMs = Date.UTC(b.solar.y + sy, b.solar.m - 1 + sm, Math.min(b.solar.d, 28));
    var startYear = new Date(startMs).getUTCFullYear(), startMonth = new Date(startMs).getUTCMonth() + 1;
    var mi = gzIndex(gz[1]), dayun = [];
    for (var k = 1; k <= 8; k++) {
      var g2 = gzAt(mi + (forward ? k : -k));
      dayun.push({ gz: g2, god: shishen(dayStem, g2.charAt(0)), fromAge: sy + 10 * (k - 1), toAge: sy + 10 * k, months: sm, startYear: startYear + 10 * (k - 1), startMonth: startMonth });
    }
    // 流年
    var now = taipeiNow(), ln = L.Solar.fromYmdHms(now.y, now.m, now.d, now.h, now.mi, 0).getLunar().getYearInGanZhiExact();
    // 提醒
    var warn = [], pj = solarObj(l.getPrevJie(false).getSolar()), nj = solarObj(l.getNextJie(false).getSolar());
    var pjn = jqName(l.getPrevJie(false)), njn = jqName(l.getNextJie(false));
    if (b.hasTime) {
      var near = [[pjn, pj], [njn, nj]].filter(function (x) { return Math.abs(ms(x[1]) - ms(dt)) < 86400000; });
      near.forEach(function (x) { warn.push('出生時間在' + x[0] + '（' + fmtDT(x[1]) + '）前後 24 小時內，' + (x[0] === '立春' ? '年柱與月柱' : '月柱') + '對時間很敏感，請確認出生時間。'); });
    } else {
      var d0 = ms({ y: dt.y, m: dt.m, d: dt.d, h: 0, mi: 0 }), d1 = d0 + 86400000;
      [[pjn, pj], [njn, nj]].forEach(function (x) { var t = ms(x[1]); if (t >= d0 && t < d1) warn.push('出生當天交' + x[0] + '（' + fmtDT(x[1]) + '），時辰不詳時' + (x[0] === '立春' ? '年柱、月柱' : '月柱') + '可能不同。'); });
      warn.push('時辰不詳：只排年、月、日三柱；起運歲數以中午 12:00 估算。');
    }
    var ss = shensha(pillars, b.gender);
    return {
      pillars: pillars, count: count, countTotal: pillars.filter(Boolean).length * 2,
      forward: forward, startYears: sy, startMonths: sm, startDays: days, jie: { name: forward ? njn : pjn, at: jo },
      dayun: dayun, smallLuck: gz[1], liunian: { year: now.y, gz: ln }, shensha: ss.list, kong: ss.kong, warnings: warn, birth: b
    };
  }

  // ================= 合婚 =================
  var WUHE = { 甲己: '土', 乙庚: '金', 丙辛: '水', 丁壬: '木', 戊癸: '火' };
  var GANCHONG = ['甲庚', '乙辛', '丙壬', '丁癸'];
  var LIUHE = { 子丑: '土', 寅亥: '木', 卯戌: '火', 辰酉: '金', 巳申: '水', 午未: '土' };
  var CHONG = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
  var HAI = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌'];
  var SANHE = [['申', '子', '辰', '水'], ['亥', '卯', '未', '木'], ['寅', '午', '戌', '火'], ['巳', '酉', '丑', '金']];
  var XING3 = [['寅', '巳', '申', '無恩之刑'], ['丑', '未', '戌', '恃勢之刑']];
  function pairIn(a, b, list) { return list.indexOf(a + b) >= 0 || list.indexOf(b + a) >= 0; }
  function pairMap(a, b, map) { return map[a + b] || map[b + a] || null; }
  function stemRel(a, b) {
    var out = [], h = pairMap(a, b, WUHE);
    if (h) out.push('天干五合（' + a + b + '合化' + h + '）');
    if (pairIn(a, b, GANCHONG)) out.push('天干相沖');
    return out;
  }
  function branchRel(a, b) {
    var out = [], h = pairMap(a, b, LIUHE);
    if (h) out.push('六合（化' + h + '）');
    if (a !== b) SANHE.forEach(function (g) { if (g.indexOf(a) >= 0 && g.indexOf(b) >= 0 && g.indexOf(a) < 3 && g.indexOf(b) < 3) out.push('半合（' + g.slice(0, 3).join('') + '三合' + g[3] + '局之二）'); });
    if (pairIn(a, b, CHONG)) out.push('六沖');
    if (pairIn(a, b, HAI)) out.push('六害');
    if (a !== b) XING3.forEach(function (g) { if (g.indexOf(a) >= 0 && g.indexOf(b) >= 0 && g.indexOf(a) < 3 && g.indexOf(b) < 3) out.push('相刑（' + g[3] + '）'); });
    if (pairIn(a, b, ['子卯'])) out.push('相刑（無禮之刑）');
    if (a === b && '辰午酉亥'.indexOf(a) >= 0) out.push('自刑');
    return out;
  }
  function hehun(A, B) {
    var ya = A.pillars[0], yb = B.pillars[0], da = A.pillars[2], db = B.pillars[2];
    var lack = [];
    ELS.forEach(function (e) {
      if (!A.count[e] && !B.count[e]) { lack.push('兩人都缺' + e); return; }
      if (!A.count[e]) lack.push((A.birth.name || '甲方') + '缺' + e + '，' + (B.birth.name || '乙方') + '有 ' + B.count[e] + ' 個');
      if (!B.count[e]) lack.push((B.birth.name || '乙方') + '缺' + e + '，' + (A.birth.name || '甲方') + '有 ' + A.count[e] + ' 個');
    });
    var na = ya.nayin, nb = yb.nayin;
    return {
      yearStem: { a: ya.stem, b: yb.stem, rel: stemRel(ya.stem, yb.stem) },
      dayStem: { a: da.stem, b: db.stem, rel: stemRel(da.stem, db.stem) },
      yearBranch: { a: ya.branch, b: yb.branch, rel: branchRel(ya.branch, yb.branch) },
      dayBranch: { a: da.branch, b: db.branch, rel: branchRel(da.branch, db.branch) },
      dayMaster: { aToB: shishen(db.stem, da.stem), bToA: shishen(da.stem, db.stem), el: elRel(da.stemEl, db.stemEl) },
      lack: lack,
      nayin: { a: na, b: nb, rel: elRel(na.charAt(2), nb.charAt(2)) }
    };
  }

  // ================= 奇門遁甲（時家轉盤・拆補法） =================
  var JU = { 冬至: '174', 驚蟄: '174', 小寒: '285', 大寒: '396', 春分: '396', 立春: '852', 雨水: '963', 清明: '417', 立夏: '417', 穀雨: '528', 小滿: '528', 芒種: '639',
    夏至: '936', 白露: '936', 小暑: '825', 大暑: '714', 秋分: '714', 立秋: '258', 處暑: '147', 霜降: '582', 小雪: '582', 寒露: '693', 立冬: '693', 大雪: '471' };
  var YANG_TERMS = ['冬至', '小寒', '大寒', '立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿', '芒種'];
  var QM_STARS = { 1: '天蓬', 2: '天芮', 3: '天沖', 4: '天輔', 5: '天禽', 6: '天心', 7: '天柱', 8: '天任', 9: '天英' };
  var QM_DOORS = { 1: '休門', 2: '死門', 3: '傷門', 4: '杜門', 6: '開門', 7: '驚門', 8: '生門', 9: '景門' };
  var QM_GODS = ['值符', '螣蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天'];
  var QM_YI = '戊己庚辛壬癸丁丙乙';
  var XUN_YI = { 甲子: '戊', 甲戌: '己', 甲申: '庚', 甲午: '辛', 甲辰: '壬', 甲寅: '癸' };
  var RING = [1, 8, 3, 4, 9, 2, 7, 6];
  var PALACE = { 1: '坎一宮・北', 2: '坤二宮・西南', 3: '震三宮・東', 4: '巽四宮・東南', 5: '中五宮', 6: '乾六宮・西北', 7: '兌七宮・西', 8: '艮八宮・東北', 9: '離九宮・南' };
  var PNAME = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兌', 8: '艮', 9: '離' };
  function step9(p, dir) { return ((p - 1 + dir + 9) % 9) + 1; }
  function ringShift(p, off) { return RING[(RING.indexOf(p) + off + 80) % 8]; }
  function qimen(t) {
    var L = lib(), l = L.Solar.fromYmdHms(t.y, t.m, t.d, t.h, t.mi, 0).getLunar();
    var pq = l.getPrevJieQi(false), nq = l.getNextJieQi(false), term = jqName(pq);
    var yang = YANG_TERMS.indexOf(term) >= 0, dir = yang ? 1 : -1;
    var dayGz = l.getDayInGanZhiExact(), hourGz = l.getTimeInGanZhi();
    var di = gzIndex(dayGz), yuan = Math.floor(di / 5) % 3, ju = +JU[term].charAt(yuan);
    var earth = {}, where = {}, p = ju;
    for (var i = 0; i < 9; i++) { earth[p] = QM_YI.charAt(i); where[QM_YI.charAt(i)] = p; p = step9(p, dir); }
    var hi = gzIndex(hourGz), xs = hi - hi % 10, xunName = gzAt(xs), yi = XUN_YI[xunName];
    var hourStem = hourGz.charAt(0), useStem = hourStem === '甲' ? yi : hourStem;
    var xunPalace = where[yi], srcP = xunPalace === 5 ? 2 : xunPalace;
    var zhifu = QM_STARS[srcP], zhishi = QM_DOORS[srcP];
    var hp = where[useStem]; if (hp === 5) hp = 2;
    var off = RING.indexOf(hp) - RING.indexOf(srcP);
    var cells = {};
    for (var k = 1; k <= 9; k++) cells[k] = { palace: k, name: PALACE[k], earth: earth[k], heaven: [], stars: [], door: '', god: '' };
    RING.forEach(function (op) {
      var np = ringShift(op, off);
      cells[np].stars.push(QM_STARS[op]); cells[np].heaven.push(earth[op]);
      if (op === 2) { cells[np].stars.push('天禽'); cells[np].heaven.push(earth[5]); }
    });
    var steps = hi - xs, dp = xunPalace;
    for (var s2 = 0; s2 < steps; s2++) dp = step9(dp, dir);
    if (dp === 5) dp = 2;
    var doff = RING.indexOf(dp) - RING.indexOf(srcP);
    RING.forEach(function (op) { cells[ringShift(op, doff)].door = QM_DOORS[op]; });
    for (var g = 0; g < 8; g++) cells[ringShift(hp, dir * g)].god = QM_GODS[g];
    var kong = [BRANCHES.charAt((xs % 12 + 10) % 12), BRANCHES.charAt((xs % 12 + 11) % 12)];
    var hb = hourGz.charAt(1), horse = grp(hb, ['申', '寅', '亥', '巳']);
    var BR_P = { 子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6 };
    return {
      time: t, term: term, termStart: solarObj(pq.getSolar()), nextTerm: jqName(nq), nextStart: solarObj(nq.getSolar()),
      yang: yang, yuan: ['上元', '中元', '下元'][yuan], ju: ju,
      pillars: [l.getYearInGanZhiExact(), l.getMonthInGanZhiExact(), dayGz, hourGz],
      xun: xunName, xunYi: yi, zhifu: zhifu, zhifuPalace: hp, zhishi: zhishi, zhishiPalace: dp,
      kong: kong, kongPalaces: kong.map(function (b2) { return BR_P[b2]; }), horse: horse, horsePalace: BR_P[horse],
      hourStem: useStem, cells: cells
    };
  }
  var QM_FOCUS = {
    事業: { doors: ['開門'], gods: [], stars: [], stems: [], zhifu: true, text: '事業看開門、值符。' },
    財運: { doors: ['生門'], gods: [], stars: [], stems: ['戊'], text: '財運看生門、戊（天盤干）。' },
    感情: { doors: [], gods: ['六合'], stars: [], stems: ['乙', '庚'], text: '感情看六合，乙為女、庚為男（天盤干）。' },
    考試: { doors: ['景門'], gods: [], stars: [], stems: ['丁'], text: '考試看景門、丁（天盤干）。' },
    健康: { doors: [], gods: [], stars: ['天芮', '天心'], stems: [], text: '健康看天芮（病）、天心（醫）。不能取代醫療，不適應找醫師。' },
    出行: { doors: ['開門'], gods: [], stars: [], stems: [], horse: true, text: '出行看開門與驛馬所在宮。' },
    訴訟: { doors: ['驚門'], gods: [], stars: [], stems: [], zhifu: true, text: '訴訟看驚門、值符。' },
    尋物: { doors: [], gods: ['六合'], stars: [], stems: [], hourStem: true, text: '尋物看時干落宮與六合。' },
    其他: { doors: [], gods: [], stars: [], stems: [], zhifu: true, zhishi: true, hourStem: true, text: '一般事看值符、值使與時干落宮。' }
  };
  function qimenFocus(chart, cat) {
    var f = QM_FOCUS[cat] || QM_FOCUS['其他'], hits = {};
    function add(p, why) { (hits[p] = hits[p] || []).push(why); }
    for (var p = 1; p <= 9; p++) {
      var c = chart.cells[p];
      f.doors.forEach(function (d) { if (c.door === d) add(p, d); });
      f.gods.forEach(function (g) { if (c.god === g) add(p, g); });
      f.stars.forEach(function (s) { if (c.stars.indexOf(s) >= 0) add(p, s); });
      f.stems.forEach(function (s) { if (c.heaven.indexOf(s) >= 0) add(p, '天盤' + s); });
      if (f.zhifu && c.god === '值符') add(p, '值符');
      if (f.zhishi && c.door === chart.zhishi) add(p, '值使' + chart.zhishi);
      if (f.hourStem && p === chart.zhifuPalace) add(p, '時干' + chart.hourStem);
      if (f.horse && p === chart.horsePalace) add(p, '驛馬');
    }
    return { text: f.text, hits: hits };
  }

  // ================= 風水（玄空飛星・八宅） =================
  var MOUNTAINS = '子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬'.split('');
  var MT_PALACE = { 壬: 1, 子: 1, 癸: 1, 丑: 8, 艮: 8, 寅: 8, 甲: 3, 卯: 3, 乙: 3, 辰: 4, 巽: 4, 巳: 4, 丙: 9, 午: 9, 丁: 9, 未: 2, 坤: 2, 申: 2, 庚: 7, 酉: 7, 辛: 7, 戌: 6, 乾: 6, 亥: 6 };
  var PAL_MTS = { 1: '壬子癸', 8: '丑艮寅', 3: '甲卯乙', 4: '辰巽巳', 9: '丙午丁', 2: '未坤申', 7: '庚酉辛', 6: '戌乾亥' };
  var MT_YANG = {}; '乾坤艮巽甲庚壬丙寅申巳亥'.split('').forEach(function (c) { MT_YANG[c] = true; });
  var TI = {}; [['子癸甲申', 1], ['坤壬乙卯未', 2], ['戌乾亥辰巽巳', 6], ['艮丙辛酉丑', 7], ['寅午庚丁', 9]].forEach(function (r) { r[0].split('').forEach(function (c) { TI[c] = r[1]; }); });
  var FLY = [5, 6, 7, 8, 9, 1, 2, 3, 4];
  var DIR = { 1: '北', 2: '西南', 3: '東', 4: '東南', 5: '中', 6: '西北', 7: '西', 8: '東北', 9: '南' };
  var TRI = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 6: '乾', 7: '兌', 8: '艮', 9: '離' };
  function yuanlong(mt) { return PAL_MTS[MT_PALACE[mt]].indexOf(mt); } // 0 地元、1 天元、2 人元
  function wrap9(n) { return ((n - 1) % 9 + 9) % 9 + 1; }
  function fly(center, fwd) { var g = {}; for (var i = 0; i < 9; i++) g[FLY[i]] = wrap9(center + (fwd ? i : -i)); return g; }
  function degreeInfo(deg) {
    var d = ((deg % 360) + 360) % 360, idx = Math.floor(((d + 7.5) % 360) / 15), center = idx * 15;
    var off = d - center; if (off > 180) off -= 360; if (off < -180) off += 360;
    var facing = MOUNTAINS[idx], sitting = MOUNTAINS[(idx + 12) % 24];
    var side = off >= 0 ? 1 : -1, nb = MOUNTAINS[(idx + side + 24) % 24];
    var abs = Math.abs(off), sameGua = MT_PALACE[nb] === MT_PALACE[facing];
    var note = '';
    if (abs >= 6) note = (sameGua ? '小空亡' : '大空亡') + '：偏離中線 ' + abs.toFixed(1) + '°，接近' + facing + '與' + nb + '交界' + (sameGua ? '（同卦兩山之間）' : '（兩卦交界）') + '，宜謹慎複核坐向。';
    else if (abs > 3) note = '兼向：偏離中線 ' + abs.toFixed(1) + '°，' + facing + '兼' + nb + '，建議下卦與替卦兩盤並參。';
    return { deg: d, facing: facing, sitting: sitting, offset: off, abs: abs, neighbor: nb, kongwang: abs >= 6, jian: abs > 3, note: note };
  }
  function periodOf(y) { return Math.floor((y - 1864) / 20) % 9 + 1; }
  function yearStar(y) { var n = (11 - ((y % 9) + 9) % 9) % 9; return n === 0 ? 9 : n; }
  function starState(n, period) {
    if (n === period) return '當旺';
    if (n === wrap9(period + 1) || n === wrap9(period + 2)) return '生氣';
    if (n === wrap9(period - 1)) return '退氣';
    if (n === 5) return '五黃煞';
    return '衰死';
  }
  function starFor(n, mt, useTi) {
    // 回傳 {center, fwd, basis, replaced}
    var basis = n === 5 ? mt : PAL_MTS[n].charAt(yuanlong(mt));
    var fwd = !!MT_YANG[basis], center = n;
    if (useTi && n !== 5) center = TI[basis];
    return { orig: n, center: center, fwd: fwd, basis: basis, replaced: useTi && n !== 5 && center !== n };
  }
  function flyingStars(sitting, period, useTi, year) {
    var facing = MOUNTAINS[(MOUNTAINS.indexOf(sitting) + 12) % 24];
    var sp = MT_PALACE[sitting], fp = MT_PALACE[facing];
    var yun = fly(period, true);
    var ms1 = starFor(yun[sp], sitting, useTi), fs = starFor(yun[fp], facing, useTi);
    var mtn = fly(ms1.center, ms1.fwd), wat = fly(fs.center, fs.fwd), ann = fly(yearStar(year), true);
    var pats = [];
    if (mtn[sp] === period && wat[fp] === period) pats.push('旺山旺向');
    if (mtn[fp] === period && wat[sp] === period) pats.push('上山下水');
    if (mtn[fp] === period && wat[fp] === period) pats.push('雙星到向');
    if (mtn[sp] === period && wat[sp] === period) pats.push('雙星到坐');
    if (ms1.center === 5) pats.push(ms1.fwd ? '山星伏吟' : '山星反吟');
    if (fs.center === 5) pats.push(fs.fwd ? '向星伏吟' : '向星反吟');
    var all = function (fn) { for (var i = 1; i <= 9; i++) if (!fn(i)) return false; return true; };
    if (all(function (i) { return mtn[i] + yun[i] === 10; })) pats.push('山星與運星合十');
    if (all(function (i) { return wat[i] + yun[i] === 10; })) pats.push('向星與運星合十');
    if (all(function (i) { var a = [yun[i], mtn[i], wat[i]].map(function (x) { return x % 3; }); return a[0] === a[1] && a[1] === a[2] && yun[i] !== mtn[i] && mtn[i] !== wat[i] && yun[i] !== wat[i]; })) pats.push('父母三般卦');
    if (all(function (i) { var a = [yun[i], mtn[i], wat[i]].sort(function (x, y2) { return x - y2; }); var s = a.join(','); return (a[1] === a[0] + 1 && a[2] === a[1] + 1) || s === '1,8,9' || s === '1,2,9'; })) pats.push('連珠三般卦');
    var states = []; for (var n = 1; n <= 9; n++) states.push({ star: n, state: starState(n, period) });
    return { sitting: sitting, facing: facing, sp: sp, fp: fp, period: period, useTi: useTi, yun: yun, mtn: mtn, wat: wat, ann: ann, yearStar: yearStar(year), year: year, mStar: ms1, fStar: fs, patterns: pats, states: states };
  }
  var GUA_BITS = { 乾: [1, 1, 1], 兌: [1, 1, 0], 離: [1, 0, 1], 震: [1, 0, 0], 巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0] };
  var GUA_NUM = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 乾: 6, 兌: 7, 艮: 8, 離: 9 };
  var YOU = ['生氣', '五鬼', '延年', '六煞', '禍害', '天醫', '絕命'], YOU_LINE = [2, 1, 0, 1, 2, 1, 0];
  var YOU_RANK = { 生氣: '上吉', 延年: '上吉', 天醫: '中吉', 伏位: '小吉', 禍害: '小凶', 六煞: '次凶', 五鬼: '大凶', 絕命: '大凶' };
  function bitsToGua(b) { for (var k in GUA_BITS) if (GUA_BITS[k].join('') === b.join('')) return k; }
  function youNian(gua) {
    var b = GUA_BITS[gua].slice(), out = [{ star: '伏位', gua: gua }];
    YOU_LINE.forEach(function (ln, i) { b[ln] = 1 - b[ln]; out.push({ star: YOU[i], gua: bitsToGua(b) }); });
    return out.map(function (o) { var n = GUA_NUM[o.gua]; return { star: o.star, gua: o.gua, dir: DIR[n], rank: YOU_RANK[o.star] }; });
  }
  var EAST = ['坎', '離', '震', '巽'];
  function lichunYear(y, m, d) {
    var gz = lib().Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getYearInGanZhiExact();
    return gzIndex(gz) === (((y - 4) % 60) + 60) % 60 ? y : y - 1;
  }
  function mingGua(y, m, d, gender) {
    var Y = lichunYear(y, m, d), r = ((Y % 9) + 9) % 9, n;
    if (gender === '男') { n = (11 - r) % 9; if (n === 0) n = 9; if (n === 5) n = 2; }
    else { n = (r + 4) % 9; if (n === 0) n = 9; if (n === 5) n = 8; }
    var gua = TRI[n];
    return { year: Y, num: n, gua: gua, group: EAST.indexOf(gua) >= 0 ? '東四命' : '西四命', you: youNian(gua) };
  }
  function bazhai(sitting) { var gua = TRI[MT_PALACE[sitting]]; return { gua: gua, group: EAST.indexOf(gua) >= 0 ? '東四宅' : '西四宅', you: youNian(gua) }; }

  // ================= 塔羅 =================
  var MAJORS = ['愚者', '魔術師', '女祭司', '女皇', '皇帝', '教皇', '戀人', '戰車', '力量', '隱士', '命運之輪', '正義', '倒吊人', '死神', '節制', '惡魔', '高塔', '星星', '月亮', '太陽', '審判', '世界'];
  var SUITS = [['權杖', '火', '行動'], ['聖杯', '水', '情感'], ['寶劍', '風', '思維'], ['星幣', '土', '身體與金錢']];
  var RANKS = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍從', '騎士', '皇后', '國王'];
  var RANK_CUE = ['種子、新的開始', '選擇', '初步成果', '穩定', '衝突', '恢復', '考驗', '精進', '接近完成', '完成或過載', '學習', '行動', '滋養', '掌控'];
  var DECK = (function () {
    var d = [];
    MAJORS.forEach(function (n, i) { d.push({ id: i, name: n, major: true, num: i, el: null, cue: '大阿卡納第 ' + i + ' 號，屬「' + (i <= 7 ? '第一階段（0–7）：起步與向外探索' : i <= 14 ? '第二階段（8–14）：內在調整與取捨' : '第三階段（15–21）：深層轉變與整合') + '」。' }); });
    SUITS.forEach(function (s, si) { RANKS.forEach(function (r, ri) { d.push({ id: 22 + si * 14 + ri, name: s[0] + r, major: false, suit: s[0], el: s[1], rank: ri, cue: s[0] + '代表' + s[2] + '；' + r + '代表' + RANK_CUE[ri] + '。' }); }); });
    return d;
  })();
  var SPREADS = {
    single: { name: '單張', pos: ['當前指引'], key: [0], up7: [] },
    three: { name: '三牌', pos: ['過去', '現在', '未來'], key: [1], up7: [2] },
    five: { name: '五牌', pos: ['核心', '根源', '阻力', '潛力', '建議'], key: [0, 4], up7: [4] },
    moon: { name: '月亮', pos: ['新月', '上弦', '滿月', '下弦'], key: [0, 2], up7: [] },
    horseshoe: { name: '馬蹄形', pos: ['遠期過去', '近期過去', '當前', '近期未來', '外部影響', '建議', '結果'], key: [2, 4, 6], up7: [5, 6] },
    celtic: { name: '凱爾特十字', pos: ['核心', '交叉', '意識目標', '根基過去', '近期過去', '近期未來', '自我', '環境', '希望與恐懼', '結果'], key: [0, 4, 9], up7: [9] }
  };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function slotOfHour(h) { return h >= 6 && h < 12 ? 'M' : h >= 12 && h < 18 ? 'A' : 'N'; }
  function newSeed(h) {
    var c = root.crypto || (typeof globalThis !== 'undefined' ? globalThis.crypto : null), a = new Uint32Array(1);
    c.getRandomValues(a);
    return ('00000000' + a[0].toString(16).toUpperCase()).slice(-8) + '-' + slotOfHour(h);
  }
  function parseSeed(code, h) {
    var m = String(code || '').trim().toUpperCase().match(/^([0-9A-F]{1,8})(?:-([MAN]))?$/);
    if (!m) return null;
    var hex = ('00000000' + m[1]).slice(-8), slot = m[2] || slotOfHour(h);
    return { n: parseInt(hex, 16) >>> 0, slot: slot, code: hex + '-' + slot };
  }
  function drawTarot(spreadKey, seedCode, hour) {
    var sp = SPREADS[spreadKey], sd = parseSeed(seedCode, hour);
    if (!sp || !sd) return null;
    var rnd = mulberry32(sd.n), pool = DECK.slice(), out = [];
    var favor = sd.slot === 'M' ? ['火', '風'] : sd.slot === 'A' ? ['水', '土'] : ['major'];
    sp.pos.forEach(function (pos, i) {
      var key = sp.key.indexOf(i) >= 0, ws = pool.map(function (c) {
        var w = 1;
        if (key && c.major) w *= 60 / 28;
        if ((c.major && favor[0] === 'major') || (!c.major && favor.indexOf(c.el) >= 0)) w *= 1.08;
        return w;
      });
      var tot = ws.reduce(function (a, b) { return a + b; }, 0), r = rnd() * tot, k = 0;
      while (k < ws.length - 1 && r >= ws[k]) { r -= ws[k]; k++; }
      var card = pool.splice(k, 1)[0], pUp = sp.up7.indexOf(i) >= 0 ? 0.7 : 0.6, upright = rnd() < pUp;
      out.push({ pos: pos, key: key, card: card, upright: upright, pUp: pUp });
    });
    return { spread: sp.name, spreadKey: spreadKey, seed: sd.code, slot: sd.slot, cards: out };
  }

  // ================= 驗算 =================
  function selfTest(iztro) {
    var out = [];
    function eq(name, got, exp) { var g = JSON.stringify(got), e = JSON.stringify(exp); out.push({ name: name, pass: g === e, detail: g === e ? '' : '得到 ' + g + '，應為 ' + e }); }
    function B(y, m, d, t, g) { return resolveBirth({ gender: g, cal: 'solar', y: y, m: m, d: d, timeMode: t ? 'exact' : 'unknown', time: t }); }
    function pz(r) { return r.pillars.map(function (p) { return p ? p.gz : '（無）'; }).join(' '); }
    var c1 = bazi(B(1990, 5, 15, '12:30', '男'));
    eq('八字 1990/05/15 12:30 男：四柱', pz(c1), '庚午 辛巳 庚辰 壬午');
    eq('八字 同上：大運', [c1.forward ? '順' : '逆', c1.startYears, c1.startMonths, c1.dayun[0].gz, c1.dayun[1].gz], ['順', 7, 3, '壬午', '癸未']);
    eq('八字 同上：十神（年月時）', [c1.pillars[0].god, c1.pillars[1].god, c1.pillars[3].god], ['比肩', '劫財', '食神']);
    eq('八字 同上：神煞', c1.shensha.map(function (s) { return s.name; }), ['天乙貴人', '天德', '月德', '學堂', '將星', '華蓋', '天醫', '劫煞', '災煞', '亡神', '寡宿']);
    var c2 = bazi(B(1990, 2, 3, '10:00', '女'));
    eq('八字 1990/02/03 10:00 女（立春前）', [pz(c2), c2.forward ? '順' : '逆', c2.startYears, c2.startMonths, c2.dayun[0].gz], ['己巳 丁丑 己亥 己巳', '順', 0, 4, '戊寅']);
    var c3 = bazi(B(2000, 1, 1, '23:30', '男'));
    eq('八字 2000/01/01 23:30 男（夜子時）', [pz(c3), c3.forward ? '順' : '逆', c3.startYears, c3.startMonths, c3.dayun[0].gz], ['己卯 丙子 己未 甲子', '逆', 8, 4, '乙亥']);
    var c4 = bazi(B(1984, 2, 4, '23:10', '女'));
    eq('八字 1984/02/04 23:10 女', [pz(c4), c4.forward ? '順' : '逆', c4.startYears, c4.dayun[0].gz], ['癸亥 乙丑 己巳 甲子', '順', 0, '丙寅']);
    var c5 = bazi(B(2008, 8, 8, null, '女'));
    eq('八字 2008/08/08 時辰不詳 女', [pz(c5), c5.forward ? '順' : '逆', c5.dayun[0].gz], ['戊子 庚申 庚辰 （無）', '逆', '己未']);
    var sc = resolveBirth({ gender: '男', cal: 'solar', y: 2000, m: 1, d: 1, timeMode: 'shichen', shichen: 0 });
    eq('只知子時按早子時（當日日柱）', bazi(sc).pillars[2].gz, '戊午');
    eq('曆法 農曆2020閏四月初十', lunarToSolar(2020, 4, 10, true), { ok: true, y: 2020, m: 6, d: 1 });
    eq('曆法 農曆2025閏六月初一', lunarToSolar(2025, 6, 1, true), { ok: true, y: 2025, m: 7, d: 25 });
    eq('曆法 農曆2023閏二月初一', lunarToSolar(2023, 2, 1, true), { ok: true, y: 2023, m: 3, d: 22 });
    eq('曆法 2020 閏五月要報錯', lunarToSolar(2020, 5, 1, true).ok, false);
    eq('曆法 閏月 2020/2023/2025/2033', [leapMonthOf(2020), leapMonthOf(2023), leapMonthOf(2025), leapMonthOf(2033)], [4, 2, 6, 11]);
    eq('國曆 2/30 要擋', resolveBirth({ gender: '男', cal: 'solar', y: 2001, m: 2, d: 30, timeMode: 'unknown' }).ok, false);
    var HKO_LEAP = {"1903": 5, "1906": 4, "1909": 2, "1911": 6, "1914": 5, "1917": 2, "1919": 7, "1922": 5, "1925": 4, "1928": 2, "1930": 6, "1933": 5, "1936": 3, "1938": 7, "1941": 6, "1944": 4, "1947": 2, "1949": 7, "1952": 5, "1955": 3, "1957": 8, "1960": 6, "1963": 4, "1966": 3, "1968": 7, "1971": 5, "1974": 4, "1976": 8, "1979": 6, "1982": 4, "1984": 10, "1987": 6, "1990": 5, "1993": 3, "1995": 8, "1998": 5, "2001": 4, "2004": 2, "2006": 7, "2009": 5, "2012": 4, "2014": 9, "2017": 6, "2020": 4, "2023": 2, "2025": 6, "2028": 5, "2031": 3, "2033": 11, "2036": 6, "2039": 5, "2042": 2, "2044": 7, "2047": 5, "2050": 3, "2052": 8, "2055": 6, "2058": 4, "2061": 3, "2063": 7, "2066": 5, "2069": 4, "2071": 8, "2074": 6, "2077": 4, "2080": 3, "2082": 7, "2085": 5, "2088": 4, "2090": 8, "2093": 6, "2096": 4, "2099": 2};
    var lm = {}; for (var y = 1901; y <= 2099; y++) { var mm = leapMonthOf(y); if (mm) lm[y] = mm; }
    eq('1901–2099 閏月與香港天文台對照表一致（73 個）', lm, HKO_LEAP);
    var q = qimen({ y: 2026, m: 11, d: 21, h: 21, mi: 30 });
    eq('奇門 2026/11/21 21:30：局', [q.term, q.yang ? '陽遁' : '陰遁', q.ju, q.yuan, q.xun, q.xunYi], ['立冬', '陰遁', 9, '中元', '甲戌', '己']);
    eq('奇門 同上：值符值使空馬', [q.zhifu, q.zhifuPalace, q.zhishi, q.zhishiPalace, q.kong.join(''), q.horse], ['天任', 1, '生門', 7, '申酉', '巳']);
    var exp = { 1: '己/乙 天任 杜門 值符', 2: '庚/丙 天柱 休門 六合', 3: '癸/丁 天輔 死門 九地', 4: '戊/癸 天英 驚門 玄武', 6: '乙/辛 天蓬 傷門 螣蛇', 7: '辛/庚 天心 生門 太陰', 8: '丁/己 天沖 景門 九天', 9: '丙壬/戊 天芮天禽 開門 白虎' };
    var got = {}; [1, 2, 3, 4, 6, 7, 8, 9].forEach(function (k) { var c = q.cells[k]; got[k] = c.heaven.join('') + '/' + c.earth + ' ' + c.stars.join('') + ' ' + c.door + ' ' + c.god; });
    eq('奇門 同上：九宮', got, exp);
    eq('奇門 同上：中五地盤', q.cells[5].earth, '壬');
    var di = degreeInfo(195), f1 = flyingStars(di.sitting, periodOf(2015), false, 2026);
    function row(g) { return FLY.map(function (p) { return g[p]; }).join(''); }
    eq('風水 195° 2015：坐向運', [di.sitting, di.facing, f1.period], ['癸', '丁', 8]);
    eq('風水 同上：運/山/向盤', [row(f1.yun), row(f1.mtn), row(f1.wat)], ['891234567', '456789123', '321987654']);
    eq('風水 同上：山4順、向3逆、格局', [f1.mStar.center, f1.mStar.fwd, f1.fStar.center, f1.fStar.fwd, f1.patterns], [4, true, 3, false, ['雙星到向']]);
    var f2 = flyingStars('子', 8, true, 2026);
    eq('風水 8運子山午向替卦', [f2.mStar.center, f2.mStar.fwd, f2.fStar.center, f2.fStar.fwd, f2.patterns], [6, true, 2, false, ['向星與運星合十']]);
    var m1 = mingGua(1990, 5, 15, '男'), m2 = mingGua(1990, 1, 20, '女');
    var dirOf = function (mg, s) { return mg.you.filter(function (x) { return x.star === s; })[0].dir; };
    eq('風水 命卦 1990/05/15 男', [m1.num, m1.gua, m1.group, dirOf(m1, '生氣'), dirOf(m1, '延年'), dirOf(m1, '天醫'), dirOf(m1, '伏位')], [1, '坎', '東四命', '東南', '南', '東', '北']);
    eq('風水 命卦 1990/01/20 女（算1989）', [m2.year, m2.num, m2.gua], [1989, 4, '巽']);
    eq('元運 2004–2023＝8、2024–2043＝9', [periodOf(2004), periodOf(2023), periodOf(2024), periodOf(2043)], [8, 8, 9, 9]);
    var t1 = drawTarot('three', '1A2B3C4D-N', 21), t2 = drawTarot('three', '1A2B3C4D-N', 9);
    var ids = t1.cards.map(function (c) { return c.card.id; });
    eq('塔羅 三牌不重複', ids.filter(function (v, i) { return ids.indexOf(v) === i; }).length, 3);
    eq('塔羅 同種子重現', JSON.stringify(t1.cards.map(function (c) { return [c.card.id, c.upright]; })), JSON.stringify(t2.cards.map(function (c) { return [c.card.id, c.upright]; })));
    var up = 0, n = 0, upF = 0, nF = 0, maj = 0, majN = 0;
    for (var s = 1; s <= 4000; s++) {
      var d = drawTarot('three', s.toString(16) + '-N', 0);
      d.cards.forEach(function (c, i) { if (i === 2) { nF++; if (c.upright) upF++; } else { n++; if (c.upright) up++; } if (i === 1) { majN++; if (c.card.major) maj++; } });
    }
    eq('塔羅 正位比例（一般≈0.6、未來≈0.7）', [Math.abs(up / n - 0.6) < 0.03, Math.abs(upF / nF - 0.7) < 0.03], [true, true]);
    eq('塔羅 牌組 78 張', DECK.length, 78);
    if (iztro) {
      var a = iztro.astro.bySolar('1990-5-15', 6, '女', true, 'zh-TW');
      var P = {}; a.palaces.forEach(function (p) { P[p.name] = p.heavenlyStem + p.earthlyBranch + '：' + p.majorStars.map(function (s) { return s.name + (s.mutagen ? '化' + s.mutagen : ''); }).join('、'); });
      eq('紫微 1990/05/15 12:30 女：命身局主', [a.earthlyBranchOfSoulPalace, a.earthlyBranchOfBodyPalace, a.fiveElementsClass, a.soul, a.body], ['亥', '亥', '土五局', '巨門', '火星']);
      eq('紫微 同上：六宮', [P['命宮'], P['夫妻'], P['兄弟'], P['財帛'], P['疾厄'], P['遷移']],
        ['丁亥：天梁', '乙酉：天機、巨門', '丙戌：紫微、天相', '癸未：太陽化祿、太陰化科', '壬午：武曲化權、天府', '辛巳：天同化忌']);
    }
    return out;
  }

  var api = {
    STEMS: STEMS, BRANCHES: BRANCHES, LUNAR_MONTHS: LUNAR_MONTHS, LUNAR_DAYS: LUNAR_DAYS, SHICHEN: SHICHEN, ELS: ELS, MOUNTAINS: MOUNTAINS, MT_PALACE: MT_PALACE, MT_YANG: MT_YANG,
    PALACE: PALACE, PNAME: PNAME, DIR: DIR, TRI: TRI, FLY: FLY, SPREADS: SPREADS, DECK: DECK,
    pad: pad, fmtD: fmtD, fmtDT: fmtDT, taipeiNow: taipeiNow, solarValid: solarValid, leapMonthOf: leapMonthOf, lunarMonthDays: lunarMonthDays,
    lunarToSolar: lunarToSolar, solarToLunar: solarToLunar, lunarName: lunarName, resolveBirth: resolveBirth,
    bazi: bazi, shishen: shishen, hehun: hehun, qimen: qimen, qimenFocus: qimenFocus,
    degreeInfo: degreeInfo, periodOf: periodOf, yearStar: yearStar, flyingStars: flyingStars, mingGua: mingGua, bazhai: bazhai, lichunYear: lichunYear,
    newSeed: newSeed, parseSeed: parseSeed, drawTarot: drawTarot, slotOfHour: slotOfHour, selfTest: selfTest
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.XinsuEngines = api;
})(typeof window !== 'undefined' ? window : globalThis);

