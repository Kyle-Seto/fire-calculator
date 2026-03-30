import { useState } from "react";
import { useFireStore } from "@/store/useFireStore";
import { formatCurrency, formatFireDate, formatPercent } from "@/lib/utils";
import { MetricCard, MetricSkeleton } from "./MetricCard";
import { PortfolioFanChart } from "@/components/charts/PortfolioFanChart";
import { SavingsRateChart } from "@/components/charts/SavingsRateChart";
import { AccountBreakdown } from "@/components/charts/AccountBreakdown";
import { RecommendationList } from "@/components/recommendations/RecommendationList";
import { ScenarioPanel } from "@/components/scenarios/ScenarioPanel";
import { PostFireDashboard } from "@/components/postfire/PostFireDashboard";
import { FireTooltip } from "@/components/ui/FireTooltip";
import { AlertCircle, ChevronDown } from "lucide-react";

export function ResultsPanel() {
	const results = useFireStore((s) => s.results);
	const isCalculating = useFireStore((s) => s.isCalculating);
	const error = useFireStore((s) => s.error);
	const persona = useFireStore((s) => s.persona);
	const isRetired = persona.retirementStatus === "retired" || (results?.fireProgress ?? 0) >= 100;
	const [detailsOpen, setDetailsOpen] = useState(false);

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

				{/* ── Baseline Summary ── */}
				<div className="bg-slate-50 rounded-2xl p-5">
					<p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">
						Your current plan
					</p>
					<div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
						{isRetired ? (
							<>
								<div>
									<p className="text-2xl font-bold text-slate-900 tabular-nums">
										{successRate !== null ? formatPercent(successRate, 0) : "—"}
									</p>
									<p className="text-xs text-slate-400">portfolio survival</p>
								</div>
								<div>
									<p className="text-lg font-semibold text-slate-700 tabular-nums">
										{formatCurrency(results.portfolioTotal)}
									</p>
									<p className="text-xs text-slate-400">portfolio</p>
								</div>
								<div>
									<p className="text-lg font-semibold text-slate-700 tabular-nums">
										{formatCurrency(results.monthlyExpenses)}
									</p>
									<p className="text-xs text-slate-400">/mo spending</p>
								</div>
							</>
						) : (
							<>
								<div>
									<p className="text-2xl font-bold text-slate-900 tabular-nums">
										{formatFireDate(results.fireDateEstimate)}
									</p>
									<p className="text-xs text-slate-400">
										{Number.isFinite(results.yearsToFI) && results.yearsToFI > 0
											? `FIRE at age ${Math.round(persona.age + results.yearsToFI)}`
											: "FIRE date"}
									</p>
								</div>
								<div>
									<p className="text-lg font-semibold text-slate-700 tabular-nums">
										{formatCurrency(results.portfolioTotal)}
									</p>
									<p className="text-xs text-slate-400">
										of {formatCurrency(results.fireNumber)}
									</p>
								</div>
								{results.afterTaxSavingsRate !== null && (
									<div>
										<p className="text-lg font-semibold text-slate-700 tabular-nums">
											{formatPercent(results.afterTaxSavingsRate, 0)}
										</p>
										<p className="text-xs text-slate-400">savings rate</p>
									</div>
								)}
								{results.totalLiabilities > 0 && (
									<div>
										<p className="text-lg font-semibold text-slate-700 tabular-nums">
											{formatCurrency(results.netWorth)}
										</p>
										<p className="text-xs text-slate-400">net worth</p>
									</div>
								)}
							</>
						)}
					</div>

					{/* FIRE progress bar */}
					{!isRetired && (
						<div className="mt-4">
							<div className="flex justify-between items-baseline mb-1">
								<span className="text-xs text-slate-400">
									<FireTooltip term="FIRE Progress">Progress</FireTooltip>
								</span>
								<span className="text-xs font-medium text-slate-500 tabular-nums">
									{formatPercent(Math.min(results.fireProgress, 100), 0)}
								</span>
							</div>
							<div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
								<div
									className="h-full rounded-full bg-fire-blue transition-all duration-500 ease-out"
									style={{ width: `${Math.min(results.fireProgress, 100)}%` }}
								/>
							</div>
						</div>
					)}

					{/* Monte Carlo bar */}
					{successRate !== null && !isRetired && (
						<div className="mt-3">
							<div className="flex justify-between items-baseline mb-1">
								<span className="text-xs text-slate-400">
									<FireTooltip term="Monte Carlo">Monte Carlo</FireTooltip>
								</span>
								<span className="text-xs font-medium text-slate-500 tabular-nums">
									{formatPercent(successRate, 0)}
								</span>
							</div>
							<div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
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
						</div>
					)}
				</div>

				{/* ── Decision Modeler (hero) ── */}
				<ScenarioPanel />

				{/* ── Post-FIRE tools ── */}
				{isRetired && <PostFireDashboard />}

				{/* ── Recommendations ── */}
				<RecommendationList />

				{/* ── Details (collapsible) ── */}
				<div>
					<button
						type="button"
						onClick={() => setDetailsOpen(!detailsOpen)}
						className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-medium hover:text-slate-600 transition-colors w-full"
					>
						<span>Details</span>
						<ChevronDown
							className={`w-3.5 h-3.5 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
						/>
						<div className="flex-1 h-px bg-slate-100" />
					</button>

					{detailsOpen && (
						<div className="space-y-8 pt-6">
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
									value={`${results.fireType} FIRE`}
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

								{results.totalLiabilities > 0 && (
									<MetricCard
										label="Net Worth"
										value={formatCurrency(results.netWorth)}
										subtitle={`${formatCurrency(results.totalLiabilities)} in liabilities`}
									/>
								)}
							</div>

							{/* Tax section */}
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

							{/* Charts */}
							{mc && (
								<div className="space-y-3">
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
								<div className="space-y-3">
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

							<div className="space-y-3">
								<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
									Asset Breakdown
								</span>
								<AccountBreakdown
									assets={persona.assets}
									portfolioTotal={results.portfolioTotal}
								/>
							</div>

							{persona.resp && (
								<div className="bg-slate-50 rounded-xl p-5 space-y-3">
									<h3 className="text-xs text-slate-400 uppercase tracking-wider font-medium">
										Education Savings (RESP)
									</h3>
									<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
										<div>
											<p className="text-xs text-slate-400">RESP Balance</p>
											<p className="text-sm font-semibold text-slate-800 tabular-nums">
												{formatCurrency(persona.resp.balance)}
											</p>
										</div>
										<div>
											<p className="text-xs text-slate-400">CESG Received</p>
											<p className="text-sm font-semibold text-slate-800 tabular-nums">
												{formatCurrency(persona.resp.cesgReceived)}
											</p>
										</div>
										<div>
											<p className="text-xs text-slate-400">Annual Contribution</p>
											<p className="text-sm font-semibold text-slate-800 tabular-nums">
												{formatCurrency(persona.resp.annualContribution ?? 0)}
											</p>
										</div>
									</div>
									<p className="text-xs text-slate-400">
										RESP is an education sinking fund and is not included in your FIRE portfolio.
									</p>
								</div>
							)}
						</div>
					)}
				</div>

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
