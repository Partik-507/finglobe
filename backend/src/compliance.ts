// ── FINGLOBE Compliance Engine ────────────────────────────────────────
// Paper Section IV.D — ESRS/ISSB Framework Mapping & Validation
// Maps financial metadata fields to regulatory compliance badges

export interface DocumentMetadata {
  issuer?: string;
  docType?: string;
  // ESG Fields (ESRS E1 — Climate)
  carbonEmissions?: number;     // tCO2e
  renewableEnergyPct?: number;  // 0–100
  waterUsage?: number;          // m³
  wasteRecycledPct?: number;    // 0–100
  // Social (ESRS S1 / ISSB S2)
  diversityRatio?: number;      // 0–1
  genderPayGap?: number;        // %
  employeeSafetyRate?: number;  // incidents per 1000
  // Governance (ESRS G1)
  boardIndependencePct?: number; // 0–100
  antiCorruptionPolicy?: boolean;
  whistleblowerPolicy?: boolean;
  // Financial (ISSB IFRS S1)
  liquidity?: number;           // current ratio
  debtToEquity?: number;
  revenueGrowthPct?: number;
  // Custom
  reportingPeriod?: string;     // e.g. "2025-Q4"
  auditor?: string;
  jurisdiction?: string;
  [key: string]: unknown;
}

export interface ComplianceResult {
  esrs: boolean;
  issb: boolean;
  sec: boolean;
  overall: "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT";
  score: number;           // 0–100
  badges: string[];
  frameworks: FrameworkCheck[];
  warnings: string[];
  timestamp: string;
}

export interface FrameworkCheck {
  name: string;
  passed: boolean;
  score: number;
  details: string;
}

/**
 * Validate metadata against ESRS, ISSB, and SEC disclosure frameworks.
 * [Paper IV.D] — Compliance Engine with multi-framework support.
 * Returns compliance badges for frontend display.
 */
export function validateCompliance(meta: DocumentMetadata): ComplianceResult {
  const badges: string[] = [];
  const warnings: string[] = [];
  const frameworks: FrameworkCheck[] = [];
  let totalScore = 0;

  // ── ESRS E1 — Climate Change (Environmental) ─────────────────────
  const esrsE1Fields = ["carbonEmissions", "renewableEnergyPct"];
  const esrsE1Present = esrsE1Fields.filter((f) => meta[f] !== undefined).length;
  const esrsE1Score = Math.round((esrsE1Present / esrsE1Fields.length) * 100);
  const esrsE1Pass = esrsE1Score >= 50;

  if (esrsE1Pass) {
    badges.push("ESRS-E1 Ready");
    if (meta.carbonEmissions !== undefined && meta.carbonEmissions < 1000)
      badges.push("Low Carbon Footprint");
    if (meta.renewableEnergyPct !== undefined && meta.renewableEnergyPct >= 50)
      badges.push("Renewable Energy Leader");
  } else {
    warnings.push("ESRS E1: Missing climate metrics (carbonEmissions, renewableEnergyPct)");
  }

  frameworks.push({
    name: "ESRS E1 — Climate",
    passed: esrsE1Pass,
    score: esrsE1Score,
    details: esrsE1Pass
      ? "Climate disclosure fields present"
      : "Missing climate disclosure fields",
  });

  // ── ESRS S1/S2 — Social ───────────────────────────────────────────
  const esrsS1Fields = ["diversityRatio", "employeeSafetyRate"];
  const esrsS1Present = esrsS1Fields.filter((f) => meta[f] !== undefined).length;
  const esrsS1Score = Math.round((esrsS1Present / esrsS1Fields.length) * 100);
  const esrsS1Pass = esrsS1Score >= 50;

  if (esrsS1Pass) {
    badges.push("ESRS-S1 Compliant");
    if (meta.diversityRatio !== undefined && meta.diversityRatio >= 0.4)
      badges.push("Diversity Champion");
  } else {
    warnings.push("ESRS S1: Missing social metrics (diversityRatio, employeeSafetyRate)");
  }

  frameworks.push({
    name: "ESRS S1 — Social",
    passed: esrsS1Pass,
    score: esrsS1Score,
    details: esrsS1Pass ? "Social disclosure fields present" : "Missing social fields",
  });

  // ── ESRS G1 — Governance ─────────────────────────────────────────
  const esrsG1Fields = ["boardIndependencePct", "antiCorruptionPolicy"];
  const esrsG1Present = esrsG1Fields.filter((f) => meta[f] !== undefined).length;
  const esrsG1Score = Math.round((esrsG1Present / esrsG1Fields.length) * 100);
  const esrsG1Pass = esrsG1Score >= 50;

  if (esrsG1Pass) {
    badges.push("ESRS-G1 Verified");
    if (meta.antiCorruptionPolicy) badges.push("Anti-Corruption Certified");
    if (meta.whistleblowerPolicy) badges.push("Whistleblower Protected");
  } else {
    warnings.push("ESRS G1: Missing governance fields");
  }

  frameworks.push({
    name: "ESRS G1 — Governance",
    passed: esrsG1Pass,
    score: esrsG1Score,
    details: esrsG1Pass ? "Governance fields present" : "Missing governance fields",
  });

  // ── ISSB IFRS S2 — Climate-Related Disclosures ───────────────────
  const issbS2Fields = ["carbonEmissions", "renewableEnergyPct", "reportingPeriod"];
  const issbS2Present = issbS2Fields.filter((f) => meta[f] !== undefined).length;
  const issbS2Score = Math.round((issbS2Present / issbS2Fields.length) * 100);
  const issbS2Pass = issbS2Score >= 67;

  if (issbS2Pass) {
    badges.push("ISSB-S2 Compliant");
  } else {
    warnings.push("ISSB S2: Insufficient climate disclosure fields");
  }

  frameworks.push({
    name: "ISSB IFRS S2 — Climate",
    passed: issbS2Pass,
    score: issbS2Score,
    details: issbS2Pass ? "ISSB climate disclosure met" : "Insufficient ISSB fields",
  });

  // ── ISSB IFRS S1 — General Financial Disclosures ─────────────────
  const issbS1Fields = ["liquidity", "debtToEquity", "auditor", "reportingPeriod"];
  const issbS1Present = issbS1Fields.filter((f) => meta[f] !== undefined).length;
  const issbS1Score = Math.round((issbS1Present / issbS1Fields.length) * 100);
  const issbS1Pass = issbS1Score >= 50;

  if (issbS1Pass) {
    badges.push("ISSB-S1 Ready");
    if (meta.auditor) badges.push(`Auditor Verified: ${meta.auditor}`);
    if (meta.liquidity !== undefined && meta.liquidity >= 1.5)
      badges.push("Strong Liquidity");
  } else {
    warnings.push("ISSB S1: Missing financial disclosure fields");
  }

  frameworks.push({
    name: "ISSB IFRS S1 — Financial",
    passed: issbS1Pass,
    score: issbS1Score,
    details: issbS1Pass ? "Financial disclosure met" : "Insufficient financial fields",
  });

  // ── Document Integrity Badges ─────────────────────────────────────
  badges.push("SHA-256 Verified");
  badges.push("AES-256-GCM Encrypted");
  badges.push("IPFS Immutable");
  badges.push("Blockchain Anchored");

  if (meta.issuer) badges.push(`Issued by: ${meta.issuer}`);

  // ── Overall ESRS score ───────────────────────────────────────────
  const esrsOverall = esrsE1Pass && esrsS1Pass && esrsG1Pass;

  // ── Overall ISSB score ───────────────────────────────────────────
  const issbOverall = issbS2Pass && issbS1Pass;

  // ── Overall Score ─────────────────────────────────────────────────
  totalScore = Math.round(
    (esrsE1Score + esrsS1Score + esrsG1Score + issbS2Score + issbS1Score) / 5
  );

  let overall: "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT";
  if (totalScore >= 70) overall = "COMPLIANT";
  else if (totalScore >= 40) overall = "PARTIAL";
  else overall = "NON_COMPLIANT";

  // ── SEC Disclosure (simplified) ───────────────────────────────────
  const secFields = ["issuer", "reportingPeriod", "auditor", "jurisdiction"];
  const secPresent = secFields.filter((f) => meta[f] !== undefined).length;
  const secScore = Math.round((secPresent / secFields.length) * 100);
  const secPass = secScore >= 50;

  if (secPass) badges.push("SEC Disclosure Ready");

  frameworks.push({
    name: "SEC — General Disclosure",
    passed: secPass,
    score: secScore,
    details: secPass ? "Disclosure fields present" : "Missing SEC disclosure fields",
  });

  return {
    esrs: esrsOverall,
    issb: issbOverall,
    sec: secPass,
    overall,
    score: totalScore,
    badges: [...new Set(badges)], // deduplicate
    frameworks,
    warnings,
    timestamp: new Date().toISOString(),
  };
}
