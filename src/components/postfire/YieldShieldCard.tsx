import { useMemo } from "react";
import { useFireStore } from "@/store/useFireStore";
import { calculateYieldShield } from "@/engine/withdrawals";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

export function YieldShieldCard() {
	const persona = useFireStore((s) => s.persona);

	const shield = useMemo(() => calculateYieldShield(persona), [persona]);

	if (!shield) return null;

	const coveragePercent = Math.min(
		(shield.annualYieldIncome / shield.annualExpenses) * 100,
		100,
	);

	const status: "green" | "yellow" | "red" = shield.isFullyCovered
		? "green"
		: shield.cashCushionYears >= 2
			? "yellow"
			: "red";

	const barColor = {
		green: "bg-emerald-500",
		yellow: "bg-amber-500",
		red: "bg-red-500",
	}[status];

	const statusLabel = {
		green: "Fully Covered",
		yellow: "Partially Covered",
		red: "Under-Covered",
	}[status];

	const statusColor = {
		green: "text-emerald-600",
		yellow: "text-amber-600",
		red: "text-red-600",
	}[status];

	return (
		<div className="bg-slate-50/70 rounded-2xl px-6 py-5 space-y-5">
			<div className="flex items-baseline justify-between">
				<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
					Yield Shield
				</span>
				<span className={cn("text-xs font-semibold", statusColor)}>
					{statusLabel}
				</span>
			</div>

			<div className="flex items-baseline gap-8">
				<div>
					<p className="text-3xl font-bold tabular-nums text-slate-900">
						{formatPercent(shield.portfolioYield, 1)}
					</p>
					<p className="text-xs text-slate-400 mt-1">Portfolio Yield</p>
				</div>
				<div>
					<p className="text-3xl font-bold tabular-nums text-slate-900">
						{formatCurrency(shield.annualYieldIncome)}
					</p>
					<p className="text-xs text-slate-400 mt-1">Annual Yield Income</p>
				</div>
			</div>

			<div className="space-y-2">
				<div className="flex justify-between text-xs text-slate-500">
					<span>Yield vs Expenses</span>
					<span className="tabular-nums font-medium">
						{formatCurrency(shield.annualYieldIncome)} / {formatCurrency(shield.annualExpenses)}
					</span>
				</div>
				<div className="h-2 bg-white rounded-full overflow-hidden">
					<div
						className={cn("h-full rounded-full transition-all duration-500", barColor)}
						style={{ width: `${coveragePercent}%` }}
					/>
				</div>
			</div>

			{!shield.isFullyCovered && (
				<div className="flex gap-8 text-sm">
					<div>
						<p className="font-semibold tabular-nums text-slate-800">
							{formatCurrency(shield.gapAmount)}
						</p>
						<p className="text-xs text-slate-400">Annual Gap</p>
					</div>
					<div>
						<p className="font-semibold tabular-nums text-slate-800">
							{Number.isFinite(shield.cashCushionYears)
								? `${shield.cashCushionYears.toFixed(1)} years`
								: "N/A"}
						</p>
						<p className="text-xs text-slate-400">Cash Cushion Coverage</p>
					</div>
				</div>
			)}
		</div>
	);
}
