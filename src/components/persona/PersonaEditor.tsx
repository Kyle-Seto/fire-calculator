import { useFireStore } from "@/store/useFireStore";
import type { Account, LifeEvent, Persona } from "@/types";
import CurrencyInput from "react-currency-input-field";
import { ArrowLeft, Plus, RotateCcw, X } from "lucide-react";

type PersonaEditorProps = {
	onBack: () => void;
};

const ACCOUNT_LABELS: Record<string, { label: string; color: string }> = {
	TFSA: { label: "TFSA", color: "bg-violet-500" },
	RRSP: { label: "RRSP", color: "bg-cyan-500" },
	NonRegistered: { label: "Non-Registered", color: "bg-amber-500" },
	Cash: { label: "Cash", color: "bg-slate-400" },
};

export function PersonaEditor({ onBack }: PersonaEditorProps) {
	const persona = useFireStore((s) => s.persona);
	const updatePersona = useFireStore((s) => s.updatePersona);
	const resetPersona = useFireStore((s) => s.resetPersona);

	function handleCurrencyChange(field: keyof Persona, value: string | undefined) {
		const num = value ? Number.parseFloat(value) : 0;
		updatePersona({ [field]: num });
	}

	function handleAccountChange(index: number, value: string | undefined) {
		const num = value ? Number.parseFloat(value) : 0;
		const newAccounts = persona.accounts.map((acc: Account, i: number) =>
			i === index ? { ...acc, balance: num } : acc,
		);
		updatePersona({ accounts: newAccounts });
	}

	function handleHousingChange(
		field: "monthlyAmount" | "mortgageRemaining" | "type",
		value: string | number | undefined,
	) {
		if (field === "type") {
			updatePersona({
				housing: {
					...persona.housing,
					type: value as "rent" | "own",
					...(value === "rent" ? { mortgageRemaining: undefined } : {}),
				},
			});
		} else {
			const num = typeof value === "string" ? Number.parseFloat(value) || 0 : (value ?? 0);
			updatePersona({
				housing: { ...persona.housing, [field]: num },
			});
		}
	}

	const events = persona.lifeEvents ?? [];

	function handleAddEvent() {
		const now = new Date();
		const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
		updatePersona({
			lifeEvents: [
				...events,
				{
					id: crypto.randomUUID(),
					label: "",
					type: "expense",
					monthlyAmount: 0,
					startDate: defaultStart,
				},
			],
		});
	}

	function handleRemoveEvent(eventId: string) {
		updatePersona({ lifeEvents: events.filter((e) => e.id !== eventId) });
	}

	function handleUpdateEvent(eventId: string, updates: Partial<LifeEvent>) {
		updatePersona({
			lifeEvents: events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
		});
	}

	return (
		<div className="h-full flex flex-col bg-white border-r border-slate-200/80">
			<div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Personas</span>
				</button>
				<button
					type="button"
					onClick={() => resetPersona(persona.id)}
					className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
				>
					<RotateCcw className="w-3.5 h-3.5" />
					<span>Reset</span>
				</button>
			</div>

			<div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
				<div>
					<p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">
						Editing
					</p>
					<p className="text-base font-semibold text-slate-900">{persona.name}</p>
				</div>

				<Section title="Personal">
					<Field label="Age">
						<input
							type="number"
							min={18}
							max={100}
							value={persona.age}
							onChange={(e) =>
								updatePersona({ age: Number.parseInt(e.target.value) || 18 })
							}
							className="field-input"
						/>
					</Field>
				</Section>

				<Section title="Income">
					<Field label="Annual income">
						<CurrencyField
							value={persona.annualIncome}
							onValueChange={(v) => handleCurrencyChange("annualIncome", v)}
						/>
					</Field>
				</Section>

				<Section title="Spending">
					<Field label="Monthly spending">
						<CurrencyField
							value={persona.monthlySpending}
							onValueChange={(v) => handleCurrencyChange("monthlySpending", v)}
						/>
					</Field>
				</Section>

				<Section title="Accounts">
					{persona.accounts.map((account: Account, index: number) => {
						const meta = ACCOUNT_LABELS[account.type] ?? {
							label: account.type,
							color: "bg-slate-400",
						};
						return (
							<Field
								key={account.type}
								label={
									<span className="flex items-center gap-2">
										<span className={`w-2 h-2 rounded-full ${meta.color}`} />
										{meta.label}
									</span>
								}
							>
								<CurrencyField
									value={account.balance}
									onValueChange={(v) => handleAccountChange(index, v)}
								/>
							</Field>
						);
					})}
				</Section>

				<Section title="Housing">
					<Field label="Type">
						<select
							value={persona.housing.type}
							onChange={(e) => handleHousingChange("type", e.target.value)}
							className="field-input"
						>
							<option value="rent">Renting</option>
							<option value="own">Own / Mortgage</option>
						</select>
					</Field>
					<Field label="Monthly payment">
						<CurrencyField
							value={persona.housing.monthlyAmount}
							onValueChange={(v) => handleHousingChange("monthlyAmount", v)}
						/>
					</Field>
					{persona.housing.type === "own" && (
						<Field label="Mortgage remaining">
							<CurrencyField
								value={persona.housing.mortgageRemaining ?? 0}
								onValueChange={(v) => handleHousingChange("mortgageRemaining", v)}
							/>
						</Field>
					)}
				</Section>

				<Section title="Life Events">
					{events.map((event) => (
						<LifeEventCard
							key={event.id}
							event={event}
							onUpdate={(updates) => handleUpdateEvent(event.id, updates)}
							onRemove={() => handleRemoveEvent(event.id)}
						/>
					))}
					<button
						type="button"
						onClick={handleAddEvent}
						className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors pt-1"
					>
						<Plus className="w-3.5 h-3.5" />
						Add event
					</button>
				</Section>
			</div>
		</div>
	);
}

function LifeEventCard({
	event,
	onUpdate,
	onRemove,
}: {
	event: LifeEvent;
	onUpdate: (updates: Partial<LifeEvent>) => void;
	onRemove: () => void;
}) {
	return (
		<div className="bg-slate-50 rounded-lg p-3 space-y-2 relative group">
			<button
				type="button"
				onClick={onRemove}
				className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 transition-colors"
			>
				<X className="w-3.5 h-3.5" />
			</button>

			<input
				type="text"
				value={event.label}
				onChange={(e) => onUpdate({ label: e.target.value })}
				placeholder="e.g., CPP benefits"
				className="w-full text-sm font-medium text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-300 pr-6"
			/>

			<div className="flex items-center gap-2">
				<select
					value={event.type}
					onChange={(e) => onUpdate({ type: e.target.value as "income" | "expense" })}
					className="text-xs bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-600"
				>
					<option value="income">Income</option>
					<option value="expense">Expense</option>
				</select>
				<CurrencyInput
					prefix="$"
					decimalsLimit={0}
					groupSeparator=","
					value={event.monthlyAmount}
					onValueChange={(v) => onUpdate({ monthlyAmount: v ? Number.parseFloat(v) : 0 })}
					placeholder="$/mo"
					className="w-20 text-xs text-right bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-600"
				/>
				<span className="text-xs text-slate-400">/mo</span>
			</div>

			<div className="flex items-center gap-2 text-xs text-slate-500">
				<span>From</span>
				<input
					type="month"
					value={event.startDate}
					onChange={(e) => onUpdate({ startDate: e.target.value })}
					className="bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-600"
				/>
			</div>
			<div className="flex items-center gap-2 text-xs text-slate-500">
				<span>Until</span>
				<input
					type="month"
					value={event.endDate ?? ""}
					onChange={(e) => {
						const val = e.target.value;
						onUpdate({ endDate: val || undefined });
					}}
					className="bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-600"
				/>
				{!event.endDate && (
					<span className="text-slate-300 italic">forever</span>
				)}
			</div>
		</div>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-3">
			<h3 className="text-xs text-slate-400 uppercase tracking-wider font-medium">
				{title}
			</h3>
			{children}
		</div>
	);
}

function Field({
	label,
	children,
}: {
	label: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<label className="text-sm text-slate-600 shrink-0">{label}</label>
			<div className="w-36">{children}</div>
		</div>
	);
}

function CurrencyField({
	value,
	onValueChange,
}: {
	value: number;
	onValueChange: (value: string | undefined) => void;
}) {
	return (
		<CurrencyInput
			prefix="$"
			decimalsLimit={0}
			groupSeparator=","
			value={value}
			onValueChange={onValueChange}
			className="field-input text-right"
		/>
	);
}
