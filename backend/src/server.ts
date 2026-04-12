import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { hashFile, encryptFile } from "./crypto";
import { validateCompliance, DocumentMetadata } from "./compliance";
import { uploadToIPFS, uploadJSONToIPFS, testPinataAuth } from "./ipfs";

// ── FINGLOBE Backend API Server ───────────────────────────────────────
// Paper Section IV — Cryptographic Pipeline & Verification Service

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security Middleware ───────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    credentials: true,
  })
);

app.use(morgan("combined"));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ── Rate Limiting ─────────────────────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: "Too many upload requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { error: "Too many verify requests. Try again later." },
});

// ── Multer (multipart uploads) ────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/json",
      "text/plain",
      "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// ── Validation Schemas ────────────────────────────────────────────────
const MetadataSchema = z.object({
  issuer: z.string().optional(),
  docType: z.string().optional(),
  carbonEmissions: z.number().optional(),
  renewableEnergyPct: z.number().min(0).max(100).optional(),
  waterUsage: z.number().optional(),
  wasteRecycledPct: z.number().min(0).max(100).optional(),
  diversityRatio: z.number().min(0).max(1).optional(),
  genderPayGap: z.number().optional(),
  employeeSafetyRate: z.number().optional(),
  boardIndependencePct: z.number().min(0).max(100).optional(),
  antiCorruptionPolicy: z.boolean().optional(),
  whistleblowerPolicy: z.boolean().optional(),
  liquidity: z.number().optional(),
  debtToEquity: z.number().optional(),
  revenueGrowthPct: z.number().optional(),
  reportingPeriod: z.string().optional(),
  auditor: z.string().optional(),
  jurisdiction: z.string().optional(),
});

// ── Helper: parse metadata from request ──────────────────────────────
function parseMetadata(raw: unknown): DocumentMetadata {
  if (!raw || typeof raw !== "object") return {};
  if (typeof raw === "string") {
    try {
      return MetadataSchema.parse(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  try {
    return MetadataSchema.parse(raw) as DocumentMetadata;
  } catch {
    return {};
  }
}

// ════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════

// ── Health Check ─────────────────────────────────────────────────────
app.get("/health", async (_req: Request, res: Response) => {
  const pinataOk = await testPinataAuth();
  res.json({
    status: "ok",
    service: "FINGLOBE Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    services: {
      ipfs: pinataOk ? "connected" : "mock_mode",
      crypto: "ready",
      compliance: "ready",
    },
  });
});

// ── POST /api/upload — Main proof generation pipeline ─────────────────
// Accepts: multipart/form-data (file + metadata) OR JSON (base64 + metadata)
// Returns: { hash, cid, ipfsUrl, compliance, encryption }
app.post(
  "/api/upload",
  uploadLimiter,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let fileBuffer: Buffer;
      let filename: string;

      // Accept either multipart file upload or base64 JSON body
      if (req.file) {
        fileBuffer = req.file.buffer;
        filename = req.file.originalname;
      } else if (req.body?.base64File) {
        const base64 = req.body.base64File as string;
        fileBuffer = Buffer.from(base64, "base64");
        filename = req.body.filename || "document";
      } else {
        res.status(400).json({ error: "No file provided. Send multipart 'file' or JSON 'base64File'." });
        return;
      }

      const metadata = parseMetadata(
        req.file ? req.body.metadata : req.body.metadata
      );

      // [Paper IV.B] — Step 1: SHA-256 Fingerprint
      const hashResult = hashFile(fileBuffer);

      // [Paper IV.B] — Step 2: AES-256-GCM Encrypt
      const encryption = encryptFile(fileBuffer);

      // [Paper IV.C] — Step 3: Upload encrypted file to IPFS
      const encryptedBuffer = Buffer.from(encryption.combined, "hex");
      const ipfsResult = await uploadToIPFS(encryptedBuffer, `${hashResult.hex}.enc`, {
        originalFilename: filename,
        sha256: hashResult.hex,
        uploadedAt: new Date().toISOString(),
      });

      // Upload metadata sidecar to IPFS
      const metaCid = await uploadJSONToIPFS(
        {
          ...metadata,
          sha256: hashResult.hex,
          encryptedFileCid: ipfsResult.cid,
          uploadedAt: new Date().toISOString(),
        },
        `${hashResult.hex}-meta`
      );

      // [Paper IV.D] — Step 4: Compliance validation
      const compliance = validateCompliance(metadata);

      res.json({
        success: true,
        hash: hashResult.bytes32,
        hashHex: hashResult.hex,
        cid: ipfsResult.cid,
        ipfsUrl: ipfsResult.url,
        metaCid: metaCid.cid,
        metaIpfsUrl: metaCid.url,
        mockMode: ipfsResult.mock,
        encryption: {
          algorithm: "AES-256-GCM",
          iv: encryption.iv,
          authTag: encryption.authTag,
        },
        compliance,
        filename,
        fileSize: fileBuffer.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/verify — Verify a document hash ─────────────────────────
// Input: { hash: "0x..." }  or  base64 file to re-hash + compare
app.post(
  "/api/verify",
  verifyLimiter,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let hashToVerify: string;

      if (req.file) {
        const hashResult = hashFile(req.file.buffer);
        hashToVerify = hashResult.bytes32;
      } else if (req.body?.hash) {
        hashToVerify = req.body.hash as string;
        if (!hashToVerify.startsWith("0x")) hashToVerify = "0x" + hashToVerify;
      } else if (req.body?.base64File) {
        const buf = Buffer.from(req.body.base64File as string, "base64");
        hashToVerify = hashFile(buf).bytes32;
      } else {
        res.status(400).json({ error: "Provide 'hash', 'file', or 'base64File'" });
        return;
      }

      res.json({
        success: true,
        hash: hashToVerify,
        message: "Hash computed. Use this with the smart contract verifyProof() function.",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/stats — Platform statistics (mocked) ────────────────────
app.get("/api/stats", (_req: Request, res: Response) => {
  res.json({
    totalProofs: Math.floor(Math.random() * 5000) + 10000,
    verifiedToday: Math.floor(Math.random() * 200) + 800,
    avgVerificationMs: Math.floor(Math.random() * 500) + 800,
    activeUsers: Math.floor(Math.random() * 100) + 200,
    uptime: "99.99%",
    frameworks: ["ESRS E1", "ESRS S1", "ESRS G1", "ISSB S1", "ISSB S2", "SEC"],
    timestamp: new Date().toISOString(),
  });
});

// ── GET /api/compliance/schema — Return compliance field requirements ─
app.get("/api/compliance/schema", (_req: Request, res: Response) => {
  res.json({
    frameworks: {
      "ESRS-E1": {
        required: ["carbonEmissions", "renewableEnergyPct"],
        optional: ["waterUsage", "wasteRecycledPct"],
        description: "European Sustainability Reporting Standard — Climate",
      },
      "ESRS-S1": {
        required: ["diversityRatio", "employeeSafetyRate"],
        optional: ["genderPayGap"],
        description: "ESRS — Social",
      },
      "ESRS-G1": {
        required: ["boardIndependencePct", "antiCorruptionPolicy"],
        optional: ["whistleblowerPolicy"],
        description: "ESRS — Governance",
      },
      "ISSB-S1": {
        required: ["liquidity", "debtToEquity", "auditor"],
        optional: ["revenueGrowthPct", "reportingPeriod"],
        description: "ISSB IFRS S1 — General Financial Disclosures",
      },
      "ISSB-S2": {
        required: ["carbonEmissions", "renewableEnergyPct", "reportingPeriod"],
        optional: [],
        description: "ISSB IFRS S2 — Climate-Related Disclosures",
      },
    },
  });
});

// ── Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Error:", err.message);
  const statusCode = err.message.includes("not allowed") ? 415
    : err.message.includes("File too large") ? 413
    : 500;

  res.status(statusCode).json({
    error: err.message || "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Start Server ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║    FINGLOBE Backend API — Ready              ║");
  console.log(`║    http://localhost:${PORT}                     ║`);
  console.log("║                                              ║");
  console.log("║    POST /api/upload   → Register proof       ║");
  console.log("║    POST /api/verify   → Compute hash         ║");
  console.log("║    GET  /api/stats    → Platform stats       ║");
  console.log("║    GET  /health       → Health check         ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  if (!process.env.PINATA_JWT) {
    console.warn("⚠️  PINATA_JWT not configured — IPFS uploads will use mock mode");
  }
  if (!process.env.ENCRYPTION_KEY) {
    console.warn("⚠️  ENCRYPTION_KEY not configured — using derived key (demo only)");
  }
});

export default app;
