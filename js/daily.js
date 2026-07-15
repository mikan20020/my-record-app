const form = document.querySelector("#daily-record-form");
const dateInput = document.querySelector("#record-date");
const timeInput = document.querySelector("#record-time");
const currentTimeButton = document.querySelector("#set-current-time");
const moodInput = document.querySelector("#mood");
const sleepinessInput = document.querySelector("#sleepiness");
const motivationInput = document.querySelector("#motivation");
const otherConditionInput = document.querySelector("#other-condition");
const dailyNoteInput = document.querySelector("#daily-note");
const recordList = document.querySelector("#record-list");
const editingDailyRecordIdInput = document.querySelector("#editing-daily-record-id");
const dailyEditingMessage = document.querySelector("#daily-editing-message");
const dailySaveButton = document.querySelector("#daily-save-button");
const cancelDailyEditButton = document.querySelector("#cancel-daily-edit-button");
const STORAGE_KEY = "myDailyRecords";

function loadRecords() {
  return loadArrayFromStorage(STORAGE_KEY);
}
function saveRecords(records) {
  saveArrayToStorage(STORAGE_KEY, records);
}
function setCurrentDateTime() {
  const now = new Date();
  dateInput.value = formatLocalDateKey(now);
  timeInput.value = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
}
function getSelectedConditions() {
  const conditions = Array.from(document.querySelectorAll('input[name="condition"]:checked')).map(x => x.value);
  const other = otherConditionInput.value.trim();
  if (other) conditions.push(other);
  return conditions;
}
function formatDate(dateText) {
  const [y,m,d] = dateText.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}
function displayRecords() {
  const records = loadRecords().sort((a,b) => new Date(`${b.date}T${b.time}`)-new Date(`${a.date}T${a.time}`));
  if (!records.length) {
    recordList.innerHTML = '<p class="empty-message">まだ記録はありません。</p>';
    return;
  }
  recordList.innerHTML = records.map(record => {
    const conditions = record.conditions?.length ? record.conditions.map(escapeHtml).join("、") : "特になし";
    const note = record.note ? escapeHtml(record.note).replace(/\n/g,"<br>") : "記入なし";
    return `<article class="record-card">
      <div class="record-card-header">
        <div><h3>${formatDate(record.date)}</h3><p class="record-time">${escapeHtml(record.time)}</p></div>
        <div class="record-action-buttons">
          <button type="button" class="edit-button daily-edit-button" data-record-id="${record.id}">編集</button>
          <button type="button" class="delete-button daily-delete-button" data-record-id="${record.id}">削除</button>
        </div>
      </div>
      <dl class="record-details">
        <div><dt>気分</dt><dd>${record.mood || "未選択"}</dd></div>
        <div><dt>眠気</dt><dd>${record.sleepiness || "未選択"}</dd></div>
        <div><dt>やる気</dt><dd>${record.motivation || "未選択"}</dd></div>
      </dl>
      <p><strong>体調：</strong>${conditions}</p>
      <p><strong>出来事・感じたこと：</strong><br>${note}</p>
    </article>`;
  }).join("");
}
function cancelDailyEditing() {
  editingDailyRecordIdInput.value = "";
  form.reset();
  setCurrentDateTime();
  dailySaveButton.textContent = "保存する";
  dailyEditingMessage.classList.add("hidden-button");
  cancelDailyEditButton.classList.add("hidden-button");
}
function startDailyEditing(recordId) {
  const record = loadRecords().find(r => String(r.id) === String(recordId));
  if (!record) return alert("編集する記録が見つかりません。");
  editingDailyRecordIdInput.value = record.id;
  dateInput.value = record.date;
  timeInput.value = record.time;
  moodInput.value = record.mood || "";
  sleepinessInput.value = record.sleepiness || "";
  motivationInput.value = record.motivation || "";
  const fixed = Array.from(document.querySelectorAll('input[name="condition"]')).map(x=>x.value);
  document.querySelectorAll('input[name="condition"]').forEach(box => box.checked = (record.conditions || []).includes(box.value));
  otherConditionInput.value = (record.conditions || []).filter(x=>!fixed.includes(x)).join("、");
  dailyNoteInput.value = record.note || "";
  dailySaveButton.textContent = "変更を保存";
  dailyEditingMessage.classList.remove("hidden-button");
  cancelDailyEditButton.classList.remove("hidden-button");
  form.scrollIntoView({behavior:"smooth",block:"start"});
}
function refreshDailyAndSync() {
  if (typeof refreshAllScreens === "function") refreshAllScreens(); else displayRecords();
  if (window.firebaseSync?.queueUpload) window.firebaseSync.queueUpload();
}

currentTimeButton.addEventListener("click", setCurrentDateTime);
form.addEventListener("submit", event => {
  event.preventDefault();
  if (!dateInput.value || !timeInput.value) return alert("日付と時刻を入力してください。");
  const records = loadRecords();
  const editingId = editingDailyRecordIdInput.value;
  const data = {date:dateInput.value,time:timeInput.value,mood:moodInput.value,sleepiness:sleepinessInput.value,motivation:motivationInput.value,conditions:getSelectedConditions(),note:dailyNoteInput.value.trim()};
  if (editingId) {
    const record = records.find(r=>String(r.id)===String(editingId));
    if (!record) return alert("編集する記録が見つかりません。");
    Object.assign(record,data);
  } else {
    records.push({id:createRecordId(),...data});
  }
  const edited = Boolean(editingId);
  saveRecords(records);
  cancelDailyEditing();
  refreshDailyAndSync();
  alert(edited ? "記録を変更しました。" : "記録を保存しました。");
});
recordList.addEventListener("click", event => {
  const edit = event.target.closest(".daily-edit-button");
  if (edit) return startDailyEditing(edit.dataset.recordId);
  const del = event.target.closest(".daily-delete-button");
  if (!del || !confirm("この記録を削除しますか？")) return;
  saveRecords(loadRecords().filter(r=>String(r.id)!==String(del.dataset.recordId)));
  refreshDailyAndSync();
});
cancelDailyEditButton.addEventListener("click", cancelDailyEditing);
setCurrentDateTime();
displayRecords();
