# Gold Pocket

<p align="center">
  <img src="public/img/GoldPocket-Logo.webp" alt="Gold Pocket" width="240" />
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
- Mobile-first layout (pinned keypad + CTA, no scroll)
- Bridged PAXG risk disclosure (Polygon PoS)

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

All rights reserved. Built for the Nimiq Mini Apps Competition — Cycle III, Save Track.
