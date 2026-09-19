import { useLocation } from "react-router-dom";
import HomePage from "./pages/home/home";
import UploadPage from "./pages/upload/upload";
import ProcessingPage from "./pages/processing/processing";
import ResultPage from "./pages/result/result";
import LibraryPage from "./pages/library/library";

export default function SonoscopeApp() {
  const { pathname } = useLocation();

  if (pathname === "/") return <HomePage />;
  if (pathname === "/upload") return <UploadPage />;
  if (pathname === "/processing") return <ProcessingPage />;
  if (pathname === "/library") return <LibraryPage />;
  if (pathname.endsWith("/edit")) return <ResultPage edit />;

  return <ResultPage />;
}
