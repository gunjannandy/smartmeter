# Hardware options: cheapest Box that gathers what the app needs

Status: **brainstorm, not a decision.** Written 2026-11-03 at the end of a planning session. The next session should dissect this and narrow it to **one, at most two, approaches** (see "Next session" at the bottom). Prices below are web-search snapshots (unverified, change often) or labelled guesses.

## Goal

We are in the hardware phase. Swayam's apps start after the hardware POC. The aim is the most frugal, bare-minimum hardware that still produces everything the app needs. Cost is the engineering problem. Cheaper chips with less functionality are welcome if they still deliver the data below.

## What the app needs from the hardware (per Socket)

- **Energy** (Units). Needs real power, not just current: Indian mains swings widely and cheap Toto chargers have low power factor, so a current-only sensor would misbill.
- **Load present / tapering**, to end a Session automatically. RMS current is enough.
- **Relay that fails safe**: off at boot and after any power cut (ADR 0005). A non-latching relay does this naturally.
- **Per-Socket switching.** A single shared relay cannot stop one Socket (auto-stop, prepaid balance ran out, Host disables one Socket). An optional master contactor in the hub is fine as a kill-all, but is not a substitute. Per-Socket relays are the cheapest part of the design.
- **One radio** (Bluetooth LE and Wi-Fi) per Box, plus non-volatile storage and a clock.

Not needed in the minimum: display, keypad, SIM, RFID, custom PCB for the POC.

## Size ladder (indicative, not fixed)

Default 2 Sockets, expandable to 4. A larger Box starts at 4, expandable to 8. Then 8, expandable to about 12. Only **2 and 4** need proving on the bench for the POC.

## Power-loss storage (needs to work with no phone nearby)

Requirement: after a power cut we must still know which Driver was last on each Socket and how much energy had been delivered, even with no Sync.

- Flash keeps data with no power and no battery, so the "last Driver per Socket" record is safe once it is written.
- The metering IC's energy counter and the MCU's RAM are volatile, so the MCU writes small checkpoints to wear-levelled flash: at Session start (Driver, Socket, start reading), every N Wh or minute during a Session, and at Session end.
- A small supercap plus brown-out detect lets the MCU flush one final record when power drops. Without it we lose at most one checkpoint interval (a few Wh).
- Sync later copies the log to the phone or cloud. FRAM is an upgrade if flash wear ever matters.

## Time keeping

After a power cut the Box does not know the time, and a Ledger without timestamps cannot be billed. Add an RTC chip with backup power. A coin cell fixes this but ages quickly in hot outdoor enclosures (Kolkata summers) and needs replacement; a supercap or small rechargeable cell avoids that and can also power the final flush. Preference: supercap. The coin-cell idea is for **time**, not for the Ledger itself.

## The cost ceiling (benchmark)

Complete 16 A Wi-Fi smart plugs with energy monitoring retail in India for roughly ₹700-1,000. They include enclosure, relay, meter, radio, supply, plug, app and certification. These prices include retail margin, so manufacturers' unit cost is far lower. Any custom plug point must beat this or justify itself.

- [Havells 16A Wi-Fi socket, about ₹875](https://havells.com/crabtree/switches/16-a-wi-fi-enabled-smart-socket-acst161603.html)
- [V-Guard 16A smart plug, about ₹989](https://vguard.com/products/v-guard-16a-smart-plug-works-with-alexa-google-assistant-app-control-timer-scheduling-remote-access-smart-plug-for-home-appliances-ideal-for-heavy-appliances-energy-monitoring)
- [AGARO Regency 16A with energy monitoring, about ₹699](https://www.dealsmagnet.com/deal/agaro-regency-16a-wi-fi-smart-plug-with-energy-mon-1d7HaiSu)
- [Teardown of Polycab's 16A plug for Tasmota](https://techenclave.com/t/teardown-and-preparation-of-polycabs-16a-wi-fi-smart-plug-for-tasmota/264708?page=4) (shows these can be reflashed)

## Candidate architectures

| | **0. Off-the-shelf plugs** | **A. Everything in the hub** | **B. Hub + remote plug-point units** | **C. Every unit standalone** |
|---|---|---|---|---|
| Idea | Reflashed retail smart plugs as plug points; our hub holds MCB, RCCB, radio, feed | One MCU and a meter and relay per Socket in the hub; each Socket has its own cable to a dumb socket | Hub (MCU, MCB, RCCB) plus small per-Socket units (meter, relay, isolated serial link, optional tiny MCU) on a shared feeder | Each unit has its own radio MCU; hub is only breakers |
| Fits ADR 0008 | Partly | No (contradicts it) | Yes | Yes |
| Likely cheapest at | POC, 2 Sockets | 2-4 Sockets | 6-12 Sockets spread out | Not obviously |
| Main risk | Unknown accuracy, no custom log or Ledger, no control of firmware on closed models | Hub grows with Socket count; long star runs; one fault kills all | More mains parts outside the hub, each IP-rated; feeder must carry the sum of loads (voltage drop, cable size); isolated link per unit | Most radios; Wi-Fi provisioning on every unit |
| Enclosures | Retail | One large | Hub plus N small | N small |

**Idea to test:** design a **per-Socket module once** (meter IC, relay, optional tiny MCU, isolated serial link). Mount it in the hub for small Boxes (A) or in a remote enclosure for large ones (B). Then A vs B is a housing and cabling decision, not a redesign. Cost: paying for the isolated link even when the module sits next to the MCU.

Hub failure rule (settled in this session): if the hub dies, all Sockets stay off.

## Component price snapshots (unverified; check live listings)

- BL0942 metering IC: about [$0.25-0.45 per piece](https://fat.lcsc.com/product-detail/Energy-Metering-ICs_BL-Shanghai-Belling-BL0942_C2909509.html), needs calibration.
- Bare current-transformer part: cost floor about [$0.21-0.26](https://www.ti.com/lit/pdf/SBAA762) (TI comparison). Hobby clamp CTs in India are [₹474-596](https://m.indiamart.com/proddetail/sct013-100a-50ma-non-invasive-ac-current-sensor-split-core-type-clamp-meter-sensor-2856418209191.html) and are not what we would fit.
- Manganin shunt: no reliable price found. Typically the cheapest sensing choice, but may need trimming to reach about 1% ([thesis](https://nrl.northumbria.ac.uk/id/eprint/36271)), and needs isolation on the data side.
- **CT vs shunt is worth only about ₹10-30 per Socket.** Safety (CT is isolated) should decide it. Leaning CT, parked.
- Not yet researched: relay, socket, MCB, RCCB, enclosure, supply, cable, RTC, supercap, ESP32-C3/C2 modules, per-Socket isolator.

## Open questions

| # | Question | Who can answer |
|---|---|---|
| 1 | Real AC draw of Toto and e-scooter chargers (watts, amps, power factor, inrush). Sets relay, sensing and cable sizing. Nobody knows yet. | Suvajit: read nameplates on 3-5 chargers; clamp one with a plug-in energy meter |
| 2 | Single phase or three phase at a typical stand? A 12-Socket Box could be about 12 kW simultaneous. | Suvajit, electricians |
| 3 | Should the Box limit simultaneous charging to stay inside the stand's sanctioned load? Cheap in software, affects relay and cable sizing. | Suvajit, stand owners |
| 4 | Target cost per Socket and per hub in rupees. | Team |
| 5 | Accuracy vs cost: pre-calibrated module for the POC, cheap calibrated IC later? Leaning yes. | Team |
| 6 | Distance between parking spots at real stands. Decides A vs B. | Suvajit |
| 7 | Do the apps need a trustworthy offline clock for token expiry (ADR 0004), and how is it provided? | Team |
| 8 | Is ADR 0008 negotiable on cost grounds? Assumed yes, if the costed comparison says so. | Team |

## Emulation and compute (hardware phase)

- Analog and load models are light and fit the small VM: charger load curves (Toto CC/CV taper, low power factor, noisy current, no clean "full" signal), metering error (shunt/CT tolerance, drift, voltage swing, 50 Hz noise), relay inrush and wear, plus ngspice for the front end.
- Kaggle is only for Monte Carlo sweeps over those models (thousands of charger, voltage and temperature combinations). It cannot serve ports.
- Full MCU emulation (Renode, QEMU for ESP32) is heavy and poorly supported for the C3. Skip it; test firmware logic compiled for x86 instead.

## Next session

Goal: dissect everything above and end with **one, at most two, most optimal approaches**.

1. Research real prices for the missing components (relay, socket, MCB, RCCB, enclosure, supply, cable, RTC, supercap, ESP32-C3/C2 modules, isolators) and fill a per-Socket and per-hub BOM for Options 0, A, B at 2 and 4 Sockets, with pessimistic and likely cases.
2. Test whether Option 0 is credible: which retail smart plugs are reflashable, and what is their energy-reporting accuracy and log behavior across a power cut? (Buying 2-3 plugs needs the team's go-ahead.)
3. Resolve or scope the open questions above. Questions 1, 2, 3 and 6 need field data from Suvajit.
4. Draft a one-page comparison (cost, install work for an electrician, failure modes and who fixes them, what a Host sees) to share with Suvajit, electricians and stand owners so they can weigh in.
5. Decide whether the answer changes ADR 0008 and record it.
