# FINGLOBE — Verifiable Financial Proof Engine

> Cryptographically verifiable, tamper-proof financial and ESG proof infrastructure for banks, enterprises, auditors, and regulators.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FINGLOBE Stack                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐   HTTP/JSON    ┌────────────────────────────┐   │
│  │  Next.js 14     │ ─────────────▶ │   Express Backend           │   │
│  │  App Router     │               │   Port 3001                 │   │
│  │  Tailwind CSS   │               │                             │   │
│  │  Framer Motion  │               │   POST /api/upload          │   │
│  │  ethers.js v6   │               │   ├─ SHA-256 hash           │   │
│  └────────┬────────┘               │   ├─ AES-256-GCM encrypt    │   │
│           │                        │   ├─ Pinata IPFS upload     │   │
│           │ ethers.js              │   └─ Compliance check       │   │
│           │ MetaMask               │                             │   │
│           ▼                        │   GET  /api/stats           │   │
│  ┌─────────────────┐               │   GET  /health              │   │
│  │  MetaMask       │               └────────────┬───────────────┘   │
│  │  Wallet         │                            │                   │
│  └────────┬────────┘                            ▼                   │
│           │                        ┌────────────────────────────┐   │
│           │ Polygon Amoy           │   Pinata IPFS              │   │
│           │ (chainId: 80002)       │   Encrypted File CID       │   │
│           ▼                        │   Metadata CID             │   │
│  ┌─────────────────────────────────┴──────────────────────────┐ │   │
│  │   ProofRegistry.sol — Polygon Amoy Testnet                  │ │   │
│  │   registerProof(bytes32 hash, string cid)                   │ │   │
│  │   getProof(bytes32 hash) → (exists, cid, timestamp, issuer) │ │   │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
c:\FinGlobe\
├── contracts/                    ← Hardhat + Solidity 0.8.20
│   ├── contracts/ProofRegistry.sol
│   ├── scripts/deploy.ts
│   ├── hardhat.config.ts
│   └── package.json
├── backend/                      ← Node.js Express API
│   ├── src/
│   │   ├── server.ts             ← Main API server (port 3001)
│   │   ├── crypto.ts             ← SHA-256 + AES-256-GCM
│   │   ├── compliance.ts         ← ESRS/ISSB/SEC validator
│   │   └── ipfs.ts               ← Pinata upload service
│   └── package.json
├── frontend/                     ← Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          ← Main page (all sections)
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── UploadSection.tsx ← File upload + blockchain register
│   │   │   ├── VerifySection.tsx ← Document verification
│   │   │   ├── WalletButton.tsx  ← MetaMask connector
│   │   │   ├── GoldButton.tsx    ← Luxury button component
│   │   │   └── GoldCard.tsx      ← Luxury card component
│   │   ├── hooks/useWallet.ts    ← ethers.js v6 wallet hook
│   │   └── lib/
│   │       ├── contract.ts       ← ABI + chain config
│   │       ├── api.ts            ← Backend API client
│   │       └── utils.ts          ← Utility functions
│   └── package.json
├── .env.example                  ← All environment variables
├── setup.bat                     ← Windows setup script
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js v20+ (download: https://nodejs.org)
- MetaMask browser extension
- Git

### Step 1 — Install All Dependencies

```batch
cd c:\FinGlobe
setup.bat
```

Or manually:
```batch
cd contracts && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Step 2 — Compile Contracts

```batch
cd contracts
npx hardhat compile
```

### Step 3 — Set Up Environment

Copy `.env.example` to `.env` in the root, and fill in:

| Variable | Where to Get |
|---|---|
| `PRIVATE_KEY` | Export from MetaMask (Settings → Security → Export Private Key) |
| `PINATA_JWT` | https://pinata.cloud → API Keys → Create JWT |
| `ENCRYPTION_KEY` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Also create `backend/.env`:
```
PORT=3001
PINATA_JWT=your_pinata_jwt
ENCRYPTION_KEY=your_64_char_hex_key
```

### Step 4 — Get Testnet MATIC

1. Go to https://faucet.polygon.technology/
2. Select "Amoy Testnet"
3. Paste your wallet address → Request MATIC
4. Wait ~30 seconds

### Step 5 — Deploy Smart Contract

```batch
cd contracts
npx hardhat run scripts/deploy.ts --network amoy
```

Copy the contract address from the output. Then update `frontend/.env.local`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Step 6 — Start Backend

```batch
cd backend
npm run dev
```

Backend starts at http://localhost:3001

### Step 7 — Start Frontend

Open a **new terminal**:
```batch
cd frontend
npm run dev
```

Frontend starts at http://localhost:3000

---

## Demo Flow — Tamper Detection Test

### Register a Proof
1. Open http://localhost:3000
2. Click **Connect Wallet** → Connect MetaMask → Switch to Amoy
3. Click **Register a Proof**
4. Upload a test document (e.g., a PDF or text file)
5. Fill in metadata (issuer, document type, etc.)
6. Click **Register Financial Proof**
7. Approve the MetaMask transaction
8. Note the **SHA-256 Hash** and **Transaction Hash** returned

### Verify — Authentic ✓
1. Scroll to **Verify Document**
2. Upload the **same file** you uploaded
3. Click **Verify Document**
4. Result: **AUTHENTIC** ✓ — Hash found on blockchain

### Verify — Tampered ✗
1. Open the file in a text editor and add a space or change one character
2. Save the modified file
3. Upload the **modified file** to Verify
4. Click **Verify Document**
5. Result: **TAMPERED** ✗ — Hash not registered on chain

---

## API Reference

### POST /api/upload

Upload a document for hashing, encryption, and IPFS storage.

**Request** (multipart/form-data):
```
file: <File>
metadata: <JSON string>
```

**Response:**
```json
{
  "success": true,
  "hash": "0x1a2b3c...",
  "cid": "QmXxx...",
  "ipfsUrl": "https://gateway.pinata.cloud/ipfs/QmXxx",
  "compliance": {
    "esrs": true,
    "issb": true,
    "score": 80,
    "badges": ["ESRS-E1 Ready", "ISSB-S2 Compliant", ...]
  }
}
```

### GET /health

Returns backend service status.

### GET /api/stats

Returns platform statistics.

---

## Compliance Framework Mapping

| Framework | Fields Required | Badge |
|---|---|---|
| ESRS E1 | carbonEmissions, renewableEnergyPct | ESRS-E1 Ready |
| ESRS S1 | diversityRatio, employeeSafetyRate | ESRS-S1 Compliant |
| ESRS G1 | boardIndependencePct, antiCorruptionPolicy | ESRS-G1 Verified |
| ISSB S1 | liquidity, debtToEquity, auditor | ISSB-S1 Ready |
| ISSB S2 | carbonEmissions, renewableEnergyPct, reportingPeriod | ISSB-S2 Compliant |
| SEC | issuer, reportingPeriod, auditor, jurisdiction | SEC Disclosure Ready |

---

## Paper Alignment

| Paper Section | Implementation |
|---|---|
| IV.A — System Architecture | `frontend/` + `backend/` + `contracts/` monorepo |
| IV.B — Cryptographic Fingerprinting | `backend/src/crypto.ts` — SHA-256 + AES-256-GCM |
| IV.C — Decentralized Storage | `backend/src/ipfs.ts` — Pinata IPFS |
| IV.C — Immutable Anchoring | `ProofRegistry.sol` + `registerProof()` |
| IV.D — Compliance Engine | `backend/src/compliance.ts` — ESRS/ISSB mapping |
| IV.E — Identity | `did:ethr:{wallet_address}` via MetaMask |
| V.A — Deployment | Polygon Amoy, chainId 80002 |
| V.B — Performance | Sub-2s verification via `getProof()` view call |

---

## Known Limitations & Stretch Goals

### Current Limitations
- No local ZK-SNARK proofs (stretch goal)
- Pinata free tier: 1GB storage, 100 pins
- Polygon Amoy is a testnet — not production mainnet
- No on-chain event indexing (would need The Graph)

### Stretch Goals
- [ ] ZK-SNARK proofs for private verification
- [ ] The Graph subgraph for on-chain event indexing
- [ ] Multi-chain support (Ethereum mainnet, Arbitrum)
- [ ] Batch proof registration for gas optimization
- [ ] Proof expiry / revocation mechanism
- [ ] PDF report generation with compliance scores
- [ ] REST API key + enterprise dashboard

---

## Cryptographic Pipeline

```
Document (plaintext)
    │
    ├─ SHA-256 ──────────────────────────────▶ bytes32 hash (Ethereum input)
    │
    ├─ AES-256-GCM ─────────────────────────▶ Encrypted blob
    │    └─ IV (96-bit) + AuthTag (128-bit)
    │
    └─ Upload to Pinata IPFS ───────────────▶ CID (content-addressed)
             │
             ▼
        ProofRegistry.sol
        registerProof(hash, cid)
             │
             ▼
        Polygon Amoy blockchain
        (immutable, timestamped, issuer-verified)
```

---

*FINGLOBE Network — Production-Grade Financial Verification Infrastructure*

---

# 🌟 The Absolute Beginner's Guide to FinGlobe

Welcome! If you have **no idea** what a blockchain is, what MetaMask is, or what this website actually does—you are in the exact right place. 

No tech jargon. No confusing acronyms. Let's break this down using real-life examples so you completely understand the incredibly powerful platform you just built.

---

## 🛑 The Problem: Fake Documents
Imagine you are an investor or a bank manager, and an accounting firm emails you a PDF report that says a company makes $10 million a year.

How do you know an intern didn't just open that PDF in Photoshop, add a few extra zeros, and hit save before emailing it to you? 
Right now... you don't. It is very hard to guarantee a digital file wasn't tampered with.

## 🟢 The Solution: FinGlobe
FinGlobe is an automated **Digital Notary**. 

When a company finishes an official financial document, they upload it to FinGlobe. FinGlobe takes a unique digital "fingerprint" of that file and locks that fingerprint inside a glass vault where everyone can see it, but **no one can ever change it**. 

Months later, if a bank wants to check if that PDF is real, they just drag it into FinGlobe. FinGlobe checks the fingerprint. If someone edited even a *single comma* in that PDF, the fingerprint changes completely, and FinGlobe immediately yells "**TAMPERED!**".

---

## 🧩 The Core Concepts (Explained Simply)

### 1. What is "The Blockchain"? 
> **Real-Life Example:** Imagine a giant, magical textbook sitting in the middle of a town square. Anyone can write a sentence in this book using a special pen. But once the ink touches the paper, the page turns to solid diamond. The words can **never** be erased, edited, or torn out. 

A **Blockchain** is simply that digital diamond textbook. We use it to store the "fingerprints" of our official documents so nobody can ever secretly change them. Because there is no "undo" button, everyone trusts it.

### 2. What is "MetaMask"?
> **Real-Life Example:** Think of MetaMask as your digital passport and leather wallet merged into one. 

If you want to perform an official action (like writing in the diamond textbook), you have to legally prove who you are. MetaMask lives in your browser, holds your digital identity, and "signs" the transaction. It also acts as your bank account, holding the digital currency needed to pay for the ink. It's essentially "Log in with Google" but vastly more secure and private.

### 3. What is "Polygon (Amoy)"?
> **Real-Life Example:** If the main, world-famous blockchain (Ethereum) is a super busy, highly congested highway where tolls cost $50... **Polygon** is the super-fast express lane built right next to it where the toll only costs a fraction of a penny. 

"Amoy" is just the name of the *practice area* of that highway where the money is fake. We are using Amoy right now so you can test your app without spending real money!

---

## 🛠️ Step-by-Step: How to actually use your platform

Now that you know the words, here is what is actually happening when you click buttons on your website:

### Step 1: Connect Your Wallet (Logging in)
- When you click "Connect Wallet" on the website, it asks MetaMask to log you in. 
- You are proving you are the real person managing this session.

### Step 2: Register a Document (The "Upload")
- You drag and drop a PDF into the website.
- **Behind the scenes:** 
  1. The website mathematically calculates a unique "fingerprint" (called a hash) for your specific file.
  2. It securely locks your file so hackers can't read it, and saves it to a massive cloud system (IPFS).
  3. MetaMask pops up and asks you to pay a tiny fee to officially stamp that fingerprint into the "diamond textbook" (the Polygon Blockchain).

### Step 3: Verify a Document (The "Check")
- Now, pretend you are the Bank. You drag the file into the "Verify Document" section.
- **Behind the scenes:**
  1. The website calculates the fingerprint of the file you just dropped in.
  2. It looks at the "diamond textbook" to see if that exact fingerprint was ever officially recorded.
  3. If it perfectly matches, you get a giant green checkmark **(AUTHENTIC)**. If someone secretly opened that file and changed a number, the fingerprints will mismatch, and you get a red warning **(TAMPERED)**.

---

## 💰 The Business Model: How to make money with this

Building this is cool, but businesses need this desperately. Here is how FinGlobe becomes a profitable, real-world startup:

### 1. "Pay-per-Stamp" (Transaction Fees)
You allow the public to *verify* documents for free. However, **companies must pay you a fee** every time they want to register/stamp a new official document on your platform. (e.g., $5 to register an official audit). If they register 1,000 documents, you make $5,000.

### 2. Enterprise Subscriptions (B2B SaaS)
Big banks, accounting giants (like Deloitte or PwC), and government regulators don't want to pay per-document. They will gladly pay **$2,000/month** for a premium "Enterprise Dashboard" that lets them officially stamp 10,000 reports, issue custom certificates, and manage their compliance automatically.

### 3. Automated Compliance Engine (The Hidden Goldmine)
Notice how the website mentions "ESRS / SEC Compliance"? Governments around the world are currently forcing companies to legally prove their Environmental (ESG) data. 
FinGlobe automatically reads their documents and grades them. You can charge companies massively for giving them the "FinGlobe Certified Green" badge that they are legally required to show the government. 

---
