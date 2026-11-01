# Settled decisions

Everything in the **Settled** table is agreed. Treat it as final unless someone opens an issue saying otherwise and the change is accepted. Reasons for the harder decisions are in [docs/adr](adr). Words are defined in [GLOSSARY.md](../GLOSSARY.md).

## Settled

| Area | Decision |
|---|---|
| Customer | Toto unions and landlords buy the Box. They are the Host. |
| Vehicles | Toto and e-bikes first. No cars at launch. |
| Power | AC only. Hosts choose their load; the Box has a fixed hardware rating per configuration. |
| Compliance | Licensing, sanctioned load and connection type are the Host's responsibility. We state this in sales terms. |
| Payments | The software never handles Driver-to-Host money. The Host records Top-ups and keeps accounts. |
| Billing modes | Host chooses Prepaid or Postpaid per Driver, sets the Rate, and can give bonus credit. Balances are per Host. |
| Presets | Simple Presets for common cases, plus a Custom Preset that exposes every setting. |
| Our revenue | A small cut per Unit, paid by Hosts as prepaid credits. No app subscription. The apps are free. |
| Connectivity | Online-first (Wi-Fi to the Host's router or phone hotspot). Bluetooth through the Host's phone as fallback. No SIM in the base Box. |
| Source of truth | The Box meters and enforces limits. The Ledger is append-only and merged on Sync. |
| Identity | Driver registers once online, enrolls with a Host by scanning a Box QR, then starts Sessions over Bluetooth with a Host-signed token. The QR on a Socket names the Socket. |
| Session end | Ends automatically when the charger tapers or the load disappears. The Driver never has to stop it. |
| Power cut | Sockets come back off. The Driver is notified and taps to resume. Charging after the tap is billed to that Driver. |
| Feedback | One colored LED per Socket: ready, charging, problem. |
| Hardware | Certified parts only. Enclosure with MCB, RCCB and earthing. Factory calibration to about 1%. |
| Box layout | Target design: a hub (controller, breaker, earth-leakage protector) plus separate plug-point units, each with its own meter and relay, joined by one cable. The first bench prototype may use one enclosure. See ADR 0008. |
| Languages | Bengali, Hindi and English with simple icons. |
| POC phase | Keep everything as cheap as possible. No custom board yet: use off-the-shelf modules (controller with Bluetooth and Wi-Fi, ready-made meter modules, relays). Move to the certified-parts design only after the POC works. |
| Beta | After the bench POC, install a box free at one Toto stand to collect real usage data. This is a beta, not a production release. |
| App | One Android app with a host mode and a driver mode, on free-tier cloud services. Split later if needed. |
| Beta safety | Beta installs use a short written agreement with the stand, a qualified electrician for wiring, an RCCB in every box, and a check of the stand's own wiring first. |
| POC go/no-go | Units within 2% of a reference meter on at least three real Toto chargers; four weeks at the beta stand with no manual fixes; sessions billed correctly after power cuts and sync gaps; the stand owner says they would pay. |
| Rate of our cut | A configuration value, not hard-coded. Currently thought of as 50 paise to 1 rupee per Unit. Revenue is not a goal during the POC. |
| Demo | The web preview is a game: you run a Toto stand. It teaches the product by tapping things in the world, with no panels of numbers. Vehicles are Toto and e-scooter only. |
| Manual start | Host sells the first ~20 Boxes by hand and issues credits manually. A payment gateway comes after demand is proven. |

## Open

| Item | Status |
|---|---|
| Product name | Deferred. `smartmeter` is the working repo name. |
| First pilot region | Proposed: Kolkata, where Suvajit's ground work was done. |
| Field findings | Suvajit's ground-work findings (how stands bill, charger specs, willingness to pay) are not written down here yet. |
| Repo licence | No licence file yet. |
| Trademark and legal checks | Not done. Resale of power and sub-meter accuracy rules are unverified in [docs/research](research). |
| Box cost and viability | Being worked out in [docs/feasibility](feasibility). |
