import { useFireStore } from "@/store/useFireStore";
import { formatCurrency, formatPercent, formatYears } from "@/lib/utils";
import { MetricCard, MetricSkeleton } from "./MetricCard";
import { PortfolioFanChart } from "@/components/charts/PortfolioFanChart";
import { SavingsRateChart } from "@/components/charts/SavingsRateChart";
import { AccountBreakdown } from "@/components/charts/AccountBreakdown";
import { RecommendationList } from "@/components/recommendations/RecommendationList";
import { ScenarioPanel } from "@/components/scenarios/ScenarioPanel";
import { PostFireDashboard } from "@/components/postfire/PostFireDashboard";
import { FireTooltip } from "@/components/ui/FireTooltip";
import { AlertCircle } from "lucide-react";

function formatFireDate(date: Date | null): string {
	if (!date) return "Keep going";
	return date.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
}

function formatFireType(type: string): string {
	return `${type} FIRE`;
}

export function ResultsPanel() {
	const results = useFireStore((s) => s.results);
	const isCalculating = useFireStore((s) => s.isCalculating);
	const error = useFireStore((s) => s.error);
	const persona = useFireStore((s) => s.persona);
	const isRetired = persona.retirementStatus === "retired";

	if (error) {
		return (
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="text-center space-y-3 max-w-sm">
					<AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
					<p className="text-sm text-slate-600">Something went wrong with the calculation.</p>
					<p className="text-xs text-slate-400">{error}</p>
				</div>
			</div>
		);
	}

	if (!results && isCalculating) {
		return (
			<div className="flex-1 p-8 space-y-8">
				<MetricSkeleton variant="hero" />
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
					{Array.from({ length: 6 }).map((_, i) => (
						<MetricSkeleton key={`skel-${i}`} />
					))}
				</div>
			</div>
		);
	}

	if (!results) {
		return (
			<div className="flex-1 flex items-center justify-center p-8">
				<p className="text-slate-400">Calculating your FIRE path...</p>
			</div>
		);
	}

	const mc = results.monteCarloResults;
	const successRate = mc ? mc.successRate * 100 : null;

	return (
		<div className="flex-1 p-6 md:p-10 overflow-y-auto">
			<div className="max-w-2xl mx-auto space-y-8">
				{/* Hero metric */}
				<div className="text-center py-6 border-b border-slate-100">
					{isRetired ? (
						<MetricCard
							variant="hero"
							label={<FireTooltip term="Portfolio Survival">Portfolio Survival</FireTooltip>}
							value={successRate !== null ? formatPercent(successRate, 0) : "—"}
							subtitle={
								mc
									? `${mc.runs.toLocaleString()} Monte Carlo simulations over ${results.yearsToFI > 0 ? formatYears(results.yearsToFI) : "50 years"}`
									: undefined
							}
						/>
					) : (
						<MetricCard
							variant="hero"
							label="Estimated FIRE Date"
							value={formatFireDate(results.fireDateEstimate)}
							subtitle={
								Number.isFinite(results.yearsToFI) && results.yearsToFI > 0
									? `${formatYears(results.yearsToFI)} from now`
									: undefined
							}
						/>
					)}
				</div>

				{/* Success rate bar */}
				{successRate !== null && !isRetired && (
					<div className="space-y-2">
						<div className="flex justify-between items-baseline">
							<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
								<FireTooltip term="Monte Carlo">Monte Carlo Success</FireTooltip>
							</span>
							<span className="text-sm font-semibold text-slate-700 tabular-nums">
								{formatPercent(successRate, 0)}
							</span>
						</div>
						<div className="h-2 bg-slate-100 rounded-full overflow-hidden">
							<div
								className="h-full rounded-full transition-all duration-500 ease-out"
								style={{
									width: `${Math.min(successRate, 100)}%`,
									backgroundColor:
										successRate >= 90
											? "var(--color-fire-green)"
											: successRate >= 70
												? "var(--color-fire-yellow)"
												: "var(--color-fire-red)",
								}}
							/>
						</div>
						<p className="text-xs text-slate-400">
							{mc?.runs.toLocaleString()} simulations &middot;{" "}
							{successRate >= 90 ? "Strong" : successRate >= 70 ? "Moderate" : "Needs work"}
						</p>
					</div>
				)}

				{/* Metric grid */}
				<div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
					<MetricCard
						label={<FireTooltip term="FIRE Number">FIRE Number</FireTooltip>}
						value={formatCurrency(results.fireNumber)}
						subtitle="Target portfolio"
					/>
					<MetricCard
						label="Portfolio"
						value={formatCurrency(results.portfolioTotal)}
						subtitle={`${formatPercent(results.fireProgress, 0)} of target`}
					/>
					<MetricCard
						label={<FireTooltip term="FIRE Type">FIRE Type</FireTooltip>}
						value={formatFireType(results.fireType)}
					/>

					{isRetired ? (
						<>
							<MetricCard
								label="Annual Withdrawal"
								value={formatCurrency(results.annualExpenses)}
								subtitle={`${formatPercent((results.annualExpenses / results.portfolioTotal) * 100, 1)} rate`}
							/>
							<MetricCard
								label="Monthly Spending"
								value={formatCurrency(results.monthlyExpenses)}
							/>
							{persona.cashCushion !== undefined && (
								<MetricCard
									label="Cash Cushion"
									value={formatCurrency(persona.cashCushion)}
								/>
							)}
						</>
					) : (
						<>
							<MetricCard
								label={<FireTooltip term="Savings Rate">Savings Rate</FireTooltip>}
								value={
									results.afterTaxSavingsRate !== null
										? formatPercent(results.afterTaxSavingsRate, 1)
										: "N/A"
								}
								subtitle="Of after-tax income"
							/>
							<MetricCard
								label="After-Tax Income"
								value={formatCurrency(results.afterTaxIncome)}
								subtitle={`${formatCurrency(results.monthlyIncome * 12)} gross`}
							/>
							<MetricCard
								label="Monthly Expenses"
								value={formatCurrency(results.monthlyExpenses)}
							/>
						</>
					)}
				</div>

				{/* Tax & Account Breakdown */}
				{!isRetired && results.totalTax > 0 && (
					<div className="bg-slate-50 rounded-xl p-5 space-y-3">
						<h3 className="text-xs text-slate-400 uppercase tracking-wider font-medium">
							Tax Impact (Ontario + Federal)
						</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div>
								<p className="text-xs text-slate-400">Annual Tax</p>
								<p className="text-sm font-semibold text-slate-800 tabular-nums">
									{formatCurrency(results.totalTax)}
								</p>
							</div>
							<div>
								<p className="text-xs text-slate-400">Marginal Rate</p>
								<p className="text-sm font-semibold text-slate-800 tabular-nums">
									{formatPercent(results.marginalRate * 100, 1)}
								</p>
							</div>
							<div>
								<p className="text-xs text-slate-400">After-Tax Portfolio</p>
								<p className="text-sm font-semibold text-slate-800 tabular-nums">
									{formatCurrency(results.afterTaxPortfolioValue)}
								</p>
								<p className="text-xs text-slate-400">
									{formatPercent(results.afterTaxFireProgress, 0)} of FIRE target
								</p>
							</div>
							<div>
								<p className="text-xs text-slate-400">Tax Drag</p>
								<p className="text-sm font-semibold text-slate-800 tabular-nums">
									{formatCurrency(results.portfolioTotal - results.afterTaxPortfolioValue)}
								</p>
								<p className="text-xs text-slate-400">
									Lost to taxes on withdrawal
								</p>
							</div>
						</div>
					</div>
				)}

					{/* Post-FIRE tools for retired personas */}
				{isRetired && <PostFireDashboard />}

				{/* FIRE progress bar */}
				<div className="space-y-2 pt-2">
					<div className="flex justify-between items-baseline">
						<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
							<FireTooltip term="FIRE Progress">FIRE Progress</FireTooltip>
						</span>
						<span className="text-sm font-semibold text-slate-700 tabular-nums">
							{formatPercent(Math.min(results.fireProgress, 100), 0)}
						</span>
					</div>
					<div className="h-3 bg-slate-100 rounded-full overflow-hidden">
						<div
							className="h-full rounded-full bg-fire-blue transition-all duration-500 ease-out"
							style={{ width: `${Math.min(results.fireProgress, 100)}%` }}
						/>
					</div>
				</div>

				{/* Charts */}
				{mc && (
					<div className="space-y-3 pt-2">
						<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
							Portfolio Projections
						</span>
						<PortfolioFanChart
							monteCarloResults={mc}
							fireNumber={results.fireNumber}
						/>
					</div>
				)}

				{!isRetired && (
					<div className="space-y-3 pt-2">
						<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
							Savings Rate vs. Years to FI
						</span>
						<SavingsRateChart
							annualExpenses={results.annualExpenses}
							currentSavingsRate={results.savingsRate}
							currentYearsToFI={results.yearsToFI}
						/>
					</div>
				)}

				<div className="space-y-3 pt-2">
					<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
						Account Breakdown
					</span>
					<AccountBreakdown
						accounts={persona.accounts}
						portfolioTotal={results.portfolioTotal}
					/>
				</div>

				{/* Recommendations */}
				<RecommendationList />

				{/* Scenario modeling — accumulating only */}
				{!isRetired && <ScenarioPanel />}

				{/* Loading overlay */}
				{isCalculating && results && (
					<div className="fixed top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
						<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
						<span className="text-xs text-slate-500">Recalculating...</span>
					</div>
				)}
			</div>
		</div>
	);
}
