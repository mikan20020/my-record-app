/* ========================================
   カレンダー
======================================== */

const calendarMonthTitle = document.querySelector("#calendar-month-title");
const calendarGrid = document.querySelector("#calendar-grid");
const previousMonthButton = document.querySelector("#previous-month-button");
const nextMonthButton = document.querySelector("#next-month-button");
const calendarTodayButton = document.querySelector("#calendar-today-button");
const selectedDateTitle = document.querySelector("#selected-date-title");
const selectedDateRecords = document.querySelector("#selected-date-records");

const currentCalendarDate = new Date();
currentCalendarDate.setDate(1);

let selectedCalendarDate = null;

function getRecordCountsForDate(dateKey) {
  const dailyCount = loadRecords().filter((record) => record.date === dateKey).length;
  const sleepCount = loadSleepRecords().filter(
    (record) => getLocalDateKeyFromDateTime(record.waketime || record.bedtime) === dateKey
  ).length;
  const medicineCount = loadMedicineRecords().filter(
    (record) => getLocalDateKeyFromDateTime(record.datetime) === dateKey
  ).length;
  const caffeineCount = loadCaffeineRecords().filter(
    (record) => getLocalDateKeyFromDateTime(record.datetime) === dateKey
  ).length;
  const outingCount = loadOutingRecords().filter(
    (record) => getLocalDateKeyFromDateTime(record.startTime) === dateKey
  ).length;
  const houseworkCount = loadHouseworkRecords().filter(
    (record) => getLocalDateKeyFromDateTime(record.datetime) === dateKey
  ).length;

  return {
    total:
      dailyCount +
      sleepCount +
      medicineCount +
      caffeineCount +
      outingCount +
      houseworkCount
  };
}

function displayCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  calendarMonthTitle.textContent = `${year}年${month + 1}月`;

  const firstWeekday = new Date(year, month, 1).getDay();
  const numberOfDays = new Date(year, month + 1, 0).getDate();
  const todayKey = formatLocalDateKey(new Date());

  let html = "";

  for (let index = 0; index < firstWeekday; index += 1) {
    html += '<div class="calendar-day empty-day"></div>';
  }

  for (let day = 1; day <= numberOfDays; day += 1) {
    const dateKey = formatLocalDateKey(new Date(year, month, day));
    const count = getRecordCountsForDate(dateKey).total;

    html += `
      <button
        type="button"
        class="calendar-day ${dateKey === todayKey ? "today" : ""} ${
          dateKey === selectedCalendarDate ? "selected-day" : ""
        }"
        data-calendar-date="${dateKey}"
      >
        <span class="calendar-day-number">${day}</span>
        ${
          count > 0
            ? `<span class="calendar-record-count">${count}件</span>`
            : ""
        }
      </button>
    `;
  }

  calendarGrid.innerHTML = html;
}

function formatSelectedDateTitle(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date(year, month - 1, day));
}

function actionButtons(type, id) {
  return `
    <div class="calendar-record-actions">
      <button
        type="button"
        class="edit-button calendar-edit-button"
        data-calendar-type="${type}"
        data-calendar-id="${id}"
      >編集</button>
      <button
        type="button"
        class="delete-button calendar-delete-button"
        data-calendar-type="${type}"
        data-calendar-id="${id}"
      >削除</button>
    </div>
  `;
}

function createDailyCalendarHtml(dateKey) {
  const records = loadRecords()
    .filter((record) => record.date === dateKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!records.length) return "";

  const items = records.map((record) => {
    const conditions = record.conditions?.length
      ? record.conditions.map(escapeHtml).join("、")
      : "特になし";
    const note = record.note
      ? escapeHtml(record.note).replace(/\n/g, "<br>")
      : "なし";

    return `
      <div class="calendar-record-item" data-calendar-item="daily-${record.id}">
        <div class="calendar-record-item-header">
          <strong>${escapeHtml(record.time)}</strong>
          ${actionButtons("daily", record.id)}
        </div>
        気分：${record.mood || "未選択"} ／
        眠気：${record.sleepiness || "未選択"} ／
        やる気：${record.motivation || "未選択"}<br>
        体調：${conditions}<br>
        メモ：${note}
      </div>
    `;
  }).join("");

  return `<div class="calendar-record-group"><h3>今日の状態</h3>${items}</div>`;
}

function createSleepCalendarHtml(dateKey) {
  const records = loadSleepRecords()
    .filter(
      (record) =>
        getLocalDateKeyFromDateTime(record.waketime || record.bedtime) === dateKey
    )
    .sort((a, b) => new Date(a.bedtime) - new Date(b.bedtime));

  if (!records.length) return "";

  const items = records.map((record) => `
    <div class="calendar-record-item" data-calendar-item="sleep-${record.id}">
      <div class="calendar-record-item-header">
        <strong>睡眠記録</strong>
        ${actionButtons("sleep", record.id)}
      </div>
      就寝：${formatJapaneseDateTime(record.bedtime)}<br>
      起床：${formatJapaneseDateTime(record.waketime)}<br>
      睡眠時間：${formatSleepDuration(record.bedtime, record.waketime)}
    </div>
  `).join("");

  return `<div class="calendar-record-group"><h3>睡眠</h3>${items}</div>`;
}

function createMedicineCalendarHtml(dateKey) {
  const records = loadMedicineRecords()
    .filter((record) => getLocalDateKeyFromDateTime(record.datetime) === dateKey)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  if (!records.length) return "";

  const items = records.map((record) => `
    <div class="calendar-record-item" data-calendar-item="medicine-${record.id}">
      <div class="calendar-record-item-header">
        <strong>${escapeHtml(record.medicineName)}</strong>
        ${actionButtons("medicine", record.id)}
      </div>
      ${formatJapaneseDateTime(record.datetime)}<br>
      服用量：${escapeHtml(record.dose || "未入力")}<br>
      メモ：${escapeHtml(record.note || "なし")}
    </div>
  `).join("");

  return `<div class="calendar-record-group"><h3>薬</h3>${items}</div>`;
}

function createCaffeineCalendarHtml(dateKey) {
  const records = loadCaffeineRecords()
    .filter((record) => getLocalDateKeyFromDateTime(record.datetime) === dateKey)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  if (!records.length) return "";

  const total = records.reduce((sum, record) => sum + Number(record.amount), 0);
  const items = records.map((record) => `
    <div class="calendar-record-item" data-calendar-item="caffeine-${record.id}">
      <div class="calendar-record-item-header">
        <strong>${escapeHtml(record.type)}</strong>
        ${actionButtons("caffeine", record.id)}
      </div>
      ${formatJapaneseDateTime(record.datetime)}<br>
      ${Number(record.amount)}mg<br>
      メモ：${escapeHtml(record.note || "なし")}
    </div>
  `).join("");

  return `<div class="calendar-record-group"><h3>カフェイン（合計 ${total}mg）</h3>${items}</div>`;
}

function createOutingCalendarHtml(dateKey) {
  const records = loadOutingRecords()
    .filter((record) => getLocalDateKeyFromDateTime(record.startTime) === dateKey)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  if (!records.length) return "";

  const items = records.map((record) => `
    <div class="calendar-record-item" data-calendar-item="outing-${record.id}">
      <div class="calendar-record-item-header">
        <strong>${escapeHtml(record.purpose)}</strong>
        ${actionButtons("outing", record.id)}
      </div>
      外出：${formatJapaneseDateTime(record.startTime)}<br>
      帰宅：${formatJapaneseDateTime(record.returnTime)}<br>
      外出時間：${formatOutingDuration(record.startTime, record.returnTime)}<br>
      メモ：${escapeHtml(record.note || "なし")}
    </div>
  `).join("");

  return `<div class="calendar-record-group"><h3>外出</h3>${items}</div>`;
}

function createHouseworkCalendarHtml(dateKey) {
  const records = loadHouseworkRecords()
    .filter((record) => getLocalDateKeyFromDateTime(record.datetime) === dateKey)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  if (!records.length) return "";

  const items = records.map((record) => `
    <div class="calendar-record-item" data-calendar-item="housework-${record.id}">
      <div class="calendar-record-item-header">
        <strong>${(record.items || []).map(escapeHtml).join("、")}</strong>
        ${actionButtons("housework", record.id)}
      </div>
      ${formatJapaneseDateTime(record.datetime)}<br>
      メモ：${escapeHtml(record.note || "なし")}
    </div>
  `).join("");

  return `<div class="calendar-record-group"><h3>家事</h3>${items}</div>`;
}

function displaySelectedDateRecords(dateKey) {
  selectedCalendarDate = dateKey;
  selectedDateTitle.textContent = formatSelectedDateTitle(dateKey);

  const html = [
    createDailyCalendarHtml(dateKey),
    createSleepCalendarHtml(dateKey),
    createMedicineCalendarHtml(dateKey),
    createCaffeineCalendarHtml(dateKey),
    createOutingCalendarHtml(dateKey),
    createHouseworkCalendarHtml(dateKey)
  ].join("");

  selectedDateRecords.innerHTML = html || '<p class="empty-message">この日の記録はありません。</p>';
  displayCalendar();
}

function refreshAfterCalendarChange(dateKey) {

  if (
    window.firebaseSync &&
    typeof window.firebaseSync.queueUpload === "function"
  ) {
    window.firebaseSync.queueUpload();
  }

  if (typeof refreshAllScreens === "function") {
    refreshAllScreens();
  } else {
    displayCalendar();
  }

  selectedCalendarDate = dateKey;

  displaySelectedDateRecords(dateKey);
}

function getCalendarRecord(type, id) {
  const sources = {
    daily: loadRecords,
    sleep: loadSleepRecords,
    medicine: loadMedicineRecords,
    caffeine: loadCaffeineRecords,
    outing: loadOutingRecords,
    housework: loadHouseworkRecords
  };

  const load = sources[type];

  if (typeof load !== "function") {
    return null;
  }

  return (
    load().find(
      (record) => String(record.id) === String(id)
    ) || null
  );
}

function createEditorHtml(type, record) {
  if (type === "daily") {
    return `
      <form class="calendar-inline-editor" data-editor-type="daily" data-editor-id="${record.id}">
        <label>日付<input name="date" type="date" value="${escapeHtml(record.date)}" required></label>
        <label>時刻<input name="time" type="time" value="${escapeHtml(record.time)}" required></label>
        <label>気分<input name="mood" type="number" min="1" max="5" value="${escapeHtml(record.mood || "")}"></label>
        <label>眠気<input name="sleepiness" type="number" min="1" max="5" value="${escapeHtml(record.sleepiness || "")}"></label>
        <label>やる気<input name="motivation" type="number" min="1" max="5" value="${escapeHtml(record.motivation || "")}"></label>
        <label>体調（読点区切り）<input name="conditions" type="text" value="${escapeHtml((record.conditions || []).join("、"))}"></label>
        <label>メモ<textarea name="note" rows="4">${escapeHtml(record.note || "")}</textarea></label>
        ${editorButtons()}
      </form>`;
  }

  if (type === "sleep") {
    return `
      <form class="calendar-inline-editor" data-editor-type="sleep" data-editor-id="${record.id}">
        <label>就寝日時<input name="bedtime" type="datetime-local" value="${formatDateTimeLocalValue(record.bedtime)}" required></label>
        <label>起床日時<input name="waketime" type="datetime-local" value="${formatDateTimeLocalValue(record.waketime)}"></label>
        ${editorButtons()}
      </form>`;
  }

  if (type === "medicine") {
    return `
      <form class="calendar-inline-editor" data-editor-type="medicine" data-editor-id="${record.id}">
        <label>薬の名前<input name="medicineName" type="text" value="${escapeHtml(record.medicineName)}" required></label>
        <label>服用日時<input name="datetime" type="datetime-local" value="${formatDateTimeLocalValue(record.datetime)}" required></label>
        <label>服用量<input name="dose" type="text" value="${escapeHtml(record.dose || "")}"></label>
        <label>メモ<textarea name="note" rows="3">${escapeHtml(record.note || "")}</textarea></label>
        ${editorButtons()}
      </form>`;
  }

  if (type === "caffeine") {
    return `
      <form class="calendar-inline-editor" data-editor-type="caffeine" data-editor-id="${record.id}">
        <label>飲み物・食品<input name="type" type="text" value="${escapeHtml(record.type)}" required></label>
        <label>摂取日時<input name="datetime" type="datetime-local" value="${formatDateTimeLocalValue(record.datetime)}" required></label>
        <label>カフェイン量（mg）<input name="amount" type="number" min="0" step="1" value="${Number(record.amount)}" required></label>
        <label>メモ<textarea name="note" rows="3">${escapeHtml(record.note || "")}</textarea></label>
        ${editorButtons()}
      </form>`;
  }

  if (type === "outing") {
    return `
      <form class="calendar-inline-editor" data-editor-type="outing" data-editor-id="${record.id}">
        <label>外出目的<input name="purpose" type="text" value="${escapeHtml(record.purpose)}" required></label>
        <label>外出日時<input name="startTime" type="datetime-local" value="${formatDateTimeLocalValue(record.startTime)}" required></label>
        <label>帰宅日時<input name="returnTime" type="datetime-local" value="${formatDateTimeLocalValue(record.returnTime)}"></label>
        <label>メモ<textarea name="note" rows="3">${escapeHtml(record.note || "")}</textarea></label>
        ${editorButtons()}
      </form>`;
  }

  return `
    <form class="calendar-inline-editor" data-editor-type="housework" data-editor-id="${record.id}">
      <label>家事（読点区切り）<input name="items" type="text" value="${escapeHtml((record.items || []).join("、"))}" required></label>
      <label>実施日時<input name="datetime" type="datetime-local" value="${formatDateTimeLocalValue(record.datetime)}" required></label>
      <label>メモ<textarea name="note" rows="3">${escapeHtml(record.note || "")}</textarea></label>
      ${editorButtons()}
    </form>`;
}

function editorButtons() {
  return `
    <div class="calendar-editor-actions">
      <button
        type="button"
        class="save-button calendar-edit-save"
      >
        変更を保存
      </button>

      <button
        type="button"
        class="cancel-edit-button calendar-edit-cancel"
      >
        キャンセル
      </button>
    </div>
  `;
}

function startCalendarEditing(type, id) {
  const record = getCalendarRecord(type, id);
  const item = selectedDateRecords.querySelector(`[data-calendar-item="${type}-${id}"]`);
  if (!record || !item) return;
  item.innerHTML = createEditorHtml(type, record);
}

function saveCalendarEdit(form) {
  const type = form.dataset.editorType;
  const id = form.dataset.editorId;
  const data = new FormData(form);
  let dateKey = selectedCalendarDate;

  if (type === "daily") {
    const records = loadRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return;
    record.date = String(data.get("date"));
    record.time = String(data.get("time"));
    record.mood = String(data.get("mood") || "");
    record.sleepiness = String(data.get("sleepiness") || "");
    record.motivation = String(data.get("motivation") || "");
    record.conditions = String(data.get("conditions") || "")
      .split(/[、,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    record.note = String(data.get("note") || "").trim();
    dateKey = record.date;
    saveRecords(records);
  } else if (type === "sleep") {
    const records = loadSleepRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return;
    const bedtime = new Date(String(data.get("bedtime")));
    const waketimeText = String(data.get("waketime") || "");
    const waketime = waketimeText ? new Date(waketimeText) : null;
    if (waketime && waketime <= bedtime) {
      alert("起床日時は就寝日時より後にしてください。");
      return;
    }
    record.bedtime = bedtime.toISOString();
    record.waketime = waketime ? waketime.toISOString() : null;
    dateKey = getLocalDateKeyFromDateTime(record.waketime || record.bedtime);
    saveSleepRecords(records);
  } else if (type === "medicine") {
    const records = loadMedicineRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return;
    record.medicineName = String(data.get("medicineName")).trim();
    record.datetime = new Date(String(data.get("datetime"))).toISOString();
    record.dose = String(data.get("dose") || "").trim();
    record.note = String(data.get("note") || "").trim();
    dateKey = getLocalDateKeyFromDateTime(record.datetime);
    saveMedicineRecords(records);
  } else if (type === "caffeine") {
    const records = loadCaffeineRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return;
    record.type = String(data.get("type")).trim();
    record.datetime = new Date(String(data.get("datetime"))).toISOString();
    record.amount = Number(data.get("amount"));
    record.note = String(data.get("note") || "").trim();
    dateKey = getLocalDateKeyFromDateTime(record.datetime);
    saveCaffeineRecords(records);
  } else if (type === "outing") {
    const records = loadOutingRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return;
    const startTime = new Date(String(data.get("startTime")));
    const returnText = String(data.get("returnTime") || "");
    const returnTime = returnText ? new Date(returnText) : null;
    if (returnTime && returnTime <= startTime) {
      alert("帰宅日時は外出日時より後にしてください。");
      return;
    }
    record.purpose = String(data.get("purpose")).trim();
    record.startTime = startTime.toISOString();
    record.returnTime = returnTime ? returnTime.toISOString() : null;
    record.note = String(data.get("note") || "").trim();
    dateKey = getLocalDateKeyFromDateTime(record.startTime);
    saveOutingRecords(records);
  } else {
    const records = loadHouseworkRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return;
    record.items = String(data.get("items") || "")
      .split(/[、,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    record.datetime = new Date(String(data.get("datetime"))).toISOString();
    record.note = String(data.get("note") || "").trim();
    dateKey = getLocalDateKeyFromDateTime(record.datetime);
    saveHouseworkRecords(records);
  }

  const [year, month] = dateKey.split("-").map(Number);
  currentCalendarDate.setFullYear(year, month - 1, 1);
  refreshAfterCalendarChange(dateKey);
}

function deleteCalendarRecord(type, id) {
  try {
    const handlers = {
      daily: [loadRecords, saveRecords],
      sleep: [loadSleepRecords, saveSleepRecords],
      medicine: [
        loadMedicineRecords,
        saveMedicineRecords
      ],
      caffeine: [
        loadCaffeineRecords,
        saveCaffeineRecords
      ],
      outing: [
        loadOutingRecords,
        saveOutingRecords
      ],
      housework: [
        loadHouseworkRecords,
        saveHouseworkRecords
      ]
    };

    const handler = handlers[type];

    if (!handler) {
      throw new Error(
        `削除対象の種類が不明です: ${type}`
      );
    }

    const [load, save] = handler;
    const records = load();

    const updatedRecords = records.filter(
      (record) =>
        String(record.id) !== String(id)
    );

    if (updatedRecords.length === records.length) {
      throw new Error(
        "削除する記録が見つかりませんでした。"
      );
    }

    save(updatedRecords);

    const dateKey = selectedCalendarDate;

    displayCalendar();

    if (dateKey) {
      displaySelectedDateRecords(dateKey);
    }

    if (
      typeof displayStatistics === "function"
    ) {
      displayStatistics();
    }

    if (
      typeof displayDataCounts === "function"
    ) {
      displayDataCounts();
    }

    if (
      window.firebaseSync &&
      typeof window.firebaseSync.queueUpload ===
        "function"
    ) {
      window.firebaseSync.queueUpload();
    }
  } catch (error) {
    console.error(
      "カレンダーからの削除に失敗しました。",
      error
    );

    alert(
      `削除できませんでした。\n${error.message}`
    );
  }
}

calendarGrid.addEventListener("click", (event) => {
  const dayButton = event.target.closest("[data-calendar-date]");
  if (!dayButton) return;

  displaySelectedDateRecords(dayButton.dataset.calendarDate);
  selectedDateTitle.scrollIntoView({ behavior: "smooth", block: "start" });
});

selectedDateRecords.addEventListener(
  "click",
  (event) => {
    const editButton = event.target.closest(
      ".calendar-edit-button"
    );

    if (editButton) {
      startCalendarEditing(
        editButton.dataset.calendarType,
        editButton.dataset.calendarId
      );

      return;
    }

    const saveButton = event.target.closest(
      ".calendar-edit-save"
    );

    if (saveButton) {
      const form = saveButton.closest(
        ".calendar-inline-editor"
      );

      if (!form) {
        alert(
          "編集フォームが見つかりませんでした。"
        );
        return;
      }

      if (!form.reportValidity()) {
        return;
      }

      try {
        saveCalendarEdit(form);
      } catch (error) {
        console.error(
          "カレンダーからの変更保存に失敗しました。",
          error
        );

        alert(
          `変更を保存できませんでした。\n` +
          `${error.message || "原因不明"}`
        );
      }

      return;
    }

    const deleteButton = event.target.closest(
      ".calendar-delete-button"
    );

    if (deleteButton) {
      const shouldDelete = confirm(
        "この記録を削除しますか？"
      );

      if (shouldDelete) {
        deleteCalendarRecord(
          deleteButton.dataset.calendarType,
          deleteButton.dataset.calendarId
        );
      }

      return;
    }

    const cancelButton = event.target.closest(
      ".calendar-edit-cancel"
    );

    if (cancelButton && selectedCalendarDate) {
      displaySelectedDateRecords(
        selectedCalendarDate
      );
    }
  }
);

/*
 * 入力欄でEnterを押した場合にも保存します。
 */
selectedDateRecords.addEventListener(
  "submit",
  (event) => {
    const form = event.target.closest(
      ".calendar-inline-editor"
    );

    if (!form) {
      return;
    }

    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    try {
      saveCalendarEdit(form);
    } catch (error) {
      console.error(
        "カレンダーからの変更保存に失敗しました。",
        error
      );

      alert(
        `変更を保存できませんでした。\n` +
        `${error.message || "原因不明"}`
      );
    }
  }
);


previousMonthButton.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  selectedCalendarDate = null;
  selectedDateTitle.textContent = "日付を選択してください";
  selectedDateRecords.innerHTML = '<p class="empty-message">カレンダーの日付を押すと、その日の記録を確認できます。</p>';
  displayCalendar();
});

nextMonthButton.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  selectedCalendarDate = null;
  selectedDateTitle.textContent = "日付を選択してください";
  selectedDateRecords.innerHTML = '<p class="empty-message">カレンダーの日付を押すと、その日の記録を確認できます。</p>';
  displayCalendar();
});

calendarTodayButton.addEventListener("click", () => {
  const today = new Date();
  currentCalendarDate.setFullYear(today.getFullYear(), today.getMonth(), 1);
  const todayKey = formatLocalDateKey(today);
  displaySelectedDateRecords(todayKey);
  selectedDateTitle.scrollIntoView({ behavior: "smooth", block: "start" });
});

displayCalendar();
