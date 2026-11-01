# smartmeter

A multi-socket AC junction box that meters each plug point separately, so small hosts (e-rickshaw unions, landlords, shop owners) can let drivers charge Toto and e-bikes and bill them per unit. Built for tier 2/3 cities in India. Working name: `smartmeter` (may change).

**Principles**
- AC only. No DC fast charging.
- Mostly software. Keep hardware simple, certified and repairable.
- We never handle money between driver and host. The host keeps the accounts.
- Online-first, but every box keeps working safely with no internet.
- As simple as UPI for the driver: plug in, scan, start.

## Repository map

| Path | What lives there |
|---|---|
| [`GLOSSARY.md`](GLOSSARY.md) | Shared vocabulary. Use these words in code, issues and docs. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Start here: what is settled and what is open. |
| [`docs/TEAM.md`](docs/TEAM.md) | Who does what. |
| [`docs/adr/`](docs/adr) | Architecture decisions and why we made them. |
| [`docs/feasibility/`](docs/feasibility) | Feasibility questions, proof-of-concept plan and cost model. |
| [`docs/research/`](docs/research) | Market, regulation and technology research (secondary sources; unverified items are flagged). |
| [`hardware/`](hardware) | PCB, parts list, enclosure, calibration. |
| [`firmware/`](firmware) | Code running on the box: metering, relays, ledger, Bluetooth/Wi-Fi. |
| [`apps/host/`](apps/host) | Android app for the box owner. |
| [`apps/driver/`](apps/driver) | Android app for the person charging. |
| [`cloud/`](cloud) | Backend: sync, backup, notifications. |

**Live preview:** https://gunjannandy.github.io/smartmeter/ (a small game: run an e-rickshaw charging stand, tap things to learn how the Box works; simulated, no real hardware yet). Source is in [`docs/`](docs): `index.html`, `app.js`, `style.css`, `js/` (simulation, game rules, 3D scene, models). three.js is vendored under `docs/vendor`.

See [CONTRIBUTING.md](CONTRIBUTING.md) to propose changes or raise a design question.
