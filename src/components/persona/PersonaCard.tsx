import type { PersonaTemplate } from "@/types";
import { calculatePortfolioTotal, calculateSavingsRate, calculateAnnualExpenses } from "@/engine/fire";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

type PersonaCardProps = {
	persona: PersonaTemplate;
	onSelect: (persona: PersonaTemplate) => void;
};

const ACCENT_COLORS: Record<string, string> = {
	"mr-student-investor": "bg-rose-500",
	"mr-retire-or-boat": "bg-teal-500",
	"mr-retiring-with-debt": "bg-orange-500",
	"mr-ivf-fire": "bg-purple-500",
	"mr-geo-arbitrage": "bg-emerald-500",
	"mr-healing-brain": "bg-blue-500",
};

const ACCENT_TEXT: Record<string, string> = {
	"mr-student-investor": "text-rose-600",
	"mr-retire-or-boat": "text-teal-600",
	"mr-retiring-with-debt": "text-orange-600",
	"mr-ivf-fire": "text-purple-600",
	"mr-geo-arbitrage": "text-emerald-600",
	"mr-healing-brain": "text-blue-600",
};

function computeStats(persona: PersonaTemplate) {
	const totalSavings = calculatePortfolioTotal(persona.accounts);
	const annualExpenses = calculateAnnualExpenses(persona);
	const savingsRate = calculateSavingsRate(persona.annualIncome, annualExpenses);
	return { totalSavings, savingsRate };
}

export function PersonaCard({ persona, onSelect }: PersonaCardProps) {
	const { totalSavings, savingsRate } = computeStats(persona);
	const accent = ACCENT_COLORS[persona.id] ?? "bg-slate-500";
	const accentText = ACCENT_TEXT[persona.id] ?? "text-slate-600";

	return (
		<button
			type="button"
			onClick={() => onSelect(persona)}
			className="group relative w-full text-left bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
		>
			<div className={`h-1 ${accent}`} />

			<div className="p-6 space-y-4">
				<div className="flex items-start justify-between">
					<div>
						<h3 className="text-lg font-semibold text-slate-900 tracking-tight">
							{persona.name}
						</h3>
						<p className="text-sm text-slate-500 mt-0.5">Age {persona.age}</p>
					</div>
					{persona.retirementStatus === "retired" ? (
						<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
							FIREd
						</span>
					) : (
						<span className={`text-2xl font-bold tabular-nums ${accentText}`}>
							{savingsRate !== null ? formatPercent(savingsRate, 0) : "—"}
						</span>
					)}
				</div>

				<div className="space-y-1.5">
					<p className="text-sm text-slate-600 leading-relaxed">{persona.description}</p>
					{persona.sourceUrl && (
						<a
							href={persona.sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
						>
							<ExternalLink className="w-3 h-3" />
							Source
						</a>
					)}
				</div>

				<div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
					<Stat
						label="Income"
						value={
							persona.annualIncome > 0
								? formatCurrency(persona.annualIncome)
								: "Retired"
						}
					/>
					<Stat label="Saved" value={formatCurrency(totalSavings)} />
					<Stat
						label="Monthly spend"
						value={formatCurrency(persona.monthlySpending)}
					/>
					<Stat
						label={persona.housing.type === "rent" ? "Rent" : "Mortgage"}
						value={formatCurrency(persona.housing.monthlyAmount) + "/mo"}
					/>
				</div>
			</div>

			<div className="absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-t from-slate-50 to-transparent group-hover:h-8 transition-all duration-200" />
		</button>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
			<p className="text-sm font-medium text-slate-800 tabular-nums">{value}</p>
		</div>
	);
}
