import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Search, ExternalLink, TrendingUp, FileText, Zap, ChevronDown, ChevronUp, ArrowUpRight, Activity, Eye, Star, Filter, X, Plus, Trash2, BarChart2, Globe, Tag, ChevronRight, RefreshCw } from "lucide-react";

// ─────────────────────────────────────────────────────────
// MOCK DATA ENGINE
// ─────────────────────────────────────────────────────────
const ARTICLE_TYPES = ["Listicle", "Product Roundup", "Sponsored", "Advertorial", "Review", "Comparison", "Buying Guide", "News"];
const ARTICLE_TYPE_COLORS = {
  Listicle: "#6366f1",
  "Product Roundup": "#8b5cf6",
  Sponsored: "#f59e0b",
  Advertorial: "#ef4444",
  Review: "#10b981",
  Comparison: "#3b82f6",
  "Buying Guide": "#14b8a6",
  News: "#64748b",
};

const PUBLISHERS = [
  { name: "Wirecutter", domain: "nytimes.com/wirecutter", authority: 92 },
  { name: "Good Housekeeping", domain: "goodhousekeeping.com", authority: 88 },
  { name: "Forbes", domain: "forbes.com", authority: 94 },
  { name: "Sleepopolis", domain: "sleepopolis.com", authority: 71 },
  { name: "Sleep Foundation", domain: "sleepfoundation.org", authority: 76 },
  { name: "Business Insider", domain: "businessinsider.com", authority: 91 },
  { name: "BuzzFeed", domain: "buzzfeed.com", authority: 85 },
  { name: "Tom's Guide", domain: "tomsguide.com", authority: 82 },
  { name: "Reviewed", domain: "reviewed.com", authority: 79 },
  { name: "Real Simple", domain: "realsimple.com", authority: 83 },
  { name: "Apartment Therapy", domain: "apartmenttherapy.com", authority: 80 },
  { name: "PCMag", domain: "pcmag.com", authority: 87 },
  { name: "Gear Patrol", domain: "gearpatrol.com", authority: 74 },
  { name: "Healthline", domain: "healthline.com", authority: 90 },
  { name: "Verywell Fit", domain: "verywellfit.com", authority: 81 },
];

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateData(brandName) {
  const rng = seededRandom(brandName.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const category = brandName.toLowerCase().includes("linen") || brandName.toLowerCase().includes("sheet") ? "bedding" :
    brandName.toLowerCase().includes("shoe") || brandName.toLowerCase().includes("run") ? "footwear" :
    brandName.toLowerCase().includes("coffee") || brandName.toLowerCase().includes("brew") ? "coffee" :
    brandName.toLowerCase().includes("skin") || brandName.toLowerCase().includes("beauty") ? "skincare" : "products";

  const promptTemplates = {
    bedding: [
      `Best bed sheets of ${new Date().getFullYear()}`,
      `Most comfortable sheets for hot sleepers`,
      `Best luxury bed sheets under $100`,
      `What sheets do hotels use?`,
      `Best sheets for sensitive skin`,
      `Softest bed sheets on Amazon`,
      `${brandName} vs Brooklinen vs Parachute`,
      `Best Egyptian cotton sheets`,
      `Best cooling bed sheets`,
      `Best sheets for a king bed`,
      `Best thread count for bed sheets`,
      `Most durable bed sheets that last`,
    ],
    footwear: [
      `Best running shoes ${new Date().getFullYear()}`,
      `Most comfortable sneakers for everyday wear`,
      `Best shoes for wide feet`,
      `${brandName} vs Nike vs Adidas`,
      `Best shoes for standing all day`,
      `Best trail running shoes`,
      `Best budget running shoes under $100`,
      `Best shoes for overpronation`,
      `Best shoes for plantar fasciitis`,
      `Lightest running shoes available`,
    ],
    coffee: [
      `Best coffee makers ${new Date().getFullYear()}`,
      `Best espresso machines for home`,
      `Best drip coffee maker under $200`,
      `${brandName} vs Breville vs De'Longhi`,
      `Best cold brew coffee maker`,
      `Best single serve coffee maker`,
      `Best coffee grinder for beginners`,
      `Best smart coffee maker with app`,
    ],
    skincare: [
      `Best moisturizer for dry skin ${new Date().getFullYear()}`,
      `Best anti-aging serums`,
      `Best sunscreen that doesn't feel greasy`,
      `${brandName} skincare routine review`,
      `Best retinol products for beginners`,
      `Best skincare for sensitive skin`,
      `Best vitamin C serums ranked`,
      `Best drugstore skincare alternatives`,
    ],
    products: [
      `Best ${brandName} products reviewed`,
      `Top ${category} brands ${new Date().getFullYear()}`,
      `${brandName} honest review`,
      `Best ${category} for beginners`,
      `${brandName} vs competitors`,
      `Most popular ${category} on Amazon`,
      `Best ${category} under $50`,
      `${category} buying guide`,
      `Is ${brandName} worth it?`,
      `Best ${category} gifts`,
    ],
  };

  const prompts = (promptTemplates[category] || promptTemplates.products).map((text, i) => {
    const volume = Math.floor(rng() * 180000 + 5000);
    const mentioned = rng() > 0.3;
    const position = mentioned ? Math.floor(rng() * 5) + 1 : null;
    return {
      id: i + 1,
      prompt: text,
      monthlyVolume: volume,
      mentioned,
      position,
      engines: ["ChatGPT", "Claude", "Gemini", "Perplexity"].filter(() => rng() > 0.4),
      trend: Array.from({ length: 6 }, (_, m) => ({
        month: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"][m],
        volume: Math.floor(volume * (0.7 + rng() * 0.6)),
      })),
    };
  }).sort((a, b) => b.monthlyVolume - a.monthlyVolume);

  const articles = PUBLISHERS.slice(0, Math.floor(rng() * 8) + 6).map((pub, i) => {
    const type = ARTICLE_TYPES[Math.floor(rng() * ARTICLE_TYPES.length)];
    const traffic = Math.floor(rng() * 450000 + 8000);
    const mentioned = rng() > 0.25;
    return {
      id: i + 1,
      title: generateArticleTitle(brandName, type, category, rng),
      publisher: pub.name,
      domain: pub.domain,
      url: `https://${pub.domain}/best-${category}-${Math.floor(rng() * 9000) + 1000}`,
      type,
      monthlyTraffic: traffic,
      authority: pub.authority,
      brandMentioned: mentioned,
      mentionPosition: mentioned ? Math.floor(rng() * 8) + 1 : null,
      publishDate: generateDate(rng),
      sponsored: type === "Sponsored" || type === "Advertorial",
    };
  }).sort((a, b) => b.monthlyTraffic - a.monthlyTraffic);

  const trendData = Array.from({ length: 6 }, (_, m) => ({
    month: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"][m],
    mentions: Math.floor(rng() * 40 + 10),
    articles: Math.floor(rng() * 15 + 3),
  }));

  return { prompts, articles, trendData, category };
}

function generateArticleTitle(brand, type, category, rng) {
  const titles = {
    Listicle: [`${Math.floor(rng() * 10) + 5} Best ${category} of ${new Date().getFullYear()}`, `The ${Math.floor(rng() * 7) + 8} Best ${brand} Alternatives`, `Best ${category} We Tested This Year`],
    "Product Roundup": [`Best ${category} Roundup: Top Picks`, `We Tested 20 ${category} — Here Are the Winners`, `${brand} and the Best ${category} Right Now`],
    Sponsored: [`${brand} ${category}: A Complete Review`, `Why ${brand} Is Our Top Pick for ${category}`],
    Advertorial: [`${brand}: The ${category} Brand Everyone's Talking About`, `How ${brand} Changed Our ${category} Game`],
    Review: [`${brand} Review: Is It Worth It?`, `We Tried ${brand} for 30 Days — Here's What Happened`, `Honest ${brand} Review After 6 Months`],
    Comparison: [`${brand} vs. The Competition: Which Is Best?`, `Best ${category} Brands Compared Head to Head`, `${brand} vs. Premium Alternatives`],
    "Buying Guide": [`The Complete ${category} Buying Guide`, `How to Choose the Best ${category} for Your Needs`, `${category} Shopping Guide: What to Know`],
    News: [`${brand} Launches New ${category} Line`, `${category} Market Sees Major Shift in ${new Date().getFullYear()}`, `Best New ${category} Brands to Watch`],
  };
  const opts = titles[type] || titles["Product Roundup"];
  return opts[Math.floor(rng() * opts.length)];
}

function generateDate(rng) {
  const days = Math.floor(rng() * 180);
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toString();
}

// ─────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────
function extractKeywords(text, brand) {
  const stops = new Set(['what','are','the','is','do','how','can','which','where','when','who','was','were','will','would','should','could','does','did','for','with','from','that','this','have','has','had','a','an','in','of','to','and','or','but','at','by','up','on','if','no','so','i','my','after','before','about','some','its','it','use','used','me','you','your']);
  const brandWords = brand.toLowerCase().split(/\s+/);
  return text.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(w => w.length > 2 && !stops.has(w) && !brandWords.includes(w));
}
function findCoverage(promptText, articles, brand) {
  const kws = extractKeywords(promptText, brand);
  if (!kws.length) return {covered: false, count: 0};
  const matches = (articles||[]).filter(a => {
    const txt = ((a.title||'') + ' ' + (a.snippet||'')).toLowerCase();
    return kws.some(k => txt.includes(k));
  });
  return {covered: matches.length > 0, count: matches.length};
}
export default function App() {
  const [brands, setBrands] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState("prompts");
  const [data, setData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [sortPrompts, setSortPrompts] = useState("volume");
  const [filterType, setFilterType] = useState("all");
  const [filterMentioned, setFilterMentioned] = useState("all");
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (activeBrand) {
      setScanning(true);
      loadBrandData(activeBrand);
    }
  }, [activeBrand]);

  async function loadBrandData(brand) {
    // Show generated data immediately while real data loads
    const generated = generateData(brand);
    setData(generated);
    // Fetch real articles AND real prompts from the API in parallel
    try {
      const apiBase = import.meta.env.VITE_API_URL || "https://brand-visibility-api-production.up.railway.app";
      const [articlesRes, promptsRes] = await Promise.allSettled([
        fetch(`${apiBase}/api/articles?brand=${encodeURIComponent(brand)}`),
        fetch(`${apiBase}/api/prompts?brand=${encodeURIComponent(brand)}`),
      ]);
      if (articlesRes.status === "fulfilled" && articlesRes.value.ok) {
        const json = await articlesRes.value.json();
        if (json.articles && json.articles.length > 0) {
          setData(prev => ({ ...prev, articles: json.articles }));
        }
      }
      if (promptsRes.status === "fulfilled" && promptsRes.value.ok) {
        const json = await promptsRes.value.json();
        if (json.prompts && json.prompts.length > 0) {
          setData(prev => ({ ...prev, prompts: json.prompts }));
        }
      }
    } catch (err) {
      console.warn("API not reachable, using demo data:", err.message);
    } finally {
      setScanning(false);
    }
  }

  function addBrand() {
    const name = inputValue.trim();
    if (!name || brands.includes(name)) return;
    setBrands(prev => [...prev, name]);
    setActiveBrand(name);
    setInputValue("");
    setActiveTab("prompts");
  }

  function removeBrand(b) {
    const updated = brands.filter(x => x !== b);
    setBrands(updated);
    if (activeBrand === b) {
      setActiveBrand(updated[0] || null);
      setData(null);
    }
  }

  const filteredArticles = data?.articles.filter(a => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterMentioned === "mentioned" && !a.brandMentioned) return false;
    if (filterMentioned === "not-mentioned" && a.brandMentioned) return false;
    return true;
  });

  const mentionedCount = data?.articles.filter(a => a.brandMentioned).length || 0;
  const totalTraffic = data?.articles.reduce((s, a) => s + a.monthlyTraffic, 0) || 0;
  const mentionedPrompts = data?.prompts.filter(p => p.mentioned).length || 0;

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#e2e8f0",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #2d2d3a; border-radius: 4px; }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .row-hover:hover { background: rgba(99,102,241,0.06) !important; }
        .tab-btn { transition: all 0.2s; cursor: pointer; border: none; background: none; }
        .brand-chip { transition: all 0.2s; cursor: pointer; }
        .brand-chip:hover { opacity: 0.8; }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: "1px solid #1e1e2e", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} color="white" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" }}>
            AI Visibility
          </span>
          <span style={{ background: "#1e1e2e", color: "#6366f1", fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600, letterSpacing: "0.5px" }}>BETA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={14} color="#6366f1" />
          <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 500 }}>Live Tracking</span>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>

        {/* SIDEBAR */}
        <div style={{ width: 260, borderRight: "1px solid #1e1e2e", padding: 20, display: "flex", flexDirection: "column", gap: 24, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "1px", marginBottom: 12, textTransform: "uppercase" }}>Tracked Brands</div>
            
            {/* Add brand input */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addBrand()}
                placeholder="Add brand..."
                style={{
                  flex: 1, background: "#13131f", border: "1px solid #2d2d3a", borderRadius: 8, padding: "8px 12px",
                  color: "#e2e8f0", fontSize: 13, outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e => e.target.style.borderColor = "#2d2d3a"}
              />
              <button onClick={addBrand} style={{
                width: 34, height: 34, borderRadius: 8, background: "#6366f1", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "background 0.2s",
              }}>
                <Plus size={15} color="white" />
              </button>
            </div>

            {/* Brand list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {brands.length === 0 && (
                <div style={{ fontSize: 12, color: "#4b5563", padding: "12px 0", textAlign: "center" }}>
                  Add your first brand above
                </div>
              )}
              {brands.map(b => (
                <div key={b} className="brand-chip" onClick={() => { setActiveBrand(b); setActiveTab("prompts"); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                    background: activeBrand === b ? "rgba(99,102,241,0.15)" : "transparent",
                    border: `1px solid ${activeBrand === b ? "#6366f1" : "transparent"}`,
                    transition: "all 0.15s",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                      background: activeBrand === b ? "#6366f1" : "#1e1e2e", fontSize: 11, fontWeight: 700, color: activeBrand === b ? "white" : "#6366f1",
                    }}>
                      {b[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: activeBrand === b ? 600 : 400, color: activeBrand === b ? "#e2e8f0" : "#94a3b8" }}>{b}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeBrand(b); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.4, transition: "opacity 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>
                    <X size={12} color="#e2e8f0" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          {data && activeBrand && (
            <div style={{ borderTop: "1px solid #1e1e2e", paddingTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "1px", marginBottom: 12, textTransform: "uppercase" }}>Quick Stats</div>
              {[
                { label: "AI Prompts Tracked", value: data.prompts.length, icon: <Zap size={12} /> },
                { label: "Mentioned In", value: `${mentionedPrompts} prompts`, icon: <Star size={12} /> },
                { label: "Editorial Articles", value: data.articles.length, icon: <FileText size={12} /> },
                { label: "Brand Mentioned", value: `${mentionedCount} articles`, icon: <Eye size={12} /> },
                { label: "Total Article Traffic", value: formatNumber(totalTraffic) + "/mo", icon: <TrendingUp size={12} /> },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6366f1" }}>
                    {s.icon}
                    <span style={{ fontSize: 12, color: "#64748b" }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflow: "auto", padding: 32 }}>

          {!activeBrand && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Search size={28} color="#6366f1" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Add a brand to get started</div>
                <div style={{ color: "#64748b", fontSize: 14 }}>Type a brand or product name in the sidebar to see its AI visibility</div>
              </div>
            </div>
          )}

          {activeBrand && scanning && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 20 }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid #1e1e2e" }} />
                <div className="pulse" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Scanning AI engines...</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Analyzing prompts and editorial coverage for <strong>{activeBrand}</strong></div>
              </div>
            </div>
          )}

          {activeBrand && !scanning && data && (
            <div className="fade-in">
              {/* Brand header */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 4 }}>
                      {activeBrand}
                    </h1>
                    <div style={{ color: "#64748b", fontSize: 13 }}>AI visibility analysis · {data.category} category</div>
                  </div>
                  <button onClick={() => { setScanning(true); loadBrandData(activeBrand); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "#6366f1", fontSize: 13, fontWeight: 500 }}>
                    <RefreshCw size={13} /> Rescan
                  </button>
                </div>

                {/* Summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  {[
                    { title: "Top Prompt Volume", value: formatNumber(data.prompts[0]?.monthlyVolume || 0), sub: "monthly searches", color: "#6366f1" },
                    { title: "AI Mention Rate", value: `${Math.round((mentionedPrompts / data.prompts.length) * 100)}%`, sub: `${mentionedPrompts} of ${data.prompts.length} prompts`, color: "#10b981" },
                    { title: "Articles Found", value: data.articles.length, sub: `${mentionedCount} mention your brand`, color: "#f59e0b" },
                    { title: "Article Traffic Reach", value: formatNumber(totalTraffic), sub: "combined monthly visitors", color: "#8b5cf6" },
                  ].map(c => (
                    <div key={c.title} style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: 12, padding: 18 }}>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.title}</div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.value}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{c.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ borderBottom: "1px solid #1e1e2e", marginBottom: 24, display: "flex", gap: 0 }}>
                {[
                  { id: "prompts", label: "AI Prompts", icon: <Zap size={14} />, count: data.prompts.length },
                  { id: "articles", label: "Editorial Articles", icon: <FileText size={14} />, count: data.articles.length },
                  { id: "trends", label: "Trends", icon: <TrendingUp size={14} /> },
                ].map(t => (
                  <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)}
                    style={{
                      padding: "12px 20px", borderBottom: `2px solid ${activeTab === t.id ? "#6366f1" : "transparent"}`,
                      color: activeTab === t.id ? "#6366f1" : "#64748b", fontWeight: activeTab === t.id ? 600 : 400,
                      fontSize: 14, display: "flex", alignItems: "center", gap: 6,
                    }}>
                    {t.icon} {t.label}
                    {t.count && <span style={{ background: activeTab === t.id ? "rgba(99,102,241,0.2)" : "#1e1e2e", color: activeTab === t.id ? "#6366f1" : "#64748b", fontSize: 11, padding: "1px 7px", borderRadius: 99, fontWeight: 600 }}>{t.count}</span>}
                  </button>
                ))}
              </div>

              {/* ── PROMPTS TAB ── */}
              {activeTab === "prompts" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ fontSize: 14, color: "#64748b" }}>Sorted by monthly search volume — highest opportunity first</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["all", "mentioned", "not-mentioned"].map(f => (
                        <button key={f} onClick={() => setFilterMentioned(f)}
                          style={{
                            padding: "5px 12px", borderRadius: 6, border: "1px solid", cursor: "pointer", fontSize: 12, fontWeight: 500,
                            borderColor: filterMentioned === f ? "#6366f1" : "#2d2d3a",
                            background: filterMentioned === f ? "rgba(99,102,241,0.1)" : "transparent",
                            color: filterMentioned === f ? "#6366f1" : "#64748b",
                          }}>
                          {f === "all" ? "All Prompts" : f === "mentioned" ? "✓ Mentioned" : "✗ Not Mentioned"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: 12, overflow: "hidden" }}>
                    {/* Table header */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 180px 100px 130px", gap: 16, padding: "12px 20px", borderBottom: "1px solid #1e1e2e", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <div>Prompt</div>
                      <div>Monthly Volume</div>
                      <div>Status</div>
                      <div>AI Engines</div>
                      <div>Position</div>
                      <div>Coverage</div>
                    </div>

                    {data.prompts
                      .filter(p => filterMentioned === "all" || (filterMentioned === "mentioned" && p.mentioned) || (filterMentioned === "not-mentioned" && !p.mentioned))
                      .map((p, i) => (
                        <div key={p.id}>
                          <div className="row-hover" onClick={() => setExpandedPrompt(expandedPrompt === p.id ? null : p.id)}
                            style={{
                              display: "grid", gridTemplateColumns: "1fr 140px 100px 180px 100px 130px", gap: 16,
                              padding: "14px 20px", borderBottom: "1px solid #1a1a2a", cursor: "pointer",
                              background: expandedPrompt === p.id ? "rgba(99,102,241,0.04)" : "transparent",
                              transition: "background 0.15s",
                            }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 600, width: 20, textAlign: "right" }}>#{i + 1}</span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{p.prompt}</span>
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>{formatNumber(p.monthlyVolume)}</div>
                              <div style={{ fontSize: 11, color: "#4b5563" }}>searches/mo</div>
                            </div>
                            <div>
                              <span style={{
                                fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
                                background: p.mentioned ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                color: p.mentioned ? "#10b981" : "#ef4444",
                              }}>
                                {p.mentioned ? "✓ Mentioned" : "✗ Missing"}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {p.engines.map(e => (
                                <span key={e} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#1e1e2e", color: "#94a3b8", fontWeight: 500 }}>{e}</span>
                              ))}
                              {p.engines.length === 0 && <span style={{ fontSize: 11, color: "#4b5563" }}>—</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              {p.position ? (
                                <span style={{ fontSize: 13, fontWeight: 700, color: p.position <= 2 ? "#10b981" : p.position <= 4 ? "#f59e0b" : "#e2e8f0" }}>
                                  #{p.position}
                                </span>
                              ) : (
                                <span style={{ color: "#4b5563", fontSize: 12 }}>—</span>
                              )}
                              {expandedPrompt === p.id ? <ChevronUp size={14} color="#4b5563" /> : <ChevronDown size={14} color="#4b5563" />}
                            </div>
                          {/* Coverage */}
                          {(() => {
                            const cov = findCoverage(p.prompt, data.articles, activeBrand);
                            if (cov.covered) return (
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                                  ✓ {cov.count} article{cov.count > 1 ? 's' : ''}
                                </span>
                              </div>
                            );
                            if (!p.mentioned) return (
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                                  ⚠ Gap
                                </span>
                              </div>
                            );
                            return <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 11, color: "#4b5563" }}>—</span></div>;
                          })()}
                          </div>

                          {/* Expanded row */}
                          {expandedPrompt === p.id && (
                            <div style={{ padding: "0 20px 16px 50px", background: "rgba(99,102,241,0.03)", borderBottom: "1px solid #1a1a2a" }}>
                              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, paddingTop: 12 }}>6-Month Search Volume Trend</div>
                              <ResponsiveContainer width="100%" height={80}>
                                <AreaChart data={p.trend}>
                                  <defs>
                                    <linearGradient id={`grad-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={2} fill={`url(#grad-${p.id})`} />
                                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                  <Tooltip contentStyle={{ background: "#1e1e2e", border: "none", borderRadius: 8, fontSize: 12 }} formatter={v => [formatNumber(v), "Volume"]} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ── ARTICLES TAB ── */}
              {activeTab === "articles" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ fontSize: 14, color: "#64748b" }}>Editorial articles sorted by monthly traffic</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => setFilterType("all")}
                        style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${filterType === "all" ? "#6366f1" : "#2d2d3a"}`, cursor: "pointer", fontSize: 12, fontWeight: 500, background: filterType === "all" ? "rgba(99,102,241,0.1)" : "transparent", color: filterType === "all" ? "#6366f1" : "#64748b" }}>
                        All Types
                      </button>
                      {[...new Set(data.articles.map(a => a.type))].map(type => (
                        <button key={type} onClick={() => setFilterType(type)}
                          style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${filterType === type ? ARTICLE_TYPE_COLORS[type] : "#2d2d3a"}`, cursor: "pointer", fontSize: 12, fontWeight: 500, background: filterType === type ? `${ARTICLE_TYPE_COLORS[type]}22` : "transparent", color: filterType === type ? ARTICLE_TYPE_COLORS[type] : "#64748b" }}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    {["all", "mentioned", "not-mentioned"].map(f => (
                      <button key={f} onClick={() => setFilterMentioned(f)}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid", cursor: "pointer", fontSize: 11, fontWeight: 500, borderColor: filterMentioned === f ? "#6366f1" : "#2d2d3a", background: filterMentioned === f ? "rgba(99,102,241,0.1)" : "transparent", color: filterMentioned === f ? "#6366f1" : "#64748b" }}>
                        {f === "all" ? "All" : f === "mentioned" ? "Brand Mentioned" : "Not Mentioned"}
                      </button>
                    ))}
                  </div>

                  <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 130px 110px 120px 90px", gap: 12, padding: "12px 20px", borderBottom: "1px solid #1e1e2e", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <div>Article</div>
                      <div>Publisher</div>
                      <div>Type</div>
                      <div>Monthly Traffic</div>
                      <div>Brand Status</div>
                      <div>Link</div>
                    </div>

                    {filteredArticles?.map(a => (
                      <div key={a.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: "1fr 130px 130px 110px 120px 90px", gap: 12, padding: "14px 20px", borderBottom: "1px solid #1a1a2a", alignItems: "center", transition: "background 0.15s" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", marginBottom: 4, lineHeight: 1.4 }}>{a.title}</div>
                          <div style={{ fontSize: 11, color: "#4b5563" }}>{a.publishDate}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>{a.publisher}</div>
                          <div style={{ fontSize: 10, color: "#4b5563" }}>DA {a.authority}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, fontWeight: 600, background: `${ARTICLE_TYPE_COLORS[a.type]}22`, color: ARTICLE_TYPE_COLORS[a.type] }}>
                            {a.type}
                          </span>
                          {a.sponsored && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 3 }}>💰 Paid</div>}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>{formatNumber(a.monthlyTraffic)}</div>
                          <div style={{ fontSize: 11, color: "#4b5563" }}>visitors/mo</div>
                        </div>
                        <div>
                          {a.brandMentioned ? (
                            <div>
                              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, fontWeight: 600, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>✓ Mentioned</span>
                              <div style={{ fontSize: 10, color: "#4b5563", marginTop: 3 }}>Position #{a.mentionPosition}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>✗ Not Listed</span>
                          )}
                        </div>
                        <div>
                          <a href={a.url} target="_blank" rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#6366f1", fontSize: 12, fontWeight: 500, textDecoration: "none", padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; e.currentTarget.style.borderColor = "#6366f1"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.05)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}>
                            View <ArrowUpRight size={11} />
                          </a>
                        </div>
                      </div>
                    ))}

                    {filteredArticles?.length === 0 && (
                      <div style={{ padding: 40, textAlign: "center", color: "#4b5563", fontSize: 13 }}>
                        No articles match your filters
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TRENDS TAB ── */}
              {activeTab === "trends" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: 12, padding: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>AI Mention Trend</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>How many AI prompts mention your brand</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={data.trendData}>
                        <defs>
                          <linearGradient id="mentionGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#1e1e2e", border: "none", borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="mentions" stroke="#6366f1" strokeWidth={2.5} fill="url(#mentionGrad)" name="Mentions" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: 12, padding: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Editorial Coverage Trend</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Articles mentioning your brand over time</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#1e1e2e", border: "none", borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="articles" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Articles" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ gridColumn: "1 / -1", background: "#13131f", border: "1px solid #1e1e2e", borderRadius: 12, padding: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Article Type Breakdown</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>What types of editorial content exist for your category</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {Object.entries(
                        data.articles.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {})
                      ).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                        <div key={type} style={{ background: `${ARTICLE_TYPE_COLORS[type]}15`, border: `1px solid ${ARTICLE_TYPE_COLORS[type]}40`, borderRadius: 10, padding: "12px 16px", minWidth: 120 }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: ARTICLE_TYPE_COLORS[type], fontFamily: "'Space Grotesk', sans-serif", marginBottom: 2 }}>{count}</div>
                          <div style={{ fontSize: 12, color: ARTICLE_TYPE_COLORS[type], opacity: 0.8 }}>{type}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                            {data.articles.filter(a => a.type === type && a.brandMentioned).length} mention brand
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
