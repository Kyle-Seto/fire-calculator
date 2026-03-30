import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { AccountBreakdown } from "@/components/charts/AccountBreakdown";
import { PortfolioFanChart } from "@/components/charts/PortfolioFanChart";
import { SavingsRateChart } from "@/components/charts/SavingsRateChart";
import { PostFireDashboard } from "@/components/postfire/PostFireDashboard";
import { ScenarioPanel } from "@/components/scenarios/ScenarioPanel";
import { FireTooltip } from "@/components/ui/FireTooltip";
import { cn, formatCurrency, formatFireDate, formatPercent } from "@/lib/utils";
import { useFireStore } from "@/store/useFireStore";
import { MetricCard, MetricSkeleton } from "./MetricCard";

type Tab = "overview" | "whatif" | "details";

const TABS: { id: Tab; label: string }[] = [
	{ id: "overview", label: "Overview" },
	{ id: "whatif", label: "What If" },
	{ id: "details", label: "Details" },
];

export function ResultsPanel() {
	const results = useFireStore((s) => s.results);
	const isCalculating = useFireStore((s) => s.isCalculating);
	const error = useFireStore((s) => s.error);
	const persona = useFireStore((s) => s.persona);
	const isRetired = persona.retirementStatus === "retired" || (results?.fireProgress ?? 0) >= 100;
	const [activeTab, setActiveTab] = useState<Tab>("overview");

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
			<div className="max-w-2xl mx-auto space-y-6">
				{/* ── Baseline Summary (always visible) ── */}
				<div className="bg-white rounded-xl border border-[#E5E5E5] p-6 animate-fade-in relative overflow-hidden">
					<p className="text-xs text-[#9B9B9B] font-medium mb-4">Your current plan</p>
					<div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
						{isRetired ? (
							<>
								<div>
									<p className="font-[family-name:var(--font-display)] text-3xl text-[#1A1A1A] tabular-nums">
										{successRate !== null ? formatPercent(successRate, 0) : "—"}
									</p>
									<p className="text-xs text-[#9B9B9B] mt-1">portfolio survival</p>
								</div>
								<div>
									<p className="text-lg font-medium text-[#1A1A1A] tabular-nums">
										{formatCurrency(results.portfolioTotal)}
									</p>
									<p className="text-xs text-[#9B9B9B] mt-0.5">portfolio</p>
								</div>
								<div>
									<p className="text-lg font-medium text-[#1A1A1A] tabular-nums">
										{formatCurrency(results.monthlyExpenses)}
									</p>
									<p className="text-xs text-[#9B9B9B] mt-0.5">/mo spending</p>
								</div>
							</>
						) : (
							<>
								<div>
									<p className="font-[family-name:var(--font-display)] text-3xl text-[#1A1A1A] tabular-nums">
										{formatFireDate(results.fireDateEstimate)}
									</p>
									<p className="text-xs text-[#9B9B9B] mt-1">
										{Number.isFinite(results.yearsToFI) && results.yearsToFI > 0
											? `You could be free at age ${Math.round(persona.age + results.yearsToFI)}`
											: "FIRE date"}
									</p>
								</div>
								<div>
									<p className="text-lg font-medium text-[#1A1A1A] tabular-nums">
										{formatCurrency(results.portfolioTotal)}
									</p>
									<p className="text-xs text-[#9B9B9B] mt-0.5">
										of {formatCurrency(results.fireNumber)}
									</p>
								</div>
								{results.afterTaxSavingsRate !== null && (
									<div>
										<p className="text-lg font-medium text-[#1A1A1A] tabular-nums">
											{formatPercent(results.afterTaxSavingsRate, 0)}
										</p>
										<p className="text-xs text-[#9B9B9B] mt-0.5">savings rate</p>
									</div>
								)}
								{results.totalLiabilities > 0 && (
									<div>
										<p className="text-lg font-medium text-[#1A1A1A] tabular-nums">
											{formatCurrency(results.netWorth)}
										</p>
										<p className="text-xs text-[#9B9B9B] mt-0.5">net worth</p>
									</div>
								)}
							</>
						)}
					</div>

					{/* FIRE progress bar */}
					{!isRetired && (
						<div className="mt-5">
							<div className="flex justify-between items-baseline mb-1.5">
								<span className="text-xs text-[#9B9B9B]">
									<FireTooltip term="FIRE Progress">Progress</FireTooltip>
								</span>
								<span className="text-xs font-medium text-[#6B6B6B] tabular-nums">
									{formatPercent(Math.min(results.fireProgress, 100), 0)}
								</span>
							</div>
							<div className="h-1.5 bg-[#EDE8E2] rounded-full overflow-hidden">
								<div
									className="h-full rounded-full bg-[#1A1A1A] transition-all duration-500 ease-out"
									style={{ width: `${Math.min(results.fireProgress, 100)}%` }}
								/>
							</div>
						</div>
					)}

					{/* Monte Carlo bar */}
					{successRate !== null && !isRetired && (
						<div className="mt-3">
							<div className="flex justify-between items-baseline mb-1.5">
								<span className="text-xs text-[#9B9B9B]">
									<FireTooltip term="Monte Carlo">Confidence</FireTooltip>
								</span>
								<span className="text-xs font-medium text-[#6B6B6B] tabular-nums">
									{formatPercent(successRate, 0)}
								</span>
							</div>
							<div className="h-1.5 bg-[#EDE8E2] rounded-full overflow-hidden">
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

				{/* ── Tab Navigation ── */}
				<nav className="flex border-b border-[#E5E5E5]">
					{TABS.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"text-sm font-medium py-3 px-5 -mb-px transition-colors duration-150",
								activeTab === tab.id
									? "text-[#1A1A1A] border-b-2 border-[#1A1A1A]"
									: "text-[#9B9B9B] hover:text-[#6B6B6B]",
							)}
						>
							{tab.label}
						</button>
					))}
				</nav>

				{/* ── Tab Content ── */}

				{activeTab === "overview" && (
					<div className="space-y-8 animate-fade-in">
						{/* Portfolio Fan Chart — the hero visualization */}
						{mc && (
							<div className="space-y-3">
								<span className="text-xs text-[#9B9B9B] font-medium">Portfolio Projections</span>
								<PortfolioFanChart monteCarloResults={mc} fireNumber={results.fireNumber} />
							</div>
						)}

						{/* Asset Breakdown */}
						<div className="space-y-3">
							<span className="text-xs text-[#9B9B9B] font-medium">Asset Breakdown</span>
							<AccountBreakdown assets={persona.assets} portfolioTotal={results.portfolioTotal} />
						</div>

						{/* Post-FIRE tools */}
						{isRetired && <PostFireDashboard />}

						{/* RESP section */}
						{persona.resp && (
							<div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-3">
								<h3 className="text-xs text-[#9B9B9B] font-medium">Education savings (RESP)</h3>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
									<div>
										<p className="text-xs text-[#9B9B9B]">Balance</p>
										<p className="text-sm font-medium text-[#1A1A1A] tabular-nums">
											{formatCurrency(persona.resp.balance)}
										</p>
									</div>
									<div>
										<p className="text-xs text-[#9B9B9B]">CESG received</p>
										<p className="text-sm font-medium text-[#1A1A1A] tabular-nums">
											{formatCurrency(persona.resp.cesgReceived)}
										</p>
									</div>
									<div>
										<p className="text-xs text-[#9B9B9B]">Annual contribution</p>
										<p className="text-sm font-medium text-[#1A1A1A] tabular-nums">
											{formatCurrency(persona.resp.annualContribution ?? 0)}
										</p>
									</div>
								</div>
								<p className="text-xs text-[#9B9B9B]">
									RESP is an education sinking fund and is not included in your FIRE portfolio.
								</p>
							</div>
						)}
					</div>
				)}

				{activeTab === "whatif" && (
					<div className="space-y-8 animate-fade-in">
						<ScenarioPanel />
					</div>
				)}

				{activeTab === "details" && (
					<div className="space-y-8 animate-fade-in">
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
										<MetricCard label="Cash Cushion" value={formatCurrency(persona.cashCushion)} />
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
							<div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-3">
								<h3 className="text-xs text-[#9B9B9B] font-medium">
									Tax impact (Ontario + Federal)
								</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-xs text-[#9B9B9B]">Annual tax</p>
										<p className="text-sm font-medium text-[#1A1A1A] tabular-nums">
											{formatCurrency(results.totalTax)}
										</p>
									</div>
									<div>
										<p className="text-xs text-[#9B9B9B]">Marginal rate</p>
										<p className="text-sm font-medium text-[#1A1A1A] tabular-nums">
											{formatPercent(results.marginalRate * 100, 1)}
										</p>
									</div>
									<div>
										<p className="text-xs text-[#9B9B9B]">After-tax portfolio</p>
										<p className="text-sm font-medium text-[#1A1A1A] tabular-nums">
											{formatCurrency(results.afterTaxPortfolioValue)}
										</p>
										<p className="text-xs text-[#9B9B9B]">
											{formatPercent(results.afterTaxFireProgress, 0)} of FIRE target
										</p>
									</div>
									<div>
										<p className="text-xs text-[#9B9B9B]">Tax drag</p>
										<p className="text-sm font-medium text-[#1A1A1A] tabular-nums">
											{formatCurrency(results.portfolioTotal - results.afterTaxPortfolioValue)}
										</p>
										<p className="text-xs text-[#9B9B9B]">Lost to taxes on withdrawal</p>
									</div>
								</div>
							</div>
						)}

						{/* Savings Rate Chart */}
						{!isRetired && (
							<div className="space-y-3">
								<span className="text-xs text-[#9B9B9B] font-medium">
									Savings Rate vs. Years to FI
								</span>
								<SavingsRateChart
									annualExpenses={results.annualExpenses}
									currentSavingsRate={results.savingsRate}
									currentYearsToFI={results.yearsToFI}
								/>
							</div>
						)}
					</div>
				)}

				{/* intentionally empty — recalculating indicator is in DashboardLayout */}
			</div>
		</div>
	);
}
