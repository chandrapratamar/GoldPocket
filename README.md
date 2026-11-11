# Gold Pocket

<p align="center">
  <img src="public/img/GoldPocket-Logo.webp" alt="Gold Pocket" width="240" />
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://nimiq.com"><img src="https://img.shields.io/badge/Nimiq-Mini%20Apps%20Competition%20Cycle%20III-blue.svg" alt="Nimiq Mini Apps Competition" /></a>
</p>

**Nimiq Mini Apps Competition — Cycle III, Save Track**

Self-custodial tokenized gold (PAXG) investing mini app for Nimiq Pay. Buy and sell PAXG with USDT on Polygon PoS — straight from your Nimiq Pay self-custodial wallet. No accounts, no custodians, no private-key handling.

## Features

- Connect Nimiq Pay wallet via `window.ethereum` (EIP-1193)
- Real-time gold price
- Buy PAXG with USDT / sell PAXG back to USDT
- Best-of swap quoting across Li.Fi + 1inch (parallel, auto-picks highest output)
- Self-custodial execution — every transaction needs your wallet approval
- Transaction receipts with tx hash, route, fees, and PolygonScan link
- Local activity history with provider and amounts
- Mobile-first layout (pinned keypad and CTA, no scroll)
- Swipeable banner carousel with autoplay
- Bridged PAXG risk disclosure (Polygon PoS)

## Roadmap

### Completed

1. ~~Wallet connection via `window.ethereum` + Polygon chain switch (`0x89`).~~
2. ~~Token balances via viem `balanceOf`; decimals read from contracts.~~
3. ~~Swap quoting and execution through the provider (Li.Fi / 1inch) with best-of comparison.~~
4. ~~Transaction history persisted locally.~~
5. ~~Mobile-first layout with pinned keypad and CTA.~~
6. ~~Bridged PAXG risk disclosure (Polygon PoS).~~
7. ~~Banner carousel with autoplay.~~
8. ~~Receipt page with tx hash and PolygonScan link.~~

### Planned

| Priority | Feature                                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | **Portfolio value and profit/loss tracking** — cost basis from trade history. Shows real returns, not just balances.                                                 |
| P1       | **NIM → Gold in one flow** — fund a pocket straight from a NIM balance, routed to USDT then PAXG through a bridge aggregator (SwapSpace). The strongest "why Nimiq Pay" feature. |
| P1       | **Auto-save (DCA)** — weekly/monthly recurring buys. Non-custodial, so starts as a reminder + one-tap confirm. Core savings feature for the Save Track.              |
| P1       | **Gasless swaps** — a paymaster sponsors gas so users never need to hold POL. Likely the biggest friction point for newcomers.                                       |
| P2       | **Savings goals** — "Gold for my wedding, 40% there," shown in grams, not just dollars. Emotional and visual.                                                        |
| P2       | **Grams/oz and local currency display** — gold is already a savings instinct in many regions; show value in units people use.                                        |
| P2       | **Receipt polish** — share tx link, pending → confirmed states.                                                                                                      |
| P3       | **Gift gold** — send gold to a friend by link, with a message. Useful and spreads the app organically.                                                               |
| P3       | **Shared pockets** — family or friend groups saving toward a goal together.                                                                                          |
| P3       | **Languages** — English plus Bahasa Indonesia, Spanish, and others.                                                                                                  |

## Tech stack

Vite · React · TypeScript · Tailwind CSS v4 · React Router · viem · TanStack Query · lucide-react · Vercel Functions

## Quick start

```bash
npm install
cp .env.example .env   # fill in your API keys
vercel dev             # http://localhost:3000 (UI + /api/*)
```

## Environment variables

See `.env.example`. Required for production:

| Variable               | Description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `GOLD_PRICE_API_URL`   | Upstream gold spot price endpoint                                     |
| `LIFI_API_KEY`         | Li.Fi API key (optional — works keyless, rate-limited)                |
| `ONEINCH_API_KEY`      | 1inch API key (required for 1inch fallback)                           |
| `SWAP_PROVIDER`        | Pin a single provider (`lifi` or `1inch`), or leave empty for best-of |
| `VITE_POLYGON_RPC_URL` | Custom Polygon RPC (recommended for production)                       |

## Developing for Nimiq Pay

Mini apps load inside Nimiq Pay on a phone. Run `npm run dev -- --host` and open the Network URL in Nimiq Pay. Do not use `localhost` from the phone. Use `vercel dev` to serve both the UI and `/api/*` routes from one origin.

## Scripts

| Script              | Purpose                             |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start dev server (port 5173)        |
| `npm run build`     | TypeScript check + production build |
| `npm run typecheck` | TypeScript check for app and API    |
| `npm run lint`      | ESLint                              |
| `npm run format`    | Prettier write                      |

## Blockchain

| Item       | Value                                        |
| ---------- | -------------------------------------------- |
| Network    | Polygon PoS                                  |
| Chain ID   | 137 (`0x89`)                                 |
| Gas token  | POL                                          |
| USDT       | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` |
| PAXG (PoS) | `0x553d3D295e0f695B9228246232eDF400ed3560B5` |

PAXG on Polygon is the **Polygon PoS-bridged** version of the Ethereum PAXG (issued by Paxos). Redemption for physical gold requires bridging back to Ethereum.

## Security

- No private key handling — all wallet actions go through the injected provider
- API keys are server-side only (Vercel Functions)
- No third-party payment providers
- No hardcoded secrets

## License

MIT — see [LICENSE](LICENSE). Built for the Nimiq Mini Apps Competition — Cycle III, Save Track.
