import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PERSONA_TEMPLATES } from "@/data/personas";
import type { FireResults, Persona } from "@/types";

const defaultPersona = PERSONA_TEMPLATES[0];

type FireState = {
	persona: Persona;
	activePersonaId: string;
	results: FireResults | null;
	isCalculating: boolean;
	error: string | null;
};

type FireActions = {
	setPersona: (persona: Persona) => void;
	updatePersona: (updates: Partial<Persona>) => void;
	resetPersona: (templateId: string) => void;
	setResults: (results: FireResults) => void;
	setCalculating: (isCalculating: boolean) => void;
	setError: (error: string | null) => void;
};

export const useFireStore = create<FireState & FireActions>()(
	persist(
		(set) => ({
			persona: defaultPersona,
			activePersonaId: defaultPersona.id,
			results: null,
			isCalculating: false,
			error: null,

			setPersona: (persona) => set({ persona, activePersonaId: persona.id }),

			updatePersona: (updates) =>
				set((state) => ({
					persona: { ...state.persona, ...updates },
				})),

			resetPersona: (templateId) => {
				const template = PERSONA_TEMPLATES.find((p) => p.id === templateId);
				if (template) {
					set({
						persona: { ...template },
						activePersonaId: template.id,
						results: null,
						error: null,
					});
				}
			},

			setResults: (results) => set({ results }),

			setCalculating: (isCalculating) => set({ isCalculating }),

			setError: (error) => set({ error }),
		}),
		{
			name: "fire-copilot-store",
			version: 3,
			partialize: (state) => ({
				persona: state.persona,
				activePersonaId: state.activePersonaId,
			}),
			migrate: (persistedState, version) => {
				if (version === undefined || version < 3) {
					return {
						persona: defaultPersona,
						activePersonaId: defaultPersona.id,
						results: null,
						isCalculating: false,
						error: null,
					};
				}
				return persistedState as FireState & FireActions;
			},
		},
	),
);
