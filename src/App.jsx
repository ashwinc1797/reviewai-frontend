import { useState, useEffect } from "react";

// ── Gemini API helper ──────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function qrUrl(text, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

// ── Seed data ─────────────────────────────────────────────────────────────
const SEED_BUSINESSES = [{
  id: "b1", name: "Chhavi's Miracle Salon", type: "Salon",
  gmb: "https://g.page/r/example-salon/review", city: "Pune",
  rating: 4.8, totalReviews: 127, scansToday: 14, scansWeek: 89,
  whatsapp: "919876543210",
}];

const SEED_REVIEWS = [
  { id: "r1", biz: "b1", author: "Priya S.",  rating: 5, text: "Amazing haircut! Very professional staff and clean environment. Will definitely come back!", date: "2025-05-10", replied: false, aiReply: "" },
  { id: "r2", biz: "b1", author: "Rahul M.",  rating: 4, text: "Good service overall. The waiting time was a bit long but the results were worth it.", date: "2025-05-09", replied: true,  aiReply: "Thank you Rahul! We're working on reducing wait times. See you soon!" },
  { id: "r3", biz: "b1", author: "Sneha K.",  rating: 3, text: "Average experience. Expected more from the pricing.", date: "2025-05-08", replied: false, aiReply: "" },
  { id: "r4", biz: "b1", author: "Amit P.",   rating: 5, text: "Best salon in Pune! The staff is super friendly and the results are fantastic.", date: "2025-05-07", replied: false, aiReply: "" },
];

const SEED_FEEDBACK = [
  { id: "f1", rating: 2, issue: "Long waiting time",  details: "Had to wait 45 minutes even with an appointment. Very disappointed.", contact: "9823456789",        date: "2025-05-11", resolved: false },
  { id: "f2", rating: 1, issue: "Staff behaviour",    details: "The receptionist was very dismissive and unhelpful.",               contact: "",                   date: "2025-05-09", resolved: true  },
  { id: "f3", rating: 3, issue: "Product quality",    details: "The hair colour faded within a week. Expected better for the price.", contact: "meera.k@gmail.com", date: "2025-05-07", resolved: false },
];

const SCAN_DATA = [
  { day: "Mon", scans: 12 }, { day: "Tue", scans: 19 }, { day: "Wed", scans: 8 },
  { day: "Thu", scans: 24 }, { day: "Fri", scans: 31 }, { day: "Sat", scans: 28 }, { day: "Sun", scans: 14 },
];

const ISSUE_OPTIONS = ["Long waiting time","Staff behaviour","Service quality","Pricing / value","Cleanliness","Product quality","Other"];

// ── Styles ────────────────────────────────────────────────────────────────
const S = {
  app:     { fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"#0f0f13", color:"#e8e6f0" },
  sidebar: { width:220, background:"#16151c", borderRight:"1px solid #2a2835", display:"flex", flexDirection:"column", padding:"24px 0", position:"fixed", top:0, left:0, bottom:0, zIndex:100 },
  main:    { marginLeft:220, padding:"32px 36px", minHeight:"100vh" },
  logo:    { padding:"0 20px 28px", fontSize:20, fontWeight:700, letterSpacing:"-0.5px", color:"#fff", display:"flex", alignItems:"center", gap:8 },
  logoIcon:{ width:32, height:32, background:"linear-gradient(135deg,#7c5cfc,#c084fc)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 },
  navItem: (a) => ({ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", margin:"2px 8px", borderRadius:8, cursor:"pointer", fontSize:14, fontWeight:500, color:a?"#fff":"#8b88a0", background:a?"#2a2640":"transparent", borderLeft:a?"3px solid #7c5cfc":"3px solid transparent", transition:"all 0.15s" }),
  card:    { background:"#1c1b24", border:"1px solid #2a2835", borderRadius:14, padding:"20px 24px" },
  statCard:{ background:"#1c1b24", border:"1px solid #2a2835", borderRadius:14, padding:"20px 24px", flex:1 },
  btn: (v="primary") => ({
    display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", transition:"all 0.15s",
    ...(v==="primary"?{background:"#7c5cfc",color:"#fff"}:
        v==="ghost"  ?{background:"transparent",color:"#8b88a0",border:"1px solid #2a2835"}:
        v==="success"?{background:"#16a34a22",color:"#4ade80",border:"1px solid #4ade8040"}:
        v==="danger" ?{background:"#dc262622",color:"#f87171",border:"1px solid #f8717140"}:
        v==="red"    ?{background:"#ef4444",color:"#fff"}:
                      {background:"#2a2640",color:"#c4b5fd"})
  }),
  input:  { background:"#12111a", border:"1px solid #2a2835", borderRadius:8, padding:"10px 14px", color:"#e8e6f0", fontSize:13, width:"100%", outline:"none", boxSizing:"border-box" },
  badge:  (c) => ({ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, ...(c==="green"?{background:"#16a34a22",color:"#4ade80"}:c==="amber"?{background:"#d9770622",color:"#fbbf24"}:c==="red"?{background:"#ef444422",color:"#f87171"}:{background:"#7c5cfc22",color:"#c4b5fd"}) }),
  h1:     { fontSize:24, fontWeight:700, color:"#fff", margin:"0 0 4px", letterSpacing:"-0.5px" },
  h2:     { fontSize:18, fontWeight:600, color:"#fff", margin:"0 0 16px" },
  muted:  { fontSize:13, color:"#6b6880" },
};

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.scans));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
      {data.map(d => (
        <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ width:"100%", background:"#7c5cfc44", borderRadius:4, overflow:"hidden", height:64, display:"flex", alignItems:"flex-end" }}>
            <div style={{ width:"100%", height:`${(d.scans/max)*100}%`, background:"linear-gradient(to top,#7c5cfc,#c084fc)", borderRadius:4, transition:"height 0.6s ease" }} />
          </div>
          <span style={{ fontSize:10, color:"#6b6880" }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function Stars({ rating, size=14 }) {
  return <span style={{ fontSize:size, letterSpacing:1 }}>{[1,2,3,4,5].map(i=><span key={i} style={{ color:i<=rating?"#fbbf24":"#3a3848" }}>★</span>)}</span>;
}

function RatingPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:6 }}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} onClick={()=>onChange(i)} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}
          style={{ fontSize:34, cursor:"pointer", color:i<=(hover||value)?"#fbbf24":"#2a2835", transition:"color 0.1s", lineHeight:1 }}>★</span>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CUSTOMER PAGE  —  with review gating
// ══════════════════════════════════════════════════════════════════════════
function CustomerReviewPage({ biz, apiKey, onBack, onFeedbackSubmit }) {
  const [step,       setStep]       = useState("rate");
  const [rating,     setRating]     = useState(0);
  const [suggestions,setSuggestions]= useState([]);
  const [chosen,     setChosen]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [confirmed,  setConfirmed]  = useState(null);
  const [issue,      setIssue]      = useState("");
  const [details,    setDetails]    = useState("");
  const [contact,    setContact]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ratingLabels = ["","Very poor","Below average","Average","Good","Excellent"];
  const isHappy = rating >= 4;

  async function handleContinue() {
    if (!rating) return;
    if (isHappy) {
      setLoading(true);
      try {
        const prompt = `You are a review writing assistant for a ${biz.type} called "${biz.name}" in ${biz.city}.
The customer wants to leave a ${rating}-star Google review.
Generate exactly 3 short, natural, authentic-sounding review suggestions (2-3 sentences each).
Format as JSON array: ["review1","review2","review3"]
Only return the JSON array, nothing else.`;
        const text = await callGemini(apiKey, prompt);
        const clean = text.replace(/```json|```/g,"").trim();
        setSuggestions(JSON.parse(clean));
      } catch { setSuggestions([]); }
      setLoading(false);
      setStep("suggest");
    } else {
      setStep("feedback");
    }
  }

  async function handleSelectReview(text) {
    setChosen(text);
    try { await navigator.clipboard.writeText(text); setCopied(true); }
    catch { setCopied(false); }
    setStep("redirect");
  }

  function openGoogle() { window.open(biz.gmb,"_blank"); setStep("confirm"); }

  function submitFeedback() {
    if (!issue) return;
    setSubmitting(true);
    const entry = { id:`f${Date.now()}`, rating, issue, details, contact, date: new Date().toISOString().slice(0,10), resolved:false };
    onFeedbackSubmit?.(entry);
    setTimeout(() => { setSubmitting(false); setStep("feedbackDone"); }, 600);
  }

  const happySteps   = ["rate","suggest","redirect","confirm","done"];
  const unhappySteps = ["rate","feedback","feedbackDone"];
  const allSteps = (step==="feedback"||step==="feedbackDone") ? unhappySteps : happySteps;
  const stepIdx  = allSteps.indexOf(step);
  const dotColor = (!isHappy && step!=="rate") ? "#ef4444" : "#7c5cfc";

  return (
    <div style={{ minHeight:"100vh", background:"#0f0f13", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ maxWidth:460, width:"100%" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:64, height:64, background: (!isHappy && step!=="rate") ? "linear-gradient(135deg,#dc2626,#f97316)" : "linear-gradient(135deg,#7c5cfc,#c084fc)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 14px", transition:"background 0.4s" }}>
            {(step==="feedback"||step==="feedbackDone") ? "💬" : "⭐"}
          </div>
          <h1 style={{ ...S.h1, fontSize:22 }}>
            {step==="feedback"     ? "We're sorry to hear that" :
             step==="feedbackDone" ? "Thank you for telling us" :
             "How was your experience?"}
          </h1>
          <p style={{ color:"#8b88a0", fontSize:14, marginTop:6 }}>{biz.name} · {biz.city}</p>
        </div>

        {/* Progress dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:24 }}>
          {allSteps.map((s,i)=>(
            <div key={s} style={{ width:i<=stepIdx?20:6, height:6, borderRadius:3, background:i<=stepIdx?dotColor:"#2a2835", transition:"all 0.3s" }} />
          ))}
        </div>

        <div style={{ ...S.card, borderRadius:20 }}>

          {/* ── Rate ────────────────────────────────────────────────── */}
          {step==="rate" && (
            <div>
              <p style={{ color:"#8b88a0", fontSize:14, marginBottom:20, textAlign:"center" }}>Tap a star to rate your visit</p>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
                <RatingPicker value={rating} onChange={setRating} />
              </div>
              {rating>0 && (
                <p style={{ textAlign:"center", fontSize:13, marginBottom:20, fontWeight:600, color:isHappy?"#c4b5fd":"#f97316" }}>
                  {ratingLabels[rating]}
                </p>
              )}
              {/* Dynamic hint */}
              {rating>0 && !isHappy && (
                <div style={{ background:"#ef444411", border:"1px solid #ef444430", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#f87171", lineHeight:1.5 }}>
                  💬 Your feedback will go directly to the owner — not posted on Google.
                </div>
              )}
              <button
                style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", opacity:rating?1:0.4, padding:"12px", fontSize:15, background: rating&&!isHappy?"#ef4444":"#7c5cfc" }}
                onClick={handleContinue} disabled={!rating||loading}>
                {loading ? "✨ Getting suggestions…" : isHappy||!rating ? "Continue →" : "Share private feedback →"}
              </button>
            </div>
          )}

          {/* ── Suggest (happy) ──────────────────────────────────────── */}
          {step==="suggest" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <p style={{ color:"#fff", fontWeight:600, fontSize:15, margin:0 }}>Pick a review</p>
                  <p style={{ color:"#8b88a0", fontSize:12, margin:"4px 0 0" }}>AI-generated — tap one to select it</p>
                </div>
                <Stars rating={rating} size={16} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
                {suggestions.length>0 ? suggestions.map((s,i)=>(
                  <div key={i} onClick={()=>handleSelectReview(s)}
                    style={{ background:"#12111a", border:"1px solid #2a2835", borderRadius:10, padding:"12px 14px", cursor:"pointer", fontSize:13, color:"#d4d0e8", lineHeight:1.6, transition:"all 0.15s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cfc"; e.currentTarget.style.background="#1a1828"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a2835"; e.currentTarget.style.background="#12111a"; }}>
                    <span style={{ color:"#6b6880", fontSize:11, display:"block", marginBottom:4 }}>Option {i+1}</span>
                    {s}
                  </div>
                )) : (
                  <div>
                    <textarea placeholder="Write your own review…" rows={4} style={{ ...S.input, resize:"vertical" }} onChange={e=>setChosen(e.target.value)} />
                    <button style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", marginTop:10 }} onClick={()=>handleSelectReview(chosen)}>Use this review →</button>
                  </div>
                )}
              </div>
              <button style={{ ...S.btn("ghost"), fontSize:11 }} onClick={()=>setStep("rate")}>← Change rating</button>
            </div>
          )}

          {/* ── Redirect + instructions (happy) ─────────────────────── */}
          {step==="redirect" && (
            <div>
              <div style={{ background:copied?"#16a34a22":"#d9770622", border:`1px solid ${copied?"#4ade8040":"#fbbf2440"}`, borderRadius:10, padding:"10px 14px", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:18 }}>{copied?"📋":"⚠️"}</span>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:13, color:copied?"#4ade80":"#fbbf24" }}>{copied?"Review text copied to clipboard!":"Please copy your review text manually"}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#8b88a0" }}>{copied?"It's ready to paste on Google":"Clipboard access was blocked"}</p>
                </div>
              </div>
              <div style={{ background:"#12111a", border:"1px solid #2a2835", borderRadius:10, padding:"12px 14px", marginBottom:20, fontSize:13, color:"#c8c5d8", lineHeight:1.65 }}>
                <span style={{ color:"#6b6880", fontSize:11, display:"block", marginBottom:6 }}>Your review</span>
                {chosen}
              </div>
              {!copied && (
                <button style={{ ...S.btn(), width:"100%", justifyContent:"center", marginBottom:14 }}
                  onClick={()=>navigator.clipboard.writeText(chosen).then(()=>setCopied(true))}>
                  📋 Copy review text
                </button>
              )}
              <div style={{ marginBottom:20 }}>
                <p style={{ color:"#8b88a0", fontSize:11, marginBottom:12, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>How to post on Google</p>
                {[
                  { n:1, text:"Tap the button below to open Google Reviews", icon:"👆" },
                  { n:2, text:"Tap the star rating on Google",                icon:"⭐" },
                  { n:3, text:"Tap the text box and paste your review",       icon:"📝" },
                  { n:4, text:"Tap 'Post' to submit your review",             icon:"✅" },
                ].map(s=>(
                  <div key={s.n} style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:"#2a2640", border:"1px solid #7c5cfc44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#c4b5fd", flexShrink:0, fontWeight:700 }}>{s.n}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:3 }}>
                      <span style={{ fontSize:14 }}>{s.icon}</span>
                      <span style={{ fontSize:13, color:"#c8c5d8" }}>{s.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", padding:"13px", fontSize:15 }} onClick={openGoogle}>
                Open Google Reviews →
              </button>
            </div>
          )}

          {/* ── Confirm (happy) ──────────────────────────────────────── */}
          {step==="confirm" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:44, marginBottom:16 }}>📝</div>
              <h2 style={{ ...S.h2, margin:"0 0 8px", fontSize:18 }}>Did you submit the review?</h2>
              <p style={{ color:"#8b88a0", fontSize:14, marginBottom:24 }}>Google Reviews opened in a new tab. Let us know if you posted it!</p>
              <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
                <button style={{ ...S.btn("success"), padding:"12px 28px", fontSize:14 }} onClick={()=>{ setConfirmed(true); setStep("done"); }}>✓ Yes, I submitted it!</button>
                <button style={{ ...S.btn("ghost"),   padding:"12px 20px", fontSize:14 }} onClick={()=>{ setConfirmed(false); setStep("done"); }}>Not yet</button>
              </div>
            </div>
          )}

          {/* ── Done (happy) ─────────────────────────────────────────── */}
          {step==="done" && (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ fontSize:52, marginBottom:16 }}>{confirmed?"🎉":"💛"}</div>
              <h2 style={{ ...S.h2, margin:"0 0 10px" }}>{confirmed?"Thank you so much!":"No worries!"}</h2>
              <p style={{ color:"#8b88a0", fontSize:14, lineHeight:1.6 }}>
                {confirmed ? `Your review means the world to ${biz.name}. We'll keep working hard for you!`
                           : "You can always post later. Just open Google Maps and search for us!"}
              </p>
              {!confirmed && <button style={{ ...S.btn("primary"), marginTop:20, justifyContent:"center" }} onClick={openGoogle}>Try again →</button>}
              <div style={{ marginTop:20, padding:"12px 16px", background:"#12111a", borderRadius:10, fontSize:12, color:"#6b6880" }}>
                {confirmed ? "Reviews may take a few minutes to appear on Google" : "We appreciate you taking the time!"}
              </div>
            </div>
          )}

          {/* ── Private feedback form (unhappy) ─────────────────────── */}
          {step==="feedback" && (
            <div>
              {/* Private badge */}
              <div style={{ background:"#ef444411", border:"1px solid #ef444430", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:18, flexShrink:0 }}>🔒</span>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:13, color:"#f87171" }}>We value your feedback</p>
                  <p style={{ margin:"3px 0 0", fontSize:12, color:"#8b88a0", lineHeight:1.5 }}>This goes directly to the owner — not posted on Google. Thank you for helping us improve.</p>
                </div>
              </div>

              {/* Rating row */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"10px 14px", background:"#12111a", borderRadius:8 }}>
                <Stars rating={rating} size={16} />
                <span style={{ fontSize:13, color:"#8b88a0" }}>{ratingLabels[rating]} experience</span>
                <button style={{ marginLeft:"auto", background:"none", border:"none", color:"#6b6880", fontSize:11, cursor:"pointer" }} onClick={()=>setStep("rate")}>Change</button>
              </div>

              {/* Issue chips */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, color:"#8b88a0", display:"block", marginBottom:8 }}>What went wrong? <span style={{ color:"#ef4444" }}>*</span></label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {ISSUE_OPTIONS.map(opt=>(
                    <button key={opt} onClick={()=>setIssue(opt)}
                      style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:500, cursor:"pointer", border:"none", transition:"all 0.15s", background:issue===opt?"#ef4444":"#2a2835", color:issue===opt?"#fff":"#8b88a0" }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, color:"#8b88a0", display:"block", marginBottom:6 }}>Tell us more (optional)</label>
                <textarea rows={3} placeholder="What happened? The more you share, the better we can fix it." value={details} onChange={e=>setDetails(e.target.value)} style={{ ...S.input, resize:"vertical" }} />
              </div>

              {/* Contact */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, color:"#8b88a0", display:"block", marginBottom:6 }}>Phone / Email (optional — so we can make it right)</label>
                <input style={S.input} placeholder="9876543210 or you@email.com" value={contact} onChange={e=>setContact(e.target.value)} />
              </div>

              <button style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", padding:"12px", fontSize:15, background:"#ef4444", opacity:issue?1:0.4 }}
                onClick={submitFeedback} disabled={!issue||submitting}>
                {submitting ? "Sending…" : "Send feedback →"}
              </button>
            </div>
          )}

          {/* ── Feedback submitted (unhappy) ─────────────────────────── */}
          {step==="feedbackDone" && (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🙏</div>
              <h2 style={{ ...S.h2, margin:"0 0 10px" }}>We hear you.</h2>
              <p style={{ color:"#8b88a0", fontSize:14, lineHeight:1.65, marginBottom:20 }}>
                Your feedback has been sent directly to the owner. We're sorry your experience wasn't great — we'll work hard to fix it.
              </p>
              {contact && (
                <div style={{ background:"#16a34a11", border:"1px solid #4ade8030", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#4ade80" }}>
                  ✓ We'll reach out to you at {contact}
                </div>
              )}
              {biz.whatsapp && (
                <a href={`https://wa.me/${biz.whatsapp}?text=${encodeURIComponent(`Hi, I recently visited ${biz.name} and left private feedback. I'd like to discuss my experience.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ ...S.btn("success"), textDecoration:"none", justifyContent:"center", display:"inline-flex", marginBottom:12 }}>
                  💬 Chat on WhatsApp
                </a>
              )}
              <p style={{ fontSize:11, color:"#6b6880", marginTop:8 }}></p>
            </div>
          )}

        </div>

        <div style={{ textAlign:"center", marginTop:20 }}>
          <button style={{ background:"none", border:"none", color:"#6b6880", fontSize:12, cursor:"pointer" }} onClick={onBack}>← Back to dashboard</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEWS
// ══════════════════════════════════════════════════════════════════════════
function Overview({ businesses, reviews, feedback, onPreviewPage }) {
  const biz = businesses[0];
  const avgRating   = (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1);
  const unreplied   = reviews.filter(r=>!r.replied).length;
  const newFeedback = feedback.filter(f=>!f.resolved).length;

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={S.h1}>Dashboard</h1>
        <p style={S.muted}>Welcome back! Here's how {biz.name} is performing.</p>
      </div>

      <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
        {[
          { label:"Total Reviews",   value:reviews.length, sub:"All time",      icon:"⭐" },
          { label:"Avg Rating",      value:avgRating,       sub:"Google",        icon:"📊" },
          { label:"Scans Today",     value:biz.scansToday,  sub:"+22% vs yesterday", icon:"📱" },
          { label:"Pending Replies", value:unreplied,       sub:"Need attention",icon:"💬" },
          { label:"Private Feedback",value:newFeedback,     sub:"Unresolved",    icon:"🔒" },
        ].map(s=>(
          <div key={s.label} style={S.statCard}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ ...S.muted, margin:"0 0 6px" }}>{s.label}</p>
                <p style={{ fontSize:28, fontWeight:700, color:s.label==="Private Feedback"&&newFeedback>0?"#f87171":"#fff", margin:0 }}>{s.value}</p>
                <p style={{ fontSize:12, color:"#6b6880", margin:"4px 0 0" }}>{s.sub}</p>
              </div>
              <span style={{ fontSize:22 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {newFeedback>0 && (
        <div style={{ background:"#ef444411", border:"1px solid #ef444430", borderRadius:12, padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <p style={{ margin:0, fontWeight:600, fontSize:14, color:"#f87171" }}>{newFeedback} unhappy customer{newFeedback>1?"s":""} need attention</p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:"#8b88a0" }}>Resolve private feedback before it becomes a bad Google review</p>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div style={S.card}>
          <h2 style={{ ...S.h2, fontSize:15 }}>QR Scans this week</h2>
          <BarChart data={SCAN_DATA} />
          <p style={{ ...S.muted, marginTop:12, textAlign:"right" }}>Total: {SCAN_DATA.reduce((a,d)=>a+d.scans,0)} scans</p>
        </div>
        <div style={S.card}>
          <h2 style={{ ...S.h2, fontSize:15 }}>Rating breakdown</h2>
          {[5,4,3,2,1].map(star=>{
            const count = reviews.filter(r=>r.rating===star).length;
            const pct   = Math.round((count/reviews.length)*100);
            return (
              <div key={star} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:12, color:"#fbbf24", width:20 }}>{star}★</span>
                <div style={{ flex:1, height:6, background:"#12111a", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:star>=4?"#4ade80":star===3?"#fbbf24":"#f87171", borderRadius:4 }} />
                </div>
                <span style={{ fontSize:11, color:"#6b6880", width:30, textAlign:"right" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...S.card, marginTop:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ color:"#fff", fontWeight:600, margin:"0 0 4px" }}>Preview customer scan page</p>
          <p style={{ ...S.muted, margin:0 }}>See both paths — happy (Google) and unhappy (private feedback)</p>
        </div>
        <button style={S.btn("primary")} onClick={onPreviewPage}>Preview page →</button>
      </div>
    </div>
  );
}

function QRManager({ businesses }) {
  const biz = businesses[0];
  const [size, setSize]       = useState(200);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [label, setLabel]     = useState(biz.name);
  const previewUrl = qrUrl(biz.gmb, size);

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={S.h1}>QR Code Manager</h1>
        <p style={S.muted}>Generate and customize QR codes for your business.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        <div style={S.card}>
          <h2 style={{ ...S.h2, fontSize:15 }}>Customize your QR</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:"#8b88a0", display:"block", marginBottom:6 }}>Google Review URL</label>
              <input style={S.input} defaultValue={biz.gmb} readOnly />
            </div>
            <div>
              <label style={{ fontSize:12, color:"#8b88a0", display:"block", marginBottom:6 }}>Label text</label>
              <input style={S.input} value={label} onChange={e=>setLabel(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:12, color:"#8b88a0", display:"block", marginBottom:6 }}>Size: {size}×{size}px</label>
              <input type="range" min={100} max={400} step={50} value={size} onChange={e=>setSize(+e.target.value)} style={{ width:"100%", accentColor:"#7c5cfc" }} />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <a href={previewUrl} download="qr-code.png" style={{ ...S.btn("primary"), textDecoration:"none", flex:1, justifyContent:"center" }}>⬇ Download PNG</a>
              <button style={{ ...S.btn(), flex:1, justifyContent:"center" }} onClick={()=>navigator.clipboard?.writeText(biz.gmb)}>📋 Copy URL</button>
            </div>
          </div>
        </div>
        <div style={{ ...S.card, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
          <div style={{ background:bgColor, padding:20, borderRadius:12 }}>
            <img src={previewUrl} alt="QR" style={{ display:"block", width:Math.min(size,200), height:Math.min(size,200) }} />
          </div>
          {label && <p style={{ color:"#e8e6f0", fontWeight:600, fontSize:14, margin:0, textAlign:"center" }}>{label}</p>}
          <p style={{ ...S.muted, fontSize:12 }}>Scan to leave a Google review</p>
          <div style={{ display:"flex", gap:8 }}>
            {["#ffffff","#000000","#7c5cfc22"].map(c=>(
              <div key={c} onClick={()=>setBgColor(c)} style={{ width:24, height:24, borderRadius:6, background:c||"#0f0f13", border:bgColor===c?"2px solid #7c5cfc":"2px solid #2a2835", cursor:"pointer" }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ ...S.card, marginTop:20 }}>
        <h2 style={{ ...S.h2, fontSize:15 }}>QR Performance</h2>
        <div style={{ display:"flex", gap:32 }}>
          {[{ label:"Total scans", value:biz.scansWeek+189 },{ label:"This week", value:biz.scansWeek },{ label:"Today", value:biz.scansToday },{ label:"Conversion", value:"34%" }].map(s=>(
            <div key={s.label}>
              <p style={{ ...S.muted, margin:"0 0 4px" }}>{s.label}</p>
              <p style={{ fontSize:22, fontWeight:700, color:"#fff", margin:0 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewInbox({ reviews, setReviews, apiKey }) {
  const [filter,    setFilter]    = useState("all");
  const [generating,setGenerating]= useState({});
  const [replying,  setReplying]  = useState({});
  const [editTexts, setEditTexts] = useState({});

  const filtered = reviews.filter(r=>filter==="all"?true:filter==="unreplied"?!r.replied:r.replied);

  async function generateReply(review) {
    setGenerating(g=>({...g,[review.id]:true}));
    try {
      const prompt = `You are the owner of "${SEED_BUSINESSES[0].name}", a ${SEED_BUSINESSES[0].type}.
Write a warm, professional, concise reply (2-3 sentences) to this ${review.rating}-star Google review:
"${review.text}"
Reply directly as the owner. Be genuine, not corporate. No hashtags.`;
      const reply = await callGemini(apiKey, prompt);
      setEditTexts(t=>({...t,[review.id]:reply.trim()}));
      setReplying(r=>({...r,[review.id]:true}));
    } catch {
      setEditTexts(t=>({...t,[review.id]:"Unable to generate. Please write manually."}));
      setReplying(r=>({...r,[review.id]:true}));
    }
    setGenerating(g=>({...g,[review.id]:false}));
  }

  function postReply(review) {
    setReviews(prev=>prev.map(r=>r.id===review.id?{...r,replied:true,aiReply:editTexts[review.id]||""}:r));
    setReplying(r=>({...r,[review.id]:false}));
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={S.h1}>Review Inbox</h1>
          <p style={S.muted}>Manage and reply to Google reviews with AI.</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["all","unreplied","replied"].map(f=>(
            <button key={f} style={{ ...S.btn(filter===f?"primary":"ghost"), textTransform:"capitalize", fontSize:12 }} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {filtered.map(review=>(
          <div key={review.id} style={{ ...S.card, borderLeft:`3px solid ${review.rating>=4?"#4ade80":review.rating===3?"#fbbf24":"#f87171"}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"#2a2640", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color:"#c4b5fd" }}>{review.author[0]}</div>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:14, color:"#fff" }}>{review.author}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#6b6880" }}>{review.date}</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Stars rating={review.rating} size={13} />
                <span style={S.badge(review.replied?"green":"amber")}>{review.replied?"Replied":"Pending"}</span>
              </div>
            </div>
            <p style={{ fontSize:14, color:"#c8c5d8", lineHeight:1.65, margin:"0 0 12px" }}>{review.text}</p>
            {review.replied&&review.aiReply&&(
              <div style={{ background:"#12111a", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#8b88a0", borderLeft:"2px solid #7c5cfc" }}>
                <span style={{ color:"#7c5cfc", fontSize:11, fontWeight:600, display:"block", marginBottom:4 }}>Your reply</span>
                {review.aiReply}
              </div>
            )}
            {!review.replied&&(
              !replying[review.id] ? (
                <button style={S.btn()} onClick={()=>generateReply(review)} disabled={generating[review.id]}>
                  {generating[review.id]?"✨ Generating…":"✨ Generate AI reply"}
                </button>
              ) : (
                <div style={{ marginTop:8 }}>
                  <textarea rows={3} value={editTexts[review.id]||""} onChange={e=>setEditTexts(t=>({...t,[review.id]:e.target.value}))} style={{ ...S.input, resize:"vertical", marginBottom:8 }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button style={S.btn("success")} onClick={()=>postReply(review)}>✓ Post reply</button>
                    <button style={S.btn("ghost")}   onClick={()=>generateReply(review)} disabled={generating[review.id]}>↺ Regenerate</button>
                    <button style={S.btn("ghost")}   onClick={()=>setReplying(r=>({...r,[review.id]:false}))}>Cancel</button>
                  </div>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NEW: Feedback Inbox ────────────────────────────────────────────────────
function FeedbackInbox({ feedback, setFeedback, businesses }) {
  const biz = businesses[0];
  const [filter, setFilter] = useState("all");
  const filtered = feedback.filter(f=>filter==="all"?true:filter==="unresolved"?!f.resolved:f.resolved);

  function resolve(id) { setFeedback(prev=>prev.map(f=>f.id===id?{...f,resolved:true}:f)); }

  const issueColor = { "Long waiting time":"#fbbf24","Staff behaviour":"#f87171","Service quality":"#f97316","Pricing / value":"#a78bfa","Cleanliness":"#60a5fa","Product quality":"#34d399","Other":"#8b88a0" };

  const waMsg = (f) => encodeURIComponent(`Hi, we saw your feedback about "${f.issue}" on ${f.date}. We're sorry and would love to make it right. Can we help?`);
  const emailSubject = (f) => encodeURIComponent(`Your recent visit to ${biz.name}`);
  const emailBody = (f) => encodeURIComponent(`Hi,\n\nWe saw your feedback about "${f.issue}" and we're truly sorry. We'd love to make it right.\n\nBest,\n${biz.name}`);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={S.h1}>Private Feedback</h1>
          <p style={S.muted}>Unhappy customers captured privately — kept private.</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["all","unresolved","resolved"].map(f=>(
            <button key={f} style={{ ...S.btn(filter===f?"primary":"ghost"), textTransform:"capitalize", fontSize:12 }} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:"flex", gap:16, marginBottom:24 }}>
        {[
          { label:"Total caught",        value:feedback.length,                     color:"#c4b5fd", icon:"🔒" },
          { label:"Unresolved",          value:feedback.filter(f=>!f.resolved).length, color:"#f87171", icon:"⚠️" },
          { label:"Resolved",            value:feedback.filter(f=>f.resolved).length,  color:"#4ade80", icon:"✅" },
          { label:"Google reviews saved",value:feedback.length,                     color:"#fbbf24", icon:"🛡️" },
        ].map(s=>(
          <div key={s.label} style={{ ...S.statCard }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <p style={{ ...S.muted, margin:"0 0 4px" }}>{s.label}</p>
                <p style={{ fontSize:24, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
              </div>
              <span style={{ fontSize:20 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length===0 && (
        <div style={{ ...S.card, textAlign:"center", padding:"48px 24px" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
          <p style={{ color:"#fff", fontWeight:600, margin:"0 0 6px" }}>No {filter==="unresolved"?"unresolved ":""}feedback</p>
          <p style={{ ...S.muted, margin:0 }}>All good here!</p>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {filtered.map(f=>(
          <div key={f.id} style={{ ...S.card, borderLeft:`3px solid ${f.resolved?"#4ade80":"#ef4444"}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Stars rating={f.rating} size={13} />
                <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:`${issueColor[f.issue]||"#8b88a0"}22`, color:issueColor[f.issue]||"#8b88a0" }}>
                  {f.issue}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:11, color:"#6b6880" }}>{f.date}</span>
                <span style={S.badge(f.resolved?"green":"red")}>{f.resolved?"Resolved":"Needs action"}</span>
              </div>
            </div>

            {f.details && (
              <p style={{ fontSize:14, color:"#c8c5d8", lineHeight:1.65, margin:"0 0 14px", padding:"10px 14px", background:"#12111a", borderRadius:8, fontStyle:"italic" }}>
                "{f.details}"
              </p>
            )}

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                {f.contact ? (
                  <>
                    <span style={{ fontSize:12, color:"#8b88a0" }}>📞 {f.contact}</span>
                    {biz.whatsapp && (
                      <a href={`https://wa.me/${biz.whatsapp}?text=${waMsg(f)}`} target="_blank" rel="noopener noreferrer"
                        style={{ ...S.btn("success"), textDecoration:"none", fontSize:12, padding:"5px 12px" }}>
                        💬 WhatsApp
                      </a>
                    )}
                    {f.contact.includes("@") && (
                      <a href={`mailto:${f.contact}?subject=${emailSubject(f)}&body=${emailBody(f)}`}
                        style={{ ...S.btn("ghost"), textDecoration:"none", fontSize:12, padding:"5px 12px" }}>
                        ✉ Email
                      </a>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize:12, color:"#6b6880" }}>No contact provided</span>
                )}
              </div>
              {!f.resolved && (
                <button style={{ ...S.btn("success"), fontSize:12, padding:"5px 14px" }} onClick={()=>resolve(f.id)}>
                  ✓ Mark resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings({ apiKey, setApiKey, businesses, setBusinesses }) {
  const [localKey,  setLocalKey]  = useState(apiKey);
  const [saved,     setSaved]     = useState(false);
  const [testing,   setTesting]   = useState(false);
  const [testResult,setTestResult]= useState("");
  const [localBiz,  setLocalBiz]  = useState({...businesses[0]});

  function save() {
    setApiKey(localKey);
    setBusinesses(prev=>[{...prev[0],...localBiz}]);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }

  async function testApi() {
    setTesting(true); setTestResult("");
    try {
      const r = await callGemini(localKey,"Say 'API connected!' and nothing else.");
      setTestResult("✅ " + r.trim());
    } catch(e) { setTestResult("❌ Error: "+e.message); }
    setTesting(false);
  }

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={S.h1}>Settings</h1>
        <p style={S.muted}>Configure your AI API and business profile.</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:560 }}>
        <div style={S.card}>
          <h2 style={{ ...S.h2, fontSize:15 }}>🔑 Gemini API Key</h2>
          <p style={{ ...S.muted, marginBottom:14 }}>Get your free key at <a href="https://aistudio.google.com/apikey" target="_blank" style={{ color:"#c4b5fd" }}>aistudio.google.com/apikey</a></p>
          <input type="password" style={{ ...S.input, marginBottom:10 }} value={localKey} onChange={e=>setLocalKey(e.target.value)} placeholder="AIza..." />
          <button style={S.btn("primary")} onClick={testApi} disabled={testing||!localKey}>{testing?"Testing…":"Test connection"}</button>
          {testResult && <p style={{ fontSize:13, color:testResult.startsWith("✅")?"#4ade80":"#f87171", marginTop:10 }}>{testResult}</p>}
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.h2, fontSize:15 }}>🏢 Business Profile</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Business name", key:"name" },
              { label:"Business type", key:"type" },
              { label:"City",          key:"city" },
              { label:"Google Review URL", key:"gmb" },
              { label:"WhatsApp number (with country code, e.g. 919876543210)", key:"whatsapp" },
            ].map(f=>(
              <div key={f.key}>
                <label style={{ fontSize:12, color:"#8b88a0", display:"block", marginBottom:6 }}>{f.label}</label>
                <input style={S.input} value={localBiz[f.key]||""} onChange={e=>setLocalBiz(b=>({...b,[f.key]:e.target.value}))} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...S.card, border:"1px solid #7c5cfc44", background:"#7c5cfc0a" }}>
          <h2 style={{ ...S.h2, fontSize:15 }}>🛡️ Review Gating</h2>
          <p style={{ ...S.muted, marginBottom:14, lineHeight:1.6 }}>
            Smart routing is enabled.
          </p>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ flex:1, background:"#12111a", borderRadius:8, padding:"12px 14px", textAlign:"center" }}>
              <p style={{ margin:0, fontSize:20, fontWeight:700, color:"#4ade80" }}>4–5 ★</p>
              <p style={{ margin:"4px 0 0", fontSize:12, color:"#6b6880" }}>→ Google Review</p>
            </div>
            <div style={{ flex:1, background:"#12111a", borderRadius:8, padding:"12px 14px", textAlign:"center" }}>
              <p style={{ margin:0, fontSize:20, fontWeight:700, color:"#f87171" }}>1–3 ★</p>
              <p style={{ margin:"4px 0 0", fontSize:12, color:"#6b6880" }}>→ Private Feedback</p>
            </div>
          </div>
        </div>

        <button style={{ ...S.btn("primary"), alignSelf:"flex-start", padding:"11px 28px" }} onClick={save}>
          {saved?"✓ Saved!":"Save settings"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab,              setTab]             = useState("overview");
  const [apiKey,           setApiKey]          = useState("");
  const [businesses,       setBusinesses]      = useState(SEED_BUSINESSES);
  const [reviews,          setReviews]         = useState(SEED_REVIEWS);
  const [feedback,         setFeedback]        = useState(SEED_FEEDBACK);
  const [showCustomerPage, setShowCustomerPage]= useState(false);

  useEffect(()=>{
    const link = document.createElement("link");
    link.rel   = "stylesheet";
    link.href  = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  },[]);

  if (showCustomerPage) {
    return <CustomerReviewPage biz={businesses[0]} apiKey={apiKey}
      onBack={()=>setShowCustomerPage(false)}
      onFeedbackSubmit={entry=>setFeedback(prev=>[entry,...prev])} />;
  }

  const unresolved = feedback.filter(f=>!f.resolved).length;

  const nav = [
    { id:"overview", label:"Overview",        icon:"◈" },
    { id:"qr",       label:"QR Manager",      icon:"⊞" },
    { id:"reviews",  label:"Review Inbox",    icon:"✉" },
    { id:"feedback", label:"Private Feedback",icon:"🔒", badge:unresolved },
    { id:"settings", label:"Settings",        icon:"⚙" },
  ];

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoIcon}>⭐</div>
          ReviewAI
        </div>
        <nav>
          {nav.map(n=>(
            <div key={n.id} style={S.navItem(tab===n.id)} onClick={()=>setTab(n.id)}>
              <span style={{ fontSize:16 }}>{n.icon}</span>
              <span style={{ flex:1 }}>{n.label}</span>
              {n.badge>0 && (
                <span style={{ background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, borderRadius:20, padding:"1px 6px", minWidth:18, textAlign:"center" }}>
                  {n.badge}
                </span>
              )}
            </div>
          ))}
        </nav>
        <div style={{ marginTop:"auto", padding:"0 20px" }}>
          <div style={{ background:"#12111a", borderRadius:10, padding:"12px 14px" }}>
            <p style={{ fontSize:11, color:"#6b6880", margin:"0 0 4px" }}>Gemini API</p>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:apiKey?"#4ade80":"#f87171" }} />
              <span style={{ fontSize:12, color:apiKey?"#4ade80":"#f87171" }}>{apiKey?"Connected":"Not set"}</span>
            </div>
          </div>
          {!apiKey && <p style={{ fontSize:11, color:"#6b6880", marginTop:8, lineHeight:1.5 }}>Add your Gemini key in Settings.</p>}
        </div>
      </div>

      <main style={S.main}>
        {tab==="overview" && <Overview  businesses={businesses} reviews={reviews} feedback={feedback} onPreviewPage={()=>setShowCustomerPage(true)} />}
        {tab==="qr"       && <QRManager businesses={businesses} />}
        {tab==="reviews"  && <ReviewInbox reviews={reviews} setReviews={setReviews} apiKey={apiKey} />}
        {tab==="feedback" && <FeedbackInbox feedback={feedback} setFeedback={setFeedback} businesses={businesses} />}
        {tab==="settings" && <Settings apiKey={apiKey} setApiKey={setApiKey} businesses={businesses} setBusinesses={setBusinesses} />}
      </main>
    </div>
  );
}
