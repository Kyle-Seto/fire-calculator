import { useMemo } from "react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ReferenceDot,
	ResponsiveContainer,
} from "recharts";

import { calculateYearsToFI, calculateFireNumber } from "@/engine/fire";
import { DEFAULTS } from "@/data/constants";
import { formatPercent } from "@/lib/utils";

type SavingsRateChartProps = {
	annualExpenses: number;
	currentSavingsRate: number | null;
	currentYearsToFI: number;
};

const SAVINGS_RATES = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

export function SavingsRateChart({
	annualExpenses,
	currentSavingsRate,
	currentYearsToFI,
}: SavingsRateChartProps) {
	const data = useMemo(() => {
		const fireNumber = calculateFireNumber(annualExpenses, DEFAULTS.withdrawalRate);

		return SAVINGS_RATES.map((rate) => {
			// Derive income from expenses and savings rate:
			// savingsRate = (income - expenses) / income
			// income = expenses / (1 - savingsRate/100)
			const savingsRateFraction = rate / 100;
			if (savingsRateFraction >= 1) return { savingsRate: rate, yearsToFI: 0 };

			const impliedIncome = annualExpenses / (1 - savingsRateFraction);
			const annualSavings = impliedIncome - annualExpenses;

			// Start from zero portfolio to show the pure savings rate relationship
			const years = calculateYearsToFI(
				0,
				annualSavings,
				fireNumber,
				DEFAULTS.realReturnMean,
			);

			return {
				savingsRate: rate,
				yearsToFI: Number.isFinite(years) ? Math.round(years * 10) / 10 : 99,
			};
		});
	}, [annualExpenses]);

	// Find where the current savings rate falls on the curve
	const currentPoint = useMemo(() => {
		if (currentSavingsRate === null || !Number.isFinite(currentYearsToFI))
			return null;

		const roundedRate = Math.round(currentSavingsRate);
		const yearsVal = Math.min(currentYearsToFI, 99);

		return { savingsRate: roundedRate, yearsToFI: yearsVal };
	}, [currentSavingsRate, currentYearsToFI]);

	return (
		<ResponsiveContainer width="100%" height={280}>
			<AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
				<defs>
					<linearGradient id="savingsGreen" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
						<stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
					</linearGradient>
				</defs>

				<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

				<XAxis
					dataKey="savingsRate"
					tick={{ fontSize: 11, fill: "#94a3b8" }}
					tickLine={false}
					axisLine={{ stroke: "#e2e8f0" }}
					tickFormatter={(v: number) => `${v}%`}
					label={{ value: "Savings Rate", position: "insideBottomRight", offset: -4, fontSize: 11, fill: "#94a3b8" }}
				/>
				<YAxis
					tick={{ fontSize: 11, fill: "#94a3b8" }}
					tickLine={false}
					axisLine={false}
					width={50}
					label={{ value: "Years", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#94a3b8" }}
					domain={[0, "auto"]}
				/>

				<Tooltip
					formatter={((value: number) => [`${value} years`, "Years to FI"]) as never}
					labelFormatter={((label: number) => `Savings rate: ${formatPercent(label, 0)}`) as never}
					contentStyle={{
						fontSize: 12,
						borderRadius: 8,
						border: "1px solid #e2e8f0",
						boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
					}}
				/>

				<Area
					type="monotone"
					dataKey="yearsToFI"
					stroke="#22c55e"
					strokeWidth={2}
					fill="url(#savingsGreen)"
					fillOpacity={1}
					isAnimationActive={false}
				/>

				{currentPoint && (
					<ReferenceDot
						x={currentPoint.savingsRate}
						y={currentPoint.yearsToFI}
						r={6}
						fill="#22c55e"
						stroke="#fff"
						strokeWidth={2}
						label={{
							value: `You: ${formatPercent(currentPoint.savingsRate, 0)}`,
							position: "top",
							fontSize: 11,
							fill: "#16a34a",
							offset: 12,
						}}
					/>
				)}
			</AreaChart>
		</ResponsiveContainer>
	);
}
