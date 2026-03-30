import { useFireStore } from "@/store/useFireStore";
import type { Asset, AssetType, Liability, LifeEvent, Persona, RESPAccount } from "@/types";
import CurrencyInput from "react-currency-input-field";
import { ArrowLeft, Plus, RotateCcw, X } from "lucide-react";

type PersonaEditorProps = {
	onBack: () => void;
};

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
	{ value: "TFSA", label: "TFSA" },
	{ value: "RRSP", label: "RRSP" },
	{ value: "FHSA", label: "FHSA" },
	{ value: "NonRegistered", label: "Non-Registered" },
	{ value: "Cash", label: "Cash" },
	{ value: "Property", label: "Property" },
	{ value: "Vehicle", label: "Vehicle" },
	{ value: "Other", label: "Other" },
];

const ASSET_COLORS: Record<string, string> = {
	TFSA: "bg-violet-500",
	RRSP: "bg-cyan-500",
	FHSA: "bg-pink-500",
	NonRegistered: "bg-amber-500",
	Cash: "bg-slate-400",
	Property: "bg-emerald-500",
	Vehicle: "bg-blue-500",
	Other: "bg-rose-400",
};

export function PersonaEditor({ onBack }: PersonaEditorProps) {
	const persona = useFireStore((s) => s.persona);
	const updatePersona = useFireStore((s) => s.updatePersona);
	const resetPersona = useFireStore((s) => s.resetPersona);

	function handleCurrencyChange(field: keyof Persona, value: string | undefined) {
		const num = value ? Number.parseFloat(value) : 0;
		updatePersona({ [field]: num });
	}

	function handleHousingChange(
		field: "monthlyAmount" | "type",
		value: string | number | undefined,
	) {
		if (field === "type") {
			updatePersona({
				housing: {
					...persona.housing,
					type: value as "rent" | "own",
				},
			});
		} else {
			const num = typeof value === "string" ? Number.parseFloat(value) || 0 : (value ?? 0);
			updatePersona({
				housing: { ...persona.housing, [field]: num },
			});
		}
	}

	// ── Assets ──

	function handleAddAsset() {
		updatePersona({
			assets: [
				...persona.assets,
				{ id: crypto.randomUUID(), label: "", type: "Cash" as AssetType, value: 0 },
			],
		});
	}

	function handleRemoveAsset(assetId: string) {
		updatePersona({ assets: persona.assets.filter((a) => a.id !== assetId) });
	}

	function handleUpdateAsset(assetId: string, updates: Partial<Asset>) {
		updatePersona({
			assets: persona.assets.map((a) => (a.id === assetId ? { ...a, ...updates } : a)),
		});
	}

	// ── Liabilities ──

	function handleAddLiability() {
		updatePersona({
			liabilities: [
				...persona.liabilities,
				{ id: crypto.randomUUID(), label: "", balance: 0 },
			],
		});
	}

	function handleRemoveLiability(liabilityId: string) {
		updatePersona({
			liabilities: persona.liabilities.filter((l) => l.id !== liabilityId),
		});
	}

	function handleUpdateLiability(liabilityId: string, updates: Partial<Liability>) {
		updatePersona({
			liabilities: persona.liabilities.map((l) =>
				l.id === liabilityId ? { ...l, ...updates } : l,
			),
		});
	}

	// ── Life Events ──

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

				<Section title="Assets">
					{persona.assets.map((asset) => (
						<AssetCard
							key={asset.id}
							asset={asset}
							onUpdate={(updates) => handleUpdateAsset(asset.id, updates)}
							onRemove={() => handleRemoveAsset(asset.id)}
						/>
					))}
					<button
						type="button"
						onClick={handleAddAsset}
						className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors pt-1"
					>
						<Plus className="w-3.5 h-3.5" />
						Add asset
					</button>
				</Section>

				<Section title="Liabilities">
					{persona.liabilities.map((liability) => (
						<LiabilityCard
							key={liability.id}
							liability={liability}
							onUpdate={(updates) => handleUpdateLiability(liability.id, updates)}
							onRemove={() => handleRemoveLiability(liability.id)}
						/>
					))}
					<button
						type="button"
						onClick={handleAddLiability}
						className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors pt-1"
					>
						<Plus className="w-3.5 h-3.5" />
						Add liability
					</button>
				</Section>

				<Section title="Education Savings (RESP)">
					{persona.resp ? (
						<>
							<RESPEditor
								resp={persona.resp}
								onUpdate={(updates) =>
									updatePersona({ resp: { ...persona.resp!, ...updates } })
								}
							/>
							<button
								type="button"
								onClick={() => updatePersona({ resp: undefined })}
								className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors pt-1"
							>
								<X className="w-3.5 h-3.5" />
								Remove RESP
							</button>
						</>
					) : (
						<button
							type="button"
							onClick={() =>
								updatePersona({
									resp: {
										balance: 0,
										contributions: 0,
										cesgReceived: 0,
										beneficiaryAge: 0,
										annualContribution: 2_500,
									},
								})
							}
							className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors pt-1"
						>
							<Plus className="w-3.5 h-3.5" />
							Add RESP
						</button>
					)}
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

// ── Sub-components ──

function AssetCard({
	asset,
	onUpdate,
	onRemove,
}: {
	asset: Asset;
	onUpdate: (updates: Partial<Asset>) => void;
	onRemove: () => void;
}) {
	const color = ASSET_COLORS[asset.type] ?? "bg-slate-400";
	return (
		<div className="flex items-center gap-2 group">
			<span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
			<input
				type="text"
				value={asset.label}
				onChange={(e) => onUpdate({ label: e.target.value })}
				placeholder="Label"
				className="flex-1 min-w-0 text-sm text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-300"
			/>
			<select
				value={asset.type}
				onChange={(e) => onUpdate({ type: e.target.value as AssetType })}
				className="text-xs bg-transparent border border-slate-200 rounded px-1 py-0.5 text-slate-500 w-24"
			>
				{ASSET_TYPE_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>{opt.label}</option>
				))}
			</select>
			<CurrencyInput
				prefix="$"
				decimalsLimit={0}
				groupSeparator=","
				value={asset.value}
				onValueChange={(v) => onUpdate({ value: v ? Number.parseFloat(v) : 0 })}
				className="w-24 text-right text-sm bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
			/>
			<button
				type="button"
				onClick={onRemove}
				className="text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100"
			>
				<X className="w-3.5 h-3.5" />
			</button>
		</div>
	);
}

function LiabilityCard({
	liability,
	onUpdate,
	onRemove,
}: {
	liability: Liability;
	onUpdate: (updates: Partial<Liability>) => void;
	onRemove: () => void;
}) {
	return (
		<div className="flex items-center gap-2 group">
			<span className="w-2 h-2 rounded-full shrink-0 bg-red-400" />
			<input
				type="text"
				value={liability.label}
				onChange={(e) => onUpdate({ label: e.target.value })}
				placeholder="e.g., Mortgage"
				className="flex-1 min-w-0 text-sm text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-300"
			/>
			<CurrencyInput
				prefix="$"
				decimalsLimit={0}
				groupSeparator=","
				value={liability.balance}
				onValueChange={(v) => onUpdate({ balance: v ? Number.parseFloat(v) : 0 })}
				className="w-28 text-right text-sm bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
			/>
			<button
				type="button"
				onClick={onRemove}
				className="text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100"
			>
				<X className="w-3.5 h-3.5" />
			</button>
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

function RESPEditor({
	resp,
	onUpdate,
}: {
	resp: RESPAccount;
	onUpdate: (updates: Partial<RESPAccount>) => void;
}) {
	return (
		<div className="space-y-2">
			<Field label="Balance">
				<CurrencyField
					value={resp.balance}
					onValueChange={(v) => onUpdate({ balance: v ? Number.parseFloat(v) : 0 })}
				/>
			</Field>
			<Field label="Annual contribution">
				<CurrencyField
					value={resp.annualContribution ?? 0}
					onValueChange={(v) => onUpdate({ annualContribution: v ? Number.parseFloat(v) : 0 })}
				/>
			</Field>
			<Field label="Contributions to date">
				<CurrencyField
					value={resp.contributions}
					onValueChange={(v) => onUpdate({ contributions: v ? Number.parseFloat(v) : 0 })}
				/>
			</Field>
			<Field label="CESG received">
				<CurrencyField
					value={resp.cesgReceived}
					onValueChange={(v) => onUpdate({ cesgReceived: v ? Number.parseFloat(v) : 0 })}
				/>
			</Field>
			<Field label="Beneficiary age">
				<input
					type="number"
					min={0}
					max={35}
					value={resp.beneficiaryAge}
					onChange={(e) => onUpdate({ beneficiaryAge: Number.parseInt(e.target.value) || 0 })}
					className="field-input"
				/>
			</Field>
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
