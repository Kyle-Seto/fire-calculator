import * as Tooltip from "@radix-ui/react-tooltip";

const GLOSSARY: Record<string, string> = {
	"FIRE Number":
		"The total portfolio value you need to retire. Calculated as your annual expenses divided by your withdrawal rate (default 4%). At this amount, your investments can sustain your lifestyle indefinitely.",
	"Monte Carlo":
		"Instead of assuming a fixed return every year, we simulate 1,000 different market scenarios with randomized returns. The success rate shows what percentage of those scenarios your portfolio survives.",
	"Savings Rate":
		"The percentage of your gross income that you save. This is the most powerful lever for reaching FIRE \u2014 a higher savings rate both increases your savings and reduces the amount you need to retire.",
	"Years to FI":
		"How many years until your portfolio reaches your FIRE Number, assuming your current savings rate and a 7% average real return.",
	"FIRE Type":
		"Lean FIRE (under $40K/yr spending), Traditional ($40-100K), Fat ($100K+). Barista FIRE means part-time income covers expenses. Coast FI means your portfolio will compound to your target without additional savings.",
	"FIRE Progress":
		"How close you are to your FIRE Number, expressed as a percentage. 100% means you've reached financial independence.",
	"Yield Shield":
		"A temporary strategy for the first 3-5 years of retirement. Shift some investments to higher-yield assets (REITs, dividend stocks) so portfolio income covers expenses without selling during a downturn.",
	"Cash Cushion":
		"Cash reserves to cover the gap between your portfolio yield and annual expenses for 3-5 years. Protects against sequence-of-returns risk.",
	"Sequence of Returns":
		"A market crash in your first few years of retirement is far more damaging than one later. Even with the same average returns, early losses combined with withdrawals can deplete a portfolio.",
	"Withdrawal Rate":
		"The percentage of your portfolio you withdraw annually. The 4% rule (from the Trinity Study) suggests this rate has a ~95% chance of lasting 30 years historically.",
	"Portfolio Survival":
		"The probability that your portfolio lasts through retirement, based on Monte Carlo simulation. Above 90% is generally considered strong.",
};

type FireTooltipProps = {
	term: string;
	children: React.ReactNode;
};

export function FireTooltip({ term, children }: FireTooltipProps) {
	const explanation = GLOSSARY[term];

	if (!explanation) {
		return <>{children}</>;
	}

	return (
		<Tooltip.Root delayDuration={300}>
			<Tooltip.Trigger asChild>
				<span className="cursor-help border-b border-dotted border-slate-400">
					{children}
				</span>
			</Tooltip.Trigger>
			<Tooltip.Portal>
				<Tooltip.Content
					className="max-w-[280px] rounded-lg bg-slate-800 px-3 py-2 text-sm leading-relaxed text-white shadow-md"
					sideOffset={6}
				>
					{explanation}
					<Tooltip.Arrow className="fill-slate-800" />
				</Tooltip.Content>
			</Tooltip.Portal>
		</Tooltip.Root>
	);
}
