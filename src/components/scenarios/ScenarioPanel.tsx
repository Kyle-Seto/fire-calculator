import { useMemo, useState } from "react";
import { useFireStore } from "@/store/useFireStore";
import {
	evaluateScenario,
	evaluateAllScenarios,
	buildCustomScenario,
} from "@/engine/scenarios";
import type { ScenarioResult, CustomDecision } from "@/engine/scenarios";
import { calculateAllResults } from "@/engine/fire";
import CurrencyInput from "react-currency-input-field";
import { cn, formatFireDate } from "@/lib/utils";
import { Plus, X } from "lucide-react";

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

const EMPTY_DECISION: CustomDecision = {
	name: "",
	incomeChange: 0,
	spendingChange: 0,
	portfolioChange: 0,
	liabilityChange: 0,
};

function DeltaBadge({ deltaMonths }: { deltaMonths: number }) {
	const isBeneficial = deltaMonths < -0.5;
	const isHarmful = deltaMonths > 0.5;
	const isNeutral = !isBeneficial && !isHarmful;

	return (
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
	);
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

	return (
		<button
			type="button"
			onClick={() => onApply(result)}
			className={cn(
				"w-full text-left rounded-xl px-4 py-3 transition-all duration-200",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
				isApplied
					? "bg-blue-50 shadow-sm"
					: "bg-slate-50/70 hover:bg-slate-100/80",
			)}
		>
			<div className="flex items-center gap-3">
				<span className="text-lg leading-none shrink-0">{scenario.icon}</span>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-slate-700">{scenario.name}</p>
					<p className="text-xs text-slate-400 mt-0.5">{formatFireDate(newFireDate, { short: true, fallback: "—" })}</p>
				</div>
				<DeltaBadge deltaMonths={deltaMonths} />
			</div>
		</button>
	);
}

function DecisionField({
	label,
	suffix,
	value,
	onChange,
}: {
	label: string;
	suffix: string;
	value: number;
	onChange: (value: number) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
			<div className="flex items-center gap-1.5 flex-1">
				<select
					value={value >= 0 ? "+" : "-"}
					onChange={(e) => onChange(e.target.value === "+" ? Math.abs(value) : -Math.abs(value))}
					className="text-xs bg-white border border-slate-200 rounded px-1 py-1 text-slate-600"
				>
					<option value="+">+</option>
					<option value="-">-</option>
				</select>
				<CurrencyInput
					prefix="$"
					decimalsLimit={0}
					groupSeparator=","
					value={Math.abs(value)}
					onValueChange={(v) => {
						const abs = v ? Number.parseFloat(v) : 0;
						onChange(value >= 0 ? abs : -abs);
					}}
					className="w-24 text-right text-xs bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-600"
				/>
				<span className="text-xs text-slate-400">{suffix}</span>
			</div>
		</div>
	);
}

export function ScenarioPanel() {
	const persona = useFireStore((s) => s.persona);
	const setPersona = useFireStore((s) => s.setPersona);
	const [originalPersona, setOriginalPersona] = useState<typeof persona | null>(null);
	const [appliedId, setAppliedId] = useState<string | null>(null);
	const [showBuilder, setShowBuilder] = useState(false);
	const [draft, setDraft] = useState<CustomDecision>({ ...EMPTY_DECISION });
	const [showPresets, setShowPresets] = useState(false);

	const presetResults = useMemo(() => evaluateAllScenarios(persona), [persona]);

	// Evaluate custom decision live as the user edits
	const customResult = useMemo(() => {
		const hasChanges =
			draft.incomeChange !== 0 ||
			draft.spendingChange !== 0 ||
			draft.portfolioChange !== 0 ||
			draft.liabilityChange !== 0;
		if (!hasChanges) return null;

		const scenario = buildCustomScenario(draft);
		const base = calculateAllResults(persona);
		return evaluateScenario(scenario, persona, undefined, base);
	}, [draft, persona]);

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

	function handleApplyCustom() {
		if (!customResult) return;
		handleApply(customResult);
		setShowBuilder(false);
		setDraft({ ...EMPTY_DECISION });
	}

	function handleReset() {
		if (originalPersona) {
			setPersona(originalPersona);
			setOriginalPersona(null);
		}
		setAppliedId(null);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-baseline justify-between">
				<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
					What if...
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

			{/* ── Custom Decision Builder ── */}
			{showBuilder ? (
				<div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
					<div className="flex items-center justify-between">
						<input
							type="text"
							value={draft.name}
							onChange={(e) => setDraft({ ...draft, name: e.target.value })}
							placeholder="Name this decision..."
							className="text-sm font-medium text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-300 flex-1"
						/>
						<button
							type="button"
							onClick={() => { setShowBuilder(false); setDraft({ ...EMPTY_DECISION }); }}
							className="text-slate-300 hover:text-slate-500 transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					<div className="space-y-2.5">
						<DecisionField
							label="Income"
							suffix="/yr"
							value={draft.incomeChange}
							onChange={(v) => setDraft({ ...draft, incomeChange: v })}
						/>
						<DecisionField
							label="Spending"
							suffix="/mo"
							value={draft.spendingChange}
							onChange={(v) => setDraft({ ...draft, spendingChange: v })}
						/>
						<DecisionField
							label="Portfolio"
							suffix="one-time"
							value={draft.portfolioChange}
							onChange={(v) => setDraft({ ...draft, portfolioChange: v })}
						/>
						<DecisionField
							label="Debt"
							suffix="balance"
							value={draft.liabilityChange}
							onChange={(v) => setDraft({ ...draft, liabilityChange: v })}
						/>
					</div>

					{/* Live result */}
					{customResult && (
						<div className="flex items-center justify-between pt-2 border-t border-slate-100">
							<div>
								<p className="text-xs text-slate-400">New FIRE date</p>
								<p className="text-sm font-medium text-slate-700">
									{formatFireDate(customResult.newFireDate, { short: true, fallback: "—" })}
								</p>
							</div>
							<DeltaBadge deltaMonths={customResult.deltaMonths} />
						</div>
					)}

					<button
						type="button"
						onClick={handleApplyCustom}
						disabled={!customResult}
						className={cn(
							"w-full text-center text-sm font-medium rounded-xl px-4 py-2.5 transition-colors",
							customResult
								? "bg-slate-900 text-white hover:bg-slate-800"
								: "bg-slate-100 text-slate-300 cursor-not-allowed",
						)}
					>
						Apply this decision
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setShowBuilder(true)}
					className="w-full text-left rounded-2xl border-2 border-dashed border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50/50 transition-all group"
				>
					<div className="flex items-center gap-3">
						<span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
							<Plus className="w-4 h-4 text-slate-400" />
						</span>
						<div>
							<p className="text-sm font-medium text-slate-600">Model your own decision</p>
							<p className="text-xs text-slate-400">Change income, spending, assets, or debt</p>
						</div>
					</div>
				</button>
			)}

			{/* ── Preset Scenarios ── */}
			<div>
				<button
					type="button"
					onClick={() => setShowPresets(!showPresets)}
					className="text-xs text-slate-400 hover:text-slate-500 transition-colors"
				>
					{showPresets ? "Hide" : "Show"} common scenarios
				</button>

				{showPresets && (
					<div className="space-y-2 mt-3">
						{presetResults.map((result) => (
							<ScenarioCard
								key={result.scenario.id}
								result={result}
								onApply={handleApply}
								isApplied={appliedId === result.scenario.id}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
