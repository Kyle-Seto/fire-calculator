import { useMemo } from "react";
import { calculateAnnualExpenses } from "@/engine/fire";
import { calculateTotalTax } from "@/engine/tax";
import { generateWithdrawalPlan } from "@/engine/withdrawals";
import { cn, formatCurrency } from "@/lib/utils";
import { useFireStore } from "@/store/useFireStore";

const DISPLAY_YEARS = 10;

export function WithdrawalStrategy() {
	const persona = useFireStore((s) => s.persona);

	const plan = useMemo(() => generateWithdrawalPlan(persona, DISPLAY_YEARS), [persona]);

	const totalMeltdown = useMemo(() => plan.reduce((sum, row) => sum + row.rrspMeltdown, 0), [plan]);

	const taxSaved = useMemo(() => {
		const annualExpenses = calculateAnnualExpenses(persona);
		const naiveTaxPerYear = calculateTotalTax(annualExpenses);
		const naiveTaxTotal = naiveTaxPerYear * plan.length;
		const optimizedTaxTotal = plan.reduce((sum, row) => sum + row.taxOwed, 0);
		return naiveTaxTotal - optimizedTaxTotal;
	}, [plan, persona]);

	if (plan.length === 0) return null;

	return (
		<div className="space-y-4">
			<div className="flex items-baseline justify-between">
				<span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
					Withdrawal Strategy
				</span>
				{taxSaved > 0 && (
					<span className="text-xs font-semibold text-emerald-600">
						{formatCurrency(taxSaved)} saved over {DISPLAY_YEARS}y
					</span>
				)}
			</div>

			{totalMeltdown > 0 && (
				<div className="bg-cyan-50 rounded-xl p-4 text-xs text-cyan-800 space-y-1">
					<p className="font-medium">RRSP Meltdown Strategy Active</p>
					<p className="text-cyan-600">
						Converting {formatCurrency(totalMeltdown)} from RRSP to TFSA over {DISPLAY_YEARS} years
						by filling low tax brackets in early retirement — before CPP/OAS push you into higher
						brackets.
					</p>
				</div>
			)}

			<div className="bg-slate-50/70 rounded-2xl overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-xs">
						<thead>
							<tr className="bg-slate-100/50">
								<th className="px-3 py-3 text-left font-medium text-slate-400 uppercase tracking-wider">
									Yr
								</th>
								<th className="px-3 py-3 text-right font-medium text-cyan-500 uppercase tracking-wider">
									RRSP
								</th>
								<th className="px-3 py-3 text-right font-medium text-cyan-300 uppercase tracking-wider">
									Meltdown
								</th>
								<th className="px-3 py-3 text-right font-medium text-amber-500 uppercase tracking-wider">
									Non-Reg
								</th>
								<th className="px-3 py-3 text-right font-medium text-purple-400 uppercase tracking-wider">
									TFSA
								</th>
								<th className="px-3 py-3 text-right font-medium text-red-400 uppercase tracking-wider">
									Tax
								</th>
								<th className="px-3 py-3 text-right font-medium text-slate-500 uppercase tracking-wider">
									Net
								</th>
								<th className="px-3 py-3 text-right font-medium text-slate-400 uppercase tracking-wider">
									Balance
								</th>
							</tr>
						</thead>
						<tbody>
							{plan.map((row, idx) => (
								<tr
									key={row.year}
									className={cn(
										"transition-colors",
										idx % 2 === 0 ? "bg-transparent" : "bg-white/60",
									)}
								>
									<td className="px-3 py-2.5 text-slate-500 tabular-nums">
										{row.year}
										<span className="text-slate-300 ml-1">({row.age})</span>
									</td>
									<td className="px-3 py-2.5 text-right tabular-nums text-cyan-600">
										{row.rrspWithdrawal > 0 ? formatCurrency(row.rrspWithdrawal) : "—"}
									</td>
									<td className="px-3 py-2.5 text-right tabular-nums text-cyan-400">
										{row.rrspMeltdown > 0 ? formatCurrency(row.rrspMeltdown) : "—"}
									</td>
									<td className="px-3 py-2.5 text-right tabular-nums text-amber-600">
										{row.nonRegWithdrawal > 0 ? formatCurrency(row.nonRegWithdrawal) : "—"}
									</td>
									<td className="px-3 py-2.5 text-right tabular-nums text-purple-600">
										{row.tfsaWithdrawal > 0 ? formatCurrency(row.tfsaWithdrawal) : "—"}
									</td>
									<td className="px-3 py-2.5 text-right tabular-nums text-red-400">
										{row.taxOwed > 0 ? formatCurrency(row.taxOwed) : "—"}
									</td>
									<td className="px-3 py-2.5 text-right tabular-nums text-slate-700 font-medium">
										{formatCurrency(row.afterTaxIncome)}
									</td>
									<td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
										{formatCurrency(row.totalBalance)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<p className="text-xs text-slate-400 leading-relaxed">
				RRSP meltdown fills low brackets first, converting excess to TFSA. Non-reg covers remaining
				expenses. TFSA preserved for last. 7% real return assumed.
			</p>
		</div>
	);
}
