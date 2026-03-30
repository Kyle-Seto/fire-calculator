import { PersonaEditor } from "@/components/persona/PersonaEditor";
import { ResultsPanel } from "./ResultsPanel";
import { useFireEngine } from "@/engine/useFireEngine";

type DashboardLayoutProps = {
	onBack: () => void;
};

export function DashboardLayout({ onBack }: DashboardLayoutProps) {
	useFireEngine();

	return (
		<div className="min-h-screen flex flex-col md:flex-row">
			<aside className="w-full md:w-[360px] md:min-h-screen md:sticky md:top-0 md:max-h-screen flex-shrink-0">
				<PersonaEditor onBack={onBack} />
			</aside>

			<ResultsPanel />
		</div>
	);
}
