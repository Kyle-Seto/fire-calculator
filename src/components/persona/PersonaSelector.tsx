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
			<header className="pt-20 pb-10 px-6 text-center animate-fade-in">
				<h1 className="font-[family-name:var(--font-display)] text-3xl text-[#1A1A1A] mb-3">
					When can you stop working?
				</h1>
				<p className="text-sm text-[#9B9B9B] max-w-sm mx-auto">
					Real financial independence stories. Pick one close to yours, then make every number your own.
				</p>
			</header>

			<main className="flex-1 px-6 pb-20">
				<div className="max-w-3xl mx-auto">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{PERSONA_TEMPLATES.map((persona, i) => (
							<div
								key={persona.id}
								className="animate-fade-in-up"
								style={{ animationDelay: `${i * 60}ms` }}
							>
								<PersonaCard
									persona={persona}
									onSelect={handleSelect}
								/>
							</div>
						))}
					</div>

					<p className="text-xs text-[#9B9B9B] text-center mt-12">
						Every number is editable.
					</p>
				</div>
			</main>
		</div>
	);
}
