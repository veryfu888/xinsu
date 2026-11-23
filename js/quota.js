/* 心訴 — 各術數每日次數（本機計算，依台北時間換日） */
(function (root) {
  'use strict';
  var KEY = 'xinsu.v1.quota', DAILY = 2;
  var BLOCK = '今天這項已問過兩次，明天再來。';
  var mem = {};

  function sget(k) { try { return root.localStorage.getItem(k); } catch (e) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; } }
  function sset(k, v) { try { root.localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayStr() {
    var L = root.LiuYao, E = root.XinsuEngines, t;
    if (L && typeof L.taipeiNow === 'function') {
      t = L.taipeiNow();
      return L.fmtDate(t.y, t.m, t.d);
    }
    if (E && typeof E.taipeiNow === 'function') {
      t = E.taipeiNow();
      return E.fmtD(t.y, t.m, t.d);
    }
    var d = new Date(Date.now() + 8 * 3600000);
    return d.getUTCFullYear() + '/' + pad(d.getUTCMonth() + 1) + '/' + pad(d.getUTCDate());
  }

  function empty(date) { return { date: date, used: {} }; }

  function load(storeGet) {
    var get = storeGet || sget, today = todayStr(), raw;
    try { raw = JSON.parse(get(KEY) || 'null'); } catch (e) { raw = null; }
    if (!raw || raw.date !== today) return empty(today);
    if (typeof raw.used === 'number') return { date: today, used: { liuyao: raw.used | 0 } };
    if (!raw.used || typeof raw.used !== 'object' || Array.isArray(raw.used)) return empty(today);
    return { date: today, used: raw.used };
  }

  function save(st, storeSet) { (storeSet || sset)(KEY, JSON.stringify(st)); }

  function usedOf(method, st) { return (st.used[method] | 0); }

  function remaining(method) {
    return Math.max(0, DAILY - usedOf(method, load()));
  }

  function consume(method) {
    var st = load();
    st.used[method] = Math.min(DAILY, usedOf(method, st) + 1);
    save(st);
    return remaining(method);
  }

  function paint(method, pill, msg, btn) {
    var n = remaining(method);
    if (pill) {
      pill.textContent = '今日剩餘 ' + n + ' 次';
      pill.className = 'pill' + (n === 0 ? ' zero' : '');
    }
    if (msg) {
      msg.hidden = n > 0;
      msg.textContent = n > 0 ? '' : BLOCK;
    }
    if (btn) {
      if (!btn.getAttribute('data-label')) btn.setAttribute('data-label', btn.textContent);
      // 不禁用按鈕：次數用完仍可送出，才能先走 1925 關懷流程
      if (btn.getAttribute('data-busy') !== '1') {
        btn.disabled = false;
        btn.textContent = n === 0 ? '今天這項已問過兩次' : btn.getAttribute('data-label');
      }
    }
  }

  function selfTest() {
    var bag = {}, out = [];
    function get(k) { return Object.prototype.hasOwnProperty.call(bag, k) ? bag[k] : null; }
    function set(k, v) { bag[k] = v; }
    function rem(m) { return Math.max(0, DAILY - usedOf(m, load(get))); }
    function eat(m) {
      var st = load(get);
      st.used[m] = Math.min(DAILY, usedOf(m, st) + 1);
      save(st, set);
      return rem(m);
    }
    function eq(name, got, exp) {
      var ok = JSON.stringify(got) === JSON.stringify(exp);
      out.push({ name: name, pass: ok, detail: ok ? '' : '得到 ' + JSON.stringify(got) + '，期望 ' + JSON.stringify(exp) });
    }
    eq('新的一天，六爻剩 2 次', rem('liuyao'), 2);
    eq('新的一天，八字也剩 2 次', rem('bazi'), 2);
    eq('六爻用一次後剩 1', eat('liuyao'), 1);
    eq('六爻用一次後，八字仍為 2', rem('bazi'), 2);
    eq('六爻再用一次後剩 0', eat('liuyao'), 0);
    eq('已用完再記一次仍為 0', eat('liuyao'), 0);
    eq('塔羅尚未使用，仍為 2', rem('tarot'), 2);
    // 舊版全域數字格式，只視為六爻
    set(KEY, JSON.stringify({ date: todayStr(), used: 1 }));
    eq('舊版紀錄遷移：六爻剩 1', rem('liuyao'), 1);
    eq('舊版紀錄遷移：紫微仍為 2', rem('ziwei'), 2);
    // 換日重置
    set(KEY, JSON.stringify({ date: '1999/01/01', used: { liuyao: 2, bazi: 2 } }));
    eq('隔日重置為 2', rem('liuyao'), 2);
    eq('隔日其他術數也重置', rem('bazi'), 2);
    eq('提示文字', BLOCK, '今天這項已問過兩次，明天再來。');
    return out;
  }

  root.XinsuQuota = {
    KEY: KEY,
    DAILY: DAILY,
    BLOCK: BLOCK,
    todayStr: todayStr,
    remaining: remaining,
    consume: consume,
    paint: paint,
    selfTest: selfTest
  };
})(typeof window !== 'undefined' ? window : globalThis);
