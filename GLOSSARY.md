# smartmeter

A junction box with several metered AC sockets, plus apps for the people who own it and the people who charge from it.

## Language

**Box**:
The junction box: a controller and a set of Sockets, installed by a Host.
_Avoid_: Meter, charger, device, unit

**Socket**:
One metered, relay-switched AC plug point on a Box.
_Avoid_: Plug point, port, outlet

**Host**:
The person or group that owns and operates a Box and sells electricity to Drivers.
_Avoid_: Admin, owner, landlord, operator

**Driver**:
A person who charges a vehicle from a Host's Socket.
_Avoid_: Consumer, customer, user

**Session**:
One period of charging by one Driver on one Socket, from start to stop.
_Avoid_: Charge, transaction

**Unit**:
One kilowatt-hour, the way hosts and drivers say it.
_Avoid_: kWh in user-facing text

**Rate**:
The price per Unit that a Host sets.
_Avoid_: Tariff, price

**Ledger**:
The append-only record of Sessions, top-ups and adjustments. Balances are calculated from it, never overwritten.
_Avoid_: Database, wallet

**Balance**:
What a Driver is owed or owes one Host, calculated from that Host's Ledger. It is never shared across Hosts.
_Avoid_: Wallet, credit

**Top-up**:
A Ledger entry recording that a Driver paid a Host money outside the system.
_Avoid_: Recharge, deposit

**Prepaid / Postpaid**:
Whether a Driver must have Balance before charging (Prepaid) or may charge now and settle later (Postpaid). Set by the Host per Driver.

**Preset**:
A named bundle of Host settings for a common situation. A Custom Preset exposes every setting.

**Enrollment**:
A Driver's one-time approval by a Host, after which that Driver can start Sessions on that Host's Boxes.

**Sync**:
Copying Ledger entries between a Box, the Host's phone and the cloud so they agree.
