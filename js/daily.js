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
const editingDailyRecordIdInput =
  document.querySelector(
    "#editing-daily-record-id"
  );

const dailyEditingMessage =
  document.querySelector(
    "#daily-editing-message"
  );

const dailySaveButton =
  document.querySelector(
    "#daily-save-button"
  );

const cancelDailyEditButton =
  document.querySelector(
    "#cancel-daily-edit-button"
  );

const STORAGE_KEY = "myDailyRecords";

/**
 * 現在の日付と時刻を入力欄に設定します。
 */
function setCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  dateInput.value = `${year}-${month}-${day}`;
  timeInput.value = `${hours}:${minutes}`;
}

/**
 * ブラウザに保存されている記録を読み込みます。
 */
function loadRecords() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData === null) {
    return [];
  }

  try {
    return JSON.parse(savedData);
  } catch (error) {
    console.error("記録の読み込みに失敗しました。", error);
    return [];
  }
}

/**
 * 記録をブラウザに保存します。
 */
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * チェックされた体調を取得します。
 */
function getSelectedConditions() {
  const checkedConditions = document.querySelectorAll(
    'input[name="condition"]:checked'
  );

  const conditions = Array.from(checkedConditions).map(
    (checkbox) => checkbox.value
  );

  const otherCondition = otherConditionInput.value.trim();

  if (otherCondition !== "") {
    conditions.push(otherCondition);
  }

  return conditions;
}

/**
 * 日付を日本語で表示しやすい形にします。
 */
function formatDate(dateText) {
  const [year, month, day] = dateText.split("-");

  return `${year}年${Number(month)}月${Number(day)}日`;
}

/**
 * HTMLとして解釈されないように文字を変換します。
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;

  return div.innerHTML;
}

/**
 * 記録一覧を画面に表示します。
 */
function displayRecords() {
  const records = loadRecords();

  if (records.length === 0) {
    recordList.innerHTML = `
      <p class="empty-message">
        まだ記録はありません。
      </p>
    `;
    return;
  }

  const sortedRecords = [...records].sort((recordA, recordB) => {
    const dateA = new Date(`${recordA.date}T${recordA.time}`);
    const dateB = new Date(`${recordB.date}T${recordB.time}`);

    return dateB - dateA;
  });

  recordList.innerHTML = sortedRecords
    .map((record) => {
      const conditionText =
        record.conditions.length > 0
          ? record.conditions.join("、")
          : "特になし";

      const noteText =
        record.note !== ""
          ? escapeHtml(record.note).replace(/\n/g, "<br>")
          : "記入なし";

      return `
        <article class="record-card">
          <div class="record-card-header">
            <div>
              <h3>${formatDate(record.date)}</h3>
              <p class="record-time">${record.time}</p>
            </div>

            <div class="record-action-buttons">
  <button
    type="button"
    class="edit-button daily-edit-button"
    data-record-id="${record.id}"
  >
    編集
  </button>

  <button
    type="button"
    class="delete-button daily-delete-button"
    data-record-id="${record.id}"
  >
    削除
  </button>
</div>

          <dl class="record-details">
            <div>
              <dt>気分</dt>
              <dd>${record.mood || "未選択"}</dd>
            </div>

            <div>
              <dt>眠気</dt>
              <dd>${record.sleepiness || "未選択"}</dd>
            </div>

            <div>
              <dt>やる気</dt>
              <dd>${record.motivation || "未選択"}</dd>
            </div>
          </dl>

          <p>
            <strong>体調：</strong>
            ${escapeHtml(conditionText)}
          </p>

          <p>
            <strong>出来事・感じたこと：</strong><br>
            ${noteText}
          </p>
        </article>
      `;
    })
    .join("");
}

/**
 * 入力欄を初期状態に戻します。
 */
function resetForm() {
  form.reset();
  setCurrentDateTime();
}

function startDailyEditing(recordId) {
  const records = loadRecords();

  const targetRecord = records.find(
    (record) =>
      String(record.id) === String(recordId)
  );

  if (!targetRecord) {
    alert("編集する記録が見つかりません。");
    return;
  }

  editingDailyRecordIdInput.value =
    targetRecord.id;

  dateInput.value = targetRecord.date;
  timeInput.value = targetRecord.time;
  moodInput.value = targetRecord.mood || "";
  sleepinessInput.value =
    targetRecord.sleepiness || "";
  motivationInput.value =
    targetRecord.motivation || "";

  document.querySelectorAll(
    'input[name="condition"]'
  ).forEach((checkbox) => {
    checkbox.checked =
      targetRecord.conditions?.includes(
        checkbox.value
      ) || false;
  });

  const fixedConditions = [
    "頭痛",
    "腹痛",
    "だるさ",
    "吐き気"
  ];

  const otherConditions =
    (targetRecord.conditions || []).filter(
      (condition) =>
        !fixedConditions.includes(condition)
    );

  otherConditionInput.value =
    otherConditions.join("、");

  dailyNoteInput.value =
    targetRecord.note || "";

  dailySaveButton.textContent =
    "変更を保存";

  dailyEditingMessage.classList.remove(
    "hidden-button"
  );

  cancelDailyEditButton.classList.remove(
    "hidden-button"
  );

  dailyForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function cancelDailyEditing() {
  editingDailyRecordIdInput.value = "";

  dailyForm.reset();
  setCurrentDateTime();

  dailySaveButton.textContent =
    "保存する";

  dailyEditingMessage.classList.add(
    "hidden-button"
  );

  cancelDailyEditButton.classList.add(
    "hidden-button"
  );
}

/**
 * 記録を削除します。
 */
function deleteRecord(recordId) {
  const records = loadRecords();

  const updatedRecords = records.filter(
    (record) => record.id !== recordId
  );

  saveRecords(updatedRecords);
  refreshAllScreens();
}

currentTimeButton.addEventListener("click", setCurrentDateTime);

Form.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    if (
      dateInput.value === "" ||
      timeInput.value === ""
    ) {
      alert(
        "日付と時刻を入力してください。"
      );
      return;
    }

    const records = loadRecords();

    const editingId =
      editingDailyRecordIdInput.value;

    const recordData = {
      date: dateInput.value,
      time: timeInput.value,
      mood: moodInput.value,
      sleepiness: sleepinessInput.value,
      motivation: motivationInput.value,
      conditions: getSelectedConditions(),
      note: dailyNoteInput.value.trim()
    };

    if (editingId !== "") {
      const targetRecord = records.find(
        (record) =>
          String(record.id) ===
          String(editingId)
      );

      if (!targetRecord) {
        alert(
          "編集する記録が見つかりません。"
        );
        return;
      }

      Object.assign(
        targetRecord,
        recordData
      );
    } else {
      records.push({
        id: createRecordId(),
        ...recordData
      });
    }

    const wasEditing =
      editingId !== "";

    saveRecords(records);
    cancelDailyEditing();

    if (
      typeof refreshAllScreens ===
      "function"
    ) {
      refreshAllScreens();
    } else {
      displayRecords();
    }

    if (
      window.firebaseSync &&
      typeof window.firebaseSync
        .queueUpload === "function"
    ) {
      window.firebaseSync.queueUpload();
    }

    alert(
      wasEditing
        ? "記録を変更しました。"
        : "記録を保存しました。"
    );
  }
);

recordList.addEventListener(
  "click",
  (event) => {
    const editButton =
      event.target.closest(
        ".daily-edit-button"
      );

    if (editButton) {
      startDailyEditing(
        editButton.dataset.recordId
      );
      return;
    }

    const deleteButton =
      event.target.closest(
        ".daily-delete-button"
      );

    if (!deleteButton) {
      return;
    }

    if (
      !confirm(
        "この記録を削除しますか？"
      )
    ) {
      return;
    }

    const updatedRecords =
      loadRecords().filter(
        (record) =>
          String(record.id) !==
          String(
            deleteButton.dataset.recordId
          )
      );

    saveRecords(updatedRecords);

    if (
      typeof refreshAllScreens ===
      "function"
    ) {
      refreshAllScreens();
    } else {
      displayRecords();
    }

    if (
      window.firebaseSync &&
      typeof window.firebaseSync
        .queueUpload === "function"
    ) {
      window.firebaseSync.queueUpload();
    }
  }
);

cancelDailyEditButton.addEventListener(
  "click",
  cancelDailyEditing
);



/**
 * 指定された画面を表示します。
 */
