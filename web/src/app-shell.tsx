import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ReactLenis, useLenis } from "lenis/react";
import { Frame } from "./components/shell";
import { page } from "./lib/motion";
import HomePage from "./pages/home/home";
import UploadPage from "./pages/upload/upload";
import ProcessingPage from "./pages/processing/processing";
import ResultPage from "./pages/result/result";
import LibraryPage from "./pages/library/library";

function AnimatedRoutes() {
  const location = useLocation();
  const lenis = useLenis();
  // The result page and its editor share a key so switching between them
  // animates in place instead of swapping pages.
  const key = location.pathname.replace(/\/edit$/, "");

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        if (lenis) lenis.scrollTo(0, { immediate: true });
        else window.scrollTo(0, 0);
      }}
    >
      <motion.div key={key} variants={page} initial="hidden" animate="show" exit="exit">
        {/* Passing `location` freezes it for the page that is animating out. */}
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/processing" element={<ProcessingPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/result/:id/*" element={<ResultPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function SonoscopeApp() {
  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: 0.11, wheelMultiplier: 0.95 }}>
        <Frame>
          <AnimatedRoutes />
        </Frame>
      </ReactLenis>
    </MotionConfig>
  );
}
