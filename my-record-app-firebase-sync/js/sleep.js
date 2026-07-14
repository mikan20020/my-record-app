const SLEEP_STORAGE_KEY = "mySleepRecords";

const bedtimeButton = document.querySelector("#record-bedtime-button");
const waketimeButton = document.querySelector("#record-waketime-button");
const manualSleepForm = document.querySelector("#manual-sleep-form");
const manualBedtimeInput = document.querySelector("#manual-bedtime");
const manualWaketimeInput = document.querySelector("#manual-waketime");
const editingSleepIdInput = document.querySelector("#editing-sleep-id");
const manualSleepSaveButton = document.querySelector("#manual-sleep-save-button");
const cancelSleepEditButton = document.querySelector("#cancel-sleep-edit-button");
const sleepEditingMessage = document.querySelector("#sleep-editing-message");
const sleepRecordList = document.querySelector("#sleep-record-list");
const sleepStatusMessage = document.querySelector("#sleep-status-message");

function loadSleepRecords() {
  return loadArrayFromStorage(SLEEP_STORAGE_KEY);
}

function saveSleepRecords(records) {
  saveArrayToStorage(SLEEP_STORAGE_KEY, records);
}

function formatSleepDateTime(dateTimeText) {
  if (!dateTimeText) return "未記録";
  const date = new Date(dateTimeText);
  if (Number.isNaN(date.getTime())) return "日時が不正です";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "numeric", day: "numeric", weekday: "short",
    hour: "2-digit", minute: "2-digit"
  }).format(date);
}

function formatSleepDate(dateTimeText) {
  if (!dateTimeText) return "日付未定";
  const date = new Date(dateTimeText);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "long", day: "numeric"
  }).format(date);
}

function calculateSleepDuration(bedtime, waketime) {
  if (!bedtime || !waketime) return null;
  const difference = new Date(waketime).getTime() - new Date(bedtime).getTime();
  if (difference < 0) return null;
  const totalMinutes = Math.floor(difference / 60000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes
  };
}

function formatSleepDuration(bedtime, waketime) {
  const duration = calculateSleepDuration(bedtime, waketime);
  if (!duration) return "起床時刻を記録すると計算されます";
  return `${duration.hours}時間${duration.minutes}分`;
}

function findOpenSleepRecord(records) {
  return [...records].reverse().find((record) => !record.waketime);
}

function showSleepStatus(message) {
  sleepStatusMessage.textContent = message;
  window.setTimeout(() => {
    if (sleepStatusMessage.textContent === message) sleepStatusMessage.textContent = "";
  }, 4000);
}

function displaySleepRecords() {
  const records = loadSleepRecords().sort(
    (a, b) => new Date(b.bedtime).getTime() - new Date(a.bedtime).getTime()
  );

  if (records.length === 0) {
    sleepRecordList.innerHTML = '<p class="empty-message">まだ睡眠記録はありません。</p>';
    return;
  }

  sleepRecordList.innerHTML = records.map((record) => `
    <article class="sleep-record-card ${record.waketime ? "" : "open-sleep-record"}">
      <div class="sleep-record-header">
        <h3>${formatSleepDate(record.waketime || record.bedtime)}</h3>
        <div class="record-action-buttons">
          <button type="button" class="edit-button sleep-edit-button" data-sleep-id="${record.id}">編集</button>
          <button type="button" class="delete-button sleep-delete-button" data-sleep-id="${record.id}">削除</button>
        </div>
      </div>
      <div class="sleep-record-times">
        <div class="sleep-time-box">
          <span class="sleep-time-label">就寝</span>
          <span class="sleep-time-value">${formatSleepDateTime(record.bedtime)}</span>
        </div>
        <div class="sleep-time-box">
          <span class="sleep-time-label">起床</span>
          <span class="sleep-time-value">${formatSleepDateTime(record.waketime)}</span>
        </div>
      </div>
      <p class="sleep-duration">睡眠時間：${formatSleepDuration(record.bedtime, record.waketime)}</p>
    </article>
  `).join("");
}

function recordCurrentBedtime() {
  const records = loadSleepRecords();
  if (findOpenSleepRecord(records)) {
    alert("すでに起床時刻が未記録の睡眠記録があります。");
    return;
  }
  records.push({ id: createRecordId(), bedtime: new Date().toISOString(), waketime: null });
  saveSleepRecords(records);
  refreshAllScreens();
  showSleepStatus("就寝時刻を記録しました。");
}

function recordCurrentWaketime() {
  const records = loadSleepRecords();
  const openRecord = findOpenSleepRecord(records);
  if (!openRecord) {
    alert("先に就寝を記録してください。");
    return;
  }
  openRecord.waketime = new Date().toISOString();
  saveSleepRecords(records);
  refreshAllScreens();
  showSleepStatus("起床時刻を記録しました。");
}

function startSleepEditing(recordId) {
  const record = loadSleepRecords().find((item) => item.id === recordId);
  if (!record) {
    alert("編集する睡眠記録が見つかりません。");
    return;
  }
  editingSleepIdInput.value = record.id;
  manualBedtimeInput.value = formatDateTimeLocalValue(record.bedtime);
  manualWaketimeInput.value = formatDateTimeLocalValue(record.waketime);
  manualSleepSaveButton.textContent = "変更を保存";
  cancelSleepEditButton.classList.remove("hidden-button");
  sleepEditingMessage.classList.remove("hidden-button");
  manualSleepForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelSleepEditing() {
  editingSleepIdInput.value = "";
  manualSleepForm.reset();
  manualSleepSaveButton.textContent = "睡眠記録を保存";
  cancelSleepEditButton.classList.add("hidden-button");
  sleepEditingMessage.classList.add("hidden-button");
}

function saveManualSleepRecord(event) {
  event.preventDefault();
  if (!manualBedtimeInput.value) {
    alert("就寝日時を入力してください。");
    return;
  }

  const bedtime = new Date(manualBedtimeInput.value);
  let waketime = null;
  if (manualWaketimeInput.value) {
    waketime = new Date(manualWaketimeInput.value);
    if (waketime <= bedtime) {
      alert("起床日時は就寝日時より後にしてください。");
      return;
    }
  }

  const records = loadSleepRecords();
  const editingId = editingSleepIdInput.value;
  const wasEditing = Boolean(editingId);

  if (editingId) {
    const record = records.find((item) => item.id === editingId);
    if (!record) return;
    record.bedtime = bedtime.toISOString();
    record.waketime = waketime ? waketime.toISOString() : null;
  } else {
    records.push({
      id: createRecordId(),
      bedtime: bedtime.toISOString(),
      waketime: waketime ? waketime.toISOString() : null
    });
  }

  saveSleepRecords(records);
  cancelSleepEditing();
  refreshAllScreens();
  showSleepStatus(wasEditing ? "睡眠記録を変更しました。" : "睡眠記録を保存しました。");
}

bedtimeButton.addEventListener("click", recordCurrentBedtime);
waketimeButton.addEventListener("click", recordCurrentWaketime);
manualSleepForm.addEventListener("submit", saveManualSleepRecord);
cancelSleepEditButton.addEventListener("click", cancelSleepEditing);

sleepRecordList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".sleep-edit-button");
  if (editButton) {
    startSleepEditing(editButton.dataset.sleepId);
    return;
  }

  const deleteButton = event.target.closest(".sleep-delete-button");
  if (!deleteButton || !confirm("この睡眠記録を削除しますか？")) return;

  saveSleepRecords(loadSleepRecords().filter(
    (record) => record.id !== deleteButton.dataset.sleepId
  ));
  refreshAllScreens();
});

displaySleepRecords();
