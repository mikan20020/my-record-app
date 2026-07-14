/**
 * HTMLとして解釈されないように文字を変換します。
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");

  return div.innerHTML;
}

/**
 * 一意のIDを作ります。
 */
function createRecordId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

/**
 * 日付をYYYY-MM-DD形式にします。
 */
function formatLocalDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * 日時から端末上の日付を取得します。
 */
function getLocalDateKeyFromDateTime(dateTimeText) {
  if (!dateTimeText) {
    return null;
  }

  const date = new Date(dateTimeText);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatLocalDateKey(date);
}

/**
 * 保存済みの日時をdatetime-local入力欄用に変換します。
 */
function formatDateTimeLocalValue(dateTimeText) {
  if (!dateTimeText) {
    return "";
  }

  const date = new Date(dateTimeText);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Local Storageから配列を安全に読み込みます。
 */
function loadArrayFromStorage(storageKey) {
  const savedData = localStorage.getItem(storageKey);

  if (savedData === null) {
    return [];
  }

  try {
    const parsedData = JSON.parse(savedData);

    return Array.isArray(parsedData)
      ? parsedData
      : [];
  } catch (error) {
    console.error(
      `${storageKey}の読み込みに失敗しました。`,
      error
    );

    return [];
  }
}

/**
 * 配列をLocal Storageへ保存します。
 */
function saveArrayToStorage(storageKey, data) {
  localStorage.setItem(
    storageKey,
    JSON.stringify(data)
  );

  if (!window.firebaseSync?.isApplyingRemote) {
    window.firebaseSync?.queueUpload();
  }
}