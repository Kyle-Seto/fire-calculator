import { PERSONA_TEMPLATES } from "@/data/personas";
import { useFireStore } from "@/store/useFireStore";
import type { PersonaTemplate } from "@/types";
import { PersonaCard } from "./PersonaCard";

type PersonaSelectorProps = {
	onPersonaSelected: (personaId: string) => void;
};

export function PersonaSelector({ onPersonaSelected }: PersonaSelectorProps) {
	const setPersona = useFireStore((s) => s.setPersona);

	function handleSelect(persona: PersonaTemplate) {
		setPersona({ ...persona });
		onPersonaSelected(persona.id);
	}

	return (
		<div className="min-h-screen flex flex-col">
			<header className="pt-16 pb-12 px-6 text-center">
				<div className="flex items-center justify-center gap-2 mb-4">
					<div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
						<span className="text-white text-sm font-bold">F</span>
					</div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">
						FIRE Co-Pilot
					</h1>
				</div>
				<p className="text-slate-500 text-lg max-w-md mx-auto">
					Your path to financial independence, calculated.
				</p>
			</header>

			<main className="flex-1 px-6 pb-16">
				<div className="max-w-3xl mx-auto">
					<p className="text-sm text-slate-400 uppercase tracking-wider font-medium mb-6 text-center">
						Pick a profile that looks like you
					</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{PERSONA_TEMPLATES.map((persona) => (
							<PersonaCard
								key={persona.id}
								persona={persona}
								onSelect={handleSelect}
							/>
						))}
					</div>

					<p className="text-xs text-slate-400 text-center mt-8 max-w-sm mx-auto">
						Every number is editable. Pick a starting point, then make it yours.
					</p>
				</div>
			</main>
		</div>
	);
}
