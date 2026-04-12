"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, AMOY_CHAIN, CHAIN_ID } from "@/lib/contract";

export type WalletState = "disconnected" | "connecting" | "connected" | "wrong_network";

export interface WalletInfo {
  address: string;
  shortAddress: string;
  chainId: number;
  chainName: string;
  balance: string;
}

export interface UseWalletReturn {
  state: WalletState;
  wallet: WalletInfo | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToAmoy: () => Promise<void>;
  registerProof: (hash: string, cid: string) => Promise<string>;
  verifyProof: (hash: string) => Promise<ProofData | null>;
  isCorrectNetwork: boolean;
}

export interface ProofData {
  exists: boolean;
  cid: string;
  timestamp: bigint;
  issuer: string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>("disconnected");
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const isCorrectNetwork = wallet?.chainId === CHAIN_ID;

  const buildWalletInfo = useCallback(
    async (prov: ethers.BrowserProvider, address: string): Promise<WalletInfo> => {
      const network = await prov.getNetwork();
      const balanceBig = await prov.getBalance(address);
      const balance = parseFloat(ethers.formatEther(balanceBig)).toFixed(4);
      const chainId = Number(network.chainId);
      const chainName = chainId === 80002 ? "Polygon Amoy" : `Chain ${chainId}`;
      return {
        address,
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
        chainId,
        chainName,
        balance,
      };
    },
    []
  );

  const handleAccountsChanged = useCallback(
    async (accounts: unknown[]) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        setState("disconnected");
        setWallet(null);
        setProvider(null);
      } else if (provider) {
        const info = await buildWalletInfo(provider, accs[0]);
        setWallet(info);
        setState(info.chainId === CHAIN_ID ? "connected" : "wrong_network");
      }
    },
    [provider, buildWalletInfo]
  );

  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const eth = window.ethereum;
    eth.on("accountsChanged", handleAccountsChanged as (...args: unknown[]) => void);
    eth.on("chainChanged", handleChainChanged);
    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged as (...args: unknown[]) => void);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged]);

  // Auto-reconnect if MetaMask is already authorized
  useEffect(() => {
    const tryAutoConnect = async () => {
      if (!window.ethereum) return;
      try {
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as string[];
        if (accounts.length > 0) {
          const prov = new ethers.BrowserProvider(window.ethereum);
          setProvider(prov);
          const info = await buildWalletInfo(prov, accounts[0]);
          setWallet(info);
          setState(info.chainId === CHAIN_ID ? "connected" : "wrong_network");
        }
      } catch {
        // Silently ignore auto-connect failures
      }
    };
    tryAutoConnect();
  }, [buildWalletInfo]);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask from metamask.io");
      return;
    }
    setState("connecting");
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
      const info = await buildWalletInfo(prov, accounts[0]);
      setWallet(info);
      setState(info.chainId === CHAIN_ID ? "connected" : "wrong_network");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      setState("disconnected");
    }
  }, [buildWalletInfo]);

  const disconnect = useCallback(() => {
    setState("disconnected");
    setWallet(null);
    setProvider(null);
    setError(null);
  }, []);

  const switchToAmoy = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // Chain not added — add it
      if ((switchError as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${CHAIN_ID.toString(16)}`,
              chainName: AMOY_CHAIN.name,
              nativeCurrency: AMOY_CHAIN.nativeCurrency,
              rpcUrls: AMOY_CHAIN.rpcUrls.default.http,
              blockExplorerUrls: [AMOY_CHAIN.blockExplorers.default.url],
            },
          ],
        });
      }
    }
  }, []);

  const registerProof = useCallback(
    async (hash: string, cid: string): Promise<string> => {
      if (!provider || !wallet) throw new Error("Wallet not connected");
      if (!isCorrectNetwork) throw new Error("Please switch to Polygon Amoy Testnet");

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const bytes32Hash = hash.startsWith("0x") ? hash : "0x" + hash;
      const tx = await (contract as unknown as {
        registerProof: (h: string, c: string) => Promise<ethers.TransactionResponse>;
      }).registerProof(bytes32Hash, cid);

      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction failed — no receipt");
      return receipt.hash;
    },
    [provider, wallet, isCorrectNetwork]
  );

  const verifyProof = useCallback(
    async (hash: string): Promise<ProofData | null> => {
      if (!provider) throw new Error("Wallet not connected");

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const bytes32Hash = hash.startsWith("0x") ? hash : "0x" + hash;

      const result = await (contract as unknown as {
        getProof: (h: string) => Promise<[boolean, string, bigint, string]>;
      }).getProof(bytes32Hash);

      return {
        exists: result[0],
        cid: result[1],
        timestamp: result[2],
        issuer: result[3],
      };
    },
    [provider]
  );

  return {
    state,
    wallet,
    error,
    connect,
    disconnect,
    switchToAmoy,
    registerProof,
    verifyProof,
    isCorrectNetwork,
  };
}
