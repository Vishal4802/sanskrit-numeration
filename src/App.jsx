import { useState, useCallback } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const VOWELS = [
  { base:"अ",  matra:"",  roman:"a",  aryaExp:0  },
  { base:"आ",  matra:"ा",  roman:"ā",  aryaExp:0  },
  { base:"इ",  matra:"ि",  roman:"i",  aryaExp:2  },
  { base:"ई",  matra:"ी",  roman:"ī",  aryaExp:2  },
  { base:"उ",  matra:"ु",  roman:"u",  aryaExp:4  },
  { base:"ऊ",  matra:"ू",  roman:"ū",  aryaExp:4  },
  { base:"ऋ",  matra:"ृ",  roman:"ṛ",  aryaExp:6  },
  { base:"ऌ",  matra:"ॢ",  roman:"ḷ",  aryaExp:8  },
  { base:"ए",  matra:"े",  roman:"e",  aryaExp:10 },
  { base:"ऐ",  matra:"ै",  roman:"ai", aryaExp:12 },
  { base:"ओ",  matra:"ो",  roman:"o",  aryaExp:14 },
  { base:"औ",  matra:"ौ",  roman:"au", aryExp:16 },
];

const CONSONANTS = [
  { base:"क", hal:"क्", roman:"k",  aryaVal:1,   kataVal:1 },
  { base:"ख", hal:"ख्", roman:"kh", aryaVal:2,   kataVal:2 },
  { base:"ग", hal:"ग्", roman:"g",  aryaVal:3,   kataVal:3 },
  { base:"घ", hal:"घ्", roman:"gh", aryaVal:4,   kataVal:4 },
  { base:"ङ", hal:"ङ्", roman:"ṅ",  aryaVal:5,   kataVal:5 },
  { base:"च", hal:"च्", roman:"c",  aryaVal:6,   kataVal:6 },
  { base:"छ", hal:"छ्", roman:"ch", aryaVal:7,   kataVal:7 },
  { base:"ज", hal:"ज्", roman:"j",  aryaVal:8,   kataVal:8 },
  { base:"झ", hal:"झ्", roman:"jh", aryaVal:9,   kataVal:9 },
  { base:"ञ", hal:"ञ्", roman:"ñ",  aryaVal:10,  kataVal:0 },
  { base:"ट", hal:"ट्", roman:"ṭ",  aryaVal:11,  kataVal:1 },
  { base:"ठ", hal:"ठ्", roman:"ṭh", aryaVal:12,  kataVal:2 },
  { base:"ड", hal:"ड्", roman:"ḍ",  aryaVal:13,  kataVal:3 },
  { base:"ढ", hal:"ढ्", roman:"ḍh", aryaVal:14,  kataVal:4 },
  { base:"ण", hal:"ण्", roman:"ṇ",  aryaVal:15,  kataVal:5 },
  { base:"त", hal:"त्", roman:"t",  aryaVal:16,  kataVal:6 },
  { base:"थ", hal:"थ्", roman:"th", aryaVal:17,  kataVal:7 },
  { base:"द", hal:"द्", roman:"d",  aryaVal:18,  kataVal:8 },
  { base:"ध", hal:"ध्", roman:"dh", aryaVal:19,  kataVal:9 },
  { base:"न", hal:"न्", roman:"n",  aryaVal:20,  kataVal:0 },
  { base:"प", hal:"प्", roman:"p",  aryaVal:21,  kataVal:1 },
  { base:"फ", hal:"फ्", roman:"ph", aryaVal:22,  kataVal:2 },
  { base:"ब", hal:"ब्", roman:"b",  aryaVal:23,  kataVal:3 },
  { base:"भ", hal:"भ्", roman:"bh", aryaVal:24,  kataVal:4 },
  { base:"म", hal:"म्", roman:"m",  aryaVal:25,  kataVal:5 },
  { base:"य", hal:"य्", roman:"y",  aryaVal:30,  kataVal:1 },
  { base:"र", hal:"र्", roman:"r",  aryaVal:40,  kataVal:2 },
  { base:"ल", hal:"ल्", roman:"l",  aryaVal:50,  kataVal:3 },
  { base:"व", hal:"व्", roman:"v",  aryaVal:60,  kataVal:4 },
  { base:"श", hal:"श्", roman:"ś",  aryaVal:70,  kataVal:5 },
  { base:"ष", hal:"ष्", roman:"ṣ",  aryaVal:80,  kataVal:6 },
  { base:"स", hal:"स्", roman:"s",  aryaVal:90,  kataVal:7 },
  { base:"ह", hal:"ह्", roman:"h",  aryaVal:100, kataVal:8 },
];

const CONS_MAP  = Object.fromEntries(CONSONANTS.map(c => [c.base, c]));
const VOWEL_MAP = Object.fromEntries(VOWELS.map(v => [v.base, v]));

// ─── Token helpers ─────────────────────────────────────────────────────────────

function isPending(tok) {
  return tok && tok.type === "syllable" && tok.vowelBase === null;
}

// ─── Aryabhata ─────────────────────────────────────────────────────────────────
// Now strictly requires vowelBase to be present.
function calcArya(tokens) {
  // We remove the internal fallback to "अ" to ensure the data is explicit
  const steps = [];
  let total = 0;
  
  for (const tok of tokens) {
    const consSum = tok.consonants.reduce((a, b) => a + (CONS_MAP[b]?.aryaVal ?? 0), 0);
    const v = VOWEL_MAP[tok.vowelBase]; // No ?? "अ" here anymore
    const exp = v.aryaExp;
    const mult = Math.pow(10, exp);
    const val = consSum * mult;
    const consParts = tok.consonants.map(c => `${c}=${CONS_MAP[c]?.aryaVal}`).join(" + ");
    
    steps.push({
      display: tok.display,
      detail: `(${consParts}) × 10^${exp} = ${consSum} × ${fmtN(mult)} = ${fmtN(val)}`,
      val,
    });
    total += val;
  }
  return { steps, total };
}

// ─── Kaṭapayādi ───────────────────────────────────────────────────────────────

function calcKata(tokens) {
  const steps = [];
  const digits = [];
  for (const tok of tokens) {
    if (tok.type === "vowel") {
      steps.push({ display: tok.display, detail: "standalone vowel — ignored", digit: null, skip: true });
      continue;
    }
    const lastCons = tok.consonants[tok.consonants.length - 1];
    const c = CONS_MAP[lastCons];
    const kv = c?.kataVal ?? 0;
    const hasVowel = tok.vowelBase !== null;
    const digit = hasVowel ? kv : 0;
    const clusterNote = tok.consonants.length > 1
      ? `cluster [${tok.consonants.join("·")}], last=${lastCons}`
      : lastCons;
    const valNote = hasVowel ? `${kv}` : `0  (no vowel)`;
    steps.push({
      display: tok.display,
      detail: `${clusterNote} → ${valNote}`,
      digit, skip: false,
    });
    digits.push(digit);
  }
  const reversed = [...digits].reverse();
  const total = reversed.length ? parseInt(reversed.join(""), 10) : 0;
  return { steps, digits, reversed, total };
}

function fmtN(n) {
  if (!Number.isFinite(n)) return "∞";
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toExponential(2);
}

// ─── Keyboard rows ─────────────────────────────────────────────────────────────

const CONS_ROWS = [
  CONSONANTS.slice(0, 10),
  CONSONANTS.slice(10, 20),
  CONSONANTS.slice(20),
];

// ─── Key component ─────────────────────────────────────────────────────────────

function Key({ dev, sub, color, bgBase, bgHov, borderBase, borderHov, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        minWidth: 48, padding: "7px 8px", borderRadius: 10, cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center",
        background: hov ? bgHov : bgBase,
        border: `1px solid ${hov ? borderHov : borderBase}`,
        transition: "all 0.13s", userSelect: "none",
        boxShadow: hov ? `0 2px 14px ${bgHov}` : "none",
      }}>
      <span style={{ fontSize: 22, lineHeight: 1.2, color, fontFamily: "'Noto Sans Devanagari', serif" }}>{dev}</span>
      <span style={{ fontSize: 10, marginTop: 0, color: "rgba(255,255,255,0.28)", fontFamily: "monospace", letterSpacing: "0.04em" }}>{sub}</span>
    </button>
  );
}

// ─── Toast / popup ─────────────────────────────────────────────────────────────

function Toast({ msg, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "linear-gradient(135deg, #1E1830, #160E28)",
        border: "1px solid rgba(200,168,74,0.35)", borderRadius: 18,
        padding: "32px 40px", textAlign: "center", maxWidth: 340,
        boxShadow: "0 20px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,168,74,0.1)",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>Note:</div>
        <p style={{ fontSize: 13, color: "#E8D8A0", lineHeight: 1.7, fontFamily: "Georgia, serif", fontStyle: "italic", marginBottom: 20 }}>{msg}</p>
        <button onClick={onClose} style={{
          padding: "8px 24px", borderRadius: 8, fontSize: 11, letterSpacing: "2px",
          color: "#C8A84A", background: "rgba(200,168,74,0.1)", border: "1px solid rgba(200,168,74,0.3)",
          cursor: "pointer",
        }}>OK</button>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function SanskritCalculator() {
  const [tokens,   setTokens]   = useState([]);
  const [result,   setResult]   = useState(null);   // { sys, total, steps, ... }
  const [showSteps,setShowSteps]= useState(false);
  const [animKey,  setAnimKey]  = useState(0);
  const [toast,    setToast]    = useState(null);

  const pressVowel = useCallback((vowel) => {
    setTokens(prev => {
      if (!prev.length)
        return [{ type:"vowel", display:vowel.base, consonants:[], vowelBase:vowel.base }];
      const last = prev[prev.length - 1];
      if (isPending(last)) {
        const stripped = last.display.replace(/्$/, "");
        const newDisplay = stripped + (vowel.matra === "" ? "" : vowel.matra);
        const updated = [...prev];
        updated[prev.length - 1] = { ...last, display: newDisplay, vowelBase: vowel.base };
        return updated;
      }
      return [...prev, { type:"vowel", display:vowel.base, consonants:[], vowelBase:vowel.base }];
    });
    setResult(null); setShowSteps(false);
  }, []);

  const pressConsonant = useCallback((cons) => {
    setTokens(prev => {
      if (!prev.length)
        return [{ type:"syllable", display:cons.hal, consonants:[cons.base], vowelBase:null }];
      const last = prev[prev.length - 1];
      if (isPending(last)) {
        const updated = [...prev];
        updated[prev.length - 1] = {
          ...last, display: last.display + cons.hal,
          consonants: [...last.consonants, cons.base],
        };
        return updated;
      }
      return [...prev, { type:"syllable", display:cons.hal, consonants:[cons.base], vowelBase:null }];
    });
    setResult(null); setShowSteps(false);
  }, []);

  const deleteLast = useCallback(() => {
    setTokens(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (last.type === "syllable" && last.consonants.length > 1) {
        const newCons = last.consonants.slice(0, -1);
        const rebuildDisplay =
          newCons.slice(0, -1).map(c => CONS_MAP[c]?.hal ?? c).join("") +
          (CONS_MAP[newCons[newCons.length - 1]]?.hal ?? "") +
          (last.vowelBase ? (VOWEL_MAP[last.vowelBase]?.matra ?? "") : "");
        return [...prev.slice(0, -1), { ...last, consonants: newCons, display: rebuildDisplay }];
      }
      return prev.slice(0, -1);
    });
    setResult(null); setShowSteps(false);
  }, []);

  const clearAll = () => { setTokens([]); setResult(null); setShowSteps(false); };

const calculate = (sys) => {
  if (!tokens.length) return;
  setShowSteps(false);

  if (sys === "arya") {
    // 1. Check for standalone vowels (e.g., 'इ' by itself)
    if (tokens.some(t => t.type === "vowel")) {
      setToast("Āryabhaṭa's numeral system operates on syllables (consonant + vowel). Standalone vowels without a preceding consonant are not supported.");
      return;
    }

    // 2. Check for standalone consonants / pending syllables (e.g., 'क्' at the end)
    if (tokens.some(t => t.vowelBase === null)) {
      setToast("In the Āryabhaṭa system, every consonant must be paired with a vowel to determine its magnitude. Please add a vowel to the trailing consonant.");
      return;
    }

    const r = calcArya(tokens);
    setResult({ sys, ...r });
  } else {
    // Kaṭapayādi usually treats standalone consonants as 0 or ignores them, 
    // so we keep the current logic there.
    setResult({ sys, ...calcKata(tokens) });
  }
  setAnimKey(k => k + 1);
};

  const wordDisplay = tokens.map(t => t.display).join("");
  const isArya = result?.sys === "arya";

  // colors
  const gold   = "#D4B866";
  const violet = "#B8A4E8";
  const goldDim   = "rgba(212,184,102,0.7)";
  const violetDim = "rgba(184,164,232,0.7)";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #12102A 0%, #0E0C1E 40%, #131028 100%)", color: "#DDD5C4", fontFamily: "'Noto Sans Devanagari', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@300;400;500&display=swap');
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { outline:none; font-family:inherit; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>

      {/* subtle radial glows */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        background:"radial-gradient(ellipse 80% 50% at 30% 0%, rgba(212,184,102,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 90% 100%, rgba(100,70,180,0.08) 0%, transparent 60%)" }} />

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <div style={{ position:"relative", zIndex:1, maxWidth:820, margin:"0 auto", padding:"36px 24px 80px" }}>

        {/* ── Header ── */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <h1 style={{
            fontSize:"clamp(20px, 4vw, 30px)", fontWeight:700, letterSpacing:4,
            fontFamily:"'Palatino Linotype', Palatino, Georgia, serif",
            background:"linear-gradient(135deg, #E8C870 0%, #C8A040 40%, #E0C060 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            marginBottom:6, lineHeight:1.4,
          }}>
            Ancient Sanskrit Numerology
          </h1>
          <p style={{ fontSize:11, letterSpacing:"4px", color:"rgba(255,255,255,0.2)", fontFamily:"Georgia,serif" }}>
            Āryabhaṭa  ·  Kaṭapayādi
          </p>
        </div>

        {/* ── Composer card ── */}
        <div style={{
          borderRadius:20,
          background:"linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.025) 100%)",
          border:"1px solid rgba(255,255,255,0.1)",
          boxShadow:"0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
          padding:"20px 22px 22px", marginBottom:20,
        }}>

          {/* word display — inline, no box */}
          <div style={{ minHeight:52, paddingRight:50, marginBottom:0, display:"flex", flexWrap:"wrap", alignItems:"center", gap:"2px 1px", position:"relative" }}>
            {tokens.length === 0 ? (
              <span style={{ fontSize:15, color:"rgba(255,255,255,0.15)", fontStyle:"italic", fontFamily:"Georgia,serif" }}>
                tap letters to compose eg.(ख्युघृ = ख् + य् + उ + घ् + ऋ)
              </span>
            ) : (
              <>
                {tokens.map((tok, i) => (
                  <button key={i} onClick={() => setTokens(p => p.filter((_,j)=>j!==i))}
                    title="tap to remove"
                    style={{
                      fontSize:32, lineHeight:1, padding:"0 3px",
                      color: tok.type==="vowel" ? "#C8B8F0" : gold,
                      background:"none", border:"none", cursor:"pointer",
                      fontFamily:"'Noto Sans Devanagari', serif",
                      transition:"opacity 0.15s",
                      opacity:1,
                    }}
                    onMouseEnter={e=>e.currentTarget.style.opacity="0.35"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    {tok.display}
                  </button>
                ))}
                
                <div style={{ position:"absolute", right:0, top:0, display:"flex", flexDirection:"column", gap:4 }}>
                  <button onClick={clearAll} style={{
                    fontSize:10, letterSpacing:"1px",
                    color:"rgba(255,255,255,0.2)", background:"none", border:"none", cursor:"pointer",
                    padding:"2px 4px", transition:"color 0.15s", textAlign:"right"
                  }}
                    onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}
                    onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.2)"}>
                    CLEAR
                  </button>
                  <button onClick={deleteLast} style={{
                    fontSize:10, letterSpacing:"1px",
                    color:"rgba(255,255,255,0.2)", background:"none", border:"none", cursor:"pointer",
                    padding:"2px 4px", transition:"color 0.15s", textAlign:"right"
                  }}
                    onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}
                    onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.2)"}>
                    ← BACK
                  </button>
                </div>
              </>
            )}
          </div>

          {/* separator */}
          <div style={{ height:1, background:"rgba(255,255,255,0.06)", marginBottom:18 }} />

          {/* ── VOWELS ── */}
          <p style={{ fontSize:9, letterSpacing:"3px", color:"rgba(184,164,232,0.5)", marginBottom:9 }}>VOWELS · स्वर</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:18 }}>
            {VOWELS.map(v => (
              <Key key={v.base} dev={v.base} sub={v.roman}
                color="#C8B8F0"
                bgBase="rgba(100,70,180,0.12)" bgHov="rgba(130,95,210,0.28)"
                borderBase="rgba(100,70,180,0.22)" borderHov="rgba(150,110,230,0.55)"
                onClick={() => pressVowel(v)} />
            ))}
          </div>

          {/* ── CONSONANTS ── */}
          <p style={{ fontSize:9, letterSpacing:"3px", color:"rgba(212,184,102,0.5)", marginBottom:9 }}>CONSONANTS · व्यञ्जन</p>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
            {CONS_ROWS.map((row,ri) => (
              <div key={ri} style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {row.map(c => (
                  <Key key={c.base} dev={c.hal} sub={c.roman+"·"}
                    color={gold}
                    bgBase="rgba(180,140,40,0.1)" bgHov="rgba(210,170,60,0.26)"
                    borderBase="rgba(180,140,40,0.2)" borderHov="rgba(220,180,70,0.55)"
                    onClick={() => pressConsonant(c)} />
                ))}
              </div>
            ))}
          </div>

          {/* separator */}
          <div style={{ height:1, background:"rgba(255,255,255,0.06)", marginBottom:14 }} />

          {/* ── Action row ── */}
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {[
              { sys:"arya", label:"Āryabhaṭa",  c:gold,   b1:"rgba(212,184,102,0.3)", b2:"rgba(212,184,102,0.6)", bg1:"rgba(212,184,102,0.08)", bg2:"rgba(212,184,102,0.18)" },
              { sys:"kata", label:"Kaṭapayādi", c:violet, b1:"rgba(140,110,220,0.3)", b2:"rgba(150,120,230,0.6)", bg1:"rgba(110,80,190,0.1)",   bg2:"rgba(120,90,200,0.22)"  },
            ].map(({ sys, label, c, b1, b2, bg1, bg2 }) => (
              <button key={sys} onClick={() => calculate(sys)} disabled={!tokens.length}
                style={{
                  flex:1, padding:"13px 12px", borderRadius:13, fontSize:12, letterSpacing:"3px",
                  fontWeight:500, color:c, background:bg1, border:`1px solid ${b1}`,
                  cursor:tokens.length?"pointer":"not-allowed", opacity:tokens.length?1:0.25,
                  transition:"all 0.18s",
                  boxShadow:tokens.length?`0 4px 20px ${bg1}`:"none",
                }}
                onMouseEnter={e=>{ if(tokens.length){ e.currentTarget.style.background=bg2; e.currentTarget.style.borderColor=b2; e.currentTarget.style.boxShadow=`0 6px 28px ${bg2}`; }}}
                onMouseLeave={e=>{ e.currentTarget.style.background=bg1; e.currentTarget.style.borderColor=b1; e.currentTarget.style.boxShadow=tokens.length?`0 4px 20px ${bg1}`:"none"; }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Result card ── */}
        {result && (
          <div key={animKey} style={{
            borderRadius:20, overflow:"hidden",
            background:"linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
            border:`1px solid ${isArya ? "rgba(212,184,102,0.22)" : "rgba(130,100,220,0.25)"}`,
            boxShadow:`0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 ${isArya?"rgba(212,184,102,0.08)":"rgba(130,100,220,0.08)"}`,
            animation:"scaleIn 0.3s ease",
          }}>

            {/* system pill + word */}
            <div style={{ padding:"16px 22px", display:"flex", alignItems:"center", gap:12,
              borderBottom:`1px solid ${isArya?"rgba(212,184,102,0.1)":"rgba(130,100,220,0.12)"}` }}>
              <span style={{
                fontSize:9, letterSpacing:"4px", padding:"5px 14px", borderRadius:20,
                background: isArya?"rgba(212,184,102,0.12)":"rgba(110,80,190,0.18)",
                border:`1px solid ${isArya?"rgba(212,184,102,0.32)":"rgba(130,100,220,0.38)"}`,
                color: isArya?gold:violet,
              }}>
                {isArya ? "ĀRYABHAṬA" : "KAṬAPAYĀDI"}
              </span>
              <span style={{ fontSize:26, color:"rgba(255,255,255,0.25)", fontFamily:"Noto Sans Devanagari,serif" }}>
                {wordDisplay}
              </span>
            </div>

            {/* ── Big answer ── */}
            <div style={{
              padding:"30px 24px 24px", textAlign:"center",
              background: isArya
                ? "linear-gradient(180deg, rgba(212,184,102,0.04) 0%, transparent 100%)"
                : "linear-gradient(180deg, rgba(110,80,190,0.07) 0%, transparent 100%)",
            }}>
              <p style={{ fontSize:9, letterSpacing:"5px", color:isArya?goldDim:violetDim, marginBottom:14, opacity:0.7 }}>
                NUMERICAL VALUE
              </p>
              <p style={{
                fontSize:68, fontWeight:700, lineHeight:1,
                fontFamily:"'Palatino Linotype', Palatino, serif",
                background: isArya
                  ? "linear-gradient(135deg, #F0D070 0%, #C89030 50%, #E8C050 100%)"
                  : "linear-gradient(135deg, #D0C0FF 0%, #9070D0 50%, #C8B0F8 100%)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                marginBottom:10,
              }}>
                {result.total.toLocaleString()}
              </p>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.2)", fontFamily:"Noto Sans Devanagari,serif", marginBottom:20 }}>
                {wordDisplay}
              </p>

              {/* "View Calculation" toggle */}
              <button onClick={() => setShowSteps(s => !s)} style={{
                padding:"9px 22px", borderRadius:10, fontSize:11, letterSpacing:"2px",
                color: isArya ? gold : violet,
                background: isArya?"rgba(212,184,102,0.07)":"rgba(110,80,190,0.1)",
                border:`1px solid ${isArya?"rgba(212,184,102,0.22)":"rgba(130,100,220,0.28)"}`,
                cursor:"pointer", transition:"all 0.18s",
              }}
                onMouseEnter={e=>{ e.currentTarget.style.background=isArya?"rgba(212,184,102,0.16)":"rgba(110,80,190,0.22)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=isArya?"rgba(212,184,102,0.07)":"rgba(110,80,190,0.1)"; }}>
                {showSteps ? "▲ Hide Calculation" : "▼ View Calculation"}
              </button>
            </div>

            {/* ── Expandable steps ── */}
            {showSteps && (
              <div style={{ borderTop:`1px solid ${isArya?"rgba(212,184,102,0.1)":"rgba(130,100,220,0.12)"}`, animation:"fadeUp 0.25s ease" }}>
                <div style={{ padding:"16px 22px", display:"flex", flexDirection:"column", gap:0 }}>
                  {isArya
                    ? result.steps.map((s, i) => (
                        <div key={i} style={{
                          display:"flex", alignItems:"center", gap:14, padding:"10px 0",
                          borderBottom:"1px solid rgba(255,255,255,0.04)",
                        }}>
                          <span style={{ fontSize:26, width:48, textAlign:"center", flexShrink:0,
                            color:gold, fontFamily:"Noto Sans Devanagari,serif" }}>{s.display}</span>
                          <span style={{ flex:1, fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"monospace", lineHeight:1.7 }}>{s.detail}</span>
                          <span style={{ fontSize:14, fontWeight:600, color:gold, flexShrink:0, fontFamily:"monospace", minWidth:48, textAlign:"right" }}>
                            {fmtN(s.val)}
                          </span>
                        </div>
                      ))
                    : result.steps.map((s, i) => (
                        <div key={i} style={{
                          display:"flex", alignItems:"center", gap:14, padding:"10px 0",
                          borderBottom:"1px solid rgba(255,255,255,0.04)",
                          opacity: s.skip ? 0.25 : 1,
                        }}>
                          <span style={{ fontSize:26, width:48, textAlign:"center", flexShrink:0,
                            color: s.skip?"rgba(255,255,255,0.2)":violet, fontFamily:"Noto Sans Devanagari,serif" }}>{s.display}</span>
                          <span style={{ flex:1, fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"monospace", lineHeight:1.7 }}>{s.detail}</span>
                          {!s.skip && (
                            <span style={{ fontSize:14, fontWeight:600, color:violet, flexShrink:0, fontFamily:"monospace", minWidth:48, textAlign:"right" }}>
                              {s.digit}
                            </span>
                          )}
                        </div>
                      ))
                  }
                </div>

                {/* sum / reverse note */}
                <div style={{ padding:"8px 22px 20px" }}>
                  {isArya && result.steps.length > 1 && (
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.22)", fontFamily:"monospace", lineHeight:2, padding:"8px 12px", background:"rgba(255,255,255,0.025)", borderRadius:8 }}>
                      {result.steps.map(s => fmtN(s.val)).join(" + ")}
                      <span style={{ color:gold }}> = {fmtN(result.total)}</span>
                    </div>
                  )}
                  {!isArya && result.digits.length > 0 && (
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.22)", fontFamily:"monospace", lineHeight:2, padding:"8px 12px", background:"rgba(255,255,255,0.025)", borderRadius:8 }}>
                      digits [{result.digits.join(", ")}]
                      <span style={{ color:"rgba(255,255,255,0.4)" }}> → reversed → </span>
                      [{result.reversed.join(", ")}]
                      <span style={{ color:violet }}> = {result.total}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}