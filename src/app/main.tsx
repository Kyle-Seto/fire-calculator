import * as Tooltip from "@radix-ui/react-tooltip";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Tooltip.Provider delayDuration={300}>
			<App />
		</Tooltip.Provider>
	</StrictMode>,
);
