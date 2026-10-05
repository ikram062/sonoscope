import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import App from "./App";
import { muiTheme } from "./theme/mui";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* MUI's styles go into the `mui` cascade layer declared in index.css. */}
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={muiTheme}>
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
);
{/*Hello hhhh this is a  new pr. */}