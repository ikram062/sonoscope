import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, type MotionValue, type Variants } from "motion/react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ArrowDownWideNarrow, Check, Plus, Search, SearchX, X } from "lucide-react";
import { Waveform } from "../../components/waveform";
import { SpotlightCard } from "../../components/fx/spotlight-card";
import { Footer } from "../../components/shell";
import { EqBars, Eyebrow, Num, PlayButton, Serif } from "../../components/ui";
import { btn } from "../../lib/styles";
import { alpha, demoWave, fakeLibrary, formatTime, type LibraryItem } from "../../lib/sonoscope";
import { bouncy, fadeUp, press, spring, stagger, MotionLink } from "../../lib/motion";

const card: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.94 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...spring, stiffness: 220, damping: 24, delay: 0.15 + i * 0.07 },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const sorts: { id: string; label: string; fn: (a: LibraryItem, b: LibraryItem) => number }[] = [
  { id: "recent", label: "Recently added", fn: (a, b) => a.age - b.age },
  { id: "bpm", label: "Tempo (BPM)", fn: (a, b) => a.bpm - b.bpm },
  { id: "title", label: "Title A–Z", fn: (a, b) => a.title.localeCompare(b.title) },
];

function LoopCard({
  item,
  playing,
  pos,
  onToggle,
}: {
  item: LibraryItem;
  playing: boolean;
  pos: MotionValue<number>;
  onToggle: () => void;
}) {
  const i = fakeLibrary.indexOf(item);
  const start = (item.start / item.duration) * 100;
  const end = (item.end / item.duration) * 100;
  const c = item.color;

  return (
    <SpotlightCard
      tilt={5}
      glow={alpha(c, 0.14)}
      className="glass group h-full overflow-hidden rounded-[28px] bg-ink-2/40 p-2.5 transition-[border-color] hover:border-white/15"
    >
      <div
        className="relative overflow-hidden rounded-[22px] px-3 pb-12 pt-10"
        style={{
          background: `radial-gradient(120% 90% at 20% 0%, ${alpha(c, 0.35)}, transparent 60%), radial-gradient(80% 80% at 100% 100%, ${alpha(c, 0.18)}, transparent 70%), #0b0b10`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3 top-1 select-none font-serif text-7xl italic leading-none opacity-[.12] transition-transform duration-700 group-hover:-translate-x-2"
          style={{ color: c }}
        >
          {item.genre}
        </span>
        <div className="relative">
          <Waveform
            compact
            framed={false}
            bars={demoWave(i + 3, 56)}
            start={start}
            end={end}
            color={c}
            playhead={playing ? pos : null}
          />
        </div>
        <div className="absolute bottom-3 right-3">
          <PlayButton
            playing={playing}
            onClick={onToggle}
            label={`${playing ? "Pause" : "Play"} ${item.title}`}
            size={42}
            color={c}
          />
        </div>
        <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/35 px-2.5 py-1 font-mono text-[10px] text-paper/70 backdrop-blur">
          <AnimatePresence>
            {playing && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                style={{ color: c }}
              >
                <EqBars count={3} className="h-2" barClassName="w-[2px]" />
              </motion.span>
            )}
          </AnimatePresence>
          {formatTime(item.start)} — {formatTime(item.end)}
        </span>
      </div>
      <div className="px-3 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 truncate font-medium tracking-[-.01em] text-paper/90">
            <Link
              to={`/result/${item.id}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {item.title}
            </Link>
          </h2>
          <span className="shrink-0 text-xs text-paper/35">{item.added}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: alpha(c, 0.12), color: c }}>
            <span className="size-1.5 rounded-full" style={{ background: c }} />
            {item.genre}
          </span>
          <span className="font-mono text-[11px] text-paper/40">{item.bpm} BPM</span>
          <span className="size-1 rounded-full bg-paper/15" />
          <span className="font-serif text-sm italic text-paper/55">{item.musicalKey}</span>
        </div>
      </div>
    </SpotlightCard>
  );
}

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState(sorts[0]);
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const pos = useMotionValue(0);

  const filters = ["All", ...new Set(fakeLibrary.map((x) => x.genre))];
  const items = fakeLibrary
    .filter(
      (x) =>
        (filter === "All" || x.genre === filter) &&
        x.title.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort(sort.fn);

  // Simulated preview: the playhead sweeps the saved region of the playing card.
  const current = fakeLibrary.find((x) => x.id === playing);
  useAnimationFrame((_, delta) => {
    if (!current) return;
    const s = (current.start / current.duration) * 100;
    const e = (current.end / current.duration) * 100;
    const next = pos.get() + (delta / 1000 / current.duration) * 100;
    pos.set(next > e || next < s ? s : next);
  });

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <motion.div variants={stagger(0.08, 0.05)} className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.div variants={fadeUp}>
              <Eyebrow>Your collection</Eyebrow>
            </motion.div>
            <motion.h1 variants={fadeUp} className="mt-5 text-5xl font-semibold leading-[.95] tracking-[-.06em] sm:text-7xl">
              Saved <Serif spectrum>loops.</Serif>
            </motion.h1>
          </div>
          <motion.p variants={fadeUp} className="flex items-baseline gap-2 text-paper/45">
            <span className="text-4xl font-semibold tracking-[-.04em] text-paper">
              <Num value={items.length} />
            </span>
            {items.length === 1 ? "loop" : "loops"} from past analyses
          </motion.p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="glass mt-10 flex flex-col gap-2 rounded-[22px] bg-ink-2/40 p-2 sm:flex-row sm:items-center"
        >
          <label className="relative block flex-1 sm:max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search loops"
              aria-label="Search loops"
              className="h-11 w-full rounded-2xl border border-transparent bg-white/[.04] pl-11 pr-10 text-sm text-paper outline-none transition-colors placeholder:text-paper/30 focus:border-iris/40 focus:bg-white/[.06]"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  type="button"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={bouncy}
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -mt-3.5 grid size-7 place-items-center rounded-full text-paper/40 hover:bg-white/10 hover:text-paper"
                >
                  <X size={13} />
                </motion.button>
              )}
            </AnimatePresence>
          </label>
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {filters.map((f) => (
              <motion.button
                key={f}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`relative h-11 shrink-0 rounded-2xl px-4 text-sm transition-colors ${filter === f ? "font-medium text-on-accent" : "text-paper/55 hover:bg-white/[.05] hover:text-paper"}`}
              >
                {filter === f && (
                  <motion.span layoutId="lib-filter" transition={spring} className="absolute inset-0 rounded-2xl bg-paper" />
                )}
                <span className="relative">{f}</span>
              </motion.button>
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => setMenu(e.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={!!menu}
            className="flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm text-paper/60 transition-colors hover:bg-white/[.05] hover:text-paper"
          >
            <ArrowDownWideNarrow size={15} />
            {sort.label}
          </button>
          <Menu
            anchorEl={menu}
            open={!!menu}
            onClose={() => setMenu(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {sorts.map((s) => (
              <MenuItem
                key={s.id}
                selected={s.id === sort.id}
                onClick={() => {
                  setSort(s);
                  setMenu(null);
                }}
              >
                <span className="flex-1">{s.label}</span>
                {s.id === sort.id && <Check size={14} className="text-mint" />}
              </MenuItem>
            ))}
          </Menu>
        </motion.div>

        <motion.div layout className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((item, idx) => (
              <motion.article
                key={item.id}
                layout
                custom={idx}
                variants={card}
                initial="hidden"
                animate="show"
                exit="exit"
                className="relative"
              >
                <LoopCard
                  item={item}
                  playing={playing === item.id}
                  pos={pos}
                  onToggle={() => {
                    pos.set((item.start / item.duration) * 100);
                    setPlaying(playing === item.id ? null : item.id);
                  }}
                />
              </motion.article>
            ))}
            {items.length > 0 && (
              <motion.div key="new" layout custom={items.length} variants={card} initial="hidden" animate="show" exit="exit">
                <MotionLink
                  to="/upload"
                  whileHover="hover"
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex h-full min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-white/12 text-center transition-colors hover:border-white/25"
                >
                  <span aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(159,180,255,.12),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <motion.span
                    variants={{ hover: { rotate: 90, scale: 1.1 } }}
                    transition={bouncy}
                    className="relative grid size-14 place-items-center rounded-full bg-white/[.05] text-paper/60 transition-colors duration-300 group-hover:bg-spectrum group-hover:text-on-accent"
                  >
                    <Plus size={22} />
                  </motion.span>
                  <span className="relative mt-5 font-medium text-paper/85">Analyze a new track</span>
                  <span className="relative mt-1 text-sm text-paper/35">
                    Find your next <Serif>loop</Serif>
                  </span>
                </MotionLink>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={spring}
              className="glass flex flex-col items-center rounded-[28px] bg-ink-2/40 px-6 py-20 text-center"
            >
              <motion.span
                animate={{ rotate: [0, -12, 12, -6, 0] }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex text-paper/30"
              >
                <SearchX size={28} />
              </motion.span>
              <p className="mt-5 text-lg text-paper/75">
                Nothing <Serif>here</Serif> yet.
              </p>
              <p className="mt-1 text-sm text-paper/40">No loops match that search.</p>
              <motion.button
                {...press}
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("All");
                }}
                className={`${btn.secondary} mt-6 h-10`}
              >
                Clear filters
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      <Footer />
    </>
  );
}
