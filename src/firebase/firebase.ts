import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import { getFunctions, Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDWM2qqcRFELPlB0C1FrU2LTH_6KuDIL-g",
  authDomain: "muhu-voice-chat.firebaseapp.com",
  databaseURL: "https://muhu-voice-chat-default-rtdb.firebaseio.com",
  projectId: "muhu-voice-chat",
  storageBucket: "muhu-voice-chat.appspot.com",
  messagingSenderId: "713530134058",
  appId: "1:713530134058:web:7c3ad382a98e643be57d53",
 
};
// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // Use the already initialized app if available
}

// Export initialized services
export const auth: Auth = getAuth(app);
export const db: Database = getDatabase(app);
export const functions: Functions = getFunctions(app);
export { app };