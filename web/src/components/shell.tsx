import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Library as LibraryIcon, Plus } from "lucide-react";
import Tooltip from "@mui/material/Tooltip";
import { Logo, Mark } from "./brand/logo";
import { SoundField } from "./fx/sound-field";
import { RouteScan, ScopeCursor } from "./fx/scope";
import { spring } from "../lib/motion";

/** How loud the backdrop should be on each route. */
function fieldFor(pathname: string) {
  if (pathname === "/") return { intensity: 1, speed: 1, focus: -0.02 };
  if (pathname === "/processing") return { intensity: 1.45, speed: 2.6, focus: 0 };
  if (pathname.startsWith("/result")) return { intensity: 0.55, speed: 0.7, focus: 0.08 };
  return { intensity: 0.5, speed: 0.6, focus: 0.18 };
}

export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 160);
    setScrolled(y > 12);
  });

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5"
    >
      <motion.div
        animate={{
          backgroundColor: scrolled ? "rgba(13,13,18,.72)" : "rgba(13,13,18,0)",
          borderColor: scrolled ? "rgba(255,255,255,.08)" : "rgba(255,255,255,0)",
        }}
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border pl-4 pr-2 transition-[backdrop-filter] duration-300 ${scrolled ? "frost" : ""}`}
      >
        <Logo />
        <nav className="flex items-center gap-1">
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `relative flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors ${isActive ? "text-paper" : "text-paper/55 hover:text-paper"}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-full bg-white/[.08] ring-1 ring-white/10"
                  />
                )}
                <LibraryIcon size={15} className="relative" />
                <span className="relative hidden sm:inline">Library</span>
              </>
            )}
          </NavLink>
          <Tooltip title="Analyze a new track">
            <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} className="inline-flex">
              <Link
                to="/upload"
                className="group relative isolate flex h-10 items-center gap-2 overflow-hidden rounded-full bg-paper pl-2 pr-4 text-sm font-medium text-on-accent"
              >
                <span className="absolute inset-0 -z-10 bg-spectrum opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="grid size-6 place-items-center rounded-full bg-on-accent text-paper transition-transform duration-300 group-hover:rotate-90">
                  <Plus size={14} strokeWidth={2.5} />
                </span>
                <span className="hidden sm:inline">New analysis</span>
                <span className="sm:hidden">New</span>
              </Link>
            </motion.span>
          </Tooltip>
        </nav>
      </motion.div>
    </motion.header>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-10 border-t border-white/[.06]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Mark size={36} animated speed={0.4} />
            <span className="text-xl font-semibold tracking-[-.05em]">sonoscope</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-paper/40">
            An instrument for listening closely. Built for producers who dig.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-paper/50">
          {[
            ["Analyze", "/upload"],
            ["Library", "/library"],
          ].map(([label, to]) => (
            <Link key={to} to={to} className="group inline-flex items-center gap-1 transition-colors hover:text-paper">
              {label}
              <ArrowUpRight size={14} className="opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:opacity-100" />
            </Link>
          ))}
          <span className="font-mono text-xs text-paper/25 md:ml-6">© 2026 sonoscope</span>
        </div>
      </div>
    </footer>
  );
}

/** Persistent chrome: WebGL sound field, grain and nav. Pages animate inside it. */
export function Frame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const field = fieldFor(pathname);

  return (
    <main className="relative min-h-screen overflow-x-clip text-paper">
      <SoundField {...field} />
      <RouteScan id={pathname.replace(/\/edit$/, "")} />
      <ScopeCursor />
      <Nav />
      <div className="relative pt-20 sm:pt-24">{children}</div>
    </main>
  );
}
