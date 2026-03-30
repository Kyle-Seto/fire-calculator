import type { Recommendation } from "@/engine/recommendations";

const categoryColors: Record<Recommendation["category"], string> = {
	tax: "text-purple-500",
	savings: "text-blue-500",
	retirement: "text-amber-500",
	risk: "text-red-500",
};

const categoryLabels: Record<Recommendation["category"], string> = {
	tax: "Tax",
	savings: "Savings",
	retirement: "Retirement",
	risk: "Risk",
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
	return (
		<div className="bg-slate-50/70 rounded-2xl px-5 py-4 space-y-2">
			<div className="flex items-start justify-between gap-3">
				<h3 className="text-sm font-medium text-slate-700 leading-snug">
					{rec.title}
				</h3>
				<span className={`shrink-0 text-[10px] font-medium uppercase tracking-wider ${categoryColors[rec.category]}`}>
					{categoryLabels[rec.category]}
				</span>
			</div>
			<p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
			<p className="text-xs font-semibold text-emerald-600">{rec.impact}</p>
		</div>
	);
}
