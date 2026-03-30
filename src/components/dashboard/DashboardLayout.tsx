import { PersonaEditor } from "@/components/persona/PersonaEditor";
import { useFireEngine } from "@/engine/useFireEngine";
import { useFireStore } from "@/store/useFireStore";
import { ResultsPanel } from "./ResultsPanel";

type DashboardLayoutProps = {
	onBack: () => void;
};

export function DashboardLayout({ onBack }: DashboardLayoutProps) {
	useFireEngine();
	const isCalculating = useFireStore((s) => s.isCalculating);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Full-width recalculating bar — visible from anywhere */}
			{isCalculating && (
				<div className="fixed top-0 left-0 right-0 h-1 bg-[#EDE8E2] z-50 overflow-hidden">
					<div className="h-full w-1/3 bg-[#1A1A1A] rounded-full animate-[shimmer_1s_ease-in-out_infinite]" />
				</div>
			)}

			<div className="flex flex-col md:flex-row flex-1">
				<aside className="w-full md:w-[360px] md:min-h-screen md:sticky md:top-0 md:max-h-screen flex-shrink-0 overflow-y-auto">
					<PersonaEditor onBack={onBack} />
				</aside>

				<ResultsPanel />
			</div>
		</div>
	);
}
