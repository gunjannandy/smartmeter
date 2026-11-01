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
| Configurations | A short menu of fixed Box configurations on one board. First product is a 4-Socket Box. Expansion bus designed in, modules sold later. |
| Languages | Bengali, Hindi and English with simple icons. |
| POC phase | Keep everything as cheap as possible. No custom board yet: use off-the-shelf modules (controller with Bluetooth and Wi-Fi, ready-made meter modules, relays). Move to the certified-parts design only after the POC works. |
| Beta | After the bench POC, install a box free at one Toto stand to collect real usage data. This is a beta, not a production release. |
| Manual start | Host sells the first ~20 Boxes by hand and issues credits manually. A payment gateway comes after demand is proven. |

## Open

| Item | Status |
|---|---|
| Product name | Deferred. `smartmeter` is the working repo name. |
| First pilot region | Not chosen. |
| Trademark and legal checks | Not done. Resale of power and sub-meter accuracy rules are unverified in [docs/research](research). |
| Box cost and viability | Being worked out in [docs/feasibility](feasibility). |
