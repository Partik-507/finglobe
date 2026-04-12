@echo off
REM ──────────────────────────────────────────────────────────────────
REM  FINGLOBE — Windows Setup Script
REM  Run this from the c:\FinGlobe directory
REM ──────────────────────────────────────────────────────────────────

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║           FINGLOBE — Full-Stack Setup                ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM ── Check Node version ────────────────────────────────────────────
echo [1/4] Checking Node.js version...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found! Install from https://nodejs.org ^(v20+^)
    exit /b 1
)

echo.
echo [2/4] Installing Smart Contract dependencies...
cd contracts
npm install
echo Compiling contracts...
npx hardhat compile
cd ..

echo.
echo [3/4] Installing Backend dependencies...
cd backend
npm install
cd ..

echo.
echo [4/4] Installing Frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║  SETUP COMPLETE! Now follow these steps:                        ║
echo ╠══════════════════════════════════════════════════════════════════╣
echo ║                                                                  ║
echo ║  STEP 1: Configure environment variables                         ║
echo ║    - Copy .env.example to .env                                   ║
echo ║    - Fill in: PRIVATE_KEY, PINATA_JWT, ENCRYPTION_KEY            ║
echo ║    - Copy backend\.env.example to backend\.env                   ║
echo ║    - Copy frontend\.env.local with your contract address         ║
echo ║                                                                  ║
echo ║  STEP 2: Deploy Smart Contract (needs testnet MATIC)             ║
echo ║    cd contracts                                                  ║
echo ║    npx hardhat run scripts/deploy.ts --network amoy              ║
echo ║    (Copy the contract address output!)                           ║
echo ║                                                                  ║
echo ║  STEP 3: Start Backend                                           ║
echo ║    cd backend                                                    ║
echo ║    npm run dev                                                   ║
echo ║                                                                  ║
echo ║  STEP 4: Start Frontend (in new terminal)                        ║
echo ║    cd frontend                                                   ║
echo ║    npm run dev                                                   ║
echo ║    Open: http://localhost:3000                                   ║
echo ║                                                                  ║
echo ║  TESTNET MATIC FAUCET: https://faucet.polygon.technology/        ║
echo ║  PINATA SIGNUP:        https://pinata.cloud                      ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
