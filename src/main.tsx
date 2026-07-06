import { createRoot } from "react-dom/client";
import { markDesktopRoot } from "@/lib/platform";
import App from "./App.tsx";
import "./index.css";

markDesktopRoot();

createRoot(document.getElementById("root")!).render(<App />);
