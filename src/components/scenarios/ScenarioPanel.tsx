import { ChevronDown, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import CurrencyInput from "react-currency-input-field";
import { calculateAllResults } from "@/engine/fire";
import type { CustomDecision, ScenarioResult } from "@/engine/scenarios";
import { buildCustomScenario, evaluateAllScenarios, evaluateScenario } from "@/engine/scenarios";
import { cn, formatCurrency, formatFireDate, formatPercent } from "@/lib/utils";
import { useFireStore } from "@/store/useFireStore";

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
			{isNeutral ? "—" : `${isBeneficial ? "−" : "+"}${formatDelta(deltaMonths)}`}
		</span>
	);
}

/** A single row in the side-by-side comparison table */
function ComparisonRow({
	label,
	base,
	scenario,
}: {
	label: string;
	base: string;
	scenario: string;
}) {
	const changed = base !== scenario;
	return (
		<div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 py-1.5">
			<span className="text-xs text-slate-400">{label}</span>
			<span className="text-xs text-slate-500 tabular-nums text-right w-24">{base}</span>
			<span
				className={cn(
					"text-xs font-medium tabular-nums text-right w-24",
					changed ? "text-slate-800" : "text-slate-400",
				)}
			>
				{scenario}
			</span>
		</div>
	);
}

/** Side-by-side comparison panel for a scenario */
function ComparisonPanel({
	result,
	persona,
	onApply,
	isApplied,
}: {
	result: ScenarioResult;
	persona: { age: number };
	onApply: () => void;
	isApplied: boolean;
}) {
	const { baseSnapshot: base, scenarioSnapshot: sc } = result;

	const baseFireAge = Number.isFinite(base.yearsToFI)
		? Math.round(persona.age + base.yearsToFI)
		: null;
	const scFireAge = Number.isFinite(sc.yearsToFI) ? Math.round(persona.age + sc.yearsToFI) : null;

	return (
		<div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in">
			{/* Column headers */}
			<div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
				<span />
				<span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium text-right w-24">
					Current
				</span>
				<span className="text-[10px] uppercase tracking-wider text-slate-700 font-medium text-right w-24">
					With change
				</span>
			</div>

			<div className="divide-y divide-slate-100">
				<ComparisonRow
					label="FIRE date"
					base={formatFireDate(base.fireDateEstimate, { short: true, fallback: "Never" })}
					scenario={formatFireDate(sc.fireDateEstimate, { short: true, fallback: "Never" })}
				/>
				<ComparisonRow
					label="FIRE age"
					base={baseFireAge ? `Age ${baseFireAge}` : "—"}
					scenario={scFireAge ? `Age ${scFireAge}` : "—"}
				/>
				<ComparisonRow
					label="Portfolio"
					base={formatCurrency(base.portfolioTotal)}
					scenario={formatCurrency(sc.portfolioTotal)}
				/>
				<ComparisonRow
					label="FIRE number"
					base={formatCurrency(base.fireNumber)}
					scenario={formatCurrency(sc.fireNumber)}
				/>
				{(base.afterTaxSavingsRate !== null || sc.afterTaxSavingsRate !== null) && (
					<ComparisonRow
						label="Savings rate"
						base={
							base.afterTaxSavingsRate !== null ? formatPercent(base.afterTaxSavingsRate, 0) : "—"
						}
						scenario={
							sc.afterTaxSavingsRate !== null ? formatPercent(sc.afterTaxSavingsRate, 0) : "—"
						}
					/>
				)}
				{base.annualIncome !== sc.annualIncome && (
					<ComparisonRow
						label="Income"
						base={formatCurrency(base.annualIncome)}
						scenario={formatCurrency(sc.annualIncome)}
					/>
				)}
				{base.monthlyExpenses !== sc.monthlyExpenses && (
					<ComparisonRow
						label="Monthly spending"
						base={formatCurrency(base.monthlyExpenses)}
						scenario={formatCurrency(sc.monthlyExpenses)}
					/>
				)}
				{(base.totalLiabilities > 0 || sc.totalLiabilities > 0) && (
					<ComparisonRow
						label="Liabilities"
						base={formatCurrency(base.totalLiabilities)}
						scenario={formatCurrency(sc.totalLiabilities)}
					/>
				)}
				<ComparisonRow
					label="Progress"
					base={formatPercent(Math.min(base.fireProgress, 100), 0)}
					scenario={formatPercent(Math.min(sc.fireProgress, 100), 0)}
				/>
			</div>

			<button
				type="button"
				onClick={onApply}
				className={cn(
					"w-full text-center text-sm font-medium rounded-xl px-4 py-2.5 transition-colors",
					isApplied
						? "bg-blue-50 text-blue-600 hover:bg-blue-100"
						: "bg-slate-900 text-white hover:bg-slate-800",
				)}
			>
				{isApplied ? "Undo this change" : "Apply to my plan"}
			</button>
		</div>
	);
}

function ScenarioCard({
	result,
	onToggle,
	isExpanded,
	isApplied,
}: {
	result: ScenarioResult;
	onToggle: () => void;
	isExpanded: boolean;
	isApplied: boolean;
}) {
	const { scenario, deltaMonths } = result;

	return (
		<button
			type="button"
			onClick={onToggle}
			className={cn(
				"w-full text-left rounded-xl px-4 py-3 transition-all duration-200",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
				isApplied
					? "bg-blue-50 shadow-sm"
					: isExpanded
						? "bg-slate-100"
						: "bg-slate-50/70 hover:bg-slate-100/80",
			)}
		>
			<div className="flex items-center gap-3">
				<span className="text-lg leading-none shrink-0">{scenario.icon}</span>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-slate-700">{scenario.name}</p>
					<p className="text-xs text-slate-400 mt-0.5">{scenario.description}</p>
				</div>
				<DeltaBadge deltaMonths={deltaMonths} />
				<ChevronDown
					className={cn(
						"w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0",
						isExpanded && "rotate-180",
					)}
				/>
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
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showBuilder, setShowBuilder] = useState(false);
	const [draft, setDraft] = useState<CustomDecision>({ ...EMPTY_DECISION });
	const [showAllPresets, setShowAllPresets] = useState(false);

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
		setExpandedId(null);
	}

	function toggleExpand(id: string) {
		setExpandedId(expandedId === id ? null : id);
	}

	const visiblePresets = showAllPresets ? presetResults : presetResults.slice(0, 3);

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
							onClick={() => {
								setShowBuilder(false);
								setDraft({ ...EMPTY_DECISION });
							}}
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

					{/* Live comparison for custom decision */}
					{customResult && (
						<ComparisonPanel
							result={customResult}
							persona={persona}
							onApply={handleApplyCustom}
							isApplied={appliedId === customResult.scenario.id}
						/>
					)}

					{!customResult && (
						<button
							type="button"
							disabled
							className="w-full text-center text-sm font-medium rounded-xl px-4 py-2.5 bg-slate-100 text-slate-300 cursor-not-allowed"
						>
							Change a value to compare
						</button>
					)}
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
			<div className="space-y-2">
				{visiblePresets.map((result) => (
					<div key={result.scenario.id} className="space-y-2">
						<ScenarioCard
							result={result}
							onToggle={() => toggleExpand(result.scenario.id)}
							isExpanded={expandedId === result.scenario.id}
							isApplied={appliedId === result.scenario.id}
						/>
						{expandedId === result.scenario.id && (
							<ComparisonPanel
								result={result}
								persona={persona}
								onApply={() => handleApply(result)}
								isApplied={appliedId === result.scenario.id}
							/>
						)}
					</div>
				))}

				{presetResults.length > 3 && (
					<button
						type="button"
						onClick={() => setShowAllPresets(!showAllPresets)}
						className="text-xs text-slate-400 hover:text-slate-500 transition-colors"
					>
						{showAllPresets ? "Show fewer" : `Show ${presetResults.length - 3} more scenarios`}
					</button>
				)}
			</div>
		</div>
	);
}
