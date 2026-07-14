import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const STORAGE_KEYS = {
  dailyRecords: "myDailyRecords",
  sleepRecords: "mySleepRecords",
  registeredMedicines: "myRegisteredMedicines",
  medicineRecords: "myMedicineRecords",
  caffeineRecords: "myCaffeineRecords",
  caffeinePresets: "myCaffeinePresets",
  outingRecords: "myOutingRecords",
  houseworkRecords: "myHouseworkRecords"
};

const config = window.FIREBASE_CONFIG || {};
const configReady = Boolean(
  config.apiKey &&
  config.projectId &&
  !String(config.apiKey).includes("ここに")
);

const statusElement = document.querySelector("#firebase-sync-status");
const userElement = document.querySelector("#firebase-user-name");
const signInButton = document.querySelector("#firebase-sign-in-button");
const signOutButton = document.querySelector("#firebase-sign-out-button");
const uploadButton = document.querySelector("#firebase-upload-button");

let auth = null;
let db = null;
let currentUser = null;
let unsubscribeSnapshot = null;
let uploadTimer = null;
let applyingRemote = false;

function setStatus(message, isError = false) {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.classList.toggle("sync-error", isError);
}

function readLocalArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function collectLocalData() {
  const data = {};
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    data[name] = readLocalArray(key);
  });
  return data;
}

function hasAnyLocalData(data) {
  return Object.values(data).some((value) => Array.isArray(value) && value.length > 0);
}

function applyRemoteData(data) {
  applyingRemote = true;
  try {
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const value = Array.isArray(data?.[name]) ? data[name] : [];
      localStorage.setItem(key, JSON.stringify(value));
    });
  } finally {
    applyingRemote = false;
  }

  if (typeof window.refreshAllScreens === "function") {
    window.refreshAllScreens();
  }
}

function getUserDocReference() {
  if (!db || !currentUser) return null;
  return doc(db, "users", currentUser.uid, "appData", "main");
}

async function uploadLocalData() {
  const reference = getUserDocReference();
  if (!reference) {
    setStatus("Googleログイン後に同期できます。");
    return;
  }

  setStatus("クラウドへ保存中…");
  await setDoc(reference, {
    data: collectLocalData(),
    updatedAt: serverTimestamp(),
    schemaVersion: 1
  }, { merge: true });
  setStatus("同期済み");
}

function queueUpload() {
  if (applyingRemote || !currentUser) return;
  window.clearTimeout(uploadTimer);
  uploadTimer = window.setTimeout(() => {
    uploadLocalData().catch((error) => {
      console.error(error);
      setStatus("同期に失敗しました。通信状態を確認してください。", true);
    });
  }, 500);
}

function stopRealtimeSync() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
}

async function startRealtimeSync(user) {
  stopRealtimeSync();
  const reference = getUserDocReference();
  if (!reference) return;

  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) {
    const localData = collectLocalData();
    await setDoc(reference, {
      data: localData,
      updatedAt: serverTimestamp(),
      schemaVersion: 1
    });
    setStatus(hasAnyLocalData(localData) ? "端末の記録をクラウドへ保存しました。" : "同期を開始しました。");
  } else {
    applyRemoteData(snapshot.data()?.data || {});
    setStatus("クラウドの記録を読み込みました。");
  }

  unsubscribeSnapshot = onSnapshot(reference, (nextSnapshot) => {
    if (!nextSnapshot.exists()) return;
    applyRemoteData(nextSnapshot.data()?.data || {});
    setStatus("同期済み");
  }, (error) => {
    console.error(error);
    setStatus("リアルタイム同期に失敗しました。", true);
  });
}

async function signIn() {
  if (!auth) return;
  const provider = new GoogleAuthProvider();
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  setStatus("Googleログインを開いています…");
  if (standalone || mobile) {
    await signInWithRedirect(auth, provider);
  } else {
    await signInWithPopup(auth, provider);
  }
}

async function initializeFirebase() {
  if (!configReady) {
    setStatus("firebase-config.jsにFirebase設定値を入力してください。", true);
    signInButton?.setAttribute("disabled", "disabled");
    return;
  }

  const app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);

  try {
    await enableIndexedDbPersistence(db);
  } catch (error) {
    console.info("Firestoreのオフライン保存は既に有効、または利用できません。", error.code);
  }

  await setPersistence(auth, browserLocalPersistence);
  await getRedirectResult(auth).catch((error) => {
    console.error(error);
    setStatus("Googleログインに失敗しました。", true);
  });

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      if (userElement) userElement.textContent = user.displayName || user.email || "ログイン中";
      signInButton?.classList.add("hidden-button");
      signOutButton?.classList.remove("hidden-button");
      uploadButton?.classList.remove("hidden-button");
      try {
        await startRealtimeSync(user);
      } catch (error) {
        console.error(error);
        setStatus("同期の開始に失敗しました。Firestoreのルールを確認してください。", true);
      }
    } else {
      stopRealtimeSync();
      if (userElement) userElement.textContent = "未ログイン";
      signInButton?.classList.remove("hidden-button");
      signOutButton?.classList.add("hidden-button");
      uploadButton?.classList.add("hidden-button");
      setStatus("Googleログインすると端末間で自動同期します。");
    }
  });
}

signInButton?.addEventListener("click", () => {
  signIn().catch((error) => {
    console.error(error);
    setStatus("Googleログインに失敗しました。", true);
  });
});

signOutButton?.addEventListener("click", () => {
  if (auth) signOut(auth);
});

uploadButton?.addEventListener("click", () => {
  uploadLocalData().catch((error) => {
    console.error(error);
    setStatus("アップロードに失敗しました。", true);
  });
});

window.firebaseSync = {
  queueUpload,
  uploadNow: uploadLocalData,
  get isApplyingRemote() {
    return applyingRemote;
  }
};

initializeFirebase();
