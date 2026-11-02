import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const env = import.meta.env;
// No real config (or VITE_USE_EMULATORS=true) → run fully locally against the emulators with a demo project.
export const DEMO_PROJECT = 'demo-cost-tracker';
export const useEmulators = env.VITE_USE_EMULATORS === 'true' || !env.VITE_FIREBASE_API_KEY;

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${DEMO_PROJECT}.firebaseapp.com`,
  projectId: env.VITE_FIREBASE_API_KEY ? env.VITE_FIREBASE_PROJECT_ID : DEMO_PROJECT,
  appId: env.VITE_FIREBASE_APP_ID || 'demo-app',
});

export const auth = getAuth(app);
// Offline cache: works without signal, syncs when back online.
export const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

if (useEmulators) {
  connectAuthEmulator(auth, `http://${location.hostname}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, location.hostname, 8080);
}

const provider = new GoogleAuthProvider();
export async function signIn() {
  try { await signInWithPopup(auth, provider); }
  catch (e) { if (e.code === 'auth/popup-blocked') await signInWithRedirect(auth, provider); else throw e; }
}
export const logOut = () => signOut(auth);
