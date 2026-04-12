import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * FINGLOBE — ProofRegistry Deployment Script
 * Deploys to Polygon Amoy Testnet (or local Hardhat node)
 * Paper Section V.A — On-chain Registration Infrastructure
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║  FINGLOBE ProofRegistry — Deploying...  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  console.log(`📍 Network:  ${(await ethers.provider.getNetwork()).name}`);
  console.log(`👛 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance:  ${ethers.formatEther(balance)} MATIC\n`);

  if (balance === 0n) {
    throw new Error(
      "Deployer has 0 MATIC. Get testnet MATIC from: https://faucet.polygon.technology/"
    );
  }

  // Deploy the contract
  console.log("⏳ Deploying ProofRegistry...");
  const ProofRegistry = await ethers.getContractFactory("ProofRegistry");
  const contract = await ProofRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ ProofRegistry deployed to: ${address}`);
  console.log(`🔗 View on explorer: https://amoy.polygonscan.com/address/${address}\n`);

  // Write contract address to shared config files
  const deploymentInfo = {
    address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  // Save to contracts/deployment.json
  const contractsDeployPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(contractsDeployPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${contractsDeployPath}`);

  // Auto-update frontend .env.local if it exists
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
  if (fs.existsSync(frontendEnvPath)) {
    let envContent = fs.readFileSync(frontendEnvPath, "utf8");
    envContent = envContent.replace(
      /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
      `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`
    );
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log(`🔄 Updated frontend/.env.local with contract address`);
  }

  // Auto-update backend .env if it exists
  const backendEnvPath = path.join(__dirname, "../../backend/.env");
  if (fs.existsSync(backendEnvPath)) {
    let envContent = fs.readFileSync(backendEnvPath, "utf8");
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${address}`
    );
    fs.writeFileSync(backendEnvPath, envContent);
    console.log(`🔄 Updated backend/.env with contract address`);
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║  NEXT STEPS:                                         ║");
  console.log("║  1. Copy the contract address above                  ║");
  console.log("║  2. Add to frontend/.env.local:                      ║");
  console.log(`║     NEXT_PUBLIC_CONTRACT_ADDRESS=${address.slice(0, 10)}...  ║`);
  console.log("║  3. Add to backend/.env:                             ║");
  console.log("║     CONTRACT_ADDRESS=<address>                       ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err.message);
  process.exit(1);
});
