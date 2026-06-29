import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC8yX9vw0uUVoM6TOs_POrraxI1zn7Eb6s",
  authDomain: "mappit-app1.firebaseapp.com",
  projectId: "mappit-app1",
  // ✅ CORREGIDO: formato correcto del storageBucket para Web SDK
  storageBucket: "mappit-app1.appspot.com",
  messagingSenderId: "83270541621",
  appId: "1:83270541621:web:2f8efdeb90913c84a7fe5c",
  measurementId: "G-BPWZFMFCWD"
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);

let messaging = null;
try { messaging = getMessaging(app); } catch (_) {}
export { messaging };

export default app;