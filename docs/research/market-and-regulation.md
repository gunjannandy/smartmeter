# Market and regulation research: multi-socket AC LEV charging box (India)
Date: 2026-11-01. Evidence is from web-search summaries and a few page fetches. Primary-source PDFs (MoP guidelines, BIS standards, Gazette) were NOT opened directly. Items marked UNVERIFIED need checking.

## 1. Existing products and startups

India (closest analogues)
- Bolt.Earth LEVAC: 3.3 kW (230 V, 15 A) smart socket for commercial/public use, with a 4G variant. https://bolt.earth/ev-charging-products/smart-sockets-for-all-evs/levac and https://shop.bolt.earth/products/levac
- Kazam LEV AC 3.3 kW: listed on Moglix at about Rs 14,000 + GST, BLE/GSM, IP54. https://www.moglix.com/kazam-lev-ac-33kw-240v-1-phase-vehicle-charging-station/mp/msnrkrexo7g89n
- Chargeo EV Tech: 3.3 kW AC connector at about Rs 14,000. https://m.indiamart.com/chargeoevtech/charging-connector.html
- Servotech (spark AC series): https://servotech.in/spark-series-ac-charger
- Exicom LEVAC 3.3 kW appears in the Tata Power-DDL empanelment lists, with a Rs 220/month subscription line. https://www.tatapower-ddl.com/switchdelhi/files/EV%20Charger%20Opex%20Model%20Final%20List.pdf
- EROEV India: QR booking and activation at the station. https://yourstory.com/companies/eroev-india
- Batt:RE: peer-to-peer charging network, QR scan on arrival. https://www.webbikeworld.com/battre-has-a-new-peer-to-peer-charging-network-in-india/
- ChargeJet (Jaipur): app-less QR + UPI charging. https://autotechinsight.spglobal.com/news/5289275/chargejet-launches-qr-code-ev-charging-feature-across-india
- Statiq: per-kWh prepaid wallet.
- Swap models (Battery Smart, Oye Rickshaw): asset-light, partner stations do the charging. https://yourstory.com/2021/03/delhi-startup-batterysmart-solving-charging-problems-e-rickshaws/amp
- Takeaway: single-socket LEV AC units cost roughly Rs 8,000-14,000 (marketplace listings). A multi-socket box is not found as a product category (UNVERIFIED; no multi-port LEV AC product surfaced). That may be a gap or a sign the demand is thin.
- Public AC slow-charging rates of Rs 8-15/kWh come from one aggregator FAQ. https://www.mymotor.in/ev-charging-stations (weak source)

Abroad and generic parts: NOT researched successfully. The search returned nothing on Shelly/Tuya/Yulu/Zypp or abroad. Do not rely on the following: the BOM guess is from background knowledge only. A relay plus a single-phase energy IC (e.g. an ESP32 board with a Shelly-type meter) is likely Rs 1,000-2,500 per socket. UNVERIFIED.

## 2. Regulation

Resale of electricity
- MoP clarified in 2018 that EV charging is a service, not a sale of electricity under the Electricity Act 2003, and needs no licence. https://powerline.net.in/2018/04/09/mop-clarifies-no-license-required-ev-charging-stations/ and https://mercomindia.com/ministry-of-power-no-license-ev-charge-station
- Later guidelines (2019, 2022, 2024) keep charging de-licensed ("anyone can set up and operate"). https://powerline.net.in/2024/09/27/ministry-of-power-releases-guidelines-for-installation-and-operation-of-electric-vehicle-charging-infrastructure-2024/ and https://evreporter.com/amendments-in-ev-charging-guidelines/
- 2024 guidelines: single-part tariff, solar-hours discount (9am-4pm), service charges capped by charger type. Also: connection timelines of 3-90 days; they are not mandatory for private players. I could not see the exact text on service charges for private/low-power chargers.
- Caveats (UNVERIFIED):
  - The "service not sale" reading rests on a 2018 MoP letter and CEA consultation, not on a statutory amendment.
  - State rules vary. Whether the host's charging fee must follow the state ceiling or EV tariff is a state commission question.
  - Whether the host's connection must be a specific tariff category is also a state question; I did not find a source confirming a commercial rate for domestic connections.
- Theft risk: using a connection for e-rickshaw charging outside its sanctioned category or load can trigger Section 126 (unauthorised use, civil) and Section 135 (theft, criminal). Delhi discoms say illegal e-rickshaw charging costs about Rs 150 cr/year (2019 figure). https://www.tatapower-ddl.com/pr-details/199/1193286/tata-power-ddl%E2%80%99s-consumer-sentenced-to-six-months-imprisonment--by-special-electricity-court-for-illegal-e-rickshaw-charging and https://www.business-standard.com/article/pti-stories/delhi-discoms-losing-rs-150-crore-annually-to-power-theft-for-charging-e-rickshaws-119012700323_1.html
- The hosts' main legal risk is therefore the discom connection category and sanctioned load, not the resale itself. Delhi sets Rs 5.50/unit for e-rickshaw charging (older figure; UNVERIFIED currency). In many states there is a dedicated EV category tariff. Check each target state.

Metering accuracy and Legal Metrology
- Searched for an India Legal Metrology rule on EV charger meters. None found. Draft/2025 notices concern test-centre rules for other instruments. https://consumeraffairs.nic.in/sites/default/files/file-uploads/latestnews/Draft%20GATC%20Rules.pdf
- Abroad: OIML began drafting an EVSE recommendation in 2025; Australia requires accurate kWh (https://www.industry.gov.au/national-measurement-institute/trade-and-industry/instruments-industry/electric-vehicle-supply-equipment); Switzerland METAS LegalEVcharge (https://www.metas.admin.ch/en/legalevcharge).
- I did not verify any CEA requirement for sub-meters (CEA Installation and Operation of Meters regulations apply to utility/consumer meters; whether sub-meters inside a host's premises are covered is UNVERIFIED). Practical approach: use an IS 16444 / IS 13779-class (Class 1.0) meter and keep calibration records. IS numbers are from background knowledge, UNVERIFIED.

Standards and safety
- IS 17017 is the BIS EV conductive-charging series. Part 22/Sec 1:2021 covers AC charge points for light EVs. https://services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/Indian_standards/isdetails/MjYxMTA=
- AC001 (3.3 kW, 15 A, 230 V) is the Bharat LEV AC standard. https://en.wikipedia.org/wiki/Plug-in_electric_vehicles_in_India and https://bolt.earth/blog/ev-charging-connectors-in-india
- IS 17017 Part 2/Sec 7:2023 is the LECCS combined AC+DC connector. https://ceew.in/cef/quick-reads/insights/bis-approves-india-s-first-ac-and-dc-combined-charging-connector
- Compliance and certification: https://bolt.earth/blog/ev-charger-certifications-in-india-ultimate-guide-to-3-major-types-uses-and-how-to-get-them and https://en.emobility.academy/blog/ac-charger-certification-in-the-indian-market
- Tata Power-DDL tender allows only AC001, LEV AC and DC001 charger types. https://tatapower-ddl.com/switchdelhi/specifications%20of%20EV%20chargers.pdf
- NOT verified: whether a BIS CRS mark is mandatory for an AC001/LEV AC charger now; whether a plain 15 A socket with relay counts as EVSE; IS 60884 for sockets. Many existing e-rickshaws use a plain 15 A/16 A plug or proprietary connectors, not AC001.

## 3. Failure modes (mostly generic EV charging evidence)
- Reliability: IEEFA and others report high rates of non-working public chargers (a Delhi figure of about 84% non-functional is cited; sources vary, treat as indicative). https://ieefa.org/resources/upgrading-indias-public-ev-charging-experience and https://bolt.earth/blog/indias-ev-charger-gap-only-71-public-ev-charging-stations-are-operational
- Typical causes: hardware/connector faults, network connectivity and authentication failures, payment failures, poor installation and maintenance, power supply problems, vandalism, rural power cuts. https://www.etvbharat.com/en/technology/operational-challenges-accompany-increase-in-electric-vehicle-charging-stations-enn25110502557 and https://www.autocarpro.in/news/thin-margins-leave-indias-highway-ev-chargers-unguarded-135513
- Reported uptime overstates actual uptime. https://electrek.co/2024/08/05/ev-charger-reported-uptime-vs-actual-uptime/
- Not sourced (background reasoning; UNVERIFIED): vehicle-side and charger incompatibility (non-standard e-rickshaw chargers/lead-acid packs), host wiring overload and tripping with many sockets on a 230 V single-phase connection, relay welding, meter drift, power cuts leaving sessions in unknown state, UPI/payment disputes, bypassing of the box by drivers, theft/hooking, electrocution risk (an e-rickshaw driver electrocuted via a live cable is reported by discoms), and fire risk from cheap chargers.
- Note that e-rickshaws usually carry their own onboard or detachable AC-DC charger and lead-acid or Li-ion packs, so the box mostly acts as a metered, switched AC outlet. It does not control charging.

## Gaps
No data found on: abroad analogues, Yulu-style charge zones, multi-socket price points, state-wise EV tariffs, CEA/legal metrology applicability to sub-meters, BIS CRS status. All need follow-up.
