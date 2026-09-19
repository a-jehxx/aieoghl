import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** .env에 Firebase 설정값이 채워져 있는지. 비어 있으면 repository/index.ts가 메모리 구현으로 대신 동작한다. */
export function hasFirebaseConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId && firebaseConfig.appId,
  );
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Database | null = null;
let authReadyPromise: Promise<string> | null = null;

function ensureInit() {
  if (firebaseApp) return;
  firebaseApp = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
  firebaseDb = getDatabase(firebaseApp);

  authReadyPromise = new Promise<string>((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth!, (user) => {
      if (user) {
        unsubscribe();
        resolve(user.uid);
      }
    });
  });

  signInAnonymously(firebaseAuth).catch((err) => {
    console.error('익명 로그인에 실패했어요', err);
  });
}

/** 앱 시작 시 익명 로그인이 끝나면 uid로 resolve되는 프로미스. */
export function getAuthReady(): Promise<string> {
  ensureInit();
  return authReadyPromise!;
}

export function getFirebaseDb(): Database {
  ensureInit();
  return firebaseDb!;
}

export function getFirebaseAuth(): Auth {
  ensureInit();
  return firebaseAuth!;
}
