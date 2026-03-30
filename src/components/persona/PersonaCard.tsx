import { ArrowRight } from "lucide-react";
import { calculatePortfolioTotal } from "@/engine/fire";
import { formatCurrency } from "@/lib/utils";
import type { PersonaTemplate } from "@/types";

type PersonaCardProps = {
	persona: PersonaTemplate;
	onSelect: (persona: PersonaTemplate) => void;
};

export function PersonaCard({ persona, onSelect }: PersonaCardProps) {
	const portfolio = calculatePortfolioTotal(persona.assets);

	return (
		<button
			type="button"
			onClick={() => onSelect(persona)}
			className="group w-full text-left bg-white rounded-xl border border-[#E5E5E5] p-6 transition-all duration-200 hover:shadow-md hover:shadow-black/[0.04] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
		>
			{/* Name + portfolio */}
			<div className="flex items-baseline justify-between mb-3">
				<span className="text-xs text-[#9B9B9B] font-medium">
					{persona.name}, {persona.age}
				</span>
				<span className="text-sm font-medium text-[#1A1A1A] tabular-nums">
					{formatCurrency(portfolio)}
				</span>
			</div>

			{/* The hook — serif, editorial */}
			<p className="font-[family-name:var(--font-display)] text-lg text-[#1A1A1A] leading-snug">
				{persona.whyInteresting}
			</p>

			{/* CTA */}
			<div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-[#9B9B9B] group-hover:text-[#1A1A1A] transition-colors">
				<span>Explore this story</span>
				<ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
			</div>
		</button>
	);
}
