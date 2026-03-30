import { useMemo } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { MonteCarloResults } from "@/types";

type PortfolioFanChartProps = {
	monteCarloResults: MonteCarloResults | null;
	fireNumber: number;
};

export function PortfolioFanChart({ monteCarloResults, fireNumber }: PortfolioFanChartProps) {
	const data = useMemo(() => {
		if (!monteCarloResults) return [];

		const { p10, p25, p50, p75, p90 } = monteCarloResults.percentiles;

		// Find a sensible cutoff: 5 years past when p50 crosses FIRE number, or 30 years max
		let cutoff = Math.min(p50.length, 30);
		for (let i = 0; i < p50.length; i++) {
			if (p50[i] >= fireNumber) {
				cutoff = Math.min(i + 5, p50.length, 40);
				break;
			}
		}
		cutoff = Math.max(cutoff, Math.min(10, p50.length));

		// Structure data as stacked bands: base (p10), then deltas for each band
		return Array.from({ length: cutoff }, (_, i) => ({
			year: i,
			// Base value (worst case)
			base: p10[i],
			// Band from p10 to p25
			band_10_25: Math.max(0, p25[i] - p10[i]),
			// Band from p25 to p50
			band_25_50: Math.max(0, p50[i] - p25[i]),
			// Band from p50 to p75
			band_50_75: Math.max(0, p75[i] - p50[i]),
			// Band from p75 to p90
			band_75_90: Math.max(0, p90[i] - p75[i]),
			// Keep raw values for tooltip
			p10: p10[i],
			p25: p25[i],
			p50: p50[i],
			p75: p75[i],
			p90: p90[i],
		}));
	}, [monteCarloResults, fireNumber]);

	if (!monteCarloResults || data.length === 0) return null;

	const maxValue = Math.max(...data.map((d) => d.p90), fireNumber * 1.1);

	return (
		<ResponsiveContainer width="100%" height={320}>
			<AreaChart data={data} margin={{ top: 8, right: 100, bottom: 0, left: 0 }}>
				<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

				<XAxis
					dataKey="year"
					tick={{ fontSize: 11, fill: "#94a3b8" }}
					tickLine={false}
					axisLine={{ stroke: "#e2e8f0" }}
					label={{
						value: "Years",
						position: "insideBottomRight",
						offset: -4,
						fontSize: 11,
						fill: "#94a3b8",
					}}
				/>
				<YAxis
					tickFormatter={(v: number) => formatCurrency(v)}
					tick={{ fontSize: 11, fill: "#94a3b8" }}
					tickLine={false}
					axisLine={false}
					width={90}
					domain={[0, maxValue]}
				/>

				<Tooltip
					content={({ active, payload, label }) => {
						if (!active || !payload?.length) return null;
						const d = payload[0]?.payload;
						if (!d) return null;
						return (
							<div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs space-y-1">
								<p className="font-medium text-slate-700">Year {label}</p>
								<p className="text-blue-600">Best case: {formatCurrency(d.p90)}</p>
								<p className="text-blue-500">Optimistic: {formatCurrency(d.p75)}</p>
								<p className="text-blue-700 font-semibold">Median: {formatCurrency(d.p50)}</p>
								<p className="text-slate-500">Conservative: {formatCurrency(d.p25)}</p>
								<p className="text-slate-400">Worst case: {formatCurrency(d.p10)}</p>
							</div>
						);
					}}
				/>

				{/* Invisible base (p10 value) — this is the floor the bands stack on */}
				<Area
					type="monotone"
					dataKey="base"
					stackId="fan"
					stroke="none"
					fill="transparent"
					isAnimationActive={false}
				/>

				{/* Band: p10 → p25 (worst case to conservative) */}
				<Area
					type="monotone"
					dataKey="band_10_25"
					stackId="fan"
					stroke="none"
					fill="#3b82f6"
					fillOpacity={0.08}
					isAnimationActive={false}
				/>

				{/* Band: p25 → p50 (conservative to median) */}
				<Area
					type="monotone"
					dataKey="band_25_50"
					stackId="fan"
					stroke="none"
					fill="#3b82f6"
					fillOpacity={0.15}
					isAnimationActive={false}
				/>

				{/* Band: p50 → p75 (median to optimistic) */}
				<Area
					type="monotone"
					dataKey="band_50_75"
					stackId="fan"
					stroke="none"
					fill="#3b82f6"
					fillOpacity={0.15}
					isAnimationActive={false}
				/>

				{/* Band: p75 → p90 (optimistic to best case) */}
				<Area
					type="monotone"
					dataKey="band_75_90"
					stackId="fan"
					stroke="none"
					fill="#3b82f6"
					fillOpacity={0.08}
					isAnimationActive={false}
				/>

				{/* Median line overlay */}
				<Area
					type="monotone"
					dataKey="p50"
					stroke="#3b82f6"
					strokeWidth={2}
					fill="none"
					dot={false}
					isAnimationActive={false}
				/>

				{/* FIRE number line */}
				<ReferenceLine
					y={fireNumber}
					stroke="#ef4444"
					strokeDasharray="6 4"
					strokeWidth={1.5}
					label={{
						value: `FIRE ${formatCurrency(fireNumber)}`,
						position: "right",
						fontSize: 11,
						fill: "#ef4444",
					}}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}
