/** Shared risk-band vocabulary (Module 5). Safe to import from client code. */

export type RiskLevel = "ORIGINAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export const RISK_BANDS: {
  level: RiskLevel;
  min: number;
  max: number;
  label: string;
  color: string;
  tone: "success" | "warning" | "danger" | "neutral";
}[] = [
  { level: "ORIGINAL", min: 0, max: 15, label: "Original", color: "var(--risk-original)", tone: "success" },
  { level: "LOW", min: 16, max: 30, label: "Low risk", color: "var(--risk-low)", tone: "success" },
  { level: "MODERATE", min: 31, max: 60, label: "Moderate risk", color: "var(--risk-moderate)", tone: "warning" },
  { level: "HIGH", min: 61, max: 80, label: "High risk", color: "var(--risk-high)", tone: "danger" },
  { level: "CRITICAL", min: 81, max: 100, label: "Critical", color: "var(--risk-critical)", tone: "danger" },
];

export function riskLevelFor(score: number): RiskLevel {
  if (score <= 15) return "ORIGINAL";
  if (score <= 30) return "LOW";
  if (score <= 60) return "MODERATE";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

export function riskBand(level: RiskLevel) {
  return RISK_BANDS.find((band) => band.level === level) ?? RISK_BANDS[0];
}
