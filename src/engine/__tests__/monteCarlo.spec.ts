import { describe, it, expect } from "vitest";
import { runMonteCarloSimulation } from "@/engine/monteCarlo";
import type { MonteCarloParams } from "@/engine/monteCarlo";

const baseAccumulatingParams: MonteCarloParams = {
  startingPortfolio: 200_000,
  annualContribution: 30_000,
  targetAmount: 1_000_000,
  years: 30,
  runs: 200,
  meanReturn: 0.07,
  stdDevReturn: 0.15,
  seed: 42,
  mode: "accumulating",
};

const baseWithdrawalParams: MonteCarloParams = {
  startingPortfolio: 1_000_000,
  annualContribution: -40_000, // 4% withdrawal
  targetAmount: 0,
  years: 30,
  runs: 200,
  meanReturn: 0.07,
  stdDevReturn: 0.15,
  seed: 42,
  mode: "withdrawal",
};

describe("runMonteCarloSimulation", () => {
  describe("determinism", () => {
    it("same seed produces identical results", () => {
      const result1 = runMonteCarloSimulation(baseAccumulatingParams);
      const result2 = runMonteCarloSimulation(baseAccumulatingParams);

      expect(result1.successRate).toBe(result2.successRate);
      expect(result1.medianYearsToFI).toBe(result2.medianYearsToFI);
      expect(result1.percentiles.p50).toEqual(result2.percentiles.p50);
    });

    it("different seeds produce different results", () => {
      const result1 = runMonteCarloSimulation({
        ...baseAccumulatingParams,
        seed: 42,
      });
      const result2 = runMonteCarloSimulation({
        ...baseAccumulatingParams,
        seed: 999,
      });

      // Extremely unlikely for all values to be identical with different seeds
      const allP50Same = result1.percentiles.p50.every(
        (v, i) => v === result2.percentiles.p50[i],
      );
      expect(allP50Same).toBe(false);
    });
  });

  describe("percentile ordering", () => {
    it("percentile bands are ordered p10 <= p25 <= p50 <= p75 <= p90 at each year", () => {
      const result = runMonteCarloSimulation(baseAccumulatingParams);

      for (let i = 0; i < result.percentiles.p10.length; i++) {
        expect(result.percentiles.p10[i]).toBeLessThanOrEqual(
          result.percentiles.p25[i],
        );
        expect(result.percentiles.p25[i]).toBeLessThanOrEqual(
          result.percentiles.p50[i],
        );
        expect(result.percentiles.p50[i]).toBeLessThanOrEqual(
          result.percentiles.p75[i],
        );
        expect(result.percentiles.p75[i]).toBeLessThanOrEqual(
          result.percentiles.p90[i],
        );
      }
    });
  });

  describe("withdrawal mode", () => {
    it("4% withdrawal on $1M over 30 years has high success rate (roughly 90-100%)", () => {
      const result = runMonteCarloSimulation(baseWithdrawalParams);

      expect(result.successRate).toBeGreaterThanOrEqual(0.85);
      expect(result.successRate).toBeLessThanOrEqual(1.0);
    });

    it("10% withdrawal rate shows low success rate", () => {
      const result = runMonteCarloSimulation({
        ...baseWithdrawalParams,
        annualContribution: -100_000, // 10% withdrawal
        seed: 123,
      });

      expect(result.successRate).toBeLessThan(0.7);
    });
  });

  describe("accumulating mode", () => {
    it("high savings shows high success rate", () => {
      const result = runMonteCarloSimulation({
        ...baseAccumulatingParams,
        startingPortfolio: 500_000,
        annualContribution: 60_000,
        targetAmount: 1_000_000,
        years: 30,
        seed: 77,
      });

      expect(result.successRate).toBeGreaterThanOrEqual(0.9);
    });

    it("0 starting portfolio with positive savings still works", () => {
      const result = runMonteCarloSimulation({
        ...baseAccumulatingParams,
        startingPortfolio: 0,
        annualContribution: 20_000,
        targetAmount: 500_000,
        years: 30,
        seed: 55,
      });

      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(1);
      expect(result.medianYearsToFI).toBeGreaterThan(0);
      expect(result.percentiles.p50[0]).toBeGreaterThan(0); // first year has some value
    });
  });

  describe("edge cases", () => {
    it("single run (runs=1) returns valid results", () => {
      const result = runMonteCarloSimulation({
        ...baseAccumulatingParams,
        runs: 1,
        seed: 42,
      });

      expect(result.runs).toBe(1);
      expect(result.successRate === 0 || result.successRate === 1).toBe(true);
      expect(result.percentiles.p50).toHaveLength(30);
      // With a single run all percentiles should be equal
      for (let i = 0; i < 30; i++) {
        expect(result.percentiles.p10[i]).toBe(result.percentiles.p90[i]);
      }
    });
  });

  describe("result shape", () => {
    it("percentile arrays have length equal to simulation years", () => {
      const years = 25;
      const result = runMonteCarloSimulation({
        ...baseAccumulatingParams,
        years,
      });

      expect(result.percentiles.p10).toHaveLength(years);
      expect(result.percentiles.p25).toHaveLength(years);
      expect(result.percentiles.p50).toHaveLength(years);
      expect(result.percentiles.p75).toHaveLength(years);
      expect(result.percentiles.p90).toHaveLength(years);
    });
  });
});
