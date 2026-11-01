# Auth / offline-first billing research (multi-socket e-rickshaw charging, India)

Method: web search snippets only (no full-page reads). Tags: [V] = supported by a cited source; [S] = secondary/vendor/blog source; [U] = unverified or from general engineering knowledge, check before relying.

## 1. How others authenticate and unlock

| System | Mechanism | Class | Evidence |
|---|---|---|---|
| Yulu (India) | Scan QR or type vehicle number in app; payment from in-app wallet; IoT lock on vehicle | Cloud (cellular IoT) + app; BLE use not confirmed [U] | [S] https://www.medianama.com/2017/11/223-yulu-amit-gupta/ , https://yourstory.com/2020/04/vodafone-yulu-iot-bikesharing-commuting (Vodafone IoT partnership) |
| Bounce (India) | In-house keyless system via app, IoT on every scooter, server-tracked, geofenced | Cloud | [S] https://www.outlookbusiness.com/enterprise/big-idea/bike-keyless-5199 |
| Vogo (India) | OTP in app, IoT device in scooter; one 2020 account says phone Bluetooth pairs with the IoT device | Cloud + BLE | [S] https://yourstory.com/2020/07/product-roadmap-bike-rental-platform-vogo-iot |
| Lime/Bird | Scan QR or enter plate number; BLE unlock offered as fallback; Gen3 module can be driven over BLE (unofficial project) | Cloud primary, BLE fallback | [S] https://www.levyelectric.com/resources/unlocking-the-fun-how-to-scan-a-lime-scooter ; https://github.com/A-Emile/Lime_Gen3_IoT_Replacement (not Lime-endorsed) |
| Generic QR-unlock flow | App scans QR, backend checks identity/payment, encrypted unlock command sent to vehicle over LTE or BLE | Cloud | [S] https://greenmoov.app/articles/en/escooter-qr-code-rental-workflow-technical-and-operational-guide |
| Gogoro (Taiwan) | GoStation authenticates owner and runs diagnostics in the ~6 s swap; batteries paired to scooter; app/NFC access; cloud authentication needed to start charging on the mobile charger | Cloud + NFC | [S] https://www.gogoro.com/smart-energy/gocharger-mobile ; https://gogoro.com/product-information |
| Selex, Xanh SM/VinFast swap, Gesits/Swap Indonesia, Battery Smart | NOT FOUND in search. VinFast app scans a QR on a charger to start a charge (charging, not swap) | - | [S] https://www.greensm.com/vn-vi/news/sac-xe-gsm-voi-ung-dung-vinfast |
| Indonesia research (ITS) | Compared QR vs RFID authentication at scooter swap stations; RFID faster, user preference split | QR / RFID | [V] https://scholar.its.ac.id/en/publications/auth-at-battery-swapping-stations-for-electric-scooters-qr-code-v/ |
| China community e-bike charging | Older coin-operated posts, upgraded to phone scan (WeChat/Alipay QR); offline IC-card details NOT found | Cloud via QR, coin/card legacy | [S] https://hznews.hangzhou.com.cn/chengshi/content/2017-12/14/content_6741651.htm ; https://www.chinaservicesinfo.com/s/201806/15/WS5b78ab09498e855160e90abc/shared-charging-ports-popular-in-zhanjiang-communities.html |
| M-KOPA (Kenya) | Device locks if payment lapses; unlock via SMS code entered in app/lock screen (single secondary source); GSM/IoT connection to CRM; 2G needed on phones | Cloud/SMS | [S] https://paybillke.com/guides/m-kopa-phone-locked-kenya ; https://techcabal.com/2020/10/08/the-backend-mkopa-asset-financing/ ; https://www.gsma.com/mobilefordevelopment/wp-content/uploads/2022/04/M-KOPA-Applying-the-pay-as-you-go-model-to-smartphones-in-Africa.pdf |
| Angaza / OpenPAYGO token | Offline keypad tokens. Angaza algorithm is proprietary [U]. OpenPAYGO Token (open, spec v2.3): token types ADD_TIME, SET_TIME, DISABLE_PAYG, COUNTER_SYNC; SipHash-2-4 based; counter-based so used tokens return ALREADY_USED; supports out-of-order entry of recent tokens. Original repo archived Oct 2023, use OpenPAYGO-python / docs site | Offline token | [V] https://github.com/EnAccess/OpenPAYGO-Token ; https://pypi.org/project/openpaygo/ ; https://enaccess.github.io/OpenPAYGO-docs/ ; https://www.paygops.com/openpaygotoken (claims independent crypto audit) |
| STS prepaid meters (Kenya/S. Africa etc.) | 20-digit token generated at vendor's security module under utility key (supply group code), keyed into meter, one-way carrier, no meter connectivity | Offline token | [S] https://clouglobal.com/the-never-ending-token-story/ ; https://www.eskom.co.za/prepayment/prepayment-operation/ ; standard IEC 62055-41:2018 (paywalled; token bit layout/cipher not verified). STS licensing/certification and HSM requirements for a startup: [U] |

Hardware cost implications (qualitative; no sourced prices):
- Cloud-only: needs 4G/2G module + SIM per unit (or per gateway), recurring data cost; fails offline.
- BLE phone-to-device: ESP32 already has BLE, ~zero BOM add; needs the host's or driver's Android phone nearby.
- RFID/NFC: reader (e.g. PN532/RC522 class) adds a few USD per unit plus card cost [U]; works fully offline if card holds balance or device holds allow-list; ISO14443 cards need secure keys (MIFARE Classic is broken [U, general knowledge]; use DESFire/NTAG424-class).
- Keypad/token: keypad + display add small BOM cost, no radio; best fit for zero connectivity but worst UX for chargers with many sockets (per-socket keypad or one shared keypad).

## 2. Offline-first billing patterns

Patterns (design guidance, mostly general engineering knowledge [U] unless cited):
- Local ledger: append-only log in flash/FRAM per socket (session id, start/stop, Wh counter, monotonic counter, RTC time or uptime, prior-record hash). Hash-chain records for tamper evidence. Keep a monotonic cumulative Wh counter per socket as the billing source of truth, not session sums.
- Signed vouchers/tokens: server (or startup's offline signing tool) issues credit or enablement tokens with counter + device ID; device verifies and rejects reuse. OpenPAYGO's counter model is a proven template. Prefer Ed25519 or HMAC with per-device key derived from a master key (use a secure element or flash encryption on ESP32).
- Host phone as gateway: host app pairs over BLE, pulls the signed ledger delta, uploads when it has data, and receives new tokens/config to push down. Store-and-forward; server dedups by record counter.
- Per-kWh fee accounting: the startup's revenue = sum of metered kWh x rate, so reconciliation uses the device's cumulative counter signed by the device key. Optionally require sync every N days or Y kWh else socket locks (credit-limit / "dead-man" cutoff).
- Under-reporting/tamper detection: live vs neutral current comparison (firmware bills the larger, flags fault) [V] https://investors.freescale.com/docs/en/application-note/AN4993.pdf ; bypass detection by other methods in patents (caveat: thief splitting neutral defeats L-N compare) [V patents] https://www.google.de/patents/EP3015873A1?cl=en . Also: enclosure open switch, power-loss/outage counters, RTC jump detection, cumulative counter regression, sanity check of Wh vs relay-on time x max load, server-side comparison against host's sales/phone logs, and periodic mandatory sync. Physical controls (sealed enclosure, tamper screws) [U]. Note a host can also unplug the box from a metered upstream; consider an optional upstream check meter [U].

BLE security on ESP32:
- LE Secure Connections (BT 4.2+, ECDH) is the baseline; numeric comparison exists only in LE SC, and auto-approving it removes MITM protection [V/S] https://www.bluetooth.com/blog/bluetooth-pairing-part-4/ ; ESPHome/Nordic forum notes on auto-accept. Official ESP-IDF API doc NOT retrieved: check https://docs.espressif.com (Bluedroid/NimBLE security) [U].
- A headless box has no display, so numeric comparison/passkey is awkward; prefer application-layer authentication over BLE: signed commands (nonce challenge-response or counter + HMAC/Ed25519), so link-layer pairing is not the only protection. Replay protection via monotonic counter plus device nonce [U, standard practice].
- Limits: ESP32 BLE stack reportedly supports a maximum of 3 simultaneous connections (ESPHome docs) [S] https://esphome.io/components/ble_client/ .

Connectivity costs in India:
- Published M2M per-year prices NOT found. M2M SIMs are sold through operators' enterprise arms (Airtel Business, Jio, Vi); small makers often use ordinary prepaid SIMs as a workaround [S] https://circuitdigest.com/articles/how-can-you-get-and-use-an-m2m-iot-sim-card-in-india ; https://zbotic.in/gsm-sim-card-for-iot-projects-best-operators-plans-india-2025/ . Consumer annual plans sit around Rs 2,400+ and were raised after 2024 [S] https://techcrunch.com/2024/06/27/reliance-jio-kicks-off-indian-telecom-price-hike . Need a real quote; a low-volume plan is commonly cited at a few hundred rupees per year [U, unverified].
- NB-IoT: Jio commercial since 2022 in select smart cities (S); Airtel reports conflicting; BSNL pilot; tier-2/3 and rural coverage sparse [S] https://zbotic.in/nb-iot-vs-lte-m-vs-lora-low-power-wan-comparison-for-india-2025/ ; https://devzone.nordicsemi.com/f/nordic-q-a/128227/nb-iot-sim-options-for-nrf9160-in-india/567488 . Not a safe bet for weak-internet sites.
- LoRaWAN: India band 865-867 MHz unlicensed (IN865), no per-SIM fee but you must deploy gateways; band is crowded [S] https://dot.gov.in/sites/default/files/WG1_Contribution_By_%20IAFI_2_Received%20on%2013082024.docx?download=1 . Poor fit for sparse single-site hosts.
- LTE-M availability in India: not established [U].

## 3. Modular multi-socket hardware

- RS-485/Modbus RTU: multidrop, 32 unit-loads (31 meters + master in RISH docs), 1.2 km, 120 ohm termination at both ends, addresses 1-247 [V] https://rishabh.co.in/uploads/product/rish-ec43xx-260/RISH_EC43XX_ER43XX_INTERFACE_DEFINITION_REV_G.pdf ; https://sid.siemens.com/r/A6V11165272/16318499339___en-US_16318075531 . Standard Modbus has no auto-discovery; addresses are set manually or the master polls addresses; a gateway can scan (MSA FieldServer note) [S]. For auto-discovery, design own scheme: daisy-chain enumeration line (each module's "next-enable" pin so master assigns addresses sequentially) [U, design suggestion].
- CAN and I2C: no sources retrieved. General: I2C is board-level only (short, not isolated); CAN/RS-485 are better for cable runs between modules with isolation [U].
- Metering ICs (verify against official datasheets):
  - BL0937 (Shanghai Belling): pulse output (CF = active power, CF1 = current/voltage selected by SEL), SOP-8, 3-3.6 V, ~2500:1 dynamic range, ~0.3% error; cheap; no calibration registers/UART; one source conflicts on over-current pin, so check datasheet. [S] https://wmsc.lcsc.com/wmsc/upload/file/pdf/v2/lcsc/1811151441_BL-Shanghai-Belling-BL0937_C94616.pdf ; https://docs.espressif.com/projects/esp-iot-solution/en/latest/sensors/power_measure.html . SEL multiplexing means current and voltage are not read simultaneously.
  - HLW8032 (Hiliwei): UART-only, 5 V, SOP-8, 1000:1 range [S] https://www.lcsc.com/product-detail/C128023.html . 5 V supply per the listing; confirm.
  - ATM90E26 (Microchip): UART or SPI, 3 channels 16-bit, SSOP-28, 2.8 V min [S] https://www.radiolocman.com/datasheet/pdf.html?di=128209 ; best accuracy of the cheap group with calibration registers [U on exact class].
  - ADE7953 (Analog Devices): SPI/I2C/UART, two current channels, 3.3 V, LFCSP-28; most capable, also usable for L/N dual-current tamper check [V] https://www.analog.com/en/products/ade7953.html . Price higher than Chinese ICs [U].
  - Per-socket cost trade: one IC per socket (BL0937 cheapest, ~dollar class [U]); alternative ADE7953 with two current channels can meter live and neutral on one socket for tamper check.
- 16A relay: Hongfa HF115F-I 1H: 16A/250VAC NO contact, inrush ~80-120A, life ~7.5x10^4 operations at 16A 250VAC but that test is cited at 120VAC profile, so 230V resistive/inductive/SMPS-capacitive load life must be verified by the manufacturer or your own test. Latching variant exists (HF115F-L). Datasheet excerpts from resellers only. [S] https://www.maritex.eu/en/product/hongfa-hf115f-i012-1hs3a-relays ; https://www.lcsc.com/product-detail/C2976789.html . Chargers (SMPS) cause large inrush and welded contacts; consider zero-cross switching or NTC [U]. Relay welding detection by metering the output after commanded OFF [U].
- Indian regulation (BIS, CEA metering, Electricity Act on resale of power, plug standard IS 1293) NOT researched.

## Gaps worth following up
1. Real M2M SIM quotes (Airtel IoT, Jio, Vi, or MVNOs like Tata Communications / Aeris / Eseye).
2. Primary info on Battery Smart / Sun Mobility / Selex / Xanh SM / Gesits swap auth.
3. ESP-IDF security docs and a reviewed crypto design (ESP32 secure boot, flash encryption, eFuse key storage).
4. BIS / legal position on resale of electricity per-kWh and metering certification.
