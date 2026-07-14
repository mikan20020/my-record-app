/* ========================================
   設定・バックアップ
======================================== */

const APP_BACKUP_VERSION = 1;

const dailyDataCount = document.querySelector(
  "#daily-data-count"
);

const sleepDataCount = document.querySelector(
  "#sleep-data-count"
);

const registeredMedicineCount = document.querySelector(
  "#registered-medicine-count"
);

const medicineDataCount = document.querySelector(
  "#medicine-data-count"
);

const caffeineDataCount = document.querySelector(
  "#caffeine-data-count"
);

const outingDataCount = document.querySelector(
  "#outing-data-count"
);

const houseworkDataCount = document.querySelector(
  "#housework-data-count"
);

const exportDataButton = document.querySelector(
  "#export-data-button"
);

const importDataFile = document.querySelector(
  "#import-data-file"
);

const importDataButton = document.querySelector(
  "#import-data-button"
);

const deleteAllDataButton = document.querySelector(
  "#delete-all-data-button"
);

const settingsStatusMessage = document.querySelector(
  "#settings-status-message"
);

/**
 * 設定画面に保存件数を表示します。
 */
function displayDataCounts() {
  dailyDataCount.textContent =
    `${loadRecords().length}件`;

  sleepDataCount.textContent =
    `${loadSleepRecords().length}件`;

  registeredMedicineCount.textContent =
    `${loadRegisteredMedicines().length}件`;

  medicineDataCount.textContent =
    `${loadMedicineRecords().length}件`;

  caffeineDataCount.textContent =
    `${loadCaffeineRecords().length}件`;

  outingDataCount.textContent =
    `${loadOutingRecords().length}件`;

  houseworkDataCount.textContent =
    `${loadHouseworkRecords().length}件`;
}

/**
 * 設定画面にメッセージを表示します。
 */
function showSettingsStatus(message) {
  settingsStatusMessage.textContent = message;

  window.setTimeout(() => {
    if (
      settingsStatusMessage.textContent === message
    ) {
      settingsStatusMessage.textContent = "";
    }
  }, 5000);
}

/**
 * アプリ内の全データを1つにまとめます。
 */
function createBackupData() {
  return {
    appName: "わたしの記録",
    version: APP_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),

    data: {
      dailyRecords: loadRecords(),
      sleepRecords: loadSleepRecords(),
      registeredMedicines:
        loadRegisteredMedicines(),
      medicineRecords: loadMedicineRecords(),
      caffeineRecords: loadCaffeineRecords(),
      caffeinePresets: loadCaffeinePresets(),
      outingRecords: loadOutingRecords(),
      houseworkRecords: loadHouseworkRecords()
    }
  };
}

/**
 * ファイル名に使う日付と時刻を作ります。
 */
function createBackupFileName() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  const hours = String(
    now.getHours()
  ).padStart(2, "0");

  const minutes = String(
    now.getMinutes()
  ).padStart(2, "0");

  return (
    `my-record-backup-` +
    `${year}${month}${day}-` +
    `${hours}${minutes}.json`
  );
}

/**
 * バックアップファイルを書き出します。
 */
function exportBackupData() {
  const backupData = createBackupData();

  const jsonText = JSON.stringify(
    backupData,
    null,
    2
  );

  const fileBlob = new Blob(
    [jsonText],
    {
      type: "application/json"
    }
  );

  const downloadUrl =
    URL.createObjectURL(fileBlob);

  const downloadLink =
    document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download =
    createBackupFileName();

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  URL.revokeObjectURL(downloadUrl);

  showSettingsStatus(
    "バックアップファイルを保存しました。"
  );
}

/**
 * 読み込んだバックアップの形式を確認します。
 */
function validateBackupData(backupData) {
  if (
    typeof backupData !== "object" ||
    backupData === null
  ) {
    return false;
  }

  if (
    typeof backupData.data !== "object" ||
    backupData.data === null
  ) {
    return false;
  }

  const data = backupData.data;

  const requiredArrays = [
    "dailyRecords",
    "sleepRecords",
    "registeredMedicines",
    "medicineRecords",
    "caffeineRecords",
    "outingRecords",
    "houseworkRecords"
  ];

  return requiredArrays.every(
    (key) => Array.isArray(data[key])
  );
}

/**
 * バックアップデータをLocal Storageに保存します。
 */
function restoreBackupData(backupData) {
  const data = backupData.data;

  saveRecords(data.dailyRecords);
  saveSleepRecords(data.sleepRecords);

  saveRegisteredMedicines(
    data.registeredMedicines
  );

  saveMedicineRecords(
    data.medicineRecords
  );

  saveCaffeineRecords(
    data.caffeineRecords
  );

  saveCaffeinePresets(
    Array.isArray(data.caffeinePresets) ? data.caffeinePresets : []
  );

  saveOutingRecords(
    data.outingRecords
  );

  saveHouseworkRecords(
    data.houseworkRecords
  );
}

/**
 * 各画面を最新の状態に更新します。
 */
function refreshAllScreens() {
  displayRecords();
  displaySleepRecords();

  displayRegisteredMedicines();
  displayMedicineRecords();

  displayCaffeinePresets();
  displayCaffeineRecords();
  displayOutingRecords();
  displayHouseworkRecords();

  displayCalendar();
  displayStatistics();
  displayDataCounts();
}

/**
 * バックアップファイルを読み込みます。
 */
async function importBackupData() {
  const selectedFile =
    importDataFile.files[0];

  if (!selectedFile) {
    alert(
      "読み込むバックアップファイルを選択してください。"
    );

    return;
  }

  let fileText;

  try {
    fileText = await selectedFile.text();
  } catch (error) {
    console.error(
      "ファイルの読み込みに失敗しました。",
      error
    );

    alert(
      "ファイルを読み込めませんでした。"
    );

    return;
  }

  let backupData;

  try {
    backupData = JSON.parse(fileText);
  } catch (error) {
    console.error(
      "JSONの解析に失敗しました。",
      error
    );

    alert(
      "正しいJSONファイルではありません。"
    );

    return;
  }

  if (!validateBackupData(backupData)) {
    alert(
      "このアプリのバックアップファイルとして認識できませんでした。"
    );

    return;
  }

  const shouldRestore = confirm(
    "現在のデータを、選択したバックアップの内容に置き換えますか？"
  );

  if (!shouldRestore) {
    return;
  }

  restoreBackupData(backupData);
  refreshAllScreens();

  importDataFile.value = "";

  showSettingsStatus(
    "バックアップからデータを復元しました。"
  );
}

/**
 * このアプリの全データを削除します。
 */
function deleteAllAppData() {
  const firstConfirmation = confirm(
    "このアプリに保存されている全データを削除しますか？"
  );

  if (!firstConfirmation) {
    return;
  }

  const secondConfirmation = confirm(
    "本当に削除しますか？\nこの操作は元に戻せません。"
  );

  if (!secondConfirmation) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SLEEP_STORAGE_KEY);

  localStorage.removeItem(
    MEDICINE_LIST_STORAGE_KEY
  );

  localStorage.removeItem(
    MEDICINE_RECORD_STORAGE_KEY
  );

  localStorage.removeItem(
    CAFFEINE_STORAGE_KEY
  );

  localStorage.removeItem(
    CAFFEINE_PRESET_STORAGE_KEY
  );

  localStorage.removeItem(
    OUTING_STORAGE_KEY
  );

  localStorage.removeItem(
    HOUSEWORK_STORAGE_KEY
  );

  refreshAllScreens();

  showSettingsStatus(
    "すべてのデータを削除しました。"
  );
}

exportDataButton.addEventListener(
  "click",
  exportBackupData
);

importDataButton.addEventListener(
  "click",
  importBackupData
);

deleteAllDataButton.addEventListener(
  "click",
  deleteAllAppData
);

displayDataCounts();