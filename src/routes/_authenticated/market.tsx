import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";
import { LineChart, TrendingUp, TrendingDown, Info, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/market")({
  component: MarketPage,
  head: () => ({
    meta: [
      { title: "Market Insight — JAI.AI" },
      { name: "description", content: "Learn how markets work with an interactive chart sandbox and AI-explained concepts. Educational only." },
    ],
  }),
});

/* ------------------------------------------------------------------ */
/* Deterministic sample series — clearly labelled as simulated data.    */
/* No live feed is configured, so nothing here claims to be real-time.  */
/* ------------------------------------------------------------------ */

type Candle = { o: number; h: number; l: number; c: number };

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

function buildSeries(symbol: string, base: number, n = 60): Candle[] {
  const rnd = mulberry(hash(symbol));
  const out: Candle[] = [];
  let price = base;
  for (let i = 0; i < n; i++) {
    const drift = (rnd() - 0.48) * base * 0.018;
    const o = price;
    const c = Math.max(base * 0.4, o + drift);
    const wick = base * 0.008 * (0.4 + rnd());
    out.push({ o, c, h: Math.max(o, c) + wick * rnd(), l: Math.min(o, c) - wick * rnd() });
    price = c;
  }
  return out;
}

const ASSETS = [
  { symbol: "AURA", name: "Aura Technologies", base: 182 },
  { symbol: "NVLX", name: "Novalux Semis", base: 96 },
  { symbol: "HELION", name: "Helion Energy Co.", base: 43 },
  { symbol: "ORBIT", name: "Orbit Logistics", base: 128 },
  { symbol: "VERDE", name: "Verde Agritech", base: 21 },
  { symbol: "KAIRO", name: "Kairo Financial", base: 310 },
] as const;

const LESSONS = [
  { title: "Reading candlesticks", body: "Each candle shows open, high, low and close. A long lower wick means sellers pushed price down but buyers reclaimed it before the close." },
  { title: "Support & resistance", body: "Support is a price zone where buying has repeatedly appeared; resistance is where selling has. They are zones, not exact lines." },
  { title: "Trend vs. noise", body: "A trend is a sequence of higher highs and higher lows (or the reverse). Single candles are noise — look for structure across many." },
  { title: "Risk management", body: "Position size decides survival more than entry does. Define your invalidation level before you enter, never after." },
  { title: "Fear & Greed", body: "Sentiment gauges compress volatility, momentum and demand into one number. Extremes often coincide with turning points, but they are not timing signals." },
  { title: "Valuation basics", body: "P/E compares price to earnings; it is only meaningful against a company's own history and its direct peers." },
];

function MarketPage() {
  const [tab, setTab] = useState<"market" | "learn" | "assistant">("market");
  const [active, setActive] = useState<string>(ASSETS[0].symbol);

  const rows = useMemo(() => ASSETS.map((a) => {
    const series = buildSeries(a.symbol, a.base);
    const last = series[series.length - 1].c;
    const prev = series[series.length - 2].c;
    const changePct = ((last - prev) / prev) * 100;
    return { ...a, series, last, changePct };
  }), []);

  const current = rows.find((r) => r.symbol === active) ?? rows[0];
  const gainers = [...rows].sort((a, b) => b.changePct - a.changePct).slice(0, 3);
  const losers = [...rows].sort((a, b) => a.changePct - b.changePct).slice(0, 3);
  const fearGreed = 58;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 glow-sm">
            <LineChart className="h-5 w-5 text-black" />
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
                "rounded-full px-4 py-1.5 font-medium transition-all",
                tab === k ? "bg-gradient-primary text-primary-foreground glow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >{l}</button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>All prices and charts below are <strong className="text-foreground">simulated sample data</strong> used to teach chart reading. Educational only — not financial advice.</span>
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
                  <p className="text-xs text-muted-foreground">{current.name}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl font-bold">{current.last.toFixed(2)}</div>
                  <ChangeTag pct={current.changePct} />
                </div>
              </div>
              <Candles data={current.series} />
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <MoversCard title="Top gainers" rows={gainers} up onPick={setActive} />
              <MoversCard title="Top losers" rows={losers} onPick={setActive} />
            </div>
          </div>

          <aside className="space-y-4">
            <section className="glass rounded-2xl p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Fear &amp; Greed</h3>
              <Gauge value={fearGreed} />
              <p className="mt-3 text-xs text-muted-foreground">
                Illustrative sentiment reading. Extremes describe crowd positioning, not what happens next.
              </p>
            </section>

            <section className="glass rounded-2xl p-4">
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Watchlist</h3>
              <div className="space-y-0.5">
                {rows.map((r) => (
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
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-xs">{r.last.toFixed(2)}</div>
                      <ChangeTag pct={r.changePct} small />
                    </div>
                  </button>
                ))}
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
      "inline-flex items-center gap-1 font-mono",
      small ? "text-[11px]" : "text-sm",
      up ? "text-emerald-400" : "text-rose-400",
    )}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{pct.toFixed(2)}%
    </span>
  );
}

function MoversCard({ title, rows, up, onPick }: {
  title: string;
  rows: { symbol: string; name: string; last: number; changePct: number }[];
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
          <button key={r.symbol} onClick={() => onPick(r.symbol)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-white/5">
            <span className="font-medium">{r.symbol}</span>
            <ChangeTag pct={r.changePct} small />
          </button>
        ))}
      </div>
    </section>
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

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-black/30">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full sm:h-72" role="img" aria-label="Simulated candlestick chart">
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
            <g key={i}>
              <line x1={cx} x2={cx} y1={y(d.h)} y2={y(d.l)} stroke={color} strokeWidth={1} />
              <rect x={cx - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} fill={color} rx={1} />
            </g>
          );
        })}
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
        <g transform={`rotate(${angle} 100 100)`}>
          <line x1="100" y1="100" x2="100" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="6" fill="currentColor" />
      </svg>
      <div className="-mt-2 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
