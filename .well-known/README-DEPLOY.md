# Deep-Link Association Files — Deployment Guide

Two association files enable native app deep-linking from `fixorassist.com`:

- `assetlinks.json` — Android App Links (Digital Asset Links)
- `apple-app-site-association` — iOS Universal Links (no file extension!)

## What's already filled in
- **Apple Team ID:** `PMVN634FB6` (pulled from App Store Connect API)
- **Android SHA-256 (customer upload key):** `CA:F5:58:00:BA:21:09:9F:F1:10:B0:39:29:75:F4:37:8D:80:D3:72:D7:E9:98:1D:63:72:BE:BB:5C:BF:4D:48`
- **Android SHA-256 (vendor upload key):** `B1:D6:C7:3A:7D:A6:D4:50:CB:52:B4:FF:93:8D:59:6F:B7:13:BE:83:0E:59:75:7F:5F:D4:F6:AB:BE:E5:F8:D8`
- Both `com.fixor.customer` and `com.fixor.vendor` bundle IDs

## ⚠️ ONE MORE FINGERPRINT NEEDED FOR PLAY-INSTALLED APPS
Google Play uses **Play App Signing** — a real user installing from the Play Store
gets an APK signed with Google's app-signing key (not our upload key).
For App Links verification to succeed on Play-Store-installed devices, we must
also add the **App Signing SHA-256** from Play Console.

**How to get it:**
1. Play Console → **FIXOR** app → **Test and release → Setup → App integrity → App signing**
2. Copy the **"SHA-256 certificate fingerprint"** under "App signing key certificate"
3. Repeat for **FIXOR Partner** vendor app
4. Add each to `assetlinks.json` in the same `sha256_cert_fingerprints` array:
   ```json
   "sha256_cert_fingerprints": [
     "CA:F5:58:...:48",              // upload key (dev sideload)
     "AA:BB:CC:...:XX"               // ← paste App Signing SHA-256 here
   ]
   ```
5. Re-deploy the file.

**Without step 4, App Links from Play-installed customer app won't verify** — the browser will fall back to opening the URL in a browser instead of the app.

## Deploy to production (EC2 nginx)

```bash
cd /Users/akshaykumar/Desktop/fixor-web

# Copy both files to server
ssh -i ~/Downloads/fixor.pem ubuntu@15.207.113.110 'sudo mkdir -p /var/www/fixor-web/.well-known'
scp -i ~/Downloads/fixor.pem \
  .well-known/assetlinks.json \
  .well-known/apple-app-site-association \
  ubuntu@15.207.113.110:/tmp/

ssh -i ~/Downloads/fixor.pem ubuntu@15.207.113.110 'sudo mv /tmp/assetlinks.json /tmp/apple-app-site-association /var/www/fixor-web/.well-known/ && sudo chown www-data:www-data /var/www/fixor-web/.well-known/*'
```

## Nginx MIME + no-cache config (one-time)

Both files must be served with `Content-Type: application/json` **AND** no caching
(Google + Apple crawl these on each verification check).

Edit `/etc/nginx/sites-enabled/fixor-web` (or wherever the fixorassist.com server block lives) and add **inside the `server { }` block, before the fallback location**:

```nginx
location = /.well-known/assetlinks.json {
    default_type application/json;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    try_files $uri =404;
}

location = /.well-known/apple-app-site-association {
    default_type application/json;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    try_files $uri =404;
}
```

Then:
```bash
ssh -i ~/Downloads/fixor.pem ubuntu@15.207.113.110 'sudo nginx -t && sudo systemctl reload nginx'
```

## Verify both files are live and correct

```bash
# assetlinks.json — must return 200 + Content-Type: application/json
curl -I https://fixorassist.com/.well-known/assetlinks.json
curl -s https://fixorassist.com/.well-known/assetlinks.json | python3 -m json.tool

# apple-app-site-association — must be application/json, NO redirect
curl -I https://fixorassist.com/.well-known/apple-app-site-association
curl -s https://fixorassist.com/.well-known/apple-app-site-association | python3 -m json.tool
```

Both should show `HTTP/2 200` and `content-type: application/json`.

## Android App Links — validate via Google's tool

```bash
# Google's Statement List Generator + Tester
open "https://developers.google.com/digital-asset-links/tools/generator?package_name=com.fixor.customer"
```
Or in a browser: enter `com.fixor.customer` + `https://fixorassist.com/` + the SHA-256 → click "Test statement".

## iOS Universal Links — validate

Apple crawls the file within ~24 hours of first install. After the customer iOS app is submitted with the new `applinks:fixorassist.com` entitlement (build 3+):

1. Install the app on an iPhone (via TestFlight or App Store)
2. Open **Notes** app, type: `https://fixorassist.com/?ref=TEST123`
3. **Long-press** the link → menu should show **"Open in FIXOR"**

If iOS opens Safari instead, Apple hasn't verified the file yet — force by:
- Delete + reinstall the app
- Or check console logs via `Console.app` on Mac while connected — look for `swcd` (Shared Web Credentials daemon) errors

## Test the app-side flow (once files are live)

Android — simulate an install-referrer via ADB:
```bash
adb shell am broadcast \
  -a com.android.vending.INSTALL_REFERRER \
  -n com.fixor.customer/com.google.android.finsky.receivers.CampaignTrackingReceiver \
  --es "referrer" "ref=AMIT42"
```

Or from a browser on the same phone, click `https://fixorassist.com/?ref=AMIT42` — should open the app (once verified).

iOS — from Notes/Messages, long-press `https://fixorassist.com/?ref=AMIT42`.

Both will land in the customer app with the code pre-filled on the Register screen (from AsyncStorage).

## SHA-256 lookup for the record

- **Customer upload key** (Aug 2054 validity) at `~/Downloads/FIXOR-KEYSTORES-KEEP-SAFE/customer-upload-keystore.jks`, alias `fixor-upload`, password `Fixor@2026Upload`
- **Vendor upload key** at `~/Downloads/FIXOR-KEYSTORES-KEEP-SAFE/vendor-upload-keystore.jks`, alias `fixor-vendor-upload`, password `Fixor@2026Vendor`

To re-derive at any time:
```bash
keytool -list -v -keystore <path>.jks -alias <alias> -storepass <password> | grep SHA256
```
