import axios from "axios";
import FormData from "form-data";

// ── FINGLOBE IPFS Service ─────────────────────────────
// Uploads encrypted files to Pinata IPFS.
// Falls back to mock mode if no JWT is configured.

const PINATA_JWT = process.env.PINATA_JWT || "";
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export interface IPFSUploadResult {
  cid: string;
  url: string;
  mock: boolean;
}

/**
 * Upload an encrypted file buffer to Pinata IPFS.
 * [Paper IV.C] — Decentralized encrypted storage via IPFS.
 */
export async function uploadToIPFS(
  fileBuffer: Buffer,
  filename: string,
  metadata?: Record<string, string>
): Promise<IPFSUploadResult> {
  // Mock mode if no JWT configured
  if (!PINATA_JWT) {
    console.warn("⚠️  PINATA_JWT not set — returning mock CID for demo");
    const mockCid = "Qm" + Buffer.from(filename + Date.now()).toString("hex").slice(0, 44);
    return {
      cid: mockCid,
      url: `https://gateway.pinata.cloud/ipfs/${mockCid}`,
      mock: true,
    };
  }

  const formData = new FormData();
  formData.append("file", fileBuffer, {
    filename,
    contentType: "application/octet-stream",
  });

  const pinataMetadata = JSON.stringify({
    name: `finglobe-${filename}`,
    keyvalues: metadata || {},
  });
  formData.append("pinataMetadata", pinataMetadata);

  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  formData.append("pinataOptions", pinataOptions);

  const response = await axios.post(PINATA_API_URL, formData, {
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      ...formData.getHeaders(),
    },
    maxBodyLength: Infinity,
    timeout: 30000,
  });

  const cid = response.data.IpfsHash as string;
  return {
    cid,
    url: `https://gateway.pinata.cloud/ipfs/${cid}`,
    mock: false,
  };
}

/**
 * Upload a JSON metadata object to Pinata IPFS.
 */
export async function uploadJSONToIPFS(
  obj: Record<string, unknown>,
  name: string
): Promise<IPFSUploadResult> {
  if (!PINATA_JWT) {
    const mockCid = "Qm" + Buffer.from(name + Date.now()).toString("hex").slice(0, 44);
    return {
      cid: mockCid,
      url: `https://gateway.pinata.cloud/ipfs/${mockCid}`,
      mock: true,
    };
  }

  const response = await axios.post(
    PINATA_JSON_URL,
    {
      pinataContent: obj,
      pinataMetadata: { name: `finglobe-meta-${name}` },
    },
    {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
    }
  );

  const cid = response.data.IpfsHash as string;
  return {
    cid,
    url: `https://gateway.pinata.cloud/ipfs/${cid}`,
    mock: false,
  };
}

/**
 * Test Pinata authentication.
 */
export async function testPinataAuth(): Promise<boolean> {
  if (!PINATA_JWT) return false;
  try {
    await axios.get("https://api.pinata.cloud/data/testAuthentication", {
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
    });
    return true;
  } catch {
    return false;
  }
}
