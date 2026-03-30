import { useMemo, useState } from "react";
import { useFireStore } from "@/store/useFireStore";
import { evaluateAllScenarios } from "@/engine/scenarios";
import type { ScenarioResult } from "@/engine/scenarios";
import { cn, formatFireDate } from "@/lib/utils";

function formatDelta(deltaMonths: number): string {
	if (!Number.isFinite(deltaMonths)) {
		return deltaMonths > 0 ? "Never" : "Now";
	}
	const absDelta = Math.abs(deltaMonths);
	if (absDelta < 1) return "—";
	const years = Math.floor(absDelta / 12);
	const months = Math.round(absDelta % 12);
	if (years === 0) return `${months}mo`;
	if (months === 0) return `${years}y`;
	return `${years}y ${months}mo`;
}

function ScenarioCard({
	result,
	onApply,
	isApplied,
}: {
	result: ScenarioResult;
	onApply: (result: ScenarioResult) => void;
	isApplied: boolean;
}) {
	const { scenario, deltaMonths, newFireDate } = result;
	const isBeneficial = deltaMonths < -0.5;
	const isHarmful = deltaMonths > 0.5;
	const isNeutral = !isBeneficial && !isHarmful;

	return (
		<button
			type="button"
			onClick={() => onApply(result)}
			className={cn(
				"w-full text-left rounded-2xl px-5 py-4 transition-all duration-200",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
				isApplied
					? "bg-blue-50 shadow-sm"
					: "bg-slate-50/70 hover:bg-slate-100/80",
			)}
		>
			<div className="flex items-center gap-4">
				<span className="text-xl leading-none shrink-0">{scenario.icon}</span>

				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-slate-700">{scenario.name}</p>
					<p className="text-xs text-slate-400 mt-0.5">{formatFireDate(newFireDate, { short: true, fallback: "—" })}</p>
				</div>

				<span
					className={cn(
						"text-base font-bold tabular-nums whitespace-nowrap",
						isBeneficial && "text-emerald-600",
						isHarmful && "text-red-500",
						isNeutral && "text-slate-300",
					)}
				>
					{isNeutral
						? "—"
						: `${isBeneficial ? "−" : "+"}${formatDelta(deltaMonths)}`}
				</span>
			</div>
		</button>
	);
}

export function ScenarioPanel() {
	const persona = useFireStore((s) => s.persona);
	const setPersona = useFireStore((s) => s.setPersona);
	const [originalPersona, setOriginalPersona] = useState<typeof persona | null>(null);
	const [appliedId, setAppliedId] = useState<string | null>(null);

	const results = useMemo(() => evaluateAllScenarios(persona), [persona]);

	function handleApply(result: ScenarioResult) {
		if (appliedId === result.scenario.id) {
			if (originalPersona) {
				setPersona(originalPersona);
				setOriginalPersona(null);
			}
			setAppliedId(null);
			return;
		}

		const base = originalPersona ?? persona;
		setOriginalPersona(base);
		setAppliedId(result.scenario.id);
		setPersona(result.scenario.apply(base));
	}

	function handleReset() {
		if (originalPersona) {
			setPersona(originalPersona);
			setOriginalPersona(null);
		}
		setAppliedId(null);
	}

	return (
		<div className="space-y-4 pt-2">
			<div className="flex items-baseline justify-between">
				<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
					What If...
				</span>
				{appliedId && (
					<button
						type="button"
						onClick={handleReset}
						className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
					>
						Reset
					</button>
				)}
			</div>
			<div className="space-y-2">
				{results.map((result) => (
					<ScenarioCard
						key={result.scenario.id}
						result={result}
						onApply={handleApply}
						isApplied={appliedId === result.scenario.id}
					/>
				))}
			</div>
		</div>
	);
}
