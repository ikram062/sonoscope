/** Shared class strings. Kept out of component files so fast refresh keeps working. */

const btnBase =
  "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,border-color,color,box-shadow,opacity] duration-300 disabled:pointer-events-none disabled:opacity-35";

export const btn = {
  /** Paper pill with a spectrum halo that blooms on hover. */
  primary: `${btnBase} h-12 bg-paper px-6 text-on-accent shadow-[inset_0_-2px_0_rgba(0,0,0,.12),0_10px_40px_-12px_rgba(230,168,255,.6)] before:absolute before:-inset-x-6 before:-inset-y-5 before:-z-10 before:rounded-full before:bg-[radial-gradient(closest-side,rgba(230,168,255,.55),rgba(159,180,255,.25)_60%,transparent)] before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-80`,
  secondary: `${btnBase} glass h-12 px-5 text-paper/80 hover:border-white/20 hover:bg-white/[.08] hover:text-paper`,
  ghost: `${btnBase} h-10 px-4 text-paper/55 hover:bg-white/[.06] hover:text-paper`,
};
