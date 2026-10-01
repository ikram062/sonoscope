import { createTheme } from "@mui/material/styles";
import { palette, spectrumGradient } from "../lib/sonoscope";

/** Material UI, dressed in sonoscope's palette. Used for sliders, tooltips and menus. */
export const muiTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: palette.mint, contrastText: "#0a0a0f" },
    secondary: { main: palette.orchid },
    background: { default: "#07070a", paper: "#121218" },
    text: { primary: palette.paper, secondary: "rgba(244,241,234,.55)" },
    divider: "rgba(255,255,255,.08)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Geist Variable", ui-sans-serif, system-ui, sans-serif',
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    MuiSlider: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          height: 4,
          padding: "13px 0",
          "&.Mui-disabled": { opacity: 0.35 },
        },
        rail: { opacity: 1, backgroundColor: "rgba(255,255,255,.08)" },
        track: {
          border: 0,
          background: "var(--slider-fill, " + spectrumGradient + ")",
          boxShadow: "0 0 12px -2px var(--slider-glow, rgba(159,180,255,.6))",
        },
        thumb: {
          width: 14,
          height: 14,
          backgroundColor: palette.paper,
          boxShadow: "0 0 0 4px rgba(0,0,0,.45)",
          transition: "transform .15s, box-shadow .15s",
          "&::before": { display: "none" },
          "&:hover, &.Mui-focusVisible": {
            boxShadow: "0 0 0 6px rgba(255,255,255,.12)",
            transform: "translate(-50%, -50%) scale(1.15)",
          },
          "&.Mui-active": {
            boxShadow: "0 0 0 8px rgba(255,255,255,.14)",
            transform: "translate(-50%, -50%) scale(1.25)",
          },
        },
        valueLabel: {
          fontFamily: '"Geist Mono Variable", ui-monospace, monospace',
          fontSize: 11,
          padding: "3px 7px",
          borderRadius: 8,
          background: "#1b1b23",
          border: "1px solid rgba(255,255,255,.1)",
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 250, disableInteractive: true },
      styleOverrides: {
        tooltip: {
          fontSize: 12,
          fontWeight: 500,
          padding: "6px 10px",
          borderRadius: 10,
          color: palette.paper,
          background: "rgba(27,27,35,.97)",
          border: "1px solid rgba(255,255,255,.1)",
          boxShadow: "0 12px 30px -10px rgba(0,0,0,.7)",
        },
        arrow: { color: "rgba(27,27,35,.97)" },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          marginTop: 8,
          minWidth: 190,
          borderRadius: 14,
          backgroundImage: "none",
          background: "rgba(20,20,27,.97)",
          border: "1px solid rgba(255,255,255,.09)",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,.8)",
        },
        list: { padding: 6 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 13,
          borderRadius: 9,
          gap: 10,
          minHeight: 36,
          "&.Mui-selected, &.Mui-selected:hover": { background: "rgba(142,240,201,.1)" },
        },
      },
    },
  },
});
