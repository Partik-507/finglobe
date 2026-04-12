// ── FINGLOBE — ProofRegistry Contract ABI & Helpers ───────────────────
// Paper Section V.A — On-chain Proof Registry Interface

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000"; // Replace after deployment

export const CONTRACT_ABI = [
  {
    "type": "function",
    "name": "registerProof",
    "inputs": [
      { "name": "_hash", "type": "bytes32", "internalType": "bytes32" },
      { "name": "_cid",  "type": "string",  "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verifyProof",
    "inputs": [
      { "name": "_hash", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [
      { "name": "exists",    "type": "bool",    "internalType": "bool" },
      { "name": "cid",       "type": "string",  "internalType": "string" },
      { "name": "timestamp", "type": "uint256", "internalType": "uint256" },
      { "name": "issuer",    "type": "address", "internalType": "address" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getProof",
    "inputs": [
      { "name": "_hash", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [
      { "name": "exists",    "type": "bool",    "internalType": "bool" },
      { "name": "cid",       "type": "string",  "internalType": "string" },
      { "name": "timestamp", "type": "uint256", "internalType": "uint256" },
      { "name": "issuer",    "type": "address", "internalType": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proofExists",
    "inputs": [
      { "name": "_hash", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ProofRegistered",
    "inputs": [
      { "name": "hash",      "type": "bytes32", "indexed": true  },
      { "name": "cid",       "type": "string",  "indexed": false },
      { "name": "issuer",    "type": "address", "indexed": true  },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "ProofVerified",
    "inputs": [
      { "name": "hash",     "type": "bytes32", "indexed": true },
      { "name": "valid",    "type": "bool",    "indexed": false },
      { "name": "verifier", "type": "address", "indexed": true }
    ]
  },
  {
    "type": "error",
    "name": "ProofAlreadyExists",
    "inputs": [{ "name": "hash", "type": "bytes32" }]
  },
  {
    "type": "error",
    "name": "ProofNotFound",
    "inputs": [{ "name": "hash", "type": "bytes32" }]
  },
  {
    "type": "error",
    "name": "InvalidCID",
    "inputs": []
  }
] as const;

// Polygon Amoy Testnet config
export const AMOY_CHAIN = {
  id: 80002,
  name: "Polygon Amoy Testnet",
  network: "amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-amoy.polygon.technology"] },
    public:  { http: ["https://rpc-amoy.polygon.technology"] },
  },
  blockExplorers: {
    default: { name: "PolygonScan Amoy", url: "https://amoy.polygonscan.com" },
  },
  testnet: true,
};

export const CHAIN_ID = 80002;
export const BLOCK_EXPLORER = "https://amoy.polygonscan.com";
