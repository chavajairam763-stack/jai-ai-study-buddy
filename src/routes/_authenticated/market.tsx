import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";
import {
  LineChart, TrendingUp, TrendingDown, Info, GraduationCap, Search,
  Flame, Gauge as GaugeIcon, Newspaper, Bot, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/market")({
  component: MarketPage,
  head: () => ({
    meta: [
      { title: "Market Insight — JAI.AI" },
      { name: "description", content: "Learn how markets work with an interactive chart sandbox, sentiment gauge and AI-explained concepts. Educational only." },
      { property: "og:title", content: "Market Insight — JAI.AI" },
      { property: "og:description", content: "A premium learning sandbox for reading charts, sentiment and market structure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/* ------------------------------------------------------------------ */
/* Deterministic sample series — clearly labelled as simulated data.    */
/* No live feed is configured, so nothing here claims to be real-time.  */
/* ------------------------------------------------------------------ */

type Candle = { o: number; h: number; l: number; c: number };
type TF = "1H" | "4H" | "1D" | "1W" | "1M";

const TIMEFRAMES: { key: TF; bars: number; vol: number }[] = [
  { key: "1H", bars: 48, vol: 0.006 },
  { key: "4H", bars: 60, vol: 0.011 },
  { key: "1D", bars: 70, vol: 0.018 },
  { key: "1W", bars: 52, vol: 0.032 },
  { key: "1M", bars: 36, vol: 0.055 },
];

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function buildSeries(symbol: string, base: number, n = 60, vol = 0.018): Candle[] {
  const rnd = mulberry(hash(symbol + n + Math.round(vol * 1e4)));
  const out: Candle[] = [];
  let price = base;
  for (let i = 0; i < n; i++) {
    const drift = (rnd() - 0.48) * base * vol;
    const o = price;
    const c = Math.max(base * 0.4, o + drift);
    const wick = base * vol * 0.45 * (0.4 + rnd());
    out.push({ o, c, h: Math.max(o, c) + wick * rnd(), l: Math.min(o, c) - wick * rnd() });
    price = c;
  }
  return out;
}

const ASSETS = [
  { symbol: "AURA", name: "Aura Technologies", base: 182, sector: "Technology" },
  { symbol: "NVLX", name: "Novalux Semis", base: 96, sector: "Semiconductors" },
  { symbol: "HELION", name: "Helion Energy Co.", base: 43, sector: "Energy" },
  { symbol: "ORBIT", name: "Orbit Logistics", base: 128, sector: "Industrials" },
  { symbol: "VERDE", name: "Verde Agritech", base: 21, sector: "Agriculture" },
  { symbol: "KAIRO", name: "Kairo Financial", base: 310, sector: "Financials" },
  { symbol: "LUMEN", name: "Lumen Robotics", base: 74, sector: "Robotics" },
  { symbol: "ZEPHR", name: "Zephyr Mobility", base: 57, sector: "Mobility" },
] as const;

const LESSONS = [
  { title: "Reading candlesticks", body: "Each candle shows open, high, low and close. A long lower wick means sellers pushed price down but buyers reclaimed it before the close." },
  { title: "Support & resistance", body: "Support is a price zone where buying has repeatedly appeared; resistance is where selling has. They are zones, not exact lines." },
  { title: "Trend vs. noise", body: "A trend is a sequence of higher highs and higher lows (or the reverse). Single candles are noise — look for structure across many." },
  { title: "Moving averages", body: "An average of the last N closes. Price above a rising average means the recent trend is up; crossovers lag, they never predict." },
  { title: "Risk management", body: "Position size decides survival more than entry does. Define your invalidation level before you enter, never after." },
  { title: "Fear & Greed", body: "Sentiment gauges compress volatility, momentum and demand into one number. Extremes often coincide with turning points, but they are not timing signals." },
  { title: "Volume", body: "Volume confirms conviction. A breakout on thin volume is far easier to reverse than one backed by heavy participation." },
  { title: "Valuation basics", body: "P/E compares price to earnings; it is only meaningful against a company's own history and its direct peers." },
];

/* ---------- derived analytics (all from the simulated series) -------- */

function sma(values: number[], n: number) {
  if (values.length < n) return values[values.length - 1];
  return values.slice(-n).reduce((a, b) => a + b, 0) / n;
}

function analyse(series: Candle[]) {
  const closes = series.map((c) => c.c);
  const last = closes[closes.length - 1];
  const fast = sma(closes, 7);
  const slow = sma(closes, 21);
  const hi = Math.max(...series.map((c) => c.h));
  const lo = Math.min(...series.map((c) => c.l));
  const momentum = ((fast - slow) / slow) * 100;
  const position = ((last - lo) / (hi - lo || 1)) * 100;
  const score = Math.max(0, Math.min(100, 50 + momentum * 4 + (position - 50) * 0.35));
  const verdict: "Buy" | "Hold" | "Sell" = score >= 62 ? "Buy" : score <= 38 ? "Sell" : "Hold";
  return { last, fast, slow, hi, lo, momentum, position, score, verdict };
}

function MarketPage() {
  const [tab, setTab] = useState<"market" | "learn" | "assistant">("market");
  const [active, setActive] = useState<string>(ASSETS[0].symbol);
  const [tf, setTf] = useState<TF>("1D");
  const [query, setQuery] = useState("");

  const frame = TIMEFRAMES.find((t) => t.key === tf)!;

  const rows = useMemo(() => ASSETS.map((a) => {
    const series = buildSeries(a.symbol + tf, a.base, frame.bars, frame.vol);
    const last = series[series.length - 1].c;
    const prev = series[series.length - 2].c;
    const changePct = ((last - prev) / prev) * 100;
    const spanPct = ((last - series[0].c) / series[0].c) * 100;
    return { ...a, series, last, changePct, spanPct };
  }), [tf, frame.bars, frame.vol]);

  const current = rows.find((r) => r.symbol === active) ?? rows[0];
  const stats = useMemo(() => analyse(current.series), [current.series]);

  const gainers = [...rows].sort((a, b) => b.changePct - a.changePct).slice(0, 3);
  const losers = [...rows].sort((a, b) => a.changePct - b.changePct).slice(0, 3);
  const trending = [...rows].sort((a, b) => Math.abs(b.spanPct) - Math.abs(a.spanPct)).slice(0, 4);

  const breadth = rows.filter((r) => r.changePct >= 0).length / rows.length;
  const fearGreed = Math.round(Math.max(4, Math.min(96, breadth * 70 + stats.position * 0.3)));

  const filtered = rows.filter((r) =>
    (r.symbol + " " + r.name + " " + r.sector).toLowerCase().includes(query.trim().toLowerCase()),
  );

  const news = useMemo(() => ([
    {
      tag: "Breadth",
      title: `${Math.round(breadth * 100)}% of the sample basket closed higher on the ${tf} frame`,
      body: breadth > 0.6
        ? "Broad participation. When most names move together, the move is usually driven by the whole market rather than one story."
        : "Narrow participation. A few names carrying the index is a classic sign of a fragile advance.",
    },
    {
      tag: "Momentum",
      title: `${current.symbol} fast average is ${stats.momentum >= 0 ? "above" : "below"} the slow average`,
      body: `The 7-bar mean sits at ${stats.fast.toFixed(2)} versus ${stats.slow.toFixed(2)} for the 21-bar. Crossovers describe what already happened — treat them as context, not a trigger.`,
    },
    {
      tag: "Range",
      title: `${current.symbol} is trading in the ${Math.round(stats.position)}th percentile of its ${tf} range`,
      body: `The frame high is ${stats.hi.toFixed(2)} and the low is ${stats.lo.toFixed(2)}. Price near an edge tells you where reactions are most likely, not which way they resolve.`,
    },
    {
      tag: "Sentiment",
      title: `Sentiment reads ${fearGreed} — ${fearGreed < 45 ? "cautious" : fearGreed > 60 ? "optimistic" : "balanced"}`,
      body: "Sentiment is a description of crowd positioning built from breadth and range position. Extremes cluster near turning points but never time them.",
    },
  ]), [breadth, tf, current.symbol, stats, fearGreed]);

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary glow-sm">
            <LineChart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-xl">Market Insight</h1>
            <p className="truncate text-xs text-muted-foreground">A learning sandbox — no live market feed is connected.</p>
          </div>
        </div>
        <div className="glass flex rounded-full p-1 text-xs">
          {([["market", "Market"], ["learn", "Learn"], ["assistant", "AI"]] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium transition-all duration-200",
                tab === k ? "bg-gradient-primary text-primary-foreground glow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >{l}</button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>All prices, signals and cards below are built from <strong className="text-foreground">simulated sample data</strong> to teach chart reading. Educational only — not financial advice.</span>
      </div>

      {tab === "assistant" && <ToolChat tool={TOOLS.market} />}

      {tab === "learn" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map((l) => (
            <article key={l.title} className="glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:glow-sm">
              <GraduationCap className="mb-3 h-5 w-5 text-primary" />
              <h3 className="font-semibold">{l.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
            </article>
          ))}
        </div>
      )}

      {tab === "market" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <section className="glass rounded-2xl p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{current.symbol}</h2>
                    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">sample</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{current.name} · {current.sector}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl font-bold tabular-nums">{current.last.toFixed(2)}</div>
                  <ChangeTag pct={current.changePct} />
                </div>
              </div>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="glass flex rounded-full p-0.5 text-[11px]">
                  {TIMEFRAMES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTf(t.key)}
                      className={cn(
                        "rounded-full px-3 py-1 font-medium transition-all duration-200",
                        tf === t.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground",
                      )}
                    >{t.key}</button>
                  ))}
                </div>
                <div className="flex gap-3 font-mono text-[11px] text-muted-foreground">
                  <span>H <span className="text-foreground">{stats.hi.toFixed(2)}</span></span>
                  <span>L <span className="text-foreground">{stats.lo.toFixed(2)}</span></span>
                  <span>MA7 <span className="text-foreground">{stats.fast.toFixed(2)}</span></span>
                </div>
              </div>

              <Candles key={current.symbol + tf} data={current.series} />
            </section>

            <RecommendationCard symbol={current.symbol} stats={stats} tf={tf} />

            <div className="grid gap-3 sm:grid-cols-2">
              <MoversCard title="Top gainers" rows={gainers} up onPick={setActive} />
              <MoversCard title="Top losers" rows={losers} onPick={setActive} />
            </div>

            <section className="glass rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <Flame className="h-3.5 w-3.5 text-primary" /> Trending
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {trending.map((r) => (
                  <button
                    key={r.symbol}
                    onClick={() => setActive(r.symbol)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{r.symbol}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{r.sector}</div>
                    </div>
                    <Spark data={r.series} up={r.spanPct >= 0} />
                    <ChangeTag pct={r.spanPct} small />
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <Newspaper className="h-3.5 w-3.5 text-primary" /> AI market notes
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {news.map((n) => (
                  <article key={n.tag} className="glass rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5">
                    <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">{n.tag}</span>
                    <h4 className="mt-2 text-sm font-semibold leading-snug">{n.title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="glass rounded-2xl p-5">
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <GaugeIcon className="h-3.5 w-3.5 text-primary" /> Fear &amp; Greed
              </h3>
              <Gauge value={fearGreed} />
              <p className="mt-3 text-xs text-muted-foreground">
                Derived from basket breadth and where price sits in its {tf} range. Extremes describe crowd positioning, not what happens next.
              </p>
            </section>

            <section className="glass rounded-2xl p-4">
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Watchlist</h3>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search symbol or sector…"
                  aria-label="Search watchlist"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:bg-white/[0.06]"
                />
              </div>
              <div className="space-y-0.5">
                {filtered.map((r) => (
                  <button
                    key={r.symbol}
                    onClick={() => setActive(r.symbol)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                      active === r.symbol ? "bg-white/[0.08]" : "hover:translate-x-0.5 hover:bg-white/5",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{r.symbol}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{r.name}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Spark data={r.series} up={r.changePct >= 0} />
                      <div className="text-right">
                        <div className="font-mono text-xs tabular-nums">{r.last.toFixed(2)}</div>
                        <ChangeTag pct={r.changePct} small />
                      </div>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">No assets match “{query}”.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function ChangeTag({ pct, small }: { pct: number; small?: boolean }) {
  const up = pct >= 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-mono tabular-nums",
      small ? "text-[11px]" : "text-sm",
      up ? "text-emerald-400" : "text-rose-400",
    )}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{pct.toFixed(2)}%
    </span>
  );
}

/** AI-style read of the current series — fully derived, never a trade signal. */
function RecommendationCard({ symbol, stats, tf }: {
  symbol: string;
  stats: ReturnType<typeof analyse>;
  tf: TF;
}) {
  const tone = stats.verdict === "Buy"
    ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
    : stats.verdict === "Sell"
      ? "text-rose-400 border-rose-400/30 bg-rose-400/10"
      : "text-primary border-primary/30 bg-primary/10";
  const Icon = stats.verdict === "Buy" ? TrendingUp : stats.verdict === "Sell" ? TrendingDown : Minus;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          <Bot className="h-3.5 w-3.5 text-primary" /> AI read · {symbol} · {tf}
        </h3>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", tone)}>
          <Icon className="h-3.5 w-3.5" /> {stats.verdict}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-primary transition-all duration-700"
          style={{ width: `${stats.score.toFixed(0)}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>Bearish structure</span><span>{stats.score.toFixed(0)}/100</span><span>Bullish structure</span>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <li>• Trend: 7-bar mean {stats.momentum >= 0 ? "above" : "below"} the 21-bar mean by <span className="font-mono text-foreground">{Math.abs(stats.momentum).toFixed(2)}%</span>.</li>
        <li>• Location: price sits in the <span className="font-mono text-foreground">{Math.round(stats.position)}th</span> percentile of the visible range.</li>
        <li>• Invalidation: structure breaks below <span className="font-mono text-foreground">{stats.lo.toFixed(2)}</span> or extends above <span className="font-mono text-foreground">{stats.hi.toFixed(2)}</span>.</li>
      </ul>
      <p className="mt-3 text-[11px] text-muted-foreground/80">
        This is a teaching read of simulated candles — a description of structure, not advice or a prediction.
      </p>
    </section>
  );
}

function MoversCard({ title, rows, up, onPick }: {
  title: string;
  rows: { symbol: string; name: string; last: number; changePct: number; series: Candle[] }[];
  up?: boolean;
  onPick: (s: string) => void;
}) {
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
        {up ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
        {title}
      </h3>
      <div className="space-y-0.5">
        {rows.map((r) => (
          <button
            key={r.symbol}
            onClick={() => onPick(r.symbol)}
            className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 hover:translate-x-0.5 hover:bg-white/5"
          >
            <span className="font-medium">{r.symbol}</span>
            <span className="flex items-center gap-2">
              <Spark data={r.series} up={r.changePct >= 0} />
              <ChangeTag pct={r.changePct} small />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Tiny inline sparkline built from the same candle series. */
function Spark({ data, up }: { data: Candle[]; up: boolean }) {
  const pts = data.slice(-24).map((d) => d.c);
  const max = Math.max(...pts), min = Math.min(...pts), span = max - min || 1;
  const d = pts.map((p, i) => `${(i / (pts.length - 1)) * 56},${16 - ((p - min) / span) * 14}`).join(" ");
  return (
    <svg viewBox="0 0 56 18" className="h-4 w-14 shrink-0" aria-hidden="true">
      <polyline points={d} fill="none" stroke={up ? "#34d399" : "#fb7185"} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Lightweight SVG candlestick chart — no charting dependency needed. */
function Candles({ data }: { data: Candle[] }) {
  const W = 720, H = 260, pad = 8;
  const highs = data.map((d) => d.h), lows = data.map((d) => d.l);
  const max = Math.max(...highs), min = Math.min(...lows);
  const span = max - min || 1;
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - pad * 2);
  const step = W / data.length;
  const bw = Math.max(2, step * 0.58);

  const closes = data.map((d) => d.c);
  const maPath = closes.map((_, i) => {
    const win = closes.slice(Math.max(0, i - 6), i + 1);
    const v = win.reduce((a, b) => a + b, 0) / win.length;
    return `${i === 0 ? "M" : "L"}${i * step + step / 2},${y(v)}`;
  }).join(" ");

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-black/30">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full sm:h-80" role="img" aria-label="Simulated candlestick chart">
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <line key={f} x1={0} x2={W} y1={pad + f * (H - pad * 2)} y2={pad + f * (H - pad * 2)} stroke="currentColor" strokeOpacity={0.06} />
        ))}
        {data.map((d, i) => {
          const cx = i * step + step / 2;
          const up = d.c >= d.o;
          const color = up ? "#34d399" : "#fb7185";
          const top = y(Math.max(d.o, d.c));
          const bot = y(Math.min(d.o, d.c));
          return (
            <g key={i} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 8, 400)}ms`, animationFillMode: "backwards" }}>
              <line x1={cx} x2={cx} y1={y(d.h)} y2={y(d.l)} stroke={color} strokeWidth={1} />
              <rect x={cx - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} fill={color} rx={1} />
            </g>
          );
        })}
        <path d={maPath} fill="none" stroke="oklch(0.84 0.13 85)" strokeOpacity={0.75} strokeWidth={1.5} />
      </svg>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const angle = (value / 100) * 180 - 90;
  const label = value < 25 ? "Extreme fear" : value < 45 ? "Fear" : value < 55 ? "Neutral" : value < 75 ? "Greed" : "Extreme greed";
  return (
    <div className="text-center">
      <svg viewBox="0 0 200 110" className="mx-auto w-full max-w-[220px]" role="img" aria-label={`Sentiment gauge: ${label}`}>
        <defs>
          <linearGradient id="fg" x1="0" x2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <path d="M15 100 A85 85 0 0 1 185 100" fill="none" stroke="url(#fg)" strokeWidth="14" strokeLinecap="round" />
        <g transform={`rotate(${angle} 100 100)`} style={{ transition: "transform 700ms cubic-bezier(0.22,1,0.36,1)" }}>
          <line x1="100" y1="100" x2="100" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="6" fill="currentColor" />
      </svg>
      <div className="-mt-2 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
