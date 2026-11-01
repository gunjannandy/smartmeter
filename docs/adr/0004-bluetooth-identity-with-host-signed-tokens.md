# Drivers are identified by Bluetooth and Host-signed tokens; the QR only names the Socket

Each Box is claimed by a Host at setup, and the Host's app holds the signing key. A Driver enrolls once while online, then starts Sessions with a signed token that the Box checks locally, so it works offline. The QR on each Socket only says which Socket it is. We rejected NFC phones as the base path because many low-end Android phones lack NFC, and RFID cards are a possible later add-on.
