import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
	label: ReactNode;
	value: string;
	subtitle?: string;
	variant?: "default" | "hero" | "accent";
	className?: string;
};

export function MetricCard({
	label,
	value,
	subtitle,
	variant = "default",
	className,
}: MetricCardProps) {
	return (
		<div
			className={cn(
				"space-y-1",
				variant === "hero" && "text-center py-8",
				variant === "accent" && "bg-slate-50 rounded-xl px-5 py-4",
				variant === "default" && "px-1 py-3",
				className,
			)}
		>
			<p
				className="text-xs uppercase tracking-wider font-medium text-slate-400"
			>
				{label}
			</p>
			<p
				className={cn(
					"font-bold tabular-nums tracking-tight",
					variant === "hero" && "text-5xl text-slate-900 mt-2",
					variant === "accent" && "text-xl text-slate-900",
					variant === "default" && "text-lg text-slate-800",
				)}
			>
				{value}
			</p>
			{subtitle && (
				<p
					className={cn(
						"text-xs text-slate-400",
						variant === "hero" && "mt-1",
					)}
				>
					{subtitle}
				</p>
			)}
		</div>
	);
}

export function MetricSkeleton({ variant = "default" }: { variant?: "default" | "hero" }) {
	return (
		<div
			className={cn(
				"space-y-2",
				variant === "hero" && "text-center py-8",
				variant === "default" && "px-1 py-3",
			)}
		>
			<div className="h-3 w-16 bg-slate-200 rounded animate-pulse mx-auto" />
			<div
				className={cn(
					"bg-slate-200 rounded animate-pulse mx-auto",
					variant === "hero" ? "h-12 w-48 mt-2" : "h-6 w-24",
				)}
			/>
		</div>
	);
}
