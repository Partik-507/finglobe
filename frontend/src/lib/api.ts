import axios from "axios";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface UploadMetadata {
  issuer?: string;
  docType?: string;
  carbonEmissions?: number;
  renewableEnergyPct?: number;
  diversityRatio?: number;
  liquidity?: number;
  debtToEquity?: number;
  auditor?: string;
  reportingPeriod?: string;
  jurisdiction?: string;
  antiCorruptionPolicy?: boolean;
  whistleblowerPolicy?: boolean;
  boardIndependencePct?: number;
  employeeSafetyRate?: number;
}

export interface UploadResponse {
  success: boolean;
  hash: string;         // 0x-prefixed bytes32
  hashHex: string;      // plain hex
  cid: string;          // IPFS CID
  ipfsUrl: string;
  metaCid: string;
  metaIpfsUrl: string;
  mockMode: boolean;
  encryption: {
    algorithm: string;
    iv: string;
    authTag: string;
  };
  compliance: ComplianceResult;
  filename: string;
  fileSize: number;
  timestamp: string;
}

export interface ComplianceResult {
  esrs: boolean;
  issb: boolean;
  sec: boolean;
  overall: "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT";
  score: number;
  badges: string[];
  frameworks: Array<{
    name: string;
    passed: boolean;
    score: number;
    details: string;
  }>;
  warnings: string[];
  timestamp: string;
}

export interface PlatformStats {
  totalProofs: number;
  verifiedToday: number;
  avgVerificationMs: number;
  activeUsers: number;
  uptime: string;
  frameworks: string[];
  timestamp: string;
}

/**
 * Upload a file to the FINGLOBE backend for hashing, encryption, IPFS storage.
 * [Paper IV.B–IV.D]
 */
export async function uploadToBackend(
  file: File,
  metadata: UploadMetadata
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("metadata", JSON.stringify(metadata));

  const response = await axios.post<UploadResponse>(
    `${BACKEND_URL}/api/upload`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
      onUploadProgress: (e) => {
        // Can expose this for progress bars
        console.debug(`Upload progress: ${Math.round((e.loaded / (e.total || 1)) * 100)}%`);
      },
    }
  );

  return response.data;
}

/**
 * Compute hash of a file via backend (for verification without re-uploading).
 */
export async function computeHashViaBackend(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post<{ hash: string }>(
    `${BACKEND_URL}/api/verify`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }
  );

  return response.data.hash;
}

/**
 * Compute SHA-256 hash of a file entirely client-side (no network call).
 * Used for instant client-side tamper detection before contract call.
 */
export async function computeHashClientSide(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hashHex;
}

/**
 * Fetch platform statistics from backend.
 */
export async function fetchPlatformStats(): Promise<PlatformStats> {
  const response = await axios.get<PlatformStats>(`${BACKEND_URL}/api/stats`);
  return response.data;
}

/**
 * Health check for backend.
 */
export async function checkBackendHealth(): Promise<{ online: boolean; services: Record<string, string> }> {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    return { online: true, services: response.data.services };
  } catch {
    return { online: false, services: {} };
  }
}
