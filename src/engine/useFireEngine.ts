import * as Comlink from "comlink";
import { useEffect, useRef } from "react";

import { useFireStore } from "@/store/useFireStore";
import type { WorkerApi } from "./worker";

export function useFireEngine() {
	const persona = useFireStore((s) => s.persona);
	const setResults = useFireStore((s) => s.setResults);
	const setCalculating = useFireStore((s) => s.setCalculating);
	const setError = useFireStore((s) => s.setError);

	const workerRef = useRef<Worker | null>(null);
	const apiRef = useRef<Comlink.Remote<WorkerApi> | null>(null);
	const requestIdRef = useRef(0);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Create worker on mount, terminate on unmount
	useEffect(() => {
		const worker = new Worker(new URL("./worker.ts", import.meta.url), {
			type: "module",
		});
		workerRef.current = worker;
		apiRef.current = Comlink.wrap<WorkerApi>(worker);

		return () => {
			worker.terminate();
			workerRef.current = null;
			apiRef.current = null;
		};
	}, []);

	// Watch persona changes, debounce 300ms, then call worker
	useEffect(() => {
		if (!apiRef.current) return;

		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		setCalculating(true);
		setError(null);

		const currentId = ++requestIdRef.current;

		debounceRef.current = setTimeout(async () => {
			try {
				const results = await apiRef.current!.calculate(persona);
				if (currentId === requestIdRef.current) {
					setResults(results);
					setCalculating(false);
				}
			} catch (err) {
				if (currentId === requestIdRef.current) {
					setError(err instanceof Error ? err.message : "Calculation failed");
					setCalculating(false);
				}
			}
		}, 300);

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [persona, setResults, setCalculating, setError]);
}
