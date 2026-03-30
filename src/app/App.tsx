import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { PersonaSelector } from "@/components/persona/PersonaSelector";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useFireStore } from "@/store/useFireStore";
import { getPersonaById } from "@/data/personas";

type View = "selector" | "dashboard";

function parseHash(hash: string): { view: View; personaId: string | null } {
	const cleaned = hash.replace(/^#\/?/, "");

	if (cleaned.startsWith("dashboard")) {
		const search = cleaned.includes("?") ? cleaned.slice(cleaned.indexOf("?") + 1) : "";
		const params = new URLSearchParams(search);
		return { view: "dashboard", personaId: params.get("persona") };
	}

	return { view: "selector", personaId: null };
}

function subscribeToHash(callback: () => void) {
	window.addEventListener("hashchange", callback);
	return () => window.removeEventListener("hashchange", callback);
}

function getHashSnapshot() {
	return window.location.hash;
}

export function App() {
	const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot);
	const { view, personaId } = parseHash(hash);

	const setPersona = useFireStore((s) => s.setPersona);
	const [restored, setRestored] = useState(false);

	// On initial load, if the hash specifies a persona, load it into the store
	useEffect(() => {
		if (restored) return;
		setRestored(true);

		if (view === "dashboard" && personaId) {
			const persona = getPersonaById(personaId);
			if (persona) {
				setPersona({ ...persona });
			} else {
				// Invalid persona id, go back to selector
				window.location.hash = "#/";
			}
		}
	}, [view, personaId, setPersona, restored]);

	const navigateToDashboard = useCallback((selectedPersonaId: string) => {
		window.location.hash = `#/dashboard?persona=${selectedPersonaId}`;
	}, []);

	const navigateToSelector = useCallback(() => {
		window.location.hash = "#/";
	}, []);

	if (view === "dashboard") {
		return <DashboardLayout onBack={navigateToSelector} />;
	}

	return <PersonaSelector onPersonaSelected={navigateToDashboard} />;
}
