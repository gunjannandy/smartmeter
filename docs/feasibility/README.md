# Feasibility and proof of concept

Goal: decide go or no-go on a Box that is cheap, safe and easy to maintain, and learn what to build first. Everything below is a plan or an estimate, not a result.

## Questions to answer

1. **Can the hardware be minimal?** Per Socket, a relay and a metering chip cannot be removed. Candidates to remove: display, keypad, SIM, RFID reader, custom PCB (use certified modules first).
2. **What does a Box cost?** Build a parts list from supplier quotes: controller, per-Socket relay and metering, protection (MCB, RCCB), enclosure, wiring, power supply, status LEDs, assembly, certification and support. No figures yet.
3. **What does a Box earn?** Rough: about 6 Units a day per busy Socket at a few paise to rupees cut per Unit. At 50 paise that is about ₹1,100 a year per busy Socket. Check against the parts list.
4. **Does sync and billing hold up?** Power cuts, Bluetooth on cheap phones, Wi-Fi dropping, two phones editing one Ledger.
5. **Can people use it?** Hosts finishing setup in about two minutes; Drivers needing only plug, scan, start.

## Proof-of-concept tracks

| Track | What | Hardware needed |
|---|---|---|
| A. Simulated Box | Firmware core running on a laptop with a fake meter and relay, talking to a test cloud and the two apps. Tests the Ledger, Sync, Session and power-cut rules. | None |
| B. Bench Box | A development controller with an off-the-shelf energy-metering module and relay, driven by a dummy load, to test measurement, auto-stop and Bluetooth/Wi-Fi. | Controller, metering module, relay. Mains wiring only by a qualified electrician, in a protected enclosure. |
| C. Cost model | A spreadsheet from supplier quotes, with pessimistic and likely cases. | None |

Start with A and C. They are cheap, and A finds most design mistakes before any hardware is bought.

## Hardware risks to test

- Relay life at 230V with the inrush of the chargers actually used.
- Metering drift and accuracy over temperature.
- Bluetooth pairing on cheap Android phones.
- Wi-Fi reliability in the field.
- Behavior of cheap Toto chargers: noisy, low power factor, no clean "full" signal.
