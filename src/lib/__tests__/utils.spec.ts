import { describe, expect, it } from "vitest";
import { formatCurrency, formatFireDate, formatPercent, formatYears } from "@/lib/utils";

describe("formatFireDate", () => {
	it("returns 'Keep going' for null date by default", () => {
		expect(formatFireDate(null)).toBe("Keep going");
	});

	it("returns custom fallback for null date", () => {
		expect(formatFireDate(null, { fallback: "—" })).toBe("—");
	});

	it("formats date with long month by default", () => {
		const date = new Date(2030, 2, 15); // March 15, 2030
		const result = formatFireDate(date);
		expect(result).toContain("2030");
		expect(result).toContain("March");
	});

	it("formats date with short month when short: true", () => {
		const date = new Date(2030, 2, 15);
		const result = formatFireDate(date, { short: true });
		expect(result).toContain("2030");
		expect(result).toContain("Mar");
		expect(result).not.toContain("March");
	});

	it("works with both short and fallback options", () => {
		expect(formatFireDate(null, { short: true, fallback: "N/A" })).toBe("N/A");

		const date = new Date(2025, 11, 1); // December 2025
		const result = formatFireDate(date, { short: true, fallback: "N/A" });
		expect(result).toContain("Dec");
		expect(result).toContain("2025");
	});
});

describe("formatCurrency", () => {
	it("formats positive amounts", () => {
		const result = formatCurrency(1_000_000);
		expect(result).toContain("1,000,000");
	});

	it("formats zero", () => {
		const result = formatCurrency(0);
		expect(result).toContain("0");
	});

	it("formats negative amounts", () => {
		const result = formatCurrency(-5_000);
		expect(result).toContain("5,000");
	});
});

describe("formatPercent", () => {
	it("formats with 1 decimal by default", () => {
		expect(formatPercent(50.5)).toBe("50.5%");
	});

	it("formats with 0 decimals", () => {
		expect(formatPercent(50.5, 0)).toBe("51%");
	});

	it("formats with 2 decimals", () => {
		expect(formatPercent(50.123, 2)).toBe("50.12%");
	});
});

describe("formatYears", () => {
	it("formats finite years", () => {
		expect(formatYears(10.5)).toBe("10.5 years");
	});

	it("returns N/A for Infinity", () => {
		expect(formatYears(Infinity)).toBe("N/A");
	});

	it("returns N/A for NaN", () => {
		expect(formatYears(NaN)).toBe("N/A");
	});
});
