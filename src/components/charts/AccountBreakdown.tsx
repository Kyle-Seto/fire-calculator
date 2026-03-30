import { useMemo } from "react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

import type { Account } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

type AccountBreakdownProps = {
	accounts: Account[];
	portfolioTotal: number;
};

const ACCOUNT_COLORS: Record<string, string> = {
	TFSA: "#8b5cf6",
	RRSP: "#06b6d4",
	NonRegistered: "#f59e0b",
	Cash: "#6b7280",
};

const ACCOUNT_LABELS: Record<string, string> = {
	TFSA: "TFSA",
	RRSP: "RRSP",
	NonRegistered: "Non-Registered",
	Cash: "Cash",
};

export function AccountBreakdown({
	accounts,
	portfolioTotal,
}: AccountBreakdownProps) {
	const chartData = useMemo(() => {
		return accounts
			.filter((a) => a.balance > 0)
			.map((a) => ({
				name: ACCOUNT_LABELS[a.type] ?? a.type,
				value: a.balance,
				color: ACCOUNT_COLORS[a.type] ?? "#94a3b8",
				pct: portfolioTotal > 0 ? (a.balance / portfolioTotal) * 100 : 0,
			}));
	}, [accounts, portfolioTotal]);

	if (chartData.length === 0) return null;

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="relative w-full" style={{ height: 240 }}>
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={chartData}
							cx="50%"
							cy="50%"
							innerRadius={65}
							outerRadius={100}
							paddingAngle={2}
							dataKey="value"
							stroke="none"
							isAnimationActive={false}
						>
							{chartData.map((entry) => (
								<Cell key={entry.name} fill={entry.color} />
							))}
						</Pie>
						<Tooltip
							formatter={((value: number) => formatCurrency(value)) as never}
							contentStyle={{
								fontSize: 12,
								borderRadius: 8,
								border: "1px solid #e2e8f0",
								boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
							}}
						/>
					</PieChart>
				</ResponsiveContainer>

				{/* Center label */}
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="text-center">
						<p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
						<p className="text-lg font-bold text-slate-800 tabular-nums">
							{formatCurrency(portfolioTotal)}
						</p>
					</div>
				</div>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
				{chartData.map((entry) => (
					<div key={entry.name} className="flex items-center gap-1.5">
						<div
							className="w-2.5 h-2.5 rounded-full shrink-0"
							style={{ backgroundColor: entry.color }}
						/>
						<span className="text-xs text-slate-600">
							{entry.name}{" "}
							<span className="text-slate-400 tabular-nums">
								{formatPercent(entry.pct, 0)}
							</span>
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
