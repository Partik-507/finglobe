// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ╔══════════════════════════════════════════════════════╗
// ║   FINGLOBE ProofRegistry — Cryptographic Ledger     ║
// ║   Paper Section IV.B — Immutable Proof Storage      ║
// ╚══════════════════════════════════════════════════════╝

/**
 * @title ProofRegistry
 * @dev Stores SHA-256 document hashes + IPFS CIDs on-chain.
 * Gas-optimized: bytes32 hashes, calldata params, tight struct packing.
 * Deployed on Polygon Amoy Testnet for sub-2s verification.
 */
contract ProofRegistry {
    // ── Proof Struct (packed for gas efficiency) ──────────────────────
    struct Proof {
        string  cid;         // IPFS CID of the encrypted document
        uint256 timestamp;   // Block timestamp of registration
        address issuer;      // Wallet address that registered the proof
        bool    exists;      // Guard flag to check existence
    }

    // ── State ─────────────────────────────────────────────────────────
    mapping(bytes32 => Proof) private _proofs;

    // ── Events ────────────────────────────────────────────────────────
    event ProofRegistered(
        bytes32 indexed hash,
        string  cid,
        address indexed issuer,
        uint256 timestamp
    );

    event ProofVerified(
        bytes32 indexed hash,
        bool    valid,
        address indexed verifier
    );

    // ── Errors ────────────────────────────────────────────────────────
    error ProofAlreadyExists(bytes32 hash);
    error ProofNotFound(bytes32 hash);
    error InvalidCID();

    // ── Functions ─────────────────────────────────────────────────────

    /**
     * @notice Register a new document proof on-chain
     * @param _hash   SHA-256 hash of the document (bytes32)
     * @param _cid    Pinata IPFS CID of the encrypted document
     * [Paper IV.B] — Immutable fingerprinting via SHA-256 + blockchain anchor
     */
    function registerProof(bytes32 _hash, string calldata _cid) external {
        if (_proofs[_hash].exists) revert ProofAlreadyExists(_hash);
        if (bytes(_cid).length == 0) revert InvalidCID();

        _proofs[_hash] = Proof({
            cid:       _cid,
            timestamp: block.timestamp,
            issuer:    msg.sender,
            exists:    true
        });

        emit ProofRegistered(_hash, _cid, msg.sender, block.timestamp);
    }

    /**
     * @notice Verify a document proof exists on-chain
     * @param _hash SHA-256 hash to verify
     * @return exists    Whether this hash was ever registered
     * @return cid       IPFS CID of original document
     * @return timestamp When it was registered (Unix seconds)
     * @return issuer    Who registered it
     * [Paper IV.C] — Sub-2s tamper detection via on-chain lookup
     */
    function verifyProof(bytes32 _hash)
        external
        returns (bool exists, string memory cid, uint256 timestamp, address issuer)
    {
        Proof storage p = _proofs[_hash];
        emit ProofVerified(_hash, p.exists, msg.sender);
        return (p.exists, p.cid, p.timestamp, p.issuer);
    }

    /**
     * @notice Read-only version of verify (no event, pure view call)
     */
    function getProof(bytes32 _hash)
        external
        view
        returns (bool exists, string memory cid, uint256 timestamp, address issuer)
    {
        Proof storage p = _proofs[_hash];
        return (p.exists, p.cid, p.timestamp, p.issuer);
    }

    /**
     * @notice Returns total count helper (not tracked for gas, kept simple)
     */
    function proofExists(bytes32 _hash) external view returns (bool) {
        return _proofs[_hash].exists;
    }
}
