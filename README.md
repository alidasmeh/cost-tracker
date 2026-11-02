# Cost Tracker (Firebase, no backend)

One deployable thing: a React + Material UI app on **Firebase Hosting** that talks directly to
**Cloud Firestore**, with **Google sign-in**. `firestore.rules` acts as the backend: anyone can
sign in, each user can touch only the wallets they belong to, and every write is validated.
Works on the free **Spark** plan. Offline entries sync when you're back online.

```
client/          React app (data layer: client/src/api.js)
firestore.rules  security rules (who can read and write which wallet)
tools/           Excel importer (runs on your computer with admin rights, not deployed)
```

## Run locally (no Firebase project needed)
Needs Java (for the emulators). In the `app` folder:
```bash
npm install -g firebase-tools
npm run install:all
npm run emulators        # terminal 1, keep open
npm run dev              # terminal 2 → http://localhost:5173
```
Sign in → in the emulator popup "Add new account" with **alidasmeh@gmail.com**. Then load the Excel (it goes into your Home wallet):
```bash
npm run import:local -- "../../Costs - 2026.xlsx" alidasmeh@gmail.com
```
Emulator data is wiped when you stop the emulators.

## Deploy
1. https://console.firebase.google.com → create project (Spark/free plan is fine).
2. **Build → Firestore Database → Create**, **Build → Authentication → Google → Enable**.
3. **Project settings → Your apps → Add web app**; copy the config into `client/.env.local`
   (template: `client/.env.example`). Put the project ID in `.firebaserc`.
4. `firebase login`, then `npm run deploy`.
5. Open `https://<project-id>.web.app` on your phone, sign in, "Add to Home Screen".

## Import the Excel into production
Sign in on the deployed app once, then: Project settings → Service accounts → **Generate new private key**
→ save as `tools/service-account.json` (never share or commit it).
```bash
cd tools
GOOGLE_APPLICATION_CREDENTIALS=service-account.json npm run import -- "../../Costs - 2026.xlsx" alidasmeh@gmail.com
```
Re-running replaces that year only.

## Wallets
Every person gets a **Home** wallet on first sign-in; existing data is copied into it automatically
(the old copy under `users/{uid}` is left untouched and read-only). More wallets (Job, …) are created on
the **Account** tab. Each wallet has a unique 6-character code and its own expenses, categories and
monthly setup. Share the code and the other person can **Join with code**. Anyone with a Google account can sign in;
they only see wallets they created or joined. Switch wallets from the picker in the top bar.

## Concepts (from the Excel)
- **Monthly total** = expenses + subscriptions & insurance (set per month via the ⚙ icon, with income, prediction, daily budget).
- **Ahead of budget** = daily budget × last day with an entry − non-necessity spending.
