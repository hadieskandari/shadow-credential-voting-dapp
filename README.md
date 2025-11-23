# Shadow — Confidential Voting dApp

Shadow is a premium voting experience built on Zama’s FHEVM stack. Every ballot is encrypted in the browser, transmitted through the Relayer SDK, and tallied inside a fully homomorphic smart contract. Creators stay in control of when clear counts are revealed, while voters get verifiable privacy without sacrificing transparency or UX.

## Why Shadow

- **Encrypted end‑to‑end** – ballots never leak; tallies decrypt only when the owner publishes results with relayer proofs.
- **Shareable yet private** – public polls surface on Discover with Farcaster/X share buttons, private polls stay link‑only with clipboard protected links.
- **Diagnostics baked in** – live wallet/network/handle diagnostics let auditors confirm the poll state before revealing counts.
- **Premium glassmorphism UI** – persistent Silk background, polished cards, and glowing notifications keep the dApp cohesive with the Shadow brand.

### Problems solved

Traditional DAO polls expose votes as soon as they’re cast and require trust in the frontend. Shadow removes that trust gap by:

1. Using Zama’s FHE runtime plus the Relayer SDK so the chain can verify encrypted tallies.
2. Keeping voters anonymous while still producing on‑chain evidence once the owner decrypts.
3. Providing distribution UX (share buttons, secure links) that matches public social expectations.

## Architecture at a glance

| Layer | Purpose |
| --- | --- |
| **`packages/nextjs`** | Next.js 15 + Radix UI app, Wagmi/RainbowKit wallet flow, custom Silk background & notification system. |
| **`packages/hardhat`** | Hardhat workspace with `SimpleVoting.sol` and helper scripts for deploying to Sepolia or localhost. |
| **`packages/nextjs/lib/fhevm`** | Local FHEVM hooks mirroring Zama’s SDK for client encryption/decryption and relayer storage. |
| **`packages/nextjs/utils/helper`** | Shared helpers: toast notifications, metadata, contract utilities, etc. |

Shadow runs entirely client side, but the background silk animation and Dapp wrapper sit outside page transitions so navigation never flashes. Notifications originate from a centralized helper to keep styling and copy consistent.

## User flow overview

1. **Create a vote** – connect a wallet, describe the prompt, pick Public or Private, supply optional cover art, and set a deadline. The frontend encrypts answers locally, submits via `createQuestion`, and shows a toast for every state (loading/success/error).
2. **Share** – public polls show Farcaster + X pill buttons, private polls expose a copy‑link icon only. Every share is a Zama‑styled floating action button.
3. **Vote** – voters land on `/vote?questionId=…`, see the redesigned poll card, diagnostics, and answer buttons that stay disabled until the poll is live and they haven’t voted.
4. **Reveal** – once the creator decides to publish, they decrypt via the relayer workflow; tallies update everywhere but stay auditable with the diagnostic sidebar.

## Repository layout

```
shadow-confidential-voting-dapp/
├── packages/
│   ├── nextjs/        # Shadow frontend (app router, components, hooks, styles)
│   └── hardhat/       # Contracts, deploy scripts, Hardhat tasks & tests
├── scripts/           # Helpers (relayer assets, ABI generation, etc.)
├── assets/            # Brand assets (logos, fonts, icons)
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20+
- `pnpm` (Corepack or manual install)
- Git + a wallet such as MetaMask/Rainbow
- Optional: an Alchemy/Infura RPC key and WalletConnect Project ID for production

### Clone & install

```bash
git clone <your-fork-url> shadow-confidential-voting-dapp
cd shadow-confidential-voting-dapp
pnpm install
```

### Environment

```bash
cp packages/nextjs/.env.example packages/nextjs/.env.local
```

Fill the following:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | RPC provider for Sepolia/mainnet fallback. |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect V2 client ID. |
| `NEXT_PUBLIC_CHAIN_ID` | Defaults to `11155111` (Sepolia). Set to your deployment chain. |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Address of the deployed `SimpleVoting` contract. |

If you deploy to a different network, also update `packages/nextjs/contracts/deployedContracts.ts`.

### Run the stack

1. **Start Hardhat (optional but recommended for local testing)**
   ```bash
   cd packages/hardhat
   pnpm chain        # start local node
   pnpm deploy:localhost
   ```
2. **Run Shadow**
   ```bash
   cd ../nextjs
   pnpm dev          # http://localhost:3000
   ```
3. **Production build**
   ```bash
   pnpm build && pnpm start
   ```

## Using Shadow

### Creating a vote

- Click **Create a vote** in the hero card or scroll to the builder.
- Choose **Public** to list on Discover or **Private** to keep it invitation-only.
- Provide optional artwork; Shadow falls back to the brand logo if none is supplied.
- Set a deadline at least 15 minutes in the future. A live countdown + diagnostics help watchers understand status.
- Submit — watch the new toast notifications: connect hint → validation error → encrypting/loading → success.

### Voting & sharing

- Visit `/discover` to browse curated polls. Each card exposes:
  - Creator avatar (logo placeholder if missing)
  - Status pills (Public/Private, question number, Confidential flag)
  - Deadline, vote count, publish state
  - Contextual share buttons (Farcaster, X, or secure copy)
- Clicking **View & Vote** opens `/vote?questionId=…` with the larger poll card, diagnostics sidebar, and action buttons.

### Results & diagnostics

- When a poll is closed, creators reveal encrypted tallies via relayer actions exposed in the diagnostics panel.
- The bottom card narrates the privacy guarantees: encrypted ballots, proofs upon reveal, and a “Secure link · Encrypted voters” badge for auditors.

## Privacy & UX details

- **Persistent silk background** – rendered once at the provider level, so scroll/route transitions never flash white.
- **Shadow toasts** – originate from `notification.tsx` and surface in the top-right with a soft yellow glow matching the brand.
- **Share buttons** – real Farcaster/X icons, 3D pill shapes, and carved corners that dock into each poll card.
- **Placeholders** – missing avatars automatically swap to `shadow-logo.png`, keeping layout consistent.

## Troubleshooting

- **MetaMask nonce mismatch** – restarting Hardhat resets the chain. If MetaMask refuses to send txs, clear the activity tab or reset the account under Settings → Advanced.
- **Cached contracts** – Chrome persists extension state; restart the browser when switching between local and Sepolia deployments.
- **Module errors** – ensure `pnpm install` runs at the repo root so workspace dependencies (`packages/nextjs`, `packages/hardhat`) stay in sync.

## Contributing

1. Fork and create a feature branch.
2. Keep UI changes consistent with the Shadow palette: near-black glass panels with #FFD208 accent.
3. Run `pnpm lint` and `pnpm test` (where available) before opening a PR.

## License

Shadow is distributed under the BSD-3-Clause-Clear license. See [LICENSE](LICENSE) for full terms.
