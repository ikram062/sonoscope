import { createBrowserRouter, RouterProvider } from "react-router-dom";
import SonoscopeApp from "./app-shell";

// A data router is required for view transitions between pages.
const router = createBrowserRouter([{ path: "*", element: <SonoscopeApp /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}
