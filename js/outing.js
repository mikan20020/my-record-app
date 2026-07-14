const OUTING_STORAGE_KEY = "myOutingRecords";

const currentOutingPurpose = document.querySelector("#current-outing-purpose");
const currentOutingOtherLabel = document.querySelector("#current-outing-other-label");
const currentOutingOther = document.querySelector("#current-outing-other");
const outingStartButton = document.querySelector("#outing-start-button");
const outingReturnButton = document.querySelector("#outing-return-button");
const outingStatusMessage = document.querySelector("#outing-status-message");
const manualOutingForm = document.querySelector("#manual-outing-form");
const manualOutingPurpose = document.querySelector("#manual-outing-purpose");
const manualOutingOtherLabel = document.querySelector("#manual-outing-other-label");
const manualOutingOther = document.querySelector("#manual-outing-other");
const manualOutingStart = document.querySelector("#manual-outing-start");
const manualOutingReturn = document.querySelector("#manual-outing-return");
const manualOutingNote = document.querySelector("#manual-outing-note");
const editingOutingIdInput = document.querySelector("#editing-outing-id");
const manualOutingSaveButton = document.querySelector("#manual-outing-save-button");
const cancelOutingEditButton = document.querySelector("#cancel-outing-edit-button");
const outingEditingMessage = document.querySelector("#outing-editing-message");
const outingRecordList = document.querySelector("#outing-record-list");

function loadOutingRecords() {
  return loadArrayFromStorage(OUTING_STORAGE_KEY);
}

function saveOutingRecords(records) {
  saveArrayToStorage(OUTING_STORAGE_KEY, records);
}

function updateOutingOtherInput(selectElement, labelElement, inputElement) {
  const show = selectElement.value === "その他";
  labelElement.style.display = show ? "block" : "none";
  if (!show) inputElement.value = "";
}

function getOutingPurpose(selectElement, otherInputElement) {
  return selectElement.value === "その他"
    ? otherInputElement.value.trim()
    : selectElement.value;
}

function findOpenOutingRecord(records) {
  return [...records].reverse().find((record) => !record.returnTime);
}

function formatOutingDateTime(dateTimeText) {
  if (!dateTimeText) return "未記録";
  const date = new Date(dateTimeText);
  if (Number.isNaN(date.getTime())) return "日時が不正です";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "numeric", day: "numeric", weekday: "short",
    hour: "2-digit", minute: "2-digit"
  }).format(date);
}

function formatOutingDuration(startTime, returnTime) {
  if (!startTime || !returnTime) return "帰宅時刻を記録すると計算されます";
  const difference = new Date(returnTime).getTime() - new Date(startTime).getTime();
  if (difference < 0) return "日時が不正です";
  const totalMinutes = Math.floor(difference / 60000);
  return `${Math.floor(totalMinutes / 60)}時間${totalMinutes % 60}分`;
}

function showOutingStatus(message) {
  outingStatusMessage.textContent = message;
  window.setTimeout(() => {
    if (outingStatusMessage.textContent === message) outingStatusMessage.textContent = "";
  }, 4000);
}

function setCurrentOutingDateTime() {
  manualOutingStart.value = formatDateTimeLocalValue(new Date().toISOString());
}

function displayOutingRecords() {
  const records = loadOutingRecords().sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  if (records.length === 0) {
    outingRecordList.innerHTML = '<p class="empty-message">まだ外出記録はありません。</p>';
    return;
  }

  outingRecordList.innerHTML = records.map((record) => `
    <article class="outing-record-card ${record.returnTime ? "" : "open-outing-record"}">
      <div class="outing-record-header">
        <h3>${escapeHtml(record.purpose)}</h3>
        <div class="record-action-buttons">
          <button type="button" class="edit-button outing-edit-button" data-outing-id="${record.id}">編集</button>
          <button type="button" class="delete-button outing-delete-button" data-outing-id="${record.id}">削除</button>
        </div>
      </div>
      <div class="outing-record-times">
        <div class="outing-time-box">
          <span class="outing-time-label">外出</span>
          <span class="outing-time-value">${formatOutingDateTime(record.startTime)}</span>
        </div>
        <div class="outing-time-box">
          <span class="outing-time-label">帰宅</span>
          <span class="outing-time-value">${formatOutingDateTime(record.returnTime)}</span>
        </div>
      </div>
      <p class="outing-duration">外出時間：${formatOutingDuration(record.startTime, record.returnTime)}</p>
      <p class="record-note"><strong>メモ：</strong>${escapeHtml(record.note || "なし")}</p>
    </article>
  `).join("");
}

function startOutingEditing(recordId) {
  const record = loadOutingRecords().find((item) => item.id === recordId);
  if (!record) {
    alert("編集する外出記録が見つかりません。");
    return;
  }

  editingOutingIdInput.value = record.id;
  const standardPurposes = ["勉強", "大学", "アルバイト", "買い物"];
  manualOutingPurpose.value = standardPurposes.includes(record.purpose)
    ? record.purpose
    : "その他";
  updateOutingOtherInput(manualOutingPurpose, manualOutingOtherLabel, manualOutingOther);
  if (manualOutingPurpose.value === "その他") manualOutingOther.value = record.purpose;
  manualOutingStart.value = formatDateTimeLocalValue(record.startTime);
  manualOutingReturn.value = formatDateTimeLocalValue(record.returnTime);
  manualOutingNote.value = record.note || "";
  manualOutingSaveButton.textContent = "変更を保存";
  cancelOutingEditButton.classList.remove("hidden-button");
  outingEditingMessage.classList.remove("hidden-button");
  manualOutingForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelOutingEditing() {
  editingOutingIdInput.value = "";
  manualOutingForm.reset();
  manualOutingSaveButton.textContent = "外出記録を保存";
  cancelOutingEditButton.classList.add("hidden-button");
  outingEditingMessage.classList.add("hidden-button");
  updateOutingOtherInput(manualOutingPurpose, manualOutingOtherLabel, manualOutingOther);
}

currentOutingPurpose.addEventListener("change", () => {
  updateOutingOtherInput(currentOutingPurpose, currentOutingOtherLabel, currentOutingOther);
});
manualOutingPurpose.addEventListener("change", () => {
  updateOutingOtherInput(manualOutingPurpose, manualOutingOtherLabel, manualOutingOther);
});

outingStartButton.addEventListener("click", () => {
  const purpose = getOutingPurpose(currentOutingPurpose, currentOutingOther);
  if (!purpose) {
    alert("外出目的を選択してください。");
    return;
  }
  const records = loadOutingRecords();
  if (findOpenOutingRecord(records)) {
    alert("すでに帰宅時刻が未記録の外出があります。");
    return;
  }
  records.push({
    id: createRecordId(), purpose,
    startTime: new Date().toISOString(), returnTime: null, note: ""
  });
  saveOutingRecords(records);
  currentOutingPurpose.value = "";
  updateOutingOtherInput(currentOutingPurpose, currentOutingOtherLabel, currentOutingOther);
  refreshAllScreens();
  showOutingStatus("外出時刻を記録しました。");
});

outingReturnButton.addEventListener("click", () => {
  const records = loadOutingRecords();
  const openRecord = findOpenOutingRecord(records);
  if (!openRecord) {
    alert("帰宅時刻を追加できる外出記録がありません。");
    return;
  }
  openRecord.returnTime = new Date().toISOString();
  saveOutingRecords(records);
  refreshAllScreens();
  showOutingStatus("帰宅時刻を記録しました。");
});

manualOutingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const purpose = getOutingPurpose(manualOutingPurpose, manualOutingOther);
  if (!purpose || !manualOutingStart.value) {
    alert("外出目的と外出日時を入力してください。");
    return;
  }

  const startDate = new Date(manualOutingStart.value);
  const returnDate = manualOutingReturn.value ? new Date(manualOutingReturn.value) : null;
  if (returnDate && returnDate <= startDate) {
    alert("帰宅日時は外出日時より後にしてください。");
    return;
  }

  const records = loadOutingRecords();
  const editingId = editingOutingIdInput.value;
  const wasEditing = Boolean(editingId);

  if (editingId) {
    const record = records.find((item) => item.id === editingId);
    if (!record) return;
    record.purpose = purpose;
    record.startTime = startDate.toISOString();
    record.returnTime = returnDate ? returnDate.toISOString() : null;
    record.note = manualOutingNote.value.trim();
  } else {
    records.push({
      id: createRecordId(), purpose,
      startTime: startDate.toISOString(),
      returnTime: returnDate ? returnDate.toISOString() : null,
      note: manualOutingNote.value.trim()
    });
  }

  saveOutingRecords(records);
  cancelOutingEditing();
  setCurrentOutingDateTime();
  refreshAllScreens();
  showOutingStatus(wasEditing ? "外出記録を変更しました。" : "外出記録を保存しました。");
});

cancelOutingEditButton.addEventListener("click", () => {
  cancelOutingEditing();
  setCurrentOutingDateTime();
});

outingRecordList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".outing-edit-button");
  if (editButton) {
    startOutingEditing(editButton.dataset.outingId);
    return;
  }

  const deleteButton = event.target.closest(".outing-delete-button");
  if (!deleteButton || !confirm("この外出記録を削除しますか？")) return;

  saveOutingRecords(loadOutingRecords().filter(
    (record) => record.id !== deleteButton.dataset.outingId
  ));
  refreshAllScreens();
});

setCurrentOutingDateTime();
displayOutingRecords();
