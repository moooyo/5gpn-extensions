// SPDX-License-Identifier: GPL-3.0-only
// Deterministic native build from bilibili-cleaner/source.
"use strict";
(() => {
  // node_modules/fflate/esm/browser.js
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
      b[i] = start += 1 << eb[i - 1];
    }
    var r = new i32(b[30]);
    for (var i = 1; i < 30; ++i) {
      for (var j = b[i]; j < b[i + 1]; ++j) {
        r[j] = j - b[i] << 5 | i;
      }
    }
    return { b, r };
  };
  var _a = freb(fleb, 2);
  var fl = _a.b;
  var revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b.b;
  var revfd = _b.r;
  var rev = new u16(32768);
  for (i = 0; i < 32768; ++i) {
    x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var x;
  var i;
  var hMap = function(cd, mb, r) {
    var s = cd.length;
    var i = 0;
    var l = new u16(mb);
    for (; i < s; ++i) {
      if (cd[i])
        ++l[cd[i] - 1];
    }
    var le = new u16(mb);
    for (i = 1; i < mb; ++i) {
      le[i] = le[i - 1] + l[i - 1] << 1;
    }
    var co;
    if (r) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i = 0; i < s; ++i) {
        if (cd[i]) {
          var sv = i << 4 | cd[i];
          var r_1 = mb - cd[i];
          var v = le[cd[i] - 1]++ << r_1;
          for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
            co[rev[v] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i = 0; i < s; ++i) {
        if (cd[i]) {
          co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
        }
      }
    }
    return co;
  };
  var flt = new u8(288);
  for (i = 0; i < 144; ++i)
    flt[i] = 8;
  var i;
  for (i = 144; i < 256; ++i)
    flt[i] = 9;
  var i;
  for (i = 256; i < 280; ++i)
    flt[i] = 7;
  var i;
  for (i = 280; i < 288; ++i)
    flt[i] = 8;
  var i;
  var fdt = new u8(32);
  for (i = 0; i < 32; ++i)
    fdt[i] = 5;
  var i;
  var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
  var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
  var max = function(a) {
    var m = a[0];
    for (var i = 1; i < a.length; ++i) {
      if (a[i] > m)
        m = a[i];
    }
    return m;
  };
  var bits = function(d, p, m) {
    var o = p / 8 | 0;
    return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
  };
  var bits16 = function(d, p) {
    var o = p / 8 | 0;
    return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
  };
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v, s, e) {
    if (s == null || s < 0)
      s = 0;
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
    // determined by unknown compression method
  ];
  var err = function(ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e, err);
    if (!nt)
      throw e;
    return e;
  };
  var inflt = function(dat, st, buf, dict) {
    var sl = dat.length, dl = dict ? dict.length : 0;
    if (!sl || st.f && !st.l)
      return buf || new u8(0);
    var noBuf = !buf;
    var resize = noBuf || st.i != 2;
    var noSt = st.i;
    if (noBuf)
      buf = new u8(sl * 3);
    var cbuf = function(l2) {
      var bl = buf.length;
      if (l2 > bl) {
        var nbuf = new u8(Math.max(bl * 2, l2));
        nbuf.set(buf);
        buf = nbuf;
      }
    };
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    var tbts = sl * 8;
    do {
      if (!lm) {
        final = bits(dat, pos, 1);
        var type = bits(dat, pos + 1, 3);
        pos += 3;
        if (!type) {
          var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
          if (t > sl) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + l);
          buf.set(dat.subarray(s, t), bt);
          st.b = bt += l, st.p = pos = t * 8, st.f = final;
          continue;
        } else if (type == 1)
          lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
        else if (type == 2) {
          var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
          var tl = hLit + bits(dat, pos + 5, 31) + 1;
          pos += 14;
          var ldt = new u8(tl);
          var clt = new u8(19);
          for (var i = 0; i < hcLen; ++i) {
            clt[clim[i]] = bits(dat, pos + i * 3, 7);
          }
          pos += hcLen * 3;
          var clb = max(clt), clbmsk = (1 << clb) - 1;
          var clm = hMap(clt, clb, 1);
          for (var i = 0; i < tl; ) {
            var r = clm[bits(dat, pos, clbmsk)];
            pos += r & 15;
            var s = r >> 4;
            if (s < 16) {
              ldt[i++] = s;
            } else {
              var c = 0, n = 0;
              if (s == 16)
                n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
              else if (s == 17)
                n = 3 + bits(dat, pos, 7), pos += 3;
              else if (s == 18)
                n = 11 + bits(dat, pos, 127), pos += 7;
              while (n--)
                ldt[i++] = c;
            }
          }
          var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
          lbt = max(lt);
          dbt = max(dt);
          lm = hMap(lt, lbt, 1);
          dm = hMap(dt, dbt, 1);
        } else
          err(1);
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
      }
      if (resize)
        cbuf(bt + 131072);
      var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
      var lpos = pos;
      for (; ; lpos = pos) {
        var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
        pos += c & 15;
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (!c)
          err(2);
        if (sym < 256)
          buf[bt++] = sym;
        else if (sym == 256) {
          lpos = pos, lm = null;
          break;
        } else {
          var add = sym - 254;
          if (sym > 264) {
            var i = sym - 257, b = fleb[i];
            add = bits(dat, pos, (1 << b) - 1) + fl[i];
            pos += b;
          }
          var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
          if (!d)
            err(3);
          pos += d & 15;
          var dt = fd[dsym];
          if (dsym > 3) {
            var b = fdeb[dsym];
            dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
          }
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + 131072);
          var end = bt + add;
          if (bt < dt) {
            var shift = dl - dt, dend = Math.min(dt, end);
            if (shift + bt < 0)
              err(3);
            for (; bt < dend; ++bt)
              buf[bt] = dict[shift + bt];
          }
          for (; bt < end; ++bt)
            buf[bt] = buf[bt - dt];
        }
      }
      st.l = lm, st.p = lpos, st.b = bt, st.f = final;
      if (lm)
        final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
  };
  var et = /* @__PURE__ */ new u8(0);
  var gzs = function(d) {
    if (d[0] != 31 || d[1] != 139 || d[2] != 8)
      err(6, "invalid gzip data");
    var flg = d[3];
    var st = 10;
    if (flg & 4)
      st += (d[10] | d[11] << 8) + 2;
    for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++])
      ;
    return st + (flg & 2);
  };
  var Inflate = /* @__PURE__ */ function() {
    function Inflate2(opts, cb) {
      if (typeof opts == "function")
        cb = opts, opts = {};
      this.ondata = cb;
      var dict = opts && opts.dictionary && opts.dictionary.subarray(-32768);
      this.s = { i: 0, b: dict ? dict.length : 0 };
      this.o = new u8(32768);
      this.p = new u8(0);
      if (dict)
        this.o.set(dict);
    }
    Inflate2.prototype.e = function(c) {
      if (!this.ondata)
        err(5);
      if (this.d)
        err(4);
      if (!this.p.length)
        this.p = c;
      else if (c.length) {
        var n = new u8(this.p.length + c.length);
        n.set(this.p), n.set(c, this.p.length), this.p = n;
      }
    };
    Inflate2.prototype.c = function(final) {
      this.s.i = +(this.d = final || false);
      var bts = this.s.b;
      var dt = inflt(this.p, this.s, this.o);
      this.ondata(slc(dt, bts, this.s.b), this.d);
      this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
      this.p = slc(this.p, this.s.p / 8 | 0), this.s.p &= 7;
    };
    Inflate2.prototype.push = function(chunk, final) {
      this.e(chunk), this.c(final);
    };
    return Inflate2;
  }();
  var Gunzip = /* @__PURE__ */ function() {
    function Gunzip2(opts, cb) {
      this.v = 1;
      this.r = 0;
      Inflate.call(this, opts, cb);
    }
    Gunzip2.prototype.push = function(chunk, final) {
      Inflate.prototype.e.call(this, chunk);
      this.r += chunk.length;
      if (this.v) {
        var p = this.p.subarray(this.v - 1);
        var s = p.length > 3 ? gzs(p) : 4;
        if (s > p.length) {
          if (!final)
            return;
        } else if (this.v > 1 && this.onmember) {
          this.onmember(this.r - p.length);
        }
        this.p = p.subarray(s), this.v = 0;
      }
      Inflate.prototype.c.call(this, final);
      if (this.s.f && !this.s.l && !final) {
        this.v = shft(this.s.p) + 9;
        this.s = { i: 0 };
        this.o = new u8(0);
        this.push(new u8(0), final);
      }
    };
    return Gunzip2;
  }();
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/json-typings.js
  function typeofJsonValue(value) {
    let t = typeof value;
    if (t == "object") {
      if (Array.isArray(value))
        return "array";
      if (value === null)
        return "null";
    }
    return t;
  }
  function isJsonObject(value) {
    return value !== null && typeof value == "object" && !Array.isArray(value);
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/base64.js
  var encTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
  var decTable = [];
  for (let i = 0; i < encTable.length; i++)
    decTable[encTable[i].charCodeAt(0)] = i;
  decTable["-".charCodeAt(0)] = encTable.indexOf("+");
  decTable["_".charCodeAt(0)] = encTable.indexOf("/");
  function base64decode(base64Str) {
    let es = base64Str.length * 3 / 4;
    if (base64Str[base64Str.length - 2] == "=")
      es -= 2;
    else if (base64Str[base64Str.length - 1] == "=")
      es -= 1;
    let bytes = new Uint8Array(es), bytePos = 0, groupPos = 0, b, p = 0;
    for (let i = 0; i < base64Str.length; i++) {
      b = decTable[base64Str.charCodeAt(i)];
      if (b === void 0) {
        switch (base64Str[i]) {
          case "=":
            groupPos = 0;
          // reset state when padding found
          case "\n":
          case "\r":
          case "	":
          case " ":
            continue;
          // skip white-space, and padding
          default:
            throw Error(`invalid base64 string.`);
        }
      }
      switch (groupPos) {
        case 0:
          p = b;
          groupPos = 1;
          break;
        case 1:
          bytes[bytePos++] = p << 2 | (b & 48) >> 4;
          p = b;
          groupPos = 2;
          break;
        case 2:
          bytes[bytePos++] = (p & 15) << 4 | (b & 60) >> 2;
          p = b;
          groupPos = 3;
          break;
        case 3:
          bytes[bytePos++] = (p & 3) << 6 | b;
          groupPos = 0;
          break;
      }
    }
    if (groupPos == 1)
      throw Error(`invalid base64 string.`);
    return bytes.subarray(0, bytePos);
  }
  function base64encode(bytes) {
    let base64 = "", groupPos = 0, b, p = 0;
    for (let i = 0; i < bytes.length; i++) {
      b = bytes[i];
      switch (groupPos) {
        case 0:
          base64 += encTable[b >> 2];
          p = (b & 3) << 4;
          groupPos = 1;
          break;
        case 1:
          base64 += encTable[p | b >> 4];
          p = (b & 15) << 2;
          groupPos = 2;
          break;
        case 2:
          base64 += encTable[p | b >> 6];
          base64 += encTable[b & 63];
          groupPos = 0;
          break;
      }
    }
    if (groupPos) {
      base64 += encTable[p];
      base64 += "=";
      if (groupPos == 1)
        base64 += "=";
    }
    return base64;
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/binary-format-contract.js
  var UnknownFieldHandler;
  (function(UnknownFieldHandler2) {
    UnknownFieldHandler2.symbol = Symbol.for("protobuf-ts/unknown");
    UnknownFieldHandler2.onRead = (typeName, message, fieldNo, wireType, data) => {
      let container = is(message) ? message[UnknownFieldHandler2.symbol] : message[UnknownFieldHandler2.symbol] = [];
      container.push({ no: fieldNo, wireType, data });
    };
    UnknownFieldHandler2.onWrite = (typeName, message, writer) => {
      for (let { no, wireType, data } of UnknownFieldHandler2.list(message))
        writer.tag(no, wireType).raw(data);
    };
    UnknownFieldHandler2.list = (message, fieldNo) => {
      if (is(message)) {
        let all = message[UnknownFieldHandler2.symbol];
        return fieldNo ? all.filter((uf) => uf.no == fieldNo) : all;
      }
      return [];
    };
    UnknownFieldHandler2.last = (message, fieldNo) => UnknownFieldHandler2.list(message, fieldNo).slice(-1)[0];
    const is = (message) => message && Array.isArray(message[UnknownFieldHandler2.symbol]);
  })(UnknownFieldHandler || (UnknownFieldHandler = {}));
  var WireType;
  (function(WireType2) {
    WireType2[WireType2["Varint"] = 0] = "Varint";
    WireType2[WireType2["Bit64"] = 1] = "Bit64";
    WireType2[WireType2["LengthDelimited"] = 2] = "LengthDelimited";
    WireType2[WireType2["StartGroup"] = 3] = "StartGroup";
    WireType2[WireType2["EndGroup"] = 4] = "EndGroup";
    WireType2[WireType2["Bit32"] = 5] = "Bit32";
  })(WireType || (WireType = {}));

  // node_modules/@protobuf-ts/runtime/build/es2015/goog-varint.js
  function varint64read() {
    let lowBits = 0;
    let highBits = 0;
    for (let shift = 0; shift < 28; shift += 7) {
      let b = this.buf[this.pos++];
      lowBits |= (b & 127) << shift;
      if ((b & 128) == 0) {
        this.assertBounds();
        return [lowBits, highBits];
      }
    }
    let middleByte = this.buf[this.pos++];
    lowBits |= (middleByte & 15) << 28;
    highBits = (middleByte & 112) >> 4;
    if ((middleByte & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
    for (let shift = 3; shift <= 31; shift += 7) {
      let b = this.buf[this.pos++];
      highBits |= (b & 127) << shift;
      if ((b & 128) == 0) {
        this.assertBounds();
        return [lowBits, highBits];
      }
    }
    throw new Error("invalid varint");
  }
  function varint64write(lo, hi, bytes) {
    for (let i = 0; i < 28; i = i + 7) {
      const shift = lo >>> i;
      const hasNext = !(shift >>> 7 == 0 && hi == 0);
      const byte = (hasNext ? shift | 128 : shift) & 255;
      bytes.push(byte);
      if (!hasNext) {
        return;
      }
    }
    const splitBits = lo >>> 28 & 15 | (hi & 7) << 4;
    const hasMoreBits = !(hi >> 3 == 0);
    bytes.push((hasMoreBits ? splitBits | 128 : splitBits) & 255);
    if (!hasMoreBits) {
      return;
    }
    for (let i = 3; i < 31; i = i + 7) {
      const shift = hi >>> i;
      const hasNext = !(shift >>> 7 == 0);
      const byte = (hasNext ? shift | 128 : shift) & 255;
      bytes.push(byte);
      if (!hasNext) {
        return;
      }
    }
    bytes.push(hi >>> 31 & 1);
  }
  var TWO_PWR_32_DBL = (1 << 16) * (1 << 16);
  function int64fromString(dec) {
    let minus = dec[0] == "-";
    if (minus)
      dec = dec.slice(1);
    const base = 1e6;
    let lowBits = 0;
    let highBits = 0;
    function add1e6digit(begin, end) {
      const digit1e6 = Number(dec.slice(begin, end));
      highBits *= base;
      lowBits = lowBits * base + digit1e6;
      if (lowBits >= TWO_PWR_32_DBL) {
        highBits = highBits + (lowBits / TWO_PWR_32_DBL | 0);
        lowBits = lowBits % TWO_PWR_32_DBL;
      }
    }
    add1e6digit(-24, -18);
    add1e6digit(-18, -12);
    add1e6digit(-12, -6);
    add1e6digit(-6);
    return [minus, lowBits, highBits];
  }
  function int64toString(bitsLow, bitsHigh) {
    if (bitsHigh >>> 0 <= 2097151) {
      return "" + (TWO_PWR_32_DBL * bitsHigh + (bitsLow >>> 0));
    }
    let low = bitsLow & 16777215;
    let mid = (bitsLow >>> 24 | bitsHigh << 8) >>> 0 & 16777215;
    let high = bitsHigh >> 16 & 65535;
    let digitA = low + mid * 6777216 + high * 6710656;
    let digitB = mid + high * 8147497;
    let digitC = high * 2;
    let base = 1e7;
    if (digitA >= base) {
      digitB += Math.floor(digitA / base);
      digitA %= base;
    }
    if (digitB >= base) {
      digitC += Math.floor(digitB / base);
      digitB %= base;
    }
    function decimalFrom1e7(digit1e7, needLeadingZeros) {
      let partial = digit1e7 ? String(digit1e7) : "";
      if (needLeadingZeros) {
        return "0000000".slice(partial.length) + partial;
      }
      return partial;
    }
    return decimalFrom1e7(
      digitC,
      /*needLeadingZeros=*/
      0
    ) + decimalFrom1e7(
      digitB,
      /*needLeadingZeros=*/
      digitC
    ) + // If the final 1e7 digit didn't need leading zeros, we would have
    // returned via the trivial code path at the top.
    decimalFrom1e7(
      digitA,
      /*needLeadingZeros=*/
      1
    );
  }
  function varint32write(value, bytes) {
    if (value >= 0) {
      while (value > 127) {
        bytes.push(value & 127 | 128);
        value = value >>> 7;
      }
      bytes.push(value);
    } else {
      for (let i = 0; i < 9; i++) {
        bytes.push(value & 127 | 128);
        value = value >> 7;
      }
      bytes.push(1);
    }
  }
  function varint32read() {
    let b = this.buf[this.pos++];
    let result = b & 127;
    if ((b & 128) == 0) {
      this.assertBounds();
      return result;
    }
    b = this.buf[this.pos++];
    result |= (b & 127) << 7;
    if ((b & 128) == 0) {
      this.assertBounds();
      return result;
    }
    b = this.buf[this.pos++];
    result |= (b & 127) << 14;
    if ((b & 128) == 0) {
      this.assertBounds();
      return result;
    }
    b = this.buf[this.pos++];
    result |= (b & 127) << 21;
    if ((b & 128) == 0) {
      this.assertBounds();
      return result;
    }
    b = this.buf[this.pos++];
    result |= (b & 15) << 28;
    for (let readBytes = 5; (b & 128) !== 0 && readBytes < 10; readBytes++)
      b = this.buf[this.pos++];
    if ((b & 128) != 0)
      throw new Error("invalid varint");
    this.assertBounds();
    return result >>> 0;
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/pb-long.js
  var BI;
  function detectBi() {
    const dv = new DataView(new ArrayBuffer(8));
    const ok = globalThis.BigInt !== void 0 && typeof dv.getBigInt64 === "function" && typeof dv.getBigUint64 === "function" && typeof dv.setBigInt64 === "function" && typeof dv.setBigUint64 === "function";
    BI = ok ? {
      MIN: BigInt("-9223372036854775808"),
      MAX: BigInt("9223372036854775807"),
      UMIN: BigInt("0"),
      UMAX: BigInt("18446744073709551615"),
      C: BigInt,
      V: dv
    } : void 0;
  }
  detectBi();
  function assertBi(bi) {
    if (!bi)
      throw new Error("BigInt unavailable, see https://github.com/timostamm/protobuf-ts/blob/v1.0.8/MANUAL.md#bigint-support");
  }
  var RE_DECIMAL_STR = /^-?[0-9]+$/;
  var TWO_PWR_32_DBL2 = 4294967296;
  var HALF_2_PWR_32 = 2147483648;
  var SharedPbLong = class {
    /**
     * Create a new instance with the given bits.
     */
    constructor(lo, hi) {
      this.lo = lo | 0;
      this.hi = hi | 0;
    }
    /**
     * Is this instance equal to 0?
     */
    isZero() {
      return this.lo == 0 && this.hi == 0;
    }
    /**
     * Convert to a native number.
     */
    toNumber() {
      let result = this.hi * TWO_PWR_32_DBL2 + (this.lo >>> 0);
      if (!Number.isSafeInteger(result))
        throw new Error("cannot convert to safe number");
      return result;
    }
  };
  var PbULong = class _PbULong extends SharedPbLong {
    /**
     * Create instance from a `string`, `number` or `bigint`.
     */
    static from(value) {
      if (BI)
        switch (typeof value) {
          case "string":
            if (value == "0")
              return this.ZERO;
            if (value == "")
              throw new Error("string is no integer");
            value = BI.C(value);
          case "number":
            if (value === 0)
              return this.ZERO;
            value = BI.C(value);
          case "bigint":
            if (!value)
              return this.ZERO;
            if (value < BI.UMIN)
              throw new Error("signed value for ulong");
            if (value > BI.UMAX)
              throw new Error("ulong too large");
            BI.V.setBigUint64(0, value, true);
            return new _PbULong(BI.V.getInt32(0, true), BI.V.getInt32(4, true));
        }
      else
        switch (typeof value) {
          case "string":
            if (value == "0")
              return this.ZERO;
            value = value.trim();
            if (!RE_DECIMAL_STR.test(value))
              throw new Error("string is no integer");
            let [minus, lo, hi] = int64fromString(value);
            if (minus)
              throw new Error("signed value for ulong");
            return new _PbULong(lo, hi);
          case "number":
            if (value == 0)
              return this.ZERO;
            if (!Number.isSafeInteger(value))
              throw new Error("number is no integer");
            if (value < 0)
              throw new Error("signed value for ulong");
            return new _PbULong(value, value / TWO_PWR_32_DBL2);
        }
      throw new Error("unknown value " + typeof value);
    }
    /**
     * Convert to decimal string.
     */
    toString() {
      return BI ? this.toBigInt().toString() : int64toString(this.lo, this.hi);
    }
    /**
     * Convert to native bigint.
     */
    toBigInt() {
      assertBi(BI);
      BI.V.setInt32(0, this.lo, true);
      BI.V.setInt32(4, this.hi, true);
      return BI.V.getBigUint64(0, true);
    }
  };
  PbULong.ZERO = new PbULong(0, 0);
  var PbLong = class _PbLong extends SharedPbLong {
    /**
     * Create instance from a `string`, `number` or `bigint`.
     */
    static from(value) {
      if (BI)
        switch (typeof value) {
          case "string":
            if (value == "0")
              return this.ZERO;
            if (value == "")
              throw new Error("string is no integer");
            value = BI.C(value);
          case "number":
            if (value === 0)
              return this.ZERO;
            value = BI.C(value);
          case "bigint":
            if (!value)
              return this.ZERO;
            if (value < BI.MIN)
              throw new Error("signed long too small");
            if (value > BI.MAX)
              throw new Error("signed long too large");
            BI.V.setBigInt64(0, value, true);
            return new _PbLong(BI.V.getInt32(0, true), BI.V.getInt32(4, true));
        }
      else
        switch (typeof value) {
          case "string":
            if (value == "0")
              return this.ZERO;
            value = value.trim();
            if (!RE_DECIMAL_STR.test(value))
              throw new Error("string is no integer");
            let [minus, lo, hi] = int64fromString(value);
            if (minus) {
              if (hi > HALF_2_PWR_32 || hi == HALF_2_PWR_32 && lo != 0)
                throw new Error("signed long too small");
            } else if (hi >= HALF_2_PWR_32)
              throw new Error("signed long too large");
            let pbl = new _PbLong(lo, hi);
            return minus ? pbl.negate() : pbl;
          case "number":
            if (value == 0)
              return this.ZERO;
            if (!Number.isSafeInteger(value))
              throw new Error("number is no integer");
            return value > 0 ? new _PbLong(value, value / TWO_PWR_32_DBL2) : new _PbLong(-value, -value / TWO_PWR_32_DBL2).negate();
        }
      throw new Error("unknown value " + typeof value);
    }
    /**
     * Do we have a minus sign?
     */
    isNegative() {
      return (this.hi & HALF_2_PWR_32) !== 0;
    }
    /**
     * Negate two's complement.
     * Invert all the bits and add one to the result.
     */
    negate() {
      let hi = ~this.hi, lo = this.lo;
      if (lo)
        lo = ~lo + 1;
      else
        hi += 1;
      return new _PbLong(lo, hi);
    }
    /**
     * Convert to decimal string.
     */
    toString() {
      if (BI)
        return this.toBigInt().toString();
      if (this.isNegative()) {
        let n = this.negate();
        return "-" + int64toString(n.lo, n.hi);
      }
      return int64toString(this.lo, this.hi);
    }
    /**
     * Convert to native bigint.
     */
    toBigInt() {
      assertBi(BI);
      BI.V.setInt32(0, this.lo, true);
      BI.V.setInt32(4, this.hi, true);
      return BI.V.getBigInt64(0, true);
    }
  };
  PbLong.ZERO = new PbLong(0, 0);

  // node_modules/@protobuf-ts/runtime/build/es2015/binary-reader.js
  var defaultsRead = {
    readUnknownField: true,
    readerFactory: (bytes) => new BinaryReader(bytes)
  };
  function binaryReadOptions(options) {
    return options ? Object.assign(Object.assign({}, defaultsRead), options) : defaultsRead;
  }
  var BinaryReader = class {
    constructor(buf, textDecoder) {
      this.varint64 = varint64read;
      this.uint32 = varint32read;
      this.buf = buf;
      this.len = buf.length;
      this.pos = 0;
      this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      this.textDecoder = textDecoder !== null && textDecoder !== void 0 ? textDecoder : new TextDecoder("utf-8", {
        fatal: true,
        ignoreBOM: true
      });
    }
    /**
     * Reads a tag - field number and wire type.
     */
    tag() {
      let tag = this.uint32(), fieldNo = tag >>> 3, wireType = tag & 7;
      if (fieldNo <= 0 || wireType < 0 || wireType > 5)
        throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
      return [fieldNo, wireType];
    }
    /**
     * Skip one element on the wire and return the skipped data.
     * Supports WireType.StartGroup since v2.0.0-alpha.23.
     */
    skip(wireType) {
      let start = this.pos;
      switch (wireType) {
        case WireType.Varint:
          while (this.buf[this.pos++] & 128) {
          }
          break;
        case WireType.Bit64:
          this.pos += 4;
        case WireType.Bit32:
          this.pos += 4;
          break;
        case WireType.LengthDelimited:
          let len = this.uint32();
          this.pos += len;
          break;
        case WireType.StartGroup:
          let t;
          while ((t = this.tag()[1]) !== WireType.EndGroup) {
            this.skip(t);
          }
          break;
        default:
          throw new Error("cant skip wire type " + wireType);
      }
      this.assertBounds();
      return this.buf.subarray(start, this.pos);
    }
    /**
     * Throws error if position in byte array is out of range.
     */
    assertBounds() {
      if (this.pos > this.len)
        throw new RangeError("premature EOF");
    }
    /**
     * Read a `int32` field, a signed 32 bit varint.
     */
    int32() {
      return this.uint32() | 0;
    }
    /**
     * Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
     */
    sint32() {
      let zze = this.uint32();
      return zze >>> 1 ^ -(zze & 1);
    }
    /**
     * Read a `int64` field, a signed 64-bit varint.
     */
    int64() {
      return new PbLong(...this.varint64());
    }
    /**
     * Read a `uint64` field, an unsigned 64-bit varint.
     */
    uint64() {
      return new PbULong(...this.varint64());
    }
    /**
     * Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
     */
    sint64() {
      let [lo, hi] = this.varint64();
      let s = -(lo & 1);
      lo = (lo >>> 1 | (hi & 1) << 31) ^ s;
      hi = hi >>> 1 ^ s;
      return new PbLong(lo, hi);
    }
    /**
     * Read a `bool` field, a variant.
     */
    bool() {
      let [lo, hi] = this.varint64();
      return lo !== 0 || hi !== 0;
    }
    /**
     * Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
     */
    fixed32() {
      return this.view.getUint32((this.pos += 4) - 4, true);
    }
    /**
     * Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
     */
    sfixed32() {
      return this.view.getInt32((this.pos += 4) - 4, true);
    }
    /**
     * Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
     */
    fixed64() {
      return new PbULong(this.sfixed32(), this.sfixed32());
    }
    /**
     * Read a `fixed64` field, a signed, fixed-length 64-bit integer.
     */
    sfixed64() {
      return new PbLong(this.sfixed32(), this.sfixed32());
    }
    /**
     * Read a `float` field, 32-bit floating point number.
     */
    float() {
      return this.view.getFloat32((this.pos += 4) - 4, true);
    }
    /**
     * Read a `double` field, a 64-bit floating point number.
     */
    double() {
      return this.view.getFloat64((this.pos += 8) - 8, true);
    }
    /**
     * Read a `bytes` field, length-delimited arbitrary data.
     */
    bytes() {
      let len = this.uint32();
      let start = this.pos;
      this.pos += len;
      this.assertBounds();
      return this.buf.subarray(start, start + len);
    }
    /**
     * Read a `string` field, length-delimited data converted to UTF-8 text.
     */
    string() {
      return this.textDecoder.decode(this.bytes());
    }
  };

  // node_modules/@protobuf-ts/runtime/build/es2015/assert.js
  function assert(condition, msg) {
    if (!condition) {
      throw new Error(msg);
    }
  }
  var FLOAT32_MAX = 34028234663852886e22;
  var FLOAT32_MIN = -34028234663852886e22;
  var UINT32_MAX = 4294967295;
  var INT32_MAX = 2147483647;
  var INT32_MIN = -2147483648;
  function assertInt32(arg) {
    if (typeof arg !== "number")
      throw new Error("invalid int 32: " + typeof arg);
    if (!Number.isInteger(arg) || arg > INT32_MAX || arg < INT32_MIN)
      throw new Error("invalid int 32: " + arg);
  }
  function assertUInt32(arg) {
    if (typeof arg !== "number")
      throw new Error("invalid uint 32: " + typeof arg);
    if (!Number.isInteger(arg) || arg > UINT32_MAX || arg < 0)
      throw new Error("invalid uint 32: " + arg);
  }
  function assertFloat32(arg) {
    if (typeof arg !== "number")
      throw new Error("invalid float 32: " + typeof arg);
    if (!Number.isFinite(arg))
      return;
    if (arg > FLOAT32_MAX || arg < FLOAT32_MIN)
      throw new Error("invalid float 32: " + arg);
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/binary-writer.js
  var defaultsWrite = {
    writeUnknownFields: true,
    writerFactory: () => new BinaryWriter()
  };
  function binaryWriteOptions(options) {
    return options ? Object.assign(Object.assign({}, defaultsWrite), options) : defaultsWrite;
  }
  var BinaryWriter = class {
    constructor(textEncoder) {
      this.stack = [];
      this.textEncoder = textEncoder !== null && textEncoder !== void 0 ? textEncoder : new TextEncoder();
      this.chunks = [];
      this.buf = [];
    }
    /**
     * Return all bytes written and reset this writer.
     */
    finish() {
      this.chunks.push(new Uint8Array(this.buf));
      let len = 0;
      for (let i = 0; i < this.chunks.length; i++)
        len += this.chunks[i].length;
      let bytes = new Uint8Array(len);
      let offset = 0;
      for (let i = 0; i < this.chunks.length; i++) {
        bytes.set(this.chunks[i], offset);
        offset += this.chunks[i].length;
      }
      this.chunks = [];
      return bytes;
    }
    /**
     * Start a new fork for length-delimited data like a message
     * or a packed repeated field.
     *
     * Must be joined later with `join()`.
     */
    fork() {
      this.stack.push({ chunks: this.chunks, buf: this.buf });
      this.chunks = [];
      this.buf = [];
      return this;
    }
    /**
     * Join the last fork. Write its length and bytes, then
     * return to the previous state.
     */
    join() {
      let chunk = this.finish();
      let prev = this.stack.pop();
      if (!prev)
        throw new Error("invalid state, fork stack empty");
      this.chunks = prev.chunks;
      this.buf = prev.buf;
      this.uint32(chunk.byteLength);
      return this.raw(chunk);
    }
    /**
     * Writes a tag (field number and wire type).
     *
     * Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
     *
     * Generated code should compute the tag ahead of time and call `uint32()`.
     */
    tag(fieldNo, type) {
      return this.uint32((fieldNo << 3 | type) >>> 0);
    }
    /**
     * Write a chunk of raw bytes.
     */
    raw(chunk) {
      if (this.buf.length) {
        this.chunks.push(new Uint8Array(this.buf));
        this.buf = [];
      }
      this.chunks.push(chunk);
      return this;
    }
    /**
     * Write a `uint32` value, an unsigned 32 bit varint.
     */
    uint32(value) {
      assertUInt32(value);
      while (value > 127) {
        this.buf.push(value & 127 | 128);
        value = value >>> 7;
      }
      this.buf.push(value);
      return this;
    }
    /**
     * Write a `int32` value, a signed 32 bit varint.
     */
    int32(value) {
      assertInt32(value);
      varint32write(value, this.buf);
      return this;
    }
    /**
     * Write a `bool` value, a variant.
     */
    bool(value) {
      this.buf.push(value ? 1 : 0);
      return this;
    }
    /**
     * Write a `bytes` value, length-delimited arbitrary data.
     */
    bytes(value) {
      this.uint32(value.byteLength);
      return this.raw(value);
    }
    /**
     * Write a `string` value, length-delimited data converted to UTF-8 text.
     */
    string(value) {
      let chunk = this.textEncoder.encode(value);
      this.uint32(chunk.byteLength);
      return this.raw(chunk);
    }
    /**
     * Write a `float` value, 32-bit floating point number.
     */
    float(value) {
      assertFloat32(value);
      let chunk = new Uint8Array(4);
      new DataView(chunk.buffer).setFloat32(0, value, true);
      return this.raw(chunk);
    }
    /**
     * Write a `double` value, a 64-bit floating point number.
     */
    double(value) {
      let chunk = new Uint8Array(8);
      new DataView(chunk.buffer).setFloat64(0, value, true);
      return this.raw(chunk);
    }
    /**
     * Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
     */
    fixed32(value) {
      assertUInt32(value);
      let chunk = new Uint8Array(4);
      new DataView(chunk.buffer).setUint32(0, value, true);
      return this.raw(chunk);
    }
    /**
     * Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
     */
    sfixed32(value) {
      assertInt32(value);
      let chunk = new Uint8Array(4);
      new DataView(chunk.buffer).setInt32(0, value, true);
      return this.raw(chunk);
    }
    /**
     * Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
     */
    sint32(value) {
      assertInt32(value);
      value = (value << 1 ^ value >> 31) >>> 0;
      varint32write(value, this.buf);
      return this;
    }
    /**
     * Write a `fixed64` value, a signed, fixed-length 64-bit integer.
     */
    sfixed64(value) {
      let chunk = new Uint8Array(8);
      let view = new DataView(chunk.buffer);
      let long = PbLong.from(value);
      view.setInt32(0, long.lo, true);
      view.setInt32(4, long.hi, true);
      return this.raw(chunk);
    }
    /**
     * Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
     */
    fixed64(value) {
      let chunk = new Uint8Array(8);
      let view = new DataView(chunk.buffer);
      let long = PbULong.from(value);
      view.setInt32(0, long.lo, true);
      view.setInt32(4, long.hi, true);
      return this.raw(chunk);
    }
    /**
     * Write a `int64` value, a signed 64-bit varint.
     */
    int64(value) {
      let long = PbLong.from(value);
      varint64write(long.lo, long.hi, this.buf);
      return this;
    }
    /**
     * Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
     */
    sint64(value) {
      let long = PbLong.from(value), sign = long.hi >> 31, lo = long.lo << 1 ^ sign, hi = (long.hi << 1 | long.lo >>> 31) ^ sign;
      varint64write(lo, hi, this.buf);
      return this;
    }
    /**
     * Write a `uint64` value, an unsigned 64-bit varint.
     */
    uint64(value) {
      let long = PbULong.from(value);
      varint64write(long.lo, long.hi, this.buf);
      return this;
    }
  };

  // node_modules/@protobuf-ts/runtime/build/es2015/json-format-contract.js
  var defaultsWrite2 = {
    emitDefaultValues: false,
    enumAsInteger: false,
    useProtoFieldName: false,
    prettySpaces: 0
  };
  var defaultsRead2 = {
    ignoreUnknownFields: false
  };
  function jsonReadOptions(options) {
    return options ? Object.assign(Object.assign({}, defaultsRead2), options) : defaultsRead2;
  }
  function jsonWriteOptions(options) {
    return options ? Object.assign(Object.assign({}, defaultsWrite2), options) : defaultsWrite2;
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/message-type-contract.js
  var MESSAGE_TYPE = Symbol.for("protobuf-ts/message-type");

  // node_modules/@protobuf-ts/runtime/build/es2015/lower-camel-case.js
  function lowerCamelCase(snakeCase) {
    let capNext = false;
    const sb = [];
    for (let i = 0; i < snakeCase.length; i++) {
      let next = snakeCase.charAt(i);
      if (next == "_") {
        capNext = true;
      } else if (/\d/.test(next)) {
        sb.push(next);
        capNext = true;
      } else if (capNext) {
        sb.push(next.toUpperCase());
        capNext = false;
      } else if (i == 0) {
        sb.push(next.toLowerCase());
      } else {
        sb.push(next);
      }
    }
    return sb.join("");
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-info.js
  var ScalarType;
  (function(ScalarType2) {
    ScalarType2[ScalarType2["DOUBLE"] = 1] = "DOUBLE";
    ScalarType2[ScalarType2["FLOAT"] = 2] = "FLOAT";
    ScalarType2[ScalarType2["INT64"] = 3] = "INT64";
    ScalarType2[ScalarType2["UINT64"] = 4] = "UINT64";
    ScalarType2[ScalarType2["INT32"] = 5] = "INT32";
    ScalarType2[ScalarType2["FIXED64"] = 6] = "FIXED64";
    ScalarType2[ScalarType2["FIXED32"] = 7] = "FIXED32";
    ScalarType2[ScalarType2["BOOL"] = 8] = "BOOL";
    ScalarType2[ScalarType2["STRING"] = 9] = "STRING";
    ScalarType2[ScalarType2["BYTES"] = 12] = "BYTES";
    ScalarType2[ScalarType2["UINT32"] = 13] = "UINT32";
    ScalarType2[ScalarType2["SFIXED32"] = 15] = "SFIXED32";
    ScalarType2[ScalarType2["SFIXED64"] = 16] = "SFIXED64";
    ScalarType2[ScalarType2["SINT32"] = 17] = "SINT32";
    ScalarType2[ScalarType2["SINT64"] = 18] = "SINT64";
  })(ScalarType || (ScalarType = {}));
  var LongType;
  (function(LongType2) {
    LongType2[LongType2["BIGINT"] = 0] = "BIGINT";
    LongType2[LongType2["STRING"] = 1] = "STRING";
    LongType2[LongType2["NUMBER"] = 2] = "NUMBER";
  })(LongType || (LongType = {}));
  var RepeatType;
  (function(RepeatType2) {
    RepeatType2[RepeatType2["NO"] = 0] = "NO";
    RepeatType2[RepeatType2["PACKED"] = 1] = "PACKED";
    RepeatType2[RepeatType2["UNPACKED"] = 2] = "UNPACKED";
  })(RepeatType || (RepeatType = {}));
  function normalizeFieldInfo(field) {
    var _a2, _b2, _c, _d;
    field.localName = (_a2 = field.localName) !== null && _a2 !== void 0 ? _a2 : lowerCamelCase(field.name);
    field.jsonName = (_b2 = field.jsonName) !== null && _b2 !== void 0 ? _b2 : lowerCamelCase(field.name);
    field.repeat = (_c = field.repeat) !== null && _c !== void 0 ? _c : RepeatType.NO;
    field.opt = (_d = field.opt) !== null && _d !== void 0 ? _d : field.repeat ? false : field.oneof ? false : field.kind == "message";
    return field;
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/oneof.js
  function isOneofGroup(any) {
    if (typeof any != "object" || any === null || !any.hasOwnProperty("oneofKind")) {
      return false;
    }
    switch (typeof any.oneofKind) {
      case "string":
        if (any[any.oneofKind] === void 0)
          return false;
        return Object.keys(any).length == 2;
      case "undefined":
        return Object.keys(any).length == 1;
      default:
        return false;
    }
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-type-check.js
  var ReflectionTypeCheck = class {
    constructor(info) {
      var _a2;
      this.fields = (_a2 = info.fields) !== null && _a2 !== void 0 ? _a2 : [];
    }
    prepare() {
      if (this.data)
        return;
      const req = [], known = [], oneofs = [];
      for (let field of this.fields) {
        if (field.oneof) {
          if (!oneofs.includes(field.oneof)) {
            oneofs.push(field.oneof);
            req.push(field.oneof);
            known.push(field.oneof);
          }
        } else {
          known.push(field.localName);
          switch (field.kind) {
            case "scalar":
            case "enum":
              if (!field.opt || field.repeat)
                req.push(field.localName);
              break;
            case "message":
              if (field.repeat)
                req.push(field.localName);
              break;
            case "map":
              req.push(field.localName);
              break;
          }
        }
      }
      this.data = { req, known, oneofs: Object.values(oneofs) };
    }
    /**
     * Is the argument a valid message as specified by the
     * reflection information?
     *
     * Checks all field types recursively. The `depth`
     * specifies how deep into the structure the check will be.
     *
     * With a depth of 0, only the presence of fields
     * is checked.
     *
     * With a depth of 1 or more, the field types are checked.
     *
     * With a depth of 2 or more, the members of map, repeated
     * and message fields are checked.
     *
     * Message fields will be checked recursively with depth - 1.
     *
     * The number of map entries / repeated values being checked
     * is < depth.
     */
    is(message, depth, allowExcessProperties = false) {
      if (depth < 0)
        return true;
      if (message === null || message === void 0 || typeof message != "object")
        return false;
      this.prepare();
      let keys = Object.keys(message), data = this.data;
      if (keys.length < data.req.length || data.req.some((n) => !keys.includes(n)))
        return false;
      if (!allowExcessProperties) {
        if (keys.some((k) => !data.known.includes(k)))
          return false;
      }
      if (depth < 1) {
        return true;
      }
      for (const name of data.oneofs) {
        const group = message[name];
        if (!isOneofGroup(group))
          return false;
        if (group.oneofKind === void 0)
          continue;
        const field = this.fields.find((f) => f.localName === group.oneofKind);
        if (!field)
          return false;
        if (!this.field(group[group.oneofKind], field, allowExcessProperties, depth))
          return false;
      }
      for (const field of this.fields) {
        if (field.oneof !== void 0)
          continue;
        if (!this.field(message[field.localName], field, allowExcessProperties, depth))
          return false;
      }
      return true;
    }
    field(arg, field, allowExcessProperties, depth) {
      let repeated = field.repeat;
      switch (field.kind) {
        case "scalar":
          if (arg === void 0)
            return field.opt;
          if (repeated)
            return this.scalars(arg, field.T, depth, field.L);
          return this.scalar(arg, field.T, field.L);
        case "enum":
          if (arg === void 0)
            return field.opt;
          if (repeated)
            return this.scalars(arg, ScalarType.INT32, depth);
          return this.scalar(arg, ScalarType.INT32);
        case "message":
          if (arg === void 0)
            return true;
          if (repeated)
            return this.messages(arg, field.T(), allowExcessProperties, depth);
          return this.message(arg, field.T(), allowExcessProperties, depth);
        case "map":
          if (typeof arg != "object" || arg === null)
            return false;
          if (depth < 2)
            return true;
          if (!this.mapKeys(arg, field.K, depth))
            return false;
          switch (field.V.kind) {
            case "scalar":
              return this.scalars(Object.values(arg), field.V.T, depth, field.V.L);
            case "enum":
              return this.scalars(Object.values(arg), ScalarType.INT32, depth);
            case "message":
              return this.messages(Object.values(arg), field.V.T(), allowExcessProperties, depth);
          }
          break;
      }
      return true;
    }
    message(arg, type, allowExcessProperties, depth) {
      if (allowExcessProperties) {
        return type.isAssignable(arg, depth);
      }
      return type.is(arg, depth);
    }
    messages(arg, type, allowExcessProperties, depth) {
      if (!Array.isArray(arg))
        return false;
      if (depth < 2)
        return true;
      if (allowExcessProperties) {
        for (let i = 0; i < arg.length && i < depth; i++)
          if (!type.isAssignable(arg[i], depth - 1))
            return false;
      } else {
        for (let i = 0; i < arg.length && i < depth; i++)
          if (!type.is(arg[i], depth - 1))
            return false;
      }
      return true;
    }
    scalar(arg, type, longType) {
      let argType = typeof arg;
      switch (type) {
        case ScalarType.UINT64:
        case ScalarType.FIXED64:
        case ScalarType.INT64:
        case ScalarType.SFIXED64:
        case ScalarType.SINT64:
          switch (longType) {
            case LongType.BIGINT:
              return argType == "bigint";
            case LongType.NUMBER:
              return argType == "number" && !isNaN(arg);
            default:
              return argType == "string";
          }
        case ScalarType.BOOL:
          return argType == "boolean";
        case ScalarType.STRING:
          return argType == "string";
        case ScalarType.BYTES:
          return arg instanceof Uint8Array;
        case ScalarType.DOUBLE:
        case ScalarType.FLOAT:
          return argType == "number" && !isNaN(arg);
        default:
          return argType == "number" && Number.isInteger(arg);
      }
    }
    scalars(arg, type, depth, longType) {
      if (!Array.isArray(arg))
        return false;
      if (depth < 2)
        return true;
      if (Array.isArray(arg)) {
        for (let i = 0; i < arg.length && i < depth; i++)
          if (!this.scalar(arg[i], type, longType))
            return false;
      }
      return true;
    }
    mapKeys(map, type, depth) {
      let keys = Object.keys(map);
      switch (type) {
        case ScalarType.INT32:
        case ScalarType.FIXED32:
        case ScalarType.SFIXED32:
        case ScalarType.SINT32:
        case ScalarType.UINT32:
          return this.scalars(keys.slice(0, depth).map((k) => parseInt(k)), type, depth);
        case ScalarType.BOOL:
          return this.scalars(keys.slice(0, depth).map((k) => k == "true" ? true : k == "false" ? false : k), type, depth);
        default:
          return this.scalars(keys, type, depth, LongType.STRING);
      }
    }
  };

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-long-convert.js
  function reflectionLongConvert(long, type) {
    switch (type) {
      case LongType.BIGINT:
        return long.toBigInt();
      case LongType.NUMBER:
        return long.toNumber();
      default:
        return long.toString();
    }
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-json-reader.js
  var ReflectionJsonReader = class {
    constructor(info) {
      this.info = info;
    }
    prepare() {
      var _a2;
      if (this.fMap === void 0) {
        this.fMap = {};
        const fieldsInput = (_a2 = this.info.fields) !== null && _a2 !== void 0 ? _a2 : [];
        for (const field of fieldsInput) {
          this.fMap[field.name] = field;
          this.fMap[field.jsonName] = field;
          this.fMap[field.localName] = field;
        }
      }
    }
    // Cannot parse JSON <type of jsonValue> for <type name>#<fieldName>.
    assert(condition, fieldName, jsonValue) {
      if (!condition) {
        let what = typeofJsonValue(jsonValue);
        if (what == "number" || what == "boolean")
          what = jsonValue.toString();
        throw new Error(`Cannot parse JSON ${what} for ${this.info.typeName}#${fieldName}`);
      }
    }
    /**
     * Reads a message from canonical JSON format into the target message.
     *
     * Repeated fields are appended. Map entries are added, overwriting
     * existing keys.
     *
     * If a message field is already present, it will be merged with the
     * new data.
     */
    read(input, message, options) {
      this.prepare();
      const oneofsHandled = [];
      for (const [jsonKey, jsonValue] of Object.entries(input)) {
        const field = this.fMap[jsonKey];
        if (!field) {
          if (!options.ignoreUnknownFields)
            throw new Error(`Found unknown field while reading ${this.info.typeName} from JSON format. JSON key: ${jsonKey}`);
          continue;
        }
        const localName = field.localName;
        let target;
        if (field.oneof) {
          if (jsonValue === null && (field.kind !== "enum" || field.T()[0] !== "google.protobuf.NullValue")) {
            continue;
          }
          if (oneofsHandled.includes(field.oneof))
            throw new Error(`Multiple members of the oneof group "${field.oneof}" of ${this.info.typeName} are present in JSON.`);
          oneofsHandled.push(field.oneof);
          target = message[field.oneof] = {
            oneofKind: localName
          };
        } else {
          target = message;
        }
        if (field.kind == "map") {
          if (jsonValue === null) {
            continue;
          }
          this.assert(isJsonObject(jsonValue), field.name, jsonValue);
          const fieldObj = target[localName];
          for (const [jsonObjKey, jsonObjValue] of Object.entries(jsonValue)) {
            this.assert(jsonObjValue !== null, field.name + " map value", null);
            let val;
            switch (field.V.kind) {
              case "message":
                val = field.V.T().internalJsonRead(jsonObjValue, options);
                break;
              case "enum":
                val = this.enum(field.V.T(), jsonObjValue, field.name, options.ignoreUnknownFields);
                if (val === false)
                  continue;
                break;
              case "scalar":
                val = this.scalar(jsonObjValue, field.V.T, field.V.L, field.name);
                break;
            }
            this.assert(val !== void 0, field.name + " map value", jsonObjValue);
            let key = jsonObjKey;
            if (field.K == ScalarType.BOOL)
              key = key == "true" ? true : key == "false" ? false : key;
            key = this.scalar(key, field.K, LongType.STRING, field.name).toString();
            fieldObj[key] = val;
          }
        } else if (field.repeat) {
          if (jsonValue === null)
            continue;
          this.assert(Array.isArray(jsonValue), field.name, jsonValue);
          const fieldArr = target[localName];
          for (const jsonItem of jsonValue) {
            this.assert(jsonItem !== null, field.name, null);
            let val;
            switch (field.kind) {
              case "message":
                val = field.T().internalJsonRead(jsonItem, options);
                break;
              case "enum":
                val = this.enum(field.T(), jsonItem, field.name, options.ignoreUnknownFields);
                if (val === false)
                  continue;
                break;
              case "scalar":
                val = this.scalar(jsonItem, field.T, field.L, field.name);
                break;
            }
            this.assert(val !== void 0, field.name, jsonValue);
            fieldArr.push(val);
          }
        } else {
          switch (field.kind) {
            case "message":
              if (jsonValue === null && field.T().typeName != "google.protobuf.Value") {
                this.assert(field.oneof === void 0, field.name + " (oneof member)", null);
                continue;
              }
              target[localName] = field.T().internalJsonRead(jsonValue, options, target[localName]);
              break;
            case "enum":
              if (jsonValue === null)
                continue;
              let val = this.enum(field.T(), jsonValue, field.name, options.ignoreUnknownFields);
              if (val === false)
                continue;
              target[localName] = val;
              break;
            case "scalar":
              if (jsonValue === null)
                continue;
              target[localName] = this.scalar(jsonValue, field.T, field.L, field.name);
              break;
          }
        }
      }
    }
    /**
     * Returns `false` for unrecognized string representations.
     *
     * google.protobuf.NullValue accepts only JSON `null` (or the old `"NULL_VALUE"`).
     */
    enum(type, json, fieldName, ignoreUnknownFields) {
      if (type[0] == "google.protobuf.NullValue")
        assert(json === null || json === "NULL_VALUE", `Unable to parse field ${this.info.typeName}#${fieldName}, enum ${type[0]} only accepts null.`);
      if (json === null)
        return 0;
      switch (typeof json) {
        case "number":
          assert(Number.isInteger(json), `Unable to parse field ${this.info.typeName}#${fieldName}, enum can only be integral number, got ${json}.`);
          return json;
        case "string":
          let localEnumName = json;
          if (type[2] && json.substring(0, type[2].length) === type[2])
            localEnumName = json.substring(type[2].length);
          let enumNumber = type[1][localEnumName];
          if (typeof enumNumber === "undefined" && ignoreUnknownFields) {
            return false;
          }
          assert(typeof enumNumber == "number", `Unable to parse field ${this.info.typeName}#${fieldName}, enum ${type[0]} has no value for "${json}".`);
          return enumNumber;
      }
      assert(false, `Unable to parse field ${this.info.typeName}#${fieldName}, cannot parse enum value from ${typeof json}".`);
    }
    scalar(json, type, longType, fieldName) {
      let e;
      try {
        switch (type) {
          // float, double: JSON value will be a number or one of the special string values "NaN", "Infinity", and "-Infinity".
          // Either numbers or strings are accepted. Exponent notation is also accepted.
          case ScalarType.DOUBLE:
          case ScalarType.FLOAT:
            if (json === null)
              return 0;
            if (json === "NaN")
              return Number.NaN;
            if (json === "Infinity")
              return Number.POSITIVE_INFINITY;
            if (json === "-Infinity")
              return Number.NEGATIVE_INFINITY;
            if (json === "") {
              e = "empty string";
              break;
            }
            if (typeof json == "string" && json.trim().length !== json.length) {
              e = "extra whitespace";
              break;
            }
            if (typeof json != "string" && typeof json != "number") {
              break;
            }
            let float = Number(json);
            if (Number.isNaN(float)) {
              e = "not a number";
              break;
            }
            if (!Number.isFinite(float)) {
              e = "too large or small";
              break;
            }
            if (type == ScalarType.FLOAT)
              assertFloat32(float);
            return float;
          // int32, fixed32, uint32: JSON value will be a decimal number. Either numbers or strings are accepted.
          case ScalarType.INT32:
          case ScalarType.FIXED32:
          case ScalarType.SFIXED32:
          case ScalarType.SINT32:
          case ScalarType.UINT32:
            if (json === null)
              return 0;
            let int32;
            if (typeof json == "number")
              int32 = json;
            else if (json === "")
              e = "empty string";
            else if (typeof json == "string") {
              if (json.trim().length !== json.length)
                e = "extra whitespace";
              else
                int32 = Number(json);
            }
            if (int32 === void 0)
              break;
            if (type == ScalarType.UINT32)
              assertUInt32(int32);
            else
              assertInt32(int32);
            return int32;
          // int64, fixed64, uint64: JSON value will be a decimal string. Either numbers or strings are accepted.
          case ScalarType.INT64:
          case ScalarType.SFIXED64:
          case ScalarType.SINT64:
            if (json === null)
              return reflectionLongConvert(PbLong.ZERO, longType);
            if (typeof json != "number" && typeof json != "string")
              break;
            return reflectionLongConvert(PbLong.from(json), longType);
          case ScalarType.FIXED64:
          case ScalarType.UINT64:
            if (json === null)
              return reflectionLongConvert(PbULong.ZERO, longType);
            if (typeof json != "number" && typeof json != "string")
              break;
            return reflectionLongConvert(PbULong.from(json), longType);
          // bool:
          case ScalarType.BOOL:
            if (json === null)
              return false;
            if (typeof json !== "boolean")
              break;
            return json;
          // string:
          case ScalarType.STRING:
            if (json === null)
              return "";
            if (typeof json !== "string") {
              e = "extra whitespace";
              break;
            }
            try {
              encodeURIComponent(json);
            } catch (e2) {
              e2 = "invalid UTF8";
              break;
            }
            return json;
          // bytes: JSON value will be the data encoded as a string using standard base64 encoding with paddings.
          // Either standard or URL-safe base64 encoding with/without paddings are accepted.
          case ScalarType.BYTES:
            if (json === null || json === "")
              return new Uint8Array(0);
            if (typeof json !== "string")
              break;
            return base64decode(json);
        }
      } catch (error) {
        e = error.message;
      }
      this.assert(false, fieldName + (e ? " - " + e : ""), json);
    }
  };

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-json-writer.js
  var ReflectionJsonWriter = class {
    constructor(info) {
      var _a2;
      this.fields = (_a2 = info.fields) !== null && _a2 !== void 0 ? _a2 : [];
    }
    /**
     * Converts the message to a JSON object, based on the field descriptors.
     */
    write(message, options) {
      const json = {}, source = message;
      for (const field of this.fields) {
        if (!field.oneof) {
          let jsonValue2 = this.field(field, source[field.localName], options);
          if (jsonValue2 !== void 0)
            json[options.useProtoFieldName ? field.name : field.jsonName] = jsonValue2;
          continue;
        }
        const group = source[field.oneof];
        if (group.oneofKind !== field.localName)
          continue;
        const opt = field.kind == "scalar" || field.kind == "enum" ? Object.assign(Object.assign({}, options), { emitDefaultValues: true }) : options;
        let jsonValue = this.field(field, group[field.localName], opt);
        assert(jsonValue !== void 0);
        json[options.useProtoFieldName ? field.name : field.jsonName] = jsonValue;
      }
      return json;
    }
    field(field, value, options) {
      let jsonValue = void 0;
      if (field.kind == "map") {
        assert(typeof value == "object" && value !== null);
        const jsonObj = {};
        switch (field.V.kind) {
          case "scalar":
            for (const [entryKey, entryValue] of Object.entries(value)) {
              const val = this.scalar(field.V.T, entryValue, field.name, false, true);
              assert(val !== void 0);
              jsonObj[entryKey.toString()] = val;
            }
            break;
          case "message":
            const messageType = field.V.T();
            for (const [entryKey, entryValue] of Object.entries(value)) {
              const val = this.message(messageType, entryValue, field.name, options);
              assert(val !== void 0);
              jsonObj[entryKey.toString()] = val;
            }
            break;
          case "enum":
            const enumInfo = field.V.T();
            for (const [entryKey, entryValue] of Object.entries(value)) {
              assert(entryValue === void 0 || typeof entryValue == "number");
              const val = this.enum(enumInfo, entryValue, field.name, false, true, options.enumAsInteger);
              assert(val !== void 0);
              jsonObj[entryKey.toString()] = val;
            }
            break;
        }
        if (options.emitDefaultValues || Object.keys(jsonObj).length > 0)
          jsonValue = jsonObj;
      } else if (field.repeat) {
        assert(Array.isArray(value));
        const jsonArr = [];
        switch (field.kind) {
          case "scalar":
            for (let i = 0; i < value.length; i++) {
              const val = this.scalar(field.T, value[i], field.name, field.opt, true);
              assert(val !== void 0);
              jsonArr.push(val);
            }
            break;
          case "enum":
            const enumInfo = field.T();
            for (let i = 0; i < value.length; i++) {
              assert(value[i] === void 0 || typeof value[i] == "number");
              const val = this.enum(enumInfo, value[i], field.name, field.opt, true, options.enumAsInteger);
              assert(val !== void 0);
              jsonArr.push(val);
            }
            break;
          case "message":
            const messageType = field.T();
            for (let i = 0; i < value.length; i++) {
              const val = this.message(messageType, value[i], field.name, options);
              assert(val !== void 0);
              jsonArr.push(val);
            }
            break;
        }
        if (options.emitDefaultValues || jsonArr.length > 0 || options.emitDefaultValues)
          jsonValue = jsonArr;
      } else {
        switch (field.kind) {
          case "scalar":
            jsonValue = this.scalar(field.T, value, field.name, field.opt, options.emitDefaultValues);
            break;
          case "enum":
            jsonValue = this.enum(field.T(), value, field.name, field.opt, options.emitDefaultValues, options.enumAsInteger);
            break;
          case "message":
            jsonValue = this.message(field.T(), value, field.name, options);
            break;
        }
      }
      return jsonValue;
    }
    /**
     * Returns `null` as the default for google.protobuf.NullValue.
     */
    enum(type, value, fieldName, optional, emitDefaultValues, enumAsInteger) {
      if (type[0] == "google.protobuf.NullValue")
        return !emitDefaultValues && !optional ? void 0 : null;
      if (value === void 0) {
        assert(optional);
        return void 0;
      }
      if (value === 0 && !emitDefaultValues && !optional)
        return void 0;
      assert(typeof value == "number");
      assert(Number.isInteger(value));
      if (enumAsInteger || !type[1].hasOwnProperty(value))
        return value;
      if (type[2])
        return type[2] + type[1][value];
      return type[1][value];
    }
    message(type, value, fieldName, options) {
      if (value === void 0)
        return options.emitDefaultValues ? null : void 0;
      return type.internalJsonWrite(value, options);
    }
    scalar(type, value, fieldName, optional, emitDefaultValues) {
      if (value === void 0) {
        assert(optional);
        return void 0;
      }
      const ed = emitDefaultValues || optional;
      switch (type) {
        // int32, fixed32, uint32: JSON value will be a decimal number. Either numbers or strings are accepted.
        case ScalarType.INT32:
        case ScalarType.SFIXED32:
        case ScalarType.SINT32:
          if (value === 0)
            return ed ? 0 : void 0;
          assertInt32(value);
          return value;
        case ScalarType.FIXED32:
        case ScalarType.UINT32:
          if (value === 0)
            return ed ? 0 : void 0;
          assertUInt32(value);
          return value;
        // float, double: JSON value will be a number or one of the special string values "NaN", "Infinity", and "-Infinity".
        // Either numbers or strings are accepted. Exponent notation is also accepted.
        case ScalarType.FLOAT:
          assertFloat32(value);
        case ScalarType.DOUBLE:
          if (value === 0)
            return ed ? 0 : void 0;
          assert(typeof value == "number");
          if (Number.isNaN(value))
            return "NaN";
          if (value === Number.POSITIVE_INFINITY)
            return "Infinity";
          if (value === Number.NEGATIVE_INFINITY)
            return "-Infinity";
          return value;
        // string:
        case ScalarType.STRING:
          if (value === "")
            return ed ? "" : void 0;
          assert(typeof value == "string");
          return value;
        // bool:
        case ScalarType.BOOL:
          if (value === false)
            return ed ? false : void 0;
          assert(typeof value == "boolean");
          return value;
        // JSON value will be a decimal string. Either numbers or strings are accepted.
        case ScalarType.UINT64:
        case ScalarType.FIXED64:
          assert(typeof value == "number" || typeof value == "string" || typeof value == "bigint");
          let ulong = PbULong.from(value);
          if (ulong.isZero() && !ed)
            return void 0;
          return ulong.toString();
        // JSON value will be a decimal string. Either numbers or strings are accepted.
        case ScalarType.INT64:
        case ScalarType.SFIXED64:
        case ScalarType.SINT64:
          assert(typeof value == "number" || typeof value == "string" || typeof value == "bigint");
          let long = PbLong.from(value);
          if (long.isZero() && !ed)
            return void 0;
          return long.toString();
        // bytes: JSON value will be the data encoded as a string using standard base64 encoding with paddings.
        // Either standard or URL-safe base64 encoding with/without paddings are accepted.
        case ScalarType.BYTES:
          assert(value instanceof Uint8Array);
          if (!value.byteLength)
            return ed ? "" : void 0;
          return base64encode(value);
      }
    }
  };

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-scalar-default.js
  function reflectionScalarDefault(type, longType = LongType.STRING) {
    switch (type) {
      case ScalarType.BOOL:
        return false;
      case ScalarType.UINT64:
      case ScalarType.FIXED64:
        return reflectionLongConvert(PbULong.ZERO, longType);
      case ScalarType.INT64:
      case ScalarType.SFIXED64:
      case ScalarType.SINT64:
        return reflectionLongConvert(PbLong.ZERO, longType);
      case ScalarType.DOUBLE:
      case ScalarType.FLOAT:
        return 0;
      case ScalarType.BYTES:
        return new Uint8Array(0);
      case ScalarType.STRING:
        return "";
      default:
        return 0;
    }
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-binary-reader.js
  var ReflectionBinaryReader = class {
    constructor(info) {
      this.info = info;
    }
    prepare() {
      var _a2;
      if (!this.fieldNoToField) {
        const fieldsInput = (_a2 = this.info.fields) !== null && _a2 !== void 0 ? _a2 : [];
        this.fieldNoToField = new Map(fieldsInput.map((field) => [field.no, field]));
      }
    }
    /**
     * Reads a message from binary format into the target message.
     *
     * Repeated fields are appended. Map entries are added, overwriting
     * existing keys.
     *
     * If a message field is already present, it will be merged with the
     * new data.
     */
    read(reader, message, options, length) {
      this.prepare();
      const end = length === void 0 ? reader.len : reader.pos + length;
      while (reader.pos < end) {
        const [fieldNo, wireType] = reader.tag(), field = this.fieldNoToField.get(fieldNo);
        if (!field) {
          let u = options.readUnknownField;
          if (u == "throw")
            throw new Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.info.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.info.typeName, message, fieldNo, wireType, d);
          continue;
        }
        let target = message, repeated = field.repeat, localName = field.localName;
        if (field.oneof) {
          target = target[field.oneof];
          if (target.oneofKind !== localName)
            target = message[field.oneof] = {
              oneofKind: localName
            };
        }
        switch (field.kind) {
          case "scalar":
          case "enum":
            let T = field.kind == "enum" ? ScalarType.INT32 : field.T;
            let L = field.kind == "scalar" ? field.L : void 0;
            if (repeated) {
              let arr = target[localName];
              if (wireType == WireType.LengthDelimited && T != ScalarType.STRING && T != ScalarType.BYTES) {
                let e = reader.uint32() + reader.pos;
                while (reader.pos < e)
                  arr.push(this.scalar(reader, T, L));
              } else
                arr.push(this.scalar(reader, T, L));
            } else
              target[localName] = this.scalar(reader, T, L);
            break;
          case "message":
            if (repeated) {
              let arr = target[localName];
              let msg = field.T().internalBinaryRead(reader, reader.uint32(), options);
              arr.push(msg);
            } else
              target[localName] = field.T().internalBinaryRead(reader, reader.uint32(), options, target[localName]);
            break;
          case "map":
            let [mapKey, mapVal] = this.mapEntry(field, reader, options);
            target[localName][mapKey] = mapVal;
            break;
        }
      }
    }
    /**
     * Read a map field, expecting key field = 1, value field = 2
     */
    mapEntry(field, reader, options) {
      let length = reader.uint32();
      let end = reader.pos + length;
      let key = void 0;
      let val = void 0;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case 1:
            if (field.K == ScalarType.BOOL)
              key = reader.bool().toString();
            else
              key = this.scalar(reader, field.K, LongType.STRING);
            break;
          case 2:
            switch (field.V.kind) {
              case "scalar":
                val = this.scalar(reader, field.V.T, field.V.L);
                break;
              case "enum":
                val = reader.int32();
                break;
              case "message":
                val = field.V.T().internalBinaryRead(reader, reader.uint32(), options);
                break;
            }
            break;
          default:
            throw new Error(`Unknown field ${fieldNo} (wire type ${wireType}) in map entry for ${this.info.typeName}#${field.name}`);
        }
      }
      if (key === void 0) {
        let keyRaw = reflectionScalarDefault(field.K);
        key = field.K == ScalarType.BOOL ? keyRaw.toString() : keyRaw;
      }
      if (val === void 0)
        switch (field.V.kind) {
          case "scalar":
            val = reflectionScalarDefault(field.V.T, field.V.L);
            break;
          case "enum":
            val = 0;
            break;
          case "message":
            val = field.V.T().create();
            break;
        }
      return [key, val];
    }
    scalar(reader, type, longType) {
      switch (type) {
        case ScalarType.INT32:
          return reader.int32();
        case ScalarType.STRING:
          return reader.string();
        case ScalarType.BOOL:
          return reader.bool();
        case ScalarType.DOUBLE:
          return reader.double();
        case ScalarType.FLOAT:
          return reader.float();
        case ScalarType.INT64:
          return reflectionLongConvert(reader.int64(), longType);
        case ScalarType.UINT64:
          return reflectionLongConvert(reader.uint64(), longType);
        case ScalarType.FIXED64:
          return reflectionLongConvert(reader.fixed64(), longType);
        case ScalarType.FIXED32:
          return reader.fixed32();
        case ScalarType.BYTES:
          return reader.bytes();
        case ScalarType.UINT32:
          return reader.uint32();
        case ScalarType.SFIXED32:
          return reader.sfixed32();
        case ScalarType.SFIXED64:
          return reflectionLongConvert(reader.sfixed64(), longType);
        case ScalarType.SINT32:
          return reader.sint32();
        case ScalarType.SINT64:
          return reflectionLongConvert(reader.sint64(), longType);
      }
    }
  };

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-binary-writer.js
  var ReflectionBinaryWriter = class {
    constructor(info) {
      this.info = info;
    }
    prepare() {
      if (!this.fields) {
        const fieldsInput = this.info.fields ? this.info.fields.concat() : [];
        this.fields = fieldsInput.sort((a, b) => a.no - b.no);
      }
    }
    /**
     * Writes the message to binary format.
     */
    write(message, writer, options) {
      this.prepare();
      for (const field of this.fields) {
        let value, emitDefault, repeated = field.repeat, localName = field.localName;
        if (field.oneof) {
          const group = message[field.oneof];
          if (group.oneofKind !== localName)
            continue;
          value = group[localName];
          emitDefault = true;
        } else {
          value = message[localName];
          emitDefault = false;
        }
        switch (field.kind) {
          case "scalar":
          case "enum":
            let T = field.kind == "enum" ? ScalarType.INT32 : field.T;
            if (repeated) {
              assert(Array.isArray(value));
              if (repeated == RepeatType.PACKED)
                this.packed(writer, T, field.no, value);
              else
                for (const item of value)
                  this.scalar(writer, T, field.no, item, true);
            } else if (value === void 0)
              assert(field.opt);
            else
              this.scalar(writer, T, field.no, value, emitDefault || field.opt);
            break;
          case "message":
            if (repeated) {
              assert(Array.isArray(value));
              for (const item of value)
                this.message(writer, options, field.T(), field.no, item);
            } else {
              this.message(writer, options, field.T(), field.no, value);
            }
            break;
          case "map":
            assert(typeof value == "object" && value !== null);
            for (const [key, val] of Object.entries(value))
              this.mapEntry(writer, options, field, key, val);
            break;
        }
      }
      let u = options.writeUnknownFields;
      if (u !== false)
        (u === true ? UnknownFieldHandler.onWrite : u)(this.info.typeName, message, writer);
    }
    mapEntry(writer, options, field, key, value) {
      writer.tag(field.no, WireType.LengthDelimited);
      writer.fork();
      let keyValue = key;
      switch (field.K) {
        case ScalarType.INT32:
        case ScalarType.FIXED32:
        case ScalarType.UINT32:
        case ScalarType.SFIXED32:
        case ScalarType.SINT32:
          keyValue = Number.parseInt(key);
          break;
        case ScalarType.BOOL:
          assert(key == "true" || key == "false");
          keyValue = key == "true";
          break;
      }
      this.scalar(writer, field.K, 1, keyValue, true);
      switch (field.V.kind) {
        case "scalar":
          this.scalar(writer, field.V.T, 2, value, true);
          break;
        case "enum":
          this.scalar(writer, ScalarType.INT32, 2, value, true);
          break;
        case "message":
          this.message(writer, options, field.V.T(), 2, value);
          break;
      }
      writer.join();
    }
    message(writer, options, handler, fieldNo, value) {
      if (value === void 0)
        return;
      handler.internalBinaryWrite(value, writer.tag(fieldNo, WireType.LengthDelimited).fork(), options);
      writer.join();
    }
    /**
     * Write a single scalar value.
     */
    scalar(writer, type, fieldNo, value, emitDefault) {
      let [wireType, method, isDefault] = this.scalarInfo(type, value);
      if (!isDefault || emitDefault) {
        writer.tag(fieldNo, wireType);
        writer[method](value);
      }
    }
    /**
     * Write an array of scalar values in packed format.
     */
    packed(writer, type, fieldNo, value) {
      if (!value.length)
        return;
      assert(type !== ScalarType.BYTES && type !== ScalarType.STRING);
      writer.tag(fieldNo, WireType.LengthDelimited);
      writer.fork();
      let [, method] = this.scalarInfo(type);
      for (let i = 0; i < value.length; i++)
        writer[method](value[i]);
      writer.join();
    }
    /**
     * Get information for writing a scalar value.
     *
     * Returns tuple:
     * [0]: appropriate WireType
     * [1]: name of the appropriate method of IBinaryWriter
     * [2]: whether the given value is a default value
     *
     * If argument `value` is omitted, [2] is always false.
     */
    scalarInfo(type, value) {
      let t = WireType.Varint;
      let m;
      let i = value === void 0;
      let d = value === 0;
      switch (type) {
        case ScalarType.INT32:
          m = "int32";
          break;
        case ScalarType.STRING:
          d = i || !value.length;
          t = WireType.LengthDelimited;
          m = "string";
          break;
        case ScalarType.BOOL:
          d = value === false;
          m = "bool";
          break;
        case ScalarType.UINT32:
          m = "uint32";
          break;
        case ScalarType.DOUBLE:
          t = WireType.Bit64;
          m = "double";
          break;
        case ScalarType.FLOAT:
          t = WireType.Bit32;
          m = "float";
          break;
        case ScalarType.INT64:
          d = i || PbLong.from(value).isZero();
          m = "int64";
          break;
        case ScalarType.UINT64:
          d = i || PbULong.from(value).isZero();
          m = "uint64";
          break;
        case ScalarType.FIXED64:
          d = i || PbULong.from(value).isZero();
          t = WireType.Bit64;
          m = "fixed64";
          break;
        case ScalarType.BYTES:
          d = i || !value.byteLength;
          t = WireType.LengthDelimited;
          m = "bytes";
          break;
        case ScalarType.FIXED32:
          t = WireType.Bit32;
          m = "fixed32";
          break;
        case ScalarType.SFIXED32:
          t = WireType.Bit32;
          m = "sfixed32";
          break;
        case ScalarType.SFIXED64:
          d = i || PbLong.from(value).isZero();
          t = WireType.Bit64;
          m = "sfixed64";
          break;
        case ScalarType.SINT32:
          m = "sint32";
          break;
        case ScalarType.SINT64:
          d = i || PbLong.from(value).isZero();
          m = "sint64";
          break;
      }
      return [t, m, i || d];
    }
  };

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-create.js
  function reflectionCreate(type) {
    const msg = type.messagePrototype ? Object.create(type.messagePrototype) : Object.defineProperty({}, MESSAGE_TYPE, { value: type });
    for (let field of type.fields) {
      let name = field.localName;
      if (field.opt)
        continue;
      if (field.oneof)
        msg[field.oneof] = { oneofKind: void 0 };
      else if (field.repeat)
        msg[name] = [];
      else
        switch (field.kind) {
          case "scalar":
            msg[name] = reflectionScalarDefault(field.T, field.L);
            break;
          case "enum":
            msg[name] = 0;
            break;
          case "map":
            msg[name] = {};
            break;
        }
    }
    return msg;
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-merge-partial.js
  function reflectionMergePartial(info, target, source) {
    let fieldValue, input = source, output;
    for (let field of info.fields) {
      let name = field.localName;
      if (field.oneof) {
        const group = input[field.oneof];
        if ((group === null || group === void 0 ? void 0 : group.oneofKind) == void 0) {
          continue;
        }
        fieldValue = group[name];
        output = target[field.oneof];
        output.oneofKind = group.oneofKind;
        if (fieldValue == void 0) {
          delete output[name];
          continue;
        }
      } else {
        fieldValue = input[name];
        output = target;
        if (fieldValue == void 0) {
          continue;
        }
      }
      if (field.repeat)
        output[name].length = fieldValue.length;
      switch (field.kind) {
        case "scalar":
        case "enum":
          if (field.repeat)
            for (let i = 0; i < fieldValue.length; i++)
              output[name][i] = fieldValue[i];
          else
            output[name] = fieldValue;
          break;
        case "message":
          let T = field.T();
          if (field.repeat)
            for (let i = 0; i < fieldValue.length; i++)
              output[name][i] = T.create(fieldValue[i]);
          else if (output[name] === void 0)
            output[name] = T.create(fieldValue);
          else
            T.mergePartial(output[name], fieldValue);
          break;
        case "map":
          switch (field.V.kind) {
            case "scalar":
            case "enum":
              Object.assign(output[name], fieldValue);
              break;
            case "message":
              let T2 = field.V.T();
              for (let k of Object.keys(fieldValue))
                output[name][k] = T2.create(fieldValue[k]);
              break;
          }
          break;
      }
    }
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/reflection-equals.js
  function reflectionEquals(info, a, b) {
    if (a === b)
      return true;
    if (!a || !b)
      return false;
    for (let field of info.fields) {
      let localName = field.localName;
      let val_a = field.oneof ? a[field.oneof][localName] : a[localName];
      let val_b = field.oneof ? b[field.oneof][localName] : b[localName];
      switch (field.kind) {
        case "enum":
        case "scalar":
          let t = field.kind == "enum" ? ScalarType.INT32 : field.T;
          if (!(field.repeat ? repeatedPrimitiveEq(t, val_a, val_b) : primitiveEq(t, val_a, val_b)))
            return false;
          break;
        case "map":
          if (!(field.V.kind == "message" ? repeatedMsgEq(field.V.T(), objectValues(val_a), objectValues(val_b)) : repeatedPrimitiveEq(field.V.kind == "enum" ? ScalarType.INT32 : field.V.T, objectValues(val_a), objectValues(val_b))))
            return false;
          break;
        case "message":
          let T = field.T();
          if (!(field.repeat ? repeatedMsgEq(T, val_a, val_b) : T.equals(val_a, val_b)))
            return false;
          break;
      }
    }
    return true;
  }
  var objectValues = Object.values;
  function primitiveEq(type, a, b) {
    if (a === b)
      return true;
    if (type !== ScalarType.BYTES)
      return false;
    let ba = a;
    let bb = b;
    if (ba.length !== bb.length)
      return false;
    for (let i = 0; i < ba.length; i++)
      if (ba[i] != bb[i])
        return false;
    return true;
  }
  function repeatedPrimitiveEq(type, a, b) {
    if (a.length !== b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (!primitiveEq(type, a[i], b[i]))
        return false;
    return true;
  }
  function repeatedMsgEq(type, a, b) {
    if (a.length !== b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (!type.equals(a[i], b[i]))
        return false;
    return true;
  }

  // node_modules/@protobuf-ts/runtime/build/es2015/message-type.js
  var baseDescriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf({}));
  var messageTypeDescriptor = baseDescriptors[MESSAGE_TYPE] = {};
  var MessageType = class {
    constructor(name, fields, options) {
      this.defaultCheckDepth = 16;
      this.typeName = name;
      this.fields = fields.map(normalizeFieldInfo);
      this.options = options !== null && options !== void 0 ? options : {};
      messageTypeDescriptor.value = this;
      this.messagePrototype = Object.create(null, baseDescriptors);
      this.refTypeCheck = new ReflectionTypeCheck(this);
      this.refJsonReader = new ReflectionJsonReader(this);
      this.refJsonWriter = new ReflectionJsonWriter(this);
      this.refBinReader = new ReflectionBinaryReader(this);
      this.refBinWriter = new ReflectionBinaryWriter(this);
    }
    create(value) {
      let message = reflectionCreate(this);
      if (value !== void 0) {
        reflectionMergePartial(this, message, value);
      }
      return message;
    }
    /**
     * Clone the message.
     *
     * Unknown fields are discarded.
     */
    clone(message) {
      let copy = this.create();
      reflectionMergePartial(this, copy, message);
      return copy;
    }
    /**
     * Determines whether two message of the same type have the same field values.
     * Checks for deep equality, traversing repeated fields, oneof groups, maps
     * and messages recursively.
     * Will also return true if both messages are `undefined`.
     */
    equals(a, b) {
      return reflectionEquals(this, a, b);
    }
    /**
     * Is the given value assignable to our message type
     * and contains no [excess properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#excess-property-checks)?
     */
    is(arg, depth = this.defaultCheckDepth) {
      return this.refTypeCheck.is(arg, depth, false);
    }
    /**
     * Is the given value assignable to our message type,
     * regardless of [excess properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#excess-property-checks)?
     */
    isAssignable(arg, depth = this.defaultCheckDepth) {
      return this.refTypeCheck.is(arg, depth, true);
    }
    /**
     * Copy partial data into the target message.
     */
    mergePartial(target, source) {
      reflectionMergePartial(this, target, source);
    }
    /**
     * Create a new message from binary format.
     */
    fromBinary(data, options) {
      let opt = binaryReadOptions(options);
      return this.internalBinaryRead(opt.readerFactory(data), data.byteLength, opt);
    }
    /**
     * Read a new message from a JSON value.
     */
    fromJson(json, options) {
      return this.internalJsonRead(json, jsonReadOptions(options));
    }
    /**
     * Read a new message from a JSON string.
     * This is equivalent to `T.fromJson(JSON.parse(json))`.
     */
    fromJsonString(json, options) {
      let value = JSON.parse(json);
      return this.fromJson(value, options);
    }
    /**
     * Write the message to canonical JSON value.
     */
    toJson(message, options) {
      return this.internalJsonWrite(message, jsonWriteOptions(options));
    }
    /**
     * Convert the message to canonical JSON string.
     * This is equivalent to `JSON.stringify(T.toJson(t))`
     */
    toJsonString(message, options) {
      var _a2;
      let value = this.toJson(message, options);
      return JSON.stringify(value, null, (_a2 = options === null || options === void 0 ? void 0 : options.prettySpaces) !== null && _a2 !== void 0 ? _a2 : 0);
    }
    /**
     * Write the message to binary format.
     */
    toBinary(message, options) {
      let opt = binaryWriteOptions(options);
      return this.internalBinaryWrite(message, opt.writerFactory(), opt).finish();
    }
    /**
     * This is an internal method. If you just want to read a message from
     * JSON, use `fromJson()` or `fromJsonString()`.
     *
     * Reads JSON value and merges the fields into the target
     * according to protobuf rules. If the target is omitted,
     * a new instance is created first.
     */
    internalJsonRead(json, options, target) {
      if (json !== null && typeof json == "object" && !Array.isArray(json)) {
        let message = target !== null && target !== void 0 ? target : this.create();
        this.refJsonReader.read(json, message, options);
        return message;
      }
      throw new Error(`Unable to parse message ${this.typeName} from JSON ${typeofJsonValue(json)}.`);
    }
    /**
     * This is an internal method. If you just want to write a message
     * to JSON, use `toJson()` or `toJsonString().
     *
     * Writes JSON value and returns it.
     */
    internalJsonWrite(message, options) {
      return this.refJsonWriter.write(message, options);
    }
    /**
     * This is an internal method. If you just want to write a message
     * in binary format, use `toBinary()`.
     *
     * Serializes the message in binary format and appends it to the given
     * writer. Returns passed writer.
     */
    internalBinaryWrite(message, writer, options) {
      this.refBinWriter.write(message, writer, options);
      return writer;
    }
    /**
     * This is an internal method. If you just want to read a message from
     * binary data, use `fromBinary()`.
     *
     * Reads data from binary format and merges the fields into
     * the target according to protobuf rules. If the target is
     * omitted, a new instance is created first.
     */
    internalBinaryRead(reader, length, options, target) {
      let message = target !== null && target !== void 0 ? target : this.create();
      this.refBinReader.read(reader, message, options, length);
      return message;
    }
  };

  // generated/bilibili/app/dynamic/v2/dynamic.ts
  var DynamicType = /* @__PURE__ */ ((DynamicType2) => {
    DynamicType2[DynamicType2["DYN_NONE"] = 0] = "DYN_NONE";
    DynamicType2[DynamicType2["AD"] = 15] = "AD";
    DynamicType2[DynamicType2["LIVE_RCMD"] = 18] = "LIVE_RCMD";
    return DynamicType2;
  })(DynamicType || {});
  var DynAllReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.dynamic.v2.DynAllReply", [
        { no: 1, name: "dynamic_list", kind: "message", T: () => DynamicList },
        { no: 2, name: "up_list", kind: "message", T: () => CardVideoUpList },
        {
          no: 3,
          name: "topic_list",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.dynamic.v2.DynamicList dynamic_list */
          1:
            message.dynamicList = DynamicList.internalBinaryRead(reader, reader.uint32(), options, message.dynamicList);
            break;
          case /* bilibili.app.dynamic.v2.CardVideoUpList up_list */
          2:
            message.upList = CardVideoUpList.internalBinaryRead(reader, reader.uint32(), options, message.upList);
            break;
          case /* optional bytes topic_list */
          3:
            message.topicList = reader.bytes();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.dynamicList)
        DynamicList.internalBinaryWrite(message.dynamicList, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      if (message.upList)
        CardVideoUpList.internalBinaryWrite(message.upList, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
      if (message.topicList !== void 0)
        writer.tag(3, WireType.LengthDelimited).bytes(message.topicList);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var DynAllReply = /* @__PURE__ */ new DynAllReply$Type();
  var DynamicList$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.dynamic.v2.DynamicList", [
        { no: 1, name: "list", kind: "message", repeat: 2, T: () => DynamicItem }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.list = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bilibili.app.dynamic.v2.DynamicItem list */
          1:
            message.list.push(DynamicItem.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.list.length; i++)
        DynamicItem.internalBinaryWrite(message.list[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var DynamicList = /* @__PURE__ */ new DynamicList$Type();
  var DynamicItem$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.dynamic.v2.DynamicItem", [
        { no: 1, name: "card_type", kind: "enum", T: () => ["bilibili.app.dynamic.v2.DynamicType", DynamicType] }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.cardType = 0;
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.dynamic.v2.DynamicType card_type */
          1:
            message.cardType = reader.int32();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.cardType !== 0)
        writer.tag(1, WireType.Varint).int32(message.cardType);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var DynamicItem = /* @__PURE__ */ new DynamicItem$Type();
  var CardVideoUpList$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.dynamic.v2.CardVideoUpList", [
        { no: 2, name: "list", kind: "message", repeat: 2, T: () => UpListItem },
        {
          no: 4,
          name: "show_live_num",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        { no: 10, name: "list_second", kind: "message", repeat: 2, T: () => UpListItem }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.list = [];
      message.showLiveNum = 0;
      message.listSecond = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bilibili.app.dynamic.v2.UpListItem list */
          2:
            message.list.push(UpListItem.internalBinaryRead(reader, reader.uint32(), options));
            break;
          case /* int32 show_live_num */
          4:
            message.showLiveNum = reader.int32();
            break;
          case /* repeated bilibili.app.dynamic.v2.UpListItem list_second */
          10:
            message.listSecond.push(UpListItem.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.list.length; i++)
        UpListItem.internalBinaryWrite(message.list[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
      if (message.showLiveNum !== 0)
        writer.tag(4, WireType.Varint).int32(message.showLiveNum);
      for (let i = 0; i < message.listSecond.length; i++)
        UpListItem.internalBinaryWrite(message.listSecond[i], writer.tag(10, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var CardVideoUpList = /* @__PURE__ */ new CardVideoUpList$Type();
  var UpListItem$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.dynamic.v2.UpListItem", [
        {
          no: 11,
          name: "separator",
          kind: "scalar",
          T: 8
          /*ScalarType.BOOL*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.separator = false;
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bool separator */
          11:
            message.separator = reader.bool();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.separator !== false)
        writer.tag(11, WireType.Varint).bool(message.separator);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var UpListItem = /* @__PURE__ */ new UpListItem$Type();

  // generated/bilibili/playershared/playershared.ts
  var PlayArcConf$Type = class extends MessageType {
    constructor() {
      super("bilibili.playershared.PlayArcConf", [
        { no: 1, name: "arc_confs", kind: "map", K: 5, V: { kind: "message", T: () => ArcConf } }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.arcConfs = {};
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* map<int32, bilibili.playershared.ArcConf> arc_confs */
          1:
            this.binaryReadMap1(message.arcConfs, reader, options);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    binaryReadMap1(map, reader, options) {
      let len = reader.uint32(), end = reader.pos + len, key, val;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case 1:
            key = reader.int32();
            break;
          case 2:
            val = ArcConf.internalBinaryRead(reader, reader.uint32(), options);
            break;
          default:
            throw new globalThis.Error("unknown map entry field for bilibili.playershared.PlayArcConf.arc_confs");
        }
      }
      map[key ?? 0] = val ?? ArcConf.create();
    }
    internalBinaryWrite(message, writer, options) {
      for (let k of globalThis.Object.keys(message.arcConfs)) {
        writer.tag(1, WireType.LengthDelimited).fork().tag(1, WireType.Varint).int32(parseInt(k));
        writer.tag(2, WireType.LengthDelimited).fork();
        ArcConf.internalBinaryWrite(message.arcConfs[k], writer, options);
        writer.join().join();
      }
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var PlayArcConf = /* @__PURE__ */ new PlayArcConf$Type();
  var ArcConf$Type = class extends MessageType {
    constructor() {
      super("bilibili.playershared.ArcConf", [
        {
          no: 1,
          name: "is_support",
          kind: "scalar",
          T: 8
          /*ScalarType.BOOL*/
        },
        {
          no: 2,
          name: "disabled",
          kind: "scalar",
          T: 8
          /*ScalarType.BOOL*/
        },
        { no: 3, name: "extra_content", kind: "message", T: () => ExtraContent },
        {
          no: 4,
          name: "unsupport_scene",
          kind: "scalar",
          repeat: 1,
          T: 5
          /*ScalarType.INT32*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.isSupport = false;
      message.disabled = false;
      message.unsupportScene = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bool is_support */
          1:
            message.isSupport = reader.bool();
            break;
          case /* bool disabled */
          2:
            message.disabled = reader.bool();
            break;
          case /* bilibili.playershared.ExtraContent extra_content */
          3:
            message.extraContent = ExtraContent.internalBinaryRead(reader, reader.uint32(), options, message.extraContent);
            break;
          case /* repeated int32 unsupport_scene */
          4:
            if (wireType === WireType.LengthDelimited)
              for (let e = reader.int32() + reader.pos; reader.pos < e; )
                message.unsupportScene.push(reader.int32());
            else
              message.unsupportScene.push(reader.int32());
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.isSupport !== false)
        writer.tag(1, WireType.Varint).bool(message.isSupport);
      if (message.disabled !== false)
        writer.tag(2, WireType.Varint).bool(message.disabled);
      if (message.extraContent)
        ExtraContent.internalBinaryWrite(message.extraContent, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
      if (message.unsupportScene.length) {
        writer.tag(4, WireType.LengthDelimited).fork();
        for (let i = 0; i < message.unsupportScene.length; i++)
          writer.int32(message.unsupportScene[i]);
        writer.join();
      }
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ArcConf = /* @__PURE__ */ new ArcConf$Type();
  var ExtraContent$Type = class extends MessageType {
    constructor() {
      super("bilibili.playershared.ExtraContent", [
        {
          no: 1,
          name: "disable_reason",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 2,
          name: "disable_code",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.disableReason = "";
      message.disableCode = "0";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* string disable_reason */
          1:
            message.disableReason = reader.string();
            break;
          case /* int64 disable_code */
          2:
            message.disableCode = reader.int64().toString();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.disableReason !== "")
        writer.tag(1, WireType.LengthDelimited).string(message.disableReason);
      if (message.disableCode !== "0")
        writer.tag(2, WireType.Varint).int64(message.disableCode);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ExtraContent = /* @__PURE__ */ new ExtraContent$Type();
  var ViewInfo$Type = class extends MessageType {
    constructor() {
      super("bilibili.playershared.ViewInfo", [
        {
          no: 2,
          name: "prompt_bar",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* optional bytes prompt_bar */
          2:
            message.promptBar = reader.bytes();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.promptBar !== void 0)
        writer.tag(2, WireType.LengthDelimited).bytes(message.promptBar);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ViewInfo = /* @__PURE__ */ new ViewInfo$Type();

  // generated/bilibili/app/playerunite/v1/player.ts
  var PlayViewUniteReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.playerunite.v1.PlayViewUniteReply", [
        { no: 2, name: "play_arc_conf", kind: "message", T: () => PlayArcConf },
        { no: 9, name: "view_info", kind: "message", T: () => ViewInfo }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.playershared.PlayArcConf play_arc_conf */
          2:
            message.playArcConf = PlayArcConf.internalBinaryRead(reader, reader.uint32(), options, message.playArcConf);
            break;
          case /* bilibili.playershared.ViewInfo view_info */
          9:
            message.viewInfo = ViewInfo.internalBinaryRead(reader, reader.uint32(), options, message.viewInfo);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.playArcConf)
        PlayArcConf.internalBinaryWrite(message.playArcConf, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
      if (message.viewInfo)
        ViewInfo.internalBinaryWrite(message.viewInfo, writer.tag(9, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var PlayViewUniteReply = /* @__PURE__ */ new PlayViewUniteReply$Type();

  // generated/bilibili/app/playurl/v1/playurl.ts
  var PlayViewReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.playurl.v1.PlayViewReply", [
        { no: 5, name: "play_arc", kind: "message", T: () => PlayArcConf2 }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.playurl.v1.PlayArcConf play_arc */
          5:
            message.playArc = PlayArcConf2.internalBinaryRead(reader, reader.uint32(), options, message.playArc);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.playArc)
        PlayArcConf2.internalBinaryWrite(message.playArc, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var PlayViewReply = /* @__PURE__ */ new PlayViewReply$Type();
  var PlayArcConf$Type2 = class extends MessageType {
    constructor() {
      super("bilibili.app.playurl.v1.PlayArcConf", [
        { no: 1, name: "background_play_conf", kind: "message", T: () => ArcConf2 },
        { no: 3, name: "cast_conf", kind: "message", T: () => ArcConf2 }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.playurl.v1.ArcConf background_play_conf */
          1:
            message.backgroundPlayConf = ArcConf2.internalBinaryRead(reader, reader.uint32(), options, message.backgroundPlayConf);
            break;
          case /* bilibili.app.playurl.v1.ArcConf cast_conf */
          3:
            message.castConf = ArcConf2.internalBinaryRead(reader, reader.uint32(), options, message.castConf);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.backgroundPlayConf)
        ArcConf2.internalBinaryWrite(message.backgroundPlayConf, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      if (message.castConf)
        ArcConf2.internalBinaryWrite(message.castConf, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var PlayArcConf2 = /* @__PURE__ */ new PlayArcConf$Type2();
  var ArcConf$Type2 = class extends MessageType {
    constructor() {
      super("bilibili.app.playurl.v1.ArcConf", [
        {
          no: 1,
          name: "is_support",
          kind: "scalar",
          T: 8
          /*ScalarType.BOOL*/
        },
        {
          no: 2,
          name: "disabled",
          kind: "scalar",
          T: 8
          /*ScalarType.BOOL*/
        },
        { no: 3, name: "extra_content", kind: "message", T: () => ExtraContent2 },
        {
          no: 4,
          name: "unsupport_scene",
          kind: "scalar",
          repeat: 1,
          T: 3
          /*ScalarType.INT64*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.isSupport = false;
      message.disabled = false;
      message.unsupportScene = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bool is_support */
          1:
            message.isSupport = reader.bool();
            break;
          case /* bool disabled */
          2:
            message.disabled = reader.bool();
            break;
          case /* bilibili.app.playurl.v1.ExtraContent extra_content */
          3:
            message.extraContent = ExtraContent2.internalBinaryRead(reader, reader.uint32(), options, message.extraContent);
            break;
          case /* repeated int64 unsupport_scene */
          4:
            if (wireType === WireType.LengthDelimited)
              for (let e = reader.int32() + reader.pos; reader.pos < e; )
                message.unsupportScene.push(reader.int64().toString());
            else
              message.unsupportScene.push(reader.int64().toString());
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.isSupport !== false)
        writer.tag(1, WireType.Varint).bool(message.isSupport);
      if (message.disabled !== false)
        writer.tag(2, WireType.Varint).bool(message.disabled);
      if (message.extraContent)
        ExtraContent2.internalBinaryWrite(message.extraContent, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
      if (message.unsupportScene.length) {
        writer.tag(4, WireType.LengthDelimited).fork();
        for (let i = 0; i < message.unsupportScene.length; i++)
          writer.int64(message.unsupportScene[i]);
        writer.join();
      }
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ArcConf2 = /* @__PURE__ */ new ArcConf$Type2();
  var ExtraContent$Type2 = class extends MessageType {
    constructor() {
      super("bilibili.app.playurl.v1.ExtraContent", [
        {
          no: 1,
          name: "disabled_reason",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 2,
          name: "disabled_code",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.disabledReason = "";
      message.disabledCode = "0";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* string disabled_reason */
          1:
            message.disabledReason = reader.string();
            break;
          case /* int64 disabled_code */
          2:
            message.disabledCode = reader.int64().toString();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.disabledReason !== "")
        writer.tag(1, WireType.LengthDelimited).string(message.disabledReason);
      if (message.disabledCode !== "0")
        writer.tag(2, WireType.Varint).int64(message.disabledCode);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ExtraContent2 = /* @__PURE__ */ new ExtraContent$Type2();

  // generated/bilibili/app/card/v1/card.ts
  var Card$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.card.v1.Card", [
        { no: 1, name: "small_cover_v5", kind: "message", oneof: "item", T: () => SmallCoverV5 },
        {
          no: 10,
          name: "rcmd_one_item",
          kind: "scalar",
          oneof: "item",
          T: 12
          /*ScalarType.BYTES*/
        },
        {
          no: 11,
          name: "small_cover_v5_ad",
          kind: "scalar",
          oneof: "item",
          T: 12
          /*ScalarType.BYTES*/
        },
        {
          no: 12,
          name: "topic_list",
          kind: "scalar",
          oneof: "item",
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.item = { oneofKind: void 0 };
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.card.v1.SmallCoverV5 small_cover_v5 */
          1:
            message.item = {
              oneofKind: "smallCoverV5",
              smallCoverV5: SmallCoverV5.internalBinaryRead(reader, reader.uint32(), options, message.item.smallCoverV5)
            };
            break;
          case /* bytes rcmd_one_item */
          10:
            message.item = {
              oneofKind: "rcmdOneItem",
              rcmdOneItem: reader.bytes()
            };
            break;
          case /* bytes small_cover_v5_ad */
          11:
            message.item = {
              oneofKind: "smallCoverV5Ad",
              smallCoverV5Ad: reader.bytes()
            };
            break;
          case /* bytes topic_list */
          12:
            message.item = {
              oneofKind: "topicList",
              topicList: reader.bytes()
            };
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.item.oneofKind === "smallCoverV5")
        SmallCoverV5.internalBinaryWrite(message.item.smallCoverV5, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      if (message.item.oneofKind === "rcmdOneItem")
        writer.tag(10, WireType.LengthDelimited).bytes(message.item.rcmdOneItem);
      if (message.item.oneofKind === "smallCoverV5Ad")
        writer.tag(11, WireType.LengthDelimited).bytes(message.item.smallCoverV5Ad);
      if (message.item.oneofKind === "topicList")
        writer.tag(12, WireType.LengthDelimited).bytes(message.item.topicList);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Card = /* @__PURE__ */ new Card$Type();
  var SmallCoverV5$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.card.v1.SmallCoverV5", [
        { no: 1, name: "base", kind: "message", T: () => Base }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.card.v1.Base base */
          1:
            message.base = Base.internalBinaryRead(reader, reader.uint32(), options, message.base);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.base)
        Base.internalBinaryWrite(message.base, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var SmallCoverV5 = /* @__PURE__ */ new SmallCoverV5$Type();
  var Base$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.card.v1.Base", [
        {
          no: 12,
          name: "ad_info",
          kind: "scalar",
          T: 12
          /*ScalarType.BYTES*/
        },
        {
          no: 14,
          name: "from_type",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.adInfo = new Uint8Array(0);
      message.fromType = "";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bytes ad_info */
          12:
            message.adInfo = reader.bytes();
            break;
          case /* string from_type */
          14:
            message.fromType = reader.string();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.adInfo.length)
        writer.tag(12, WireType.LengthDelimited).bytes(message.adInfo);
      if (message.fromType !== "")
        writer.tag(14, WireType.LengthDelimited).string(message.fromType);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Base = /* @__PURE__ */ new Base$Type();

  // generated/bilibili/app/show/popular/v1/popular.ts
  var PopularReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.show.popular.v1.PopularReply", [
        { no: 1, name: "items", kind: "message", repeat: 2, T: () => Card }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.items = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bilibili.app.card.v1.Card items */
          1:
            message.items.push(Card.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.items.length; i++)
        Card.internalBinaryWrite(message.items[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var PopularReply = /* @__PURE__ */ new PopularReply$Type();

  // generated/bilibili/app/view/v1/view.ts
  var ViewReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.view.v1.ViewReply", [
        { no: 4, name: "req_user", kind: "message", T: () => ReqUser },
        { no: 10, name: "relates", kind: "message", repeat: 2, T: () => Relate },
        {
          no: 23,
          name: "label",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        },
        {
          no: 30,
          name: "cms",
          kind: "scalar",
          repeat: 2,
          T: 12
          /*ScalarType.BYTES*/
        },
        {
          no: 31,
          name: "cm_config",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        },
        {
          no: 41,
          name: "cm_ipad",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        },
        {
          no: 50,
          name: "special_cell_new",
          kind: "scalar",
          repeat: 2,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.relates = [];
      message.cms = [];
      message.specialCellNew = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.view.v1.ReqUser req_user */
          4:
            message.reqUser = ReqUser.internalBinaryRead(reader, reader.uint32(), options, message.reqUser);
            break;
          case /* repeated bilibili.app.view.v1.Relate relates */
          10:
            message.relates.push(Relate.internalBinaryRead(reader, reader.uint32(), options));
            break;
          case /* optional bytes label */
          23:
            message.label = reader.bytes();
            break;
          case /* repeated bytes cms */
          30:
            message.cms.push(reader.bytes());
            break;
          case /* optional bytes cm_config */
          31:
            message.cmConfig = reader.bytes();
            break;
          case /* optional bytes cm_ipad */
          41:
            message.cmIpad = reader.bytes();
            break;
          case /* repeated bytes special_cell_new */
          50:
            message.specialCellNew.push(reader.bytes());
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.reqUser)
        ReqUser.internalBinaryWrite(message.reqUser, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
      for (let i = 0; i < message.relates.length; i++)
        Relate.internalBinaryWrite(message.relates[i], writer.tag(10, WireType.LengthDelimited).fork(), options).join();
      if (message.label !== void 0)
        writer.tag(23, WireType.LengthDelimited).bytes(message.label);
      for (let i = 0; i < message.cms.length; i++)
        writer.tag(30, WireType.LengthDelimited).bytes(message.cms[i]);
      if (message.cmConfig !== void 0)
        writer.tag(31, WireType.LengthDelimited).bytes(message.cmConfig);
      if (message.cmIpad !== void 0)
        writer.tag(41, WireType.LengthDelimited).bytes(message.cmIpad);
      for (let i = 0; i < message.specialCellNew.length; i++)
        writer.tag(50, WireType.LengthDelimited).bytes(message.specialCellNew[i]);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ViewReply = /* @__PURE__ */ new ViewReply$Type();
  var ReqUser$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.view.v1.ReqUser", [
        {
          no: 9,
          name: "elec_plus_btn",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* optional bytes elec_plus_btn */
          9:
            message.elecPlusBtn = reader.bytes();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.elecPlusBtn !== void 0)
        writer.tag(9, WireType.LengthDelimited).bytes(message.elecPlusBtn);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ReqUser = /* @__PURE__ */ new ReqUser$Type();
  var Relate$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.view.v1.Relate", [
        {
          no: 28,
          name: "cm",
          kind: "scalar",
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.cm = new Uint8Array(0);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bytes cm */
          28:
            message.cm = reader.bytes();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.cm.length)
        writer.tag(28, WireType.LengthDelimited).bytes(message.cm);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Relate = /* @__PURE__ */ new Relate$Type();
  var ViewProgressReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.view.v1.ViewProgressReply", [
        {
          no: 1,
          name: "video_guide",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        },
        { no: 2, name: "chronos", kind: "message", T: () => Chronos }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* optional bytes video_guide */
          1:
            message.videoGuide = reader.bytes();
            break;
          case /* bilibili.app.view.v1.Chronos chronos */
          2:
            message.chronos = Chronos.internalBinaryRead(reader, reader.uint32(), options, message.chronos);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.videoGuide !== void 0)
        writer.tag(1, WireType.LengthDelimited).bytes(message.videoGuide);
      if (message.chronos)
        Chronos.internalBinaryWrite(message.chronos, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ViewProgressReply = /* @__PURE__ */ new ViewProgressReply$Type();
  var Chronos$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.view.v1.Chronos", [
        {
          no: 1,
          name: "md5",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 2,
          name: "file",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 3,
          name: "sign",
          kind: "scalar",
          opt: true,
          T: 9
          /*ScalarType.STRING*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.md5 = "";
      message.file = "";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* string md5 */
          1:
            message.md5 = reader.string();
            break;
          case /* string file */
          2:
            message.file = reader.string();
            break;
          case /* optional string sign */
          3:
            message.sign = reader.string();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.md5 !== "")
        writer.tag(1, WireType.LengthDelimited).string(message.md5);
      if (message.file !== "")
        writer.tag(2, WireType.LengthDelimited).string(message.file);
      if (message.sign !== void 0)
        writer.tag(3, WireType.LengthDelimited).string(message.sign);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Chronos = /* @__PURE__ */ new Chronos$Type();

  // generated/bilibili/app/viewunite/v1/view.ts
  var TabType = /* @__PURE__ */ ((TabType2) => {
    TabType2[TabType2["TAB_NONE"] = 0] = "TAB_NONE";
    TabType2[TabType2["TAB_INTRODUCTION"] = 1] = "TAB_INTRODUCTION";
    return TabType2;
  })(TabType || {});
  var ModuleType = /* @__PURE__ */ ((ModuleType2) => {
    ModuleType2[ModuleType2["UNKNOWN"] = 0] = "UNKNOWN";
    ModuleType2[ModuleType2["UGC_HEADLINE"] = 3] = "UGC_HEADLINE";
    ModuleType2[ModuleType2["ACTIVITY"] = 18] = "ACTIVITY";
    ModuleType2[ModuleType2["RELATED_RECOMMEND"] = 28] = "RELATED_RECOMMEND";
    ModuleType2[ModuleType2["PAY_BAR"] = 29] = "PAY_BAR";
    ModuleType2[ModuleType2["SPECIALTAG"] = 37] = "SPECIALTAG";
    ModuleType2[ModuleType2["MERCHANDISE"] = 55] = "MERCHANDISE";
    return ModuleType2;
  })(ModuleType || {});
  var RelateCardType = /* @__PURE__ */ ((RelateCardType2) => {
    RelateCardType2[RelateCardType2["CARD_TYPE_UNKNOWN"] = 0] = "CARD_TYPE_UNKNOWN";
    RelateCardType2[RelateCardType2["AV"] = 1] = "AV";
    RelateCardType2[RelateCardType2["GAME"] = 4] = "GAME";
    RelateCardType2[RelateCardType2["CM_TYPE"] = 5] = "CM_TYPE";
    RelateCardType2[RelateCardType2["LIVE"] = 6] = "LIVE";
    RelateCardType2[RelateCardType2["AI_RECOMMEND"] = 7] = "AI_RECOMMEND";
    RelateCardType2[RelateCardType2["COURSE"] = 11] = "COURSE";
    return RelateCardType2;
  })(RelateCardType || {});
  var ViewReply$Type2 = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.ViewReply", [
        { no: 3, name: "req_user", kind: "message", T: () => ReqUser2 },
        { no: 5, name: "tab", kind: "message", T: () => Tab },
        {
          no: 7,
          name: "cm",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.viewunite.v1.ReqUser req_user */
          3:
            message.reqUser = ReqUser2.internalBinaryRead(reader, reader.uint32(), options, message.reqUser);
            break;
          case /* bilibili.app.viewunite.v1.Tab tab */
          5:
            message.tab = Tab.internalBinaryRead(reader, reader.uint32(), options, message.tab);
            break;
          case /* optional bytes cm */
          7:
            message.cm = reader.bytes();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.reqUser)
        ReqUser2.internalBinaryWrite(message.reqUser, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
      if (message.tab)
        Tab.internalBinaryWrite(message.tab, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
      if (message.cm !== void 0)
        writer.tag(7, WireType.LengthDelimited).bytes(message.cm);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ViewReply2 = /* @__PURE__ */ new ViewReply$Type2();
  var ReqUser$Type2 = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.ReqUser", [
        {
          no: 7,
          name: "elec_plus_btn",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* optional bytes elec_plus_btn */
          7:
            message.elecPlusBtn = reader.bytes();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.elecPlusBtn !== void 0)
        writer.tag(7, WireType.LengthDelimited).bytes(message.elecPlusBtn);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ReqUser2 = /* @__PURE__ */ new ReqUser$Type2();
  var Tab$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.Tab", [
        { no: 1, name: "tab_module", kind: "message", repeat: 2, T: () => TabModule }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.tabModule = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bilibili.app.viewunite.v1.TabModule tab_module */
          1:
            message.tabModule.push(TabModule.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.tabModule.length; i++)
        TabModule.internalBinaryWrite(message.tabModule[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Tab = /* @__PURE__ */ new Tab$Type();
  var TabModule$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.TabModule", [
        { no: 1, name: "tab_type", kind: "enum", T: () => ["bilibili.app.viewunite.v1.TabType", TabType] },
        { no: 2, name: "introduction", kind: "message", oneof: "tab", T: () => IntroductionTab }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.tabType = 0;
      message.tab = { oneofKind: void 0 };
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.viewunite.v1.TabType tab_type */
          1:
            message.tabType = reader.int32();
            break;
          case /* bilibili.app.viewunite.v1.IntroductionTab introduction */
          2:
            message.tab = {
              oneofKind: "introduction",
              introduction: IntroductionTab.internalBinaryRead(reader, reader.uint32(), options, message.tab.introduction)
            };
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.tabType !== 0)
        writer.tag(1, WireType.Varint).int32(message.tabType);
      if (message.tab.oneofKind === "introduction")
        IntroductionTab.internalBinaryWrite(message.tab.introduction, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var TabModule = /* @__PURE__ */ new TabModule$Type();
  var IntroductionTab$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.IntroductionTab", [
        { no: 2, name: "modules", kind: "message", repeat: 2, T: () => Module }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.modules = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bilibili.app.viewunite.v1.Module modules */
          2:
            message.modules.push(Module.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.modules.length; i++)
        Module.internalBinaryWrite(message.modules[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var IntroductionTab = /* @__PURE__ */ new IntroductionTab$Type();
  var Module$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.Module", [
        { no: 1, name: "type", kind: "enum", T: () => ["bilibili.app.viewunite.v1.ModuleType", ModuleType] },
        { no: 5, name: "head_line", kind: "message", oneof: "data", T: () => Headline },
        { no: 22, name: "relates", kind: "message", oneof: "data", T: () => Relates }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.type = 0;
      message.data = { oneofKind: void 0 };
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.viewunite.v1.ModuleType type */
          1:
            message.type = reader.int32();
            break;
          case /* bilibili.app.viewunite.v1.Headline head_line */
          5:
            message.data = {
              oneofKind: "headLine",
              headLine: Headline.internalBinaryRead(reader, reader.uint32(), options, message.data.headLine)
            };
            break;
          case /* bilibili.app.viewunite.v1.Relates relates */
          22:
            message.data = {
              oneofKind: "relates",
              relates: Relates.internalBinaryRead(reader, reader.uint32(), options, message.data.relates)
            };
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.type !== 0)
        writer.tag(1, WireType.Varint).int32(message.type);
      if (message.data.oneofKind === "headLine")
        Headline.internalBinaryWrite(message.data.headLine, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
      if (message.data.oneofKind === "relates")
        Relates.internalBinaryWrite(message.data.relates, writer.tag(22, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Module = /* @__PURE__ */ new Module$Type();
  var Headline$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.Headline", [
        {
          no: 1,
          name: "label",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* optional bytes label */
          1:
            message.label = reader.bytes();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.label !== void 0)
        writer.tag(1, WireType.LengthDelimited).bytes(message.label);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Headline = /* @__PURE__ */ new Headline$Type();
  var Relates$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.Relates", [
        { no: 1, name: "cards", kind: "message", repeat: 2, T: () => RelateCard }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.cards = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bilibili.app.viewunite.v1.RelateCard cards */
          1:
            message.cards.push(RelateCard.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.cards.length; i++)
        RelateCard.internalBinaryWrite(message.cards[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Relates = /* @__PURE__ */ new Relates$Type();
  var RelateCard$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.RelateCard", [
        { no: 1, name: "relate_card_type", kind: "enum", T: () => ["bilibili.app.viewunite.v1.RelateCardType", RelateCardType] },
        {
          no: 11,
          name: "cm_stock",
          kind: "scalar",
          T: 12
          /*ScalarType.BYTES*/
        },
        { no: 12, name: "basic_info", kind: "message", T: () => CardBasicInfo }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.relateCardType = 0;
      message.cmStock = new Uint8Array(0);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.viewunite.v1.RelateCardType relate_card_type */
          1:
            message.relateCardType = reader.int32();
            break;
          case /* bytes cm_stock */
          11:
            message.cmStock = reader.bytes();
            break;
          case /* bilibili.app.viewunite.v1.CardBasicInfo basic_info */
          12:
            message.basicInfo = CardBasicInfo.internalBinaryRead(reader, reader.uint32(), options, message.basicInfo);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.relateCardType !== 0)
        writer.tag(1, WireType.Varint).int32(message.relateCardType);
      if (message.cmStock.length)
        writer.tag(11, WireType.LengthDelimited).bytes(message.cmStock);
      if (message.basicInfo)
        CardBasicInfo.internalBinaryWrite(message.basicInfo, writer.tag(12, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var RelateCard = /* @__PURE__ */ new RelateCard$Type();
  var CardBasicInfo$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.CardBasicInfo", [
        {
          no: 6,
          name: "unique_id",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.uniqueId = "";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* string unique_id */
          6:
            message.uniqueId = reader.string();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.uniqueId !== "")
        writer.tag(6, WireType.LengthDelimited).string(message.uniqueId);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var CardBasicInfo = /* @__PURE__ */ new CardBasicInfo$Type();
  var ViewProgressReply$Type2 = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.ViewProgressReply", [
        { no: 2, name: "chronos", kind: "message", T: () => Chronos2 },
        {
          no: 4,
          name: "dm",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.app.viewunite.v1.Chronos chronos */
          2:
            message.chronos = Chronos2.internalBinaryRead(reader, reader.uint32(), options, message.chronos);
            break;
          case /* optional bytes dm */
          4:
            message.dm = reader.bytes();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.chronos)
        Chronos2.internalBinaryWrite(message.chronos, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
      if (message.dm !== void 0)
        writer.tag(4, WireType.LengthDelimited).bytes(message.dm);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ViewProgressReply2 = /* @__PURE__ */ new ViewProgressReply$Type2();
  var Chronos$Type2 = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.Chronos", [
        {
          no: 1,
          name: "md5",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 2,
          name: "file",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 3,
          name: "sign",
          kind: "scalar",
          opt: true,
          T: 9
          /*ScalarType.STRING*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.md5 = "";
      message.file = "";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* string md5 */
          1:
            message.md5 = reader.string();
            break;
          case /* string file */
          2:
            message.file = reader.string();
            break;
          case /* optional string sign */
          3:
            message.sign = reader.string();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.md5 !== "")
        writer.tag(1, WireType.LengthDelimited).string(message.md5);
      if (message.file !== "")
        writer.tag(2, WireType.LengthDelimited).string(message.file);
      if (message.sign !== void 0)
        writer.tag(3, WireType.LengthDelimited).string(message.sign);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Chronos2 = /* @__PURE__ */ new Chronos$Type2();
  var RelatesFeedReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.app.viewunite.v1.RelatesFeedReply", [
        { no: 1, name: "relates", kind: "message", repeat: 2, T: () => RelateCard }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.relates = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bilibili.app.viewunite.v1.RelateCard relates */
          1:
            message.relates.push(RelateCard.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.relates.length; i++)
        RelateCard.internalBinaryWrite(message.relates[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var RelatesFeedReply = /* @__PURE__ */ new RelatesFeedReply$Type();

  // generated/bilibili/community/service/dm/v1/dm.ts
  var DmColorfulType = /* @__PURE__ */ ((DmColorfulType2) => {
    DmColorfulType2[DmColorfulType2["NONE_TYPE"] = 0] = "NONE_TYPE";
    DmColorfulType2[DmColorfulType2["VIP_GRADUAL_COLOR"] = 60001] = "VIP_GRADUAL_COLOR";
    return DmColorfulType2;
  })(DmColorfulType || {});
  var DmViewReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.community.service.dm.v1.DmViewReply", [
        {
          no: 18,
          name: "activity_meta",
          kind: "scalar",
          repeat: 2,
          T: 9
          /*ScalarType.STRING*/
        },
        { no: 22, name: "command", kind: "message", T: () => Command }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.activityMeta = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated string activity_meta */
          18:
            message.activityMeta.push(reader.string());
            break;
          case /* bilibili.community.service.dm.v1.Command command */
          22:
            message.command = Command.internalBinaryRead(reader, reader.uint32(), options, message.command);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.activityMeta.length; i++)
        writer.tag(18, WireType.LengthDelimited).string(message.activityMeta[i]);
      if (message.command)
        Command.internalBinaryWrite(message.command, writer.tag(22, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var DmViewReply = /* @__PURE__ */ new DmViewReply$Type();
  var Command$Type = class extends MessageType {
    constructor() {
      super("bilibili.community.service.dm.v1.Command", [
        {
          no: 1,
          name: "command_dms",
          kind: "scalar",
          repeat: 2,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.commandDms = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bytes command_dms */
          1:
            message.commandDms.push(reader.bytes());
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.commandDms.length; i++)
        writer.tag(1, WireType.LengthDelimited).bytes(message.commandDms[i]);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Command = /* @__PURE__ */ new Command$Type();
  var DmSegMobileReq$Type = class extends MessageType {
    constructor() {
      super("bilibili.community.service.dm.v1.DmSegMobileReq", [
        {
          no: 1,
          name: "pid",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        },
        {
          no: 2,
          name: "oid",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        },
        {
          no: 3,
          name: "type",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 4,
          name: "segment_index",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        },
        {
          no: 6,
          name: "ps",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        },
        {
          no: 7,
          name: "pe",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.pid = "0";
      message.oid = "0";
      message.type = 0;
      message.segmentIndex = "0";
      message.ps = "0";
      message.pe = "0";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* int64 pid */
          1:
            message.pid = reader.int64().toString();
            break;
          case /* int64 oid */
          2:
            message.oid = reader.int64().toString();
            break;
          case /* int32 type */
          3:
            message.type = reader.int32();
            break;
          case /* int64 segment_index */
          4:
            message.segmentIndex = reader.int64().toString();
            break;
          case /* int64 ps */
          6:
            message.ps = reader.int64().toString();
            break;
          case /* int64 pe */
          7:
            message.pe = reader.int64().toString();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.pid !== "0")
        writer.tag(1, WireType.Varint).int64(message.pid);
      if (message.oid !== "0")
        writer.tag(2, WireType.Varint).int64(message.oid);
      if (message.type !== 0)
        writer.tag(3, WireType.Varint).int32(message.type);
      if (message.segmentIndex !== "0")
        writer.tag(4, WireType.Varint).int64(message.segmentIndex);
      if (message.ps !== "0")
        writer.tag(6, WireType.Varint).int64(message.ps);
      if (message.pe !== "0")
        writer.tag(7, WireType.Varint).int64(message.pe);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var DmSegMobileReq = /* @__PURE__ */ new DmSegMobileReq$Type();
  var DmSegMobileReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.community.service.dm.v1.DmSegMobileReply", [
        { no: 1, name: "elems", kind: "message", repeat: 2, T: () => DanmakuElem }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.elems = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bilibili.community.service.dm.v1.DanmakuElem elems */
          1:
            message.elems.push(DanmakuElem.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.elems.length; i++)
        DanmakuElem.internalBinaryWrite(message.elems[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var DmSegMobileReply = /* @__PURE__ */ new DmSegMobileReply$Type();
  var DanmakuElem$Type = class extends MessageType {
    constructor() {
      super("bilibili.community.service.dm.v1.DanmakuElem", [
        {
          no: 1,
          name: "id",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        },
        {
          no: 2,
          name: "progress",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 3,
          name: "mode",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 4,
          name: "fontsize",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 5,
          name: "color",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 6,
          name: "mid_hash",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 7,
          name: "content",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 8,
          name: "ctime",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        },
        {
          no: 9,
          name: "weight",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 10,
          name: "action",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 11,
          name: "pool",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 12,
          name: "id_str",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 13,
          name: "attr",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 22,
          name: "animation",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 23,
          name: "extra",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        { no: 24, name: "colorful", kind: "enum", T: () => ["bilibili.community.service.dm.v1.DmColorfulType", DmColorfulType] },
        {
          no: 25,
          name: "type",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 26,
          name: "oid",
          kind: "scalar",
          T: 3
          /*ScalarType.INT64*/
        },
        {
          no: 27,
          name: "dm_from",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.id = "0";
      message.progress = 0;
      message.mode = 0;
      message.fontsize = 0;
      message.color = 0;
      message.midHash = "";
      message.content = "";
      message.ctime = "0";
      message.weight = 0;
      message.action = "";
      message.pool = 0;
      message.idStr = "";
      message.attr = 0;
      message.animation = "";
      message.extra = "";
      message.colorful = 0;
      message.type = 0;
      message.oid = "0";
      message.dmFrom = 0;
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* int64 id */
          1:
            message.id = reader.int64().toString();
            break;
          case /* int32 progress */
          2:
            message.progress = reader.int32();
            break;
          case /* int32 mode */
          3:
            message.mode = reader.int32();
            break;
          case /* int32 fontsize */
          4:
            message.fontsize = reader.int32();
            break;
          case /* int32 color */
          5:
            message.color = reader.int32();
            break;
          case /* string mid_hash */
          6:
            message.midHash = reader.string();
            break;
          case /* string content */
          7:
            message.content = reader.string();
            break;
          case /* int64 ctime */
          8:
            message.ctime = reader.int64().toString();
            break;
          case /* int32 weight */
          9:
            message.weight = reader.int32();
            break;
          case /* string action */
          10:
            message.action = reader.string();
            break;
          case /* int32 pool */
          11:
            message.pool = reader.int32();
            break;
          case /* string id_str */
          12:
            message.idStr = reader.string();
            break;
          case /* int32 attr */
          13:
            message.attr = reader.int32();
            break;
          case /* string animation */
          22:
            message.animation = reader.string();
            break;
          case /* string extra */
          23:
            message.extra = reader.string();
            break;
          case /* bilibili.community.service.dm.v1.DmColorfulType colorful */
          24:
            message.colorful = reader.int32();
            break;
          case /* int32 type */
          25:
            message.type = reader.int32();
            break;
          case /* int64 oid */
          26:
            message.oid = reader.int64().toString();
            break;
          case /* int32 dm_from */
          27:
            message.dmFrom = reader.int32();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.id !== "0")
        writer.tag(1, WireType.Varint).int64(message.id);
      if (message.progress !== 0)
        writer.tag(2, WireType.Varint).int32(message.progress);
      if (message.mode !== 0)
        writer.tag(3, WireType.Varint).int32(message.mode);
      if (message.fontsize !== 0)
        writer.tag(4, WireType.Varint).int32(message.fontsize);
      if (message.color !== 0)
        writer.tag(5, WireType.Varint).int32(message.color);
      if (message.midHash !== "")
        writer.tag(6, WireType.LengthDelimited).string(message.midHash);
      if (message.content !== "")
        writer.tag(7, WireType.LengthDelimited).string(message.content);
      if (message.ctime !== "0")
        writer.tag(8, WireType.Varint).int64(message.ctime);
      if (message.weight !== 0)
        writer.tag(9, WireType.Varint).int32(message.weight);
      if (message.action !== "")
        writer.tag(10, WireType.LengthDelimited).string(message.action);
      if (message.pool !== 0)
        writer.tag(11, WireType.Varint).int32(message.pool);
      if (message.idStr !== "")
        writer.tag(12, WireType.LengthDelimited).string(message.idStr);
      if (message.attr !== 0)
        writer.tag(13, WireType.Varint).int32(message.attr);
      if (message.animation !== "")
        writer.tag(22, WireType.LengthDelimited).string(message.animation);
      if (message.extra !== "")
        writer.tag(23, WireType.LengthDelimited).string(message.extra);
      if (message.colorful !== 0)
        writer.tag(24, WireType.Varint).int32(message.colorful);
      if (message.type !== 0)
        writer.tag(25, WireType.Varint).int32(message.type);
      if (message.oid !== "0")
        writer.tag(26, WireType.Varint).int64(message.oid);
      if (message.dmFrom !== 0)
        writer.tag(27, WireType.Varint).int32(message.dmFrom);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var DanmakuElem = /* @__PURE__ */ new DanmakuElem$Type();

  // generated/bilibili/main/community/reply/v1/reply.ts
  var Type = /* @__PURE__ */ ((Type2) => {
    Type2[Type2["UNKNOWN"] = 0] = "UNKNOWN";
    Type2[Type2["OGV_GRADE"] = 1] = "OGV_GRADE";
    Type2[Type2["UP_PROTECTION"] = 2] = "UP_PROTECTION";
    Type2[Type2["CM"] = 3] = "CM";
    Type2[Type2["UP_SELECTION"] = 4] = "UP_SELECTION";
    Type2[Type2["OPERATION"] = 5] = "OPERATION";
    Type2[Type2["VOTE"] = 6] = "VOTE";
    Type2[Type2["ESPORTS_GRADE"] = 7] = "ESPORTS_GRADE";
    return Type2;
  })(Type || {});
  var MainListReply$Type = class extends MessageType {
    constructor() {
      super("bilibili.main.community.reply.v1.MainListReply", [
        {
          no: 11,
          name: "cm",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        },
        { no: 14, name: "top_replies", kind: "message", repeat: 2, T: () => ReplyInfo },
        { no: 28, name: "subject_top_cards", kind: "message", repeat: 2, T: () => SubjectTopCard }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.topReplies = [];
      message.subjectTopCards = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* optional bytes cm */
          11:
            message.cm = reader.bytes();
            break;
          case /* repeated bilibili.main.community.reply.v1.ReplyInfo top_replies */
          14:
            message.topReplies.push(ReplyInfo.internalBinaryRead(reader, reader.uint32(), options));
            break;
          case /* repeated bilibili.main.community.reply.v1.SubjectTopCard subject_top_cards */
          28:
            message.subjectTopCards.push(SubjectTopCard.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.cm !== void 0)
        writer.tag(11, WireType.LengthDelimited).bytes(message.cm);
      for (let i = 0; i < message.topReplies.length; i++)
        ReplyInfo.internalBinaryWrite(message.topReplies[i], writer.tag(14, WireType.LengthDelimited).fork(), options).join();
      for (let i = 0; i < message.subjectTopCards.length; i++)
        SubjectTopCard.internalBinaryWrite(message.subjectTopCards[i], writer.tag(28, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var MainListReply = /* @__PURE__ */ new MainListReply$Type();
  var ReplyInfo$Type = class extends MessageType {
    constructor() {
      super("bilibili.main.community.reply.v1.ReplyInfo", [
        { no: 12, name: "content", kind: "message", T: () => Content }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.main.community.reply.v1.Content content */
          12:
            message.content = Content.internalBinaryRead(reader, reader.uint32(), options, message.content);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.content)
        Content.internalBinaryWrite(message.content, writer.tag(12, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ReplyInfo = /* @__PURE__ */ new ReplyInfo$Type();
  var Content$Type = class extends MessageType {
    constructor() {
      super("bilibili.main.community.reply.v1.Content", [
        {
          no: 1,
          name: "message",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        { no: 5, name: "urls", kind: "map", K: 9, V: { kind: "message", T: () => Url } }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.message = "";
      message.urls = {};
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* string message */
          1:
            message.message = reader.string();
            break;
          case /* map<string, bilibili.main.community.reply.v1.Url> urls */
          5:
            this.binaryReadMap5(message.urls, reader, options);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    binaryReadMap5(map, reader, options) {
      let len = reader.uint32(), end = reader.pos + len, key, val;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case 1:
            key = reader.string();
            break;
          case 2:
            val = Url.internalBinaryRead(reader, reader.uint32(), options);
            break;
          default:
            throw new globalThis.Error("unknown map entry field for bilibili.main.community.reply.v1.Content.urls");
        }
      }
      map[key ?? ""] = val ?? Url.create();
    }
    internalBinaryWrite(message, writer, options) {
      if (message.message !== "")
        writer.tag(1, WireType.LengthDelimited).string(message.message);
      for (let k of globalThis.Object.keys(message.urls)) {
        writer.tag(5, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k);
        writer.tag(2, WireType.LengthDelimited).fork();
        Url.internalBinaryWrite(message.urls[k], writer, options);
        writer.join().join();
      }
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Content = /* @__PURE__ */ new Content$Type();
  var Url$Type = class extends MessageType {
    constructor() {
      super("bilibili.main.community.reply.v1.Url", [
        {
          no: 1,
          name: "title",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 5,
          name: "app_name",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        },
        {
          no: 6,
          name: "app_package_name",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.title = "";
      message.appName = "";
      message.appPackageName = "";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* string title */
          1:
            message.title = reader.string();
            break;
          case /* string app_name */
          5:
            message.appName = reader.string();
            break;
          case /* string app_package_name */
          6:
            message.appPackageName = reader.string();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.title !== "")
        writer.tag(1, WireType.LengthDelimited).string(message.title);
      if (message.appName !== "")
        writer.tag(5, WireType.LengthDelimited).string(message.appName);
      if (message.appPackageName !== "")
        writer.tag(6, WireType.LengthDelimited).string(message.appPackageName);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Url = /* @__PURE__ */ new Url$Type();
  var SubjectTopCard$Type = class extends MessageType {
    constructor() {
      super("bilibili.main.community.reply.v1.SubjectTopCard", [
        { no: 1, name: "type", kind: "enum", T: () => ["bilibili.main.community.reply.v1.Type", Type] }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.type = 0;
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.main.community.reply.v1.Type type */
          1:
            message.type = reader.int32();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.type !== 0)
        writer.tag(1, WireType.Varint).int32(message.type);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var SubjectTopCard = /* @__PURE__ */ new SubjectTopCard$Type();

  // generated/bilibili/pgc/gateway/player/v2/playurl.ts
  var PlayViewReply$Type2 = class extends MessageType {
    constructor() {
      super("bilibili.pgc.gateway.player.v2.PlayViewReply", [
        { no: 5, name: "view_info", kind: "message", T: () => ViewInfo2 },
        { no: 6, name: "play_ext_conf", kind: "message", T: () => PlayAbilityExtConf }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bilibili.pgc.gateway.player.v2.ViewInfo view_info */
          5:
            message.viewInfo = ViewInfo2.internalBinaryRead(reader, reader.uint32(), options, message.viewInfo);
            break;
          case /* bilibili.pgc.gateway.player.v2.PlayAbilityExtConf play_ext_conf */
          6:
            message.playExtConf = PlayAbilityExtConf.internalBinaryRead(reader, reader.uint32(), options, message.playExtConf);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.viewInfo)
        ViewInfo2.internalBinaryWrite(message.viewInfo, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
      if (message.playExtConf)
        PlayAbilityExtConf.internalBinaryWrite(message.playExtConf, writer.tag(6, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var PlayViewReply2 = /* @__PURE__ */ new PlayViewReply$Type2();
  var ViewInfo$Type2 = class extends MessageType {
    constructor() {
      super("bilibili.pgc.gateway.player.v2.ViewInfo", [
        {
          no: 8,
          name: "try_watch_prompt_bar",
          kind: "scalar",
          opt: true,
          T: 12
          /*ScalarType.BYTES*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* optional bytes try_watch_prompt_bar */
          8:
            message.tryWatchPromptBar = reader.bytes();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.tryWatchPromptBar !== void 0)
        writer.tag(8, WireType.LengthDelimited).bytes(message.tryWatchPromptBar);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var ViewInfo2 = /* @__PURE__ */ new ViewInfo$Type2();
  var PlayAbilityExtConf$Type = class extends MessageType {
    constructor() {
      super("bilibili.pgc.gateway.player.v2.PlayAbilityExtConf", [
        {
          no: 1,
          name: "allow_close_subtitle",
          kind: "scalar",
          T: 8
          /*ScalarType.BOOL*/
        },
        { no: 3, name: "cast_tips", kind: "message", T: () => CastTips }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.allowCloseSubtitle = false;
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* bool allow_close_subtitle */
          1:
            message.allowCloseSubtitle = reader.bool();
            break;
          case /* bilibili.pgc.gateway.player.v2.CastTips cast_tips */
          3:
            message.castTips = CastTips.internalBinaryRead(reader, reader.uint32(), options, message.castTips);
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.allowCloseSubtitle !== false)
        writer.tag(1, WireType.Varint).bool(message.allowCloseSubtitle);
      if (message.castTips)
        CastTips.internalBinaryWrite(message.castTips, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var PlayAbilityExtConf = /* @__PURE__ */ new PlayAbilityExtConf$Type();
  var CastTips$Type = class extends MessageType {
    constructor() {
      super("bilibili.pgc.gateway.player.v2.CastTips", [
        {
          no: 1,
          name: "code",
          kind: "scalar",
          T: 5
          /*ScalarType.INT32*/
        },
        {
          no: 2,
          name: "message",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.code = 0;
      message.message = "";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* int32 code */
          1:
            message.code = reader.int32();
            break;
          case /* string message */
          2:
            message.message = reader.string();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.code !== 0)
        writer.tag(1, WireType.Varint).int32(message.code);
      if (message.message !== "")
        writer.tag(2, WireType.LengthDelimited).string(message.message);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var CastTips = /* @__PURE__ */ new CastTips$Type();

  // generated/bilibili/polymer/app/search/v1/search.ts
  var SearchAllResponse$Type = class extends MessageType {
    constructor() {
      super("bilibili.polymer.app.search.v1.SearchAllResponse", [
        { no: 4, name: "item", kind: "message", repeat: 2, T: () => Item }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.item = [];
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* repeated bilibili.polymer.app.search.v1.Item item */
          4:
            message.item.push(Item.internalBinaryRead(reader, reader.uint32(), options));
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      for (let i = 0; i < message.item.length; i++)
        Item.internalBinaryWrite(message.item[i], writer.tag(4, WireType.LengthDelimited).fork(), options).join();
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var SearchAllResponse = /* @__PURE__ */ new SearchAllResponse$Type();
  var Item$Type = class extends MessageType {
    constructor() {
      super("bilibili.polymer.app.search.v1.Item", [
        {
          no: 4,
          name: "linktype",
          kind: "scalar",
          T: 9
          /*ScalarType.STRING*/
        }
      ]);
    }
    create(value) {
      const message = globalThis.Object.create(this.messagePrototype);
      message.linktype = "";
      if (value !== void 0)
        reflectionMergePartial(this, message, value);
      return message;
    }
    internalBinaryRead(reader, length, options, target) {
      let message = target ?? this.create(), end = reader.pos + length;
      while (reader.pos < end) {
        let [fieldNo, wireType] = reader.tag();
        switch (fieldNo) {
          case /* string linktype */
          4:
            message.linktype = reader.string();
            break;
          default:
            let u = options.readUnknownField;
            if (u === "throw")
              throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
            let d = reader.skip(wireType);
            if (u !== false)
              (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
        }
      }
      return message;
    }
    internalBinaryWrite(message, writer, options) {
      if (message.linktype !== "")
        writer.tag(4, WireType.LengthDelimited).string(message.linktype);
      let u = options.writeUnknownFields;
      if (u !== false)
        (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
      return writer;
    }
  };
  var Item = /* @__PURE__ */ new Item$Type();

  // native-protobuf.ts
  var NativeTextEncoder = class {
    encode(input = "") {
      const output = [];
      for (let index = 0; index < input.length; index += 1) {
        let codePoint = input.charCodeAt(index);
        if (codePoint >= 55296 && codePoint <= 56319) {
          const low = input.charCodeAt(index + 1);
          if (low >= 56320 && low <= 57343) {
            codePoint = 65536 + (codePoint - 55296 << 10) + low - 56320;
            index += 1;
          } else {
            codePoint = 65533;
          }
        } else if (codePoint >= 56320 && codePoint <= 57343) {
          codePoint = 65533;
        }
        if (codePoint <= 127) {
          output.push(codePoint);
        } else if (codePoint <= 2047) {
          output.push(192 | codePoint >> 6, 128 | codePoint & 63);
        } else if (codePoint <= 65535) {
          output.push(
            224 | codePoint >> 12,
            128 | codePoint >> 6 & 63,
            128 | codePoint & 63
          );
        } else {
          output.push(
            240 | codePoint >> 18,
            128 | codePoint >> 12 & 63,
            128 | codePoint >> 6 & 63,
            128 | codePoint & 63
          );
        }
      }
      return new Uint8Array(output);
    }
  };
  var NativeTextDecoder = class {
    decode(input) {
      let output = "";
      for (let index = 0; index < input.length; ) {
        const first = input[index];
        let codePoint = 0;
        let length = 0;
        let minimum = 0;
        if (first <= 127) {
          codePoint = first;
          length = 1;
        } else if (first >= 194 && first <= 223) {
          codePoint = first & 31;
          length = 2;
          minimum = 128;
        } else if (first >= 224 && first <= 239) {
          codePoint = first & 15;
          length = 3;
          minimum = 2048;
        } else if (first >= 240 && first <= 244) {
          codePoint = first & 7;
          length = 4;
          minimum = 65536;
        } else {
          throw new TypeError("Invalid UTF-8 sequence");
        }
        if (index + length > input.length) {
          throw new TypeError("Truncated UTF-8 sequence");
        }
        for (let offset = 1; offset < length; offset += 1) {
          const next = input[index + offset];
          if ((next & 192) !== 128) {
            throw new TypeError("Invalid UTF-8 continuation byte");
          }
          codePoint = codePoint << 6 | next & 63;
        }
        if (codePoint < minimum || codePoint > 1114111 || codePoint >= 55296 && codePoint <= 57343) {
          throw new TypeError("Invalid UTF-8 code point");
        }
        if (codePoint <= 65535) {
          output += String.fromCharCode(codePoint);
        } else {
          codePoint -= 65536;
          output += String.fromCharCode(55296 + (codePoint >> 10), 56320 + (codePoint & 1023));
        }
        index += length;
      }
      return output;
    }
  };
  if (typeof globalThis.TextEncoder === "undefined") {
    ;
    globalThis.TextEncoder = NativeTextEncoder;
  }
  if (typeof globalThis.TextDecoder === "undefined") {
    ;
    globalThis.TextDecoder = NativeTextDecoder;
  }
  var CHRONOS_MD5 = Object.freeze({
    universal: "ecca73e42e160074e0caf4b3ddb54a52",
    hd: "932002070dc1b51241198a074d2279fc",
    inter: "8c3feda2e92bf60e8a7aeade1a231586",
    f6d0676e75bf9a4b4469e40b19565154: "ecca73e42e160074e0caf4b3ddb54a52",
    c29bd8f2b64a8f57f49c3622c0f763db: "ecca73e42e160074e0caf4b3ddb54a52",
    "8232ffb6ee43b687b5fe5add5b3e97de": "feaca416bbc1174b8e935cf87ff8f0b5",
    "325e7073ffc6fb5263682fecdcd1058f": "932002070dc1b51241198a074d2279fc",
    "3a14beddd23328eaddfe9f0eb048d713": "8c3feda2e92bf60e8a7aeade1a231586"
  });
  var CHRONOS_COMMIT = "a96c334eb6e46d4403740c0258d064d33321a03a";
  var MAX_GRPC_MESSAGE_BYTES = 8 * 1024 * 1024;
  var GZIP_INPUT_CHUNK_BYTES = 1024;
  var RELATE_BLOCKED = /* @__PURE__ */ new Set([
    4 /* GAME */,
    5 /* CM_TYPE */,
    6 /* LIVE */,
    7 /* AI_RECOMMEND */,
    11 /* COURSE */
  ]);
  function requestPath(url) {
    const match = /^https?:\/\/[^/?#]+([^?#]*)/i.exec(url);
    if (!match) throw new Error("Invalid request URL");
    return match[1] || "/";
  }
  function headerValue(headers, name) {
    const wanted = name.toLowerCase();
    for (const [key, value] of Object.entries(headers || {})) {
      if (key.toLowerCase() === wanted) return value;
    }
    return "";
  }
  function shouldLog(context, level) {
    const values = { debug: 1, info: 2, warn: 3, error: 4, off: 5 };
    const configured = context.settings.logLevel || "info";
    return values[level] >= values[configured];
  }
  function logError(context, error) {
    if (shouldLog(context, "error")) console.error(`Bilibili Protobuf transform failed: ${String(error)}`);
  }
  function logDebug(context, ...values) {
    if (shouldLog(context, "debug")) console.debug(...values);
  }
  function logWarn(context, ...values) {
    if (shouldLog(context, "warn")) console.warn(...values);
  }
  function boundedGunzip(input) {
    const chunks = [];
    let total = 0;
    const stream = new Gunzip((chunk) => {
      total += chunk.length;
      if (total > MAX_GRPC_MESSAGE_BYTES) {
        throw new Error(`Decompressed gRPC message exceeds ${MAX_GRPC_MESSAGE_BYTES} bytes`);
      }
      chunks.push(chunk.slice());
    });
    for (let offset2 = 0; offset2 < input.length; offset2 += GZIP_INPUT_CHUNK_BYTES) {
      const end = Math.min(offset2 + GZIP_INPUT_CHUNK_BYTES, input.length);
      stream.push(input.subarray(offset2, end), end === input.length);
    }
    if (!input.length) stream.push(input, true);
    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }
  function decodeFrame(type, frame) {
    if (!(frame instanceof Uint8Array) || frame.length < 5) throw new Error("Invalid gRPC frame");
    const compressed = frame.subarray(5);
    if (!frame[0] && compressed.length > MAX_GRPC_MESSAGE_BYTES) {
      throw new Error(`gRPC message exceeds ${MAX_GRPC_MESSAGE_BYTES} bytes`);
    }
    const body = frame[0] ? boundedGunzip(compressed) : compressed;
    return type.fromBinary(body);
  }
  function encodeFrame(type, message) {
    const body = type.toBinary(message);
    const output = new Uint8Array(body.length + 5);
    output[1] = body.length >>> 24;
    output[2] = body.length >>> 16 & 255;
    output[3] = body.length >>> 8 & 255;
    output[4] = body.length & 255;
    output.set(body, 5);
    return output;
  }
  function isIpad(context) {
    return /^bili-hd/i.test(headerValue(context.request.headers, "user-agent"));
  }
  function appEdition(context) {
    const userAgent = headerValue(context.request.headers, "user-agent");
    if (userAgent.startsWith("bili-hd")) return "hd";
    if (userAgent.startsWith("bili-inter")) return "inter";
    return "universal";
  }
  function processChronos(context, chronos) {
    let processed = CHRONOS_MD5[chronos.md5];
    if (!processed) {
      logWarn(context, `Bilibili Chronos MD5 mismatch: ${chronos.md5}; file=${chronos.file}`);
      processed = CHRONOS_MD5[appEdition(context)];
    }
    chronos.md5 = processed;
    chronos.file = `https://raw.githubusercontent.com/kokoryh/chronos/${CHRONOS_COMMIT}/${processed}.zip`;
    delete chronos.sign;
  }
  function filterRelateCard(card) {
    return !RELATE_BLOCKED.has(card.relateCardType) && !card.cmStock.length && !card.basicInfo?.uniqueId;
  }
  function transformResponse(context, path, frame) {
    logDebug(context, "Bilibili Protobuf response", context.request.url, context.settings);
    const airborne = context.settings.airborne !== false;
    if (path.endsWith("/bilibili.app.dynamic.v2.Dynamic/DynAll")) {
      const message = decodeFrame(DynAllReply, frame);
      delete message.topicList;
      if (message.dynamicList) {
        message.dynamicList.list = message.dynamicList.list.filter(
          (item) => ![15 /* AD */, 18 /* LIVE_RCMD */].includes(item.cardType)
        );
      }
      const mode = context.settings.showUpList || "show";
      if (mode !== "show" && !isIpad(context) && message.upList) {
        if (mode === "hide" || !message.upList.showLiveNum) {
          delete message.upList;
        } else {
          const last = message.upList.listSecond[message.upList.listSecond.length - 1];
          if (last) {
            last.separator = true;
            message.upList.list = [...message.upList.listSecond, ...message.upList.list];
            message.upList.listSecond.length = 0;
          }
        }
      }
      return encodeFrame(DynAllReply, message);
    }
    if (path.endsWith("/bilibili.app.playerunite.v1.Player/PlayViewUnite")) {
      const message = decodeFrame(PlayViewUniteReply, frame);
      delete message.viewInfo?.promptBar;
      if (message.playArcConf?.arcConfs) {
        for (const item of Object.values(message.playArcConf.arcConfs)) {
          if (item.isSupport && item.disabled) {
            item.disabled = false;
            item.extraContent = void 0;
            item.unsupportScene.length = 0;
          }
        }
      }
      return encodeFrame(PlayViewUniteReply, message);
    }
    if (path.endsWith("/bilibili.app.playurl.v1.PlayURL/PlayView")) {
      const message = decodeFrame(PlayViewReply, frame);
      const { backgroundPlayConf, castConf } = message.playArc || {};
      for (const item of [backgroundPlayConf, castConf]) {
        if (item && (!item.isSupport || item.disabled)) {
          item.isSupport = true;
          item.disabled = false;
          item.extraContent = void 0;
          item.unsupportScene.length = 0;
        }
      }
      return encodeFrame(PlayViewReply, message);
    }
    if (path.endsWith("/bilibili.app.show.v1.Popular/Index")) {
      const message = decodeFrame(PopularReply, frame);
      message.items = message.items.filter((item) => {
        if (item.item.oneofKind === "smallCoverV5") {
          const card = item.item.smallCoverV5;
          return card.base?.fromType === "recommend" && !card.base.adInfo.length;
        }
        return !["rcmdOneItem", "smallCoverV5Ad", "topicList"].includes(item.item.oneofKind);
      });
      return encodeFrame(PopularReply, message);
    }
    if (path.endsWith("/bilibili.app.view.v1.View/View")) {
      const message = decodeFrame(ViewReply, frame);
      delete message.label;
      delete message.cmIpad;
      delete message.cmConfig;
      delete message.reqUser?.elecPlusBtn;
      message.cms.length = 0;
      message.specialCellNew.length = 0;
      message.relates = message.relates.filter((item) => !item.cm.length);
      return encodeFrame(ViewReply, message);
    }
    if (path.endsWith("/bilibili.app.view.v1.View/ViewProgress")) {
      const message = decodeFrame(ViewProgressReply, frame);
      delete message.videoGuide;
      if (airborne && message.chronos) processChronos(context, message.chronos);
      return encodeFrame(ViewProgressReply, message);
    }
    if (path.endsWith("/bilibili.app.viewunite.v1.View/RelatesFeed")) {
      const message = decodeFrame(RelatesFeedReply, frame);
      message.relates = message.relates.filter(filterRelateCard);
      return encodeFrame(RelatesFeedReply, message);
    }
    if (path.endsWith("/bilibili.app.viewunite.v1.View/View")) {
      const message = decodeFrame(ViewReply2, frame);
      delete message.cm;
      delete message.reqUser?.elecPlusBtn;
      for (const tabModule of message.tab?.tabModule || []) {
        if (tabModule.tab.oneofKind !== "introduction") continue;
        tabModule.tab.introduction.modules = tabModule.tab.introduction.modules.reduce(
          (modules, module) => {
            if ([18 /* ACTIVITY */, 29 /* PAY_BAR */, 37 /* SPECIALTAG */, 55 /* MERCHANDISE */].includes(
              module.type
            )) {
              return modules;
            }
            if (module.type === 3 /* UGC_HEADLINE */ && module.data.oneofKind === "headLine") {
              delete module.data.headLine.label;
            } else if (module.type === 28 /* RELATED_RECOMMEND */ && module.data.oneofKind === "relates") {
              module.data.relates.cards = module.data.relates.cards.filter(filterRelateCard);
            }
            modules.push(module);
            return modules;
          },
          []
        );
      }
      return encodeFrame(ViewReply2, message);
    }
    if (path.endsWith("/bilibili.app.viewunite.v1.View/ViewProgress")) {
      const message = decodeFrame(ViewProgressReply2, frame);
      delete message.dm;
      if (airborne && message.chronos) processChronos(context, message.chronos);
      return encodeFrame(ViewProgressReply2, message);
    }
    if (path.endsWith("/bilibili.community.service.dm.v1.DM/DmView")) {
      const message = decodeFrame(DmViewReply, frame);
      message.activityMeta.length = 0;
      if (message.command?.commandDms.length) message.command.commandDms.length = 0;
      return encodeFrame(DmViewReply, message);
    }
    if (path.endsWith("/bilibili.main.community.reply.v1.Reply/MainList")) {
      const message = decodeFrame(MainListReply, frame);
      delete message.cm;
      message.subjectTopCards = message.subjectTopCards.filter((item) => item.type !== 3 /* CM */);
      if (context.settings.purifyTopReplies !== false) {
        const pattern = /https:\/\/b23\.tv\/(cm|mall)/;
        message.topReplies = message.topReplies.filter((reply) => {
          const urls = reply.content?.urls || {};
          const text = reply.content?.message || "";
          return !Object.keys(urls).some((url) => pattern.test(url)) && !pattern.test(text);
        });
      }
      return encodeFrame(MainListReply, message);
    }
    if (path.endsWith("/bilibili.pgc.gateway.player.v2.PlayURL/PlayView")) {
      const message = decodeFrame(PlayViewReply2, frame);
      delete message.viewInfo?.tryWatchPromptBar;
      if (message.playExtConf?.castTips) message.playExtConf.castTips = { code: 0, message: "" };
      return encodeFrame(PlayViewReply2, message);
    }
    if (path.endsWith("/bilibili.polymer.app.search.v1.Search/SearchAll")) {
      const message = decodeFrame(SearchAllResponse, frame);
      message.item = message.item.filter((item) => !/_ad_?/.test(item.linktype));
      return encodeFrame(SearchAllResponse, message);
    }
    return null;
  }
  var BV_ALPHABET = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf";
  var BV_XOR = 23442827791579n;
  var BV_MAX_AID = 1n << 51n;
  var BV_BASE = 58n;
  function avToBv(avid) {
    const bytes = ["B", "V", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
    let index = bytes.length - 1;
    let value = (BV_MAX_AID | BigInt(avid)) ^ BV_XOR;
    while (value > 0n) {
      bytes[index] = BV_ALPHABET[Number(value % BV_BASE)];
      value /= BV_BASE;
      index -= 1;
    }
    ;
    [bytes[3], bytes[9]] = [bytes[9], bytes[3]];
    [bytes[4], bytes[7]] = [bytes[7], bytes[4]];
    return bytes.join("");
  }
  function sanitizeRequestHeaders(headers) {
    const blocked = /* @__PURE__ */ new Set([
      "connection",
      "content-length",
      "host",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "proxy-connection",
      "trailer",
      "transfer-encoding",
      "upgrade"
    ]);
    const output = {};
    for (const [name, value] of Object.entries(headers || {})) {
      const lower = name.toLowerCase();
      if (lower === "te") {
        if (value === "trailers") output.TE = "trailers";
      } else if (!blocked.has(lower)) {
        output[name] = value;
      }
    }
    return output;
  }
  function sanitizeResponseHeaders(headers) {
    return Object.fromEntries(
      Object.entries(headers || {}).filter(
        ([name]) => !["content-length", "transfer-encoding"].includes(name.toLowerCase())
      )
    );
  }
  function sanitizeTrailers(headers) {
    const blocked = /* @__PURE__ */ new Set([
      "connection",
      "content-length",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "proxy-connection",
      "te",
      "trailer",
      "transfer-encoding",
      "upgrade"
    ]);
    return Object.fromEntries(Object.entries(headers || {}).filter(([name]) => !blocked.has(name.toLowerCase())));
  }
  function getSkipSegments(context, videoId, cid) {
    try {
      const result = context.network.request({
        url: `https://bsbsb.top/api/skipSegments?videoID=${encodeURIComponent(videoId)}&cid=${encodeURIComponent(cid)}&category=sponsor`,
        method: "GET",
        headers: {
          origin: "https://github.com/kokoryh/Sparkle/blob/master/release/surge/module/bilibili.sgmodule",
          "x-ext-version": "1.0.0"
        }
      });
      logDebug(context, "Bilibili SponsorBlock response", result.status, result.text || "");
      if (result.status !== 200 || typeof result.text !== "string") return [];
      const items = JSON.parse(result.text);
      if (!Array.isArray(items)) return [];
      return items.reduce((segments, item) => {
        if (!item || typeof item !== "object") return segments;
        const value = item;
        if (value.actionType === "skip" && Array.isArray(value.segment) && value.segment.length === 2 && value.segment.every((number) => typeof number === "number" && Number.isFinite(number)) && value.segment[1] - value.segment[0] >= 8) {
          segments.push([value.segment[0], value.segment[1]]);
        }
        return segments;
      }, []);
    } catch (error) {
      if (shouldLog(context, "error")) console.error(`Bilibili SponsorBlock request failed: ${String(error)}`);
      return [];
    }
  }
  function airborneDanmaku(segments) {
    return segments.map((segment, index) => {
      const id = String(index + 1);
      return {
        id,
        progress: Math.floor(segment[0] * 1e3) + 2e3,
        mode: 5,
        fontsize: 50,
        color: 16777215,
        midHash: "1948dd5d",
        content: "空指部已就位",
        ctime: "1735660800",
        weight: 11,
        action: `airborne:${Math.floor(segment[1] * 1e3)}`,
        pool: 0,
        idStr: id,
        attr: 1310724,
        animation: "",
        extra: "",
        colorful: 0 /* NONE_TYPE */,
        type: 1,
        oid: "212364987",
        dmFrom: 1
      };
    });
  }
  function transformAirborne(context) {
    if (context.settings.airborne === false || !context.network || !context.request.body) return null;
    const request = decodeFrame(DmSegMobileReq, context.request.body);
    if (request.type !== 1) return null;
    const replay = context.network.request({
      url: context.request.url,
      method: context.request.method || "POST",
      headers: sanitizeRequestHeaders(context.request.headers),
      body: context.request.body
    });
    if (replay.status !== 200 || !(replay.body instanceof Uint8Array)) return null;
    const videoId = avToBv(request.pid);
    const cid = request.oid !== "0" ? request.oid : "";
    const segments = getSkipSegments(context, videoId, cid);
    let body = replay.body;
    if (segments.length) {
      const response = decodeFrame(DmSegMobileReply, replay.body);
      response.elems.push(...airborneDanmaku(segments));
      body = encodeFrame(DmSegMobileReply, response);
    }
    const synthetic = {
      status: replay.status,
      headers: sanitizeResponseHeaders(replay.headers),
      body
    };
    if (replay.trailers) synthetic.trailers = sanitizeTrailers(replay.trailers);
    return { response: synthetic };
  }
  function transform(context) {
    try {
      if (context.phase === "request") return transformAirborne(context);
      const body = context.response?.body;
      if (!(body instanceof Uint8Array)) return null;
      const transformed = transformResponse(context, requestPath(context.request.url), body);
      if (!transformed) return null;
      const response = { body: transformed };
      if (context.response?.trailers) response.trailers = sanitizeTrailers(context.response.trailers);
      return { response };
    } catch (error) {
      logError(context, error);
      return null;
    }
  }
  globalThis.transform = transform;
})();
