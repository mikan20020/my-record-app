const HOUSEWORK_STORAGE_KEY = "myHouseworkRecords";
/* ========================================
   家事記録
======================================== */

const currentHouseworkForm = document.querySelector(
  "#current-housework-form"
);

const currentHouseworkOther = document.querySelector(
  "#current-housework-other"
);

const currentHouseworkNote = document.querySelector(
  "#current-housework-note"
);

const manualHouseworkForm = document.querySelector(
  "#manual-housework-form"
);

const manualHouseworkOther = document.querySelector(
  "#manual-housework-other"
);

const manualHouseworkDatetime = document.querySelector(
  "#manual-housework-datetime"
);

const manualHouseworkNote = document.querySelector(
  "#manual-housework-note"
);

const houseworkStatusMessage = document.querySelector(
  "#housework-status-message"
);

const houseworkRecordList = document.querySelector(
  "#housework-record-list"
);

function createHouseworkId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function loadHouseworkRecords() {
  const savedData = localStorage.getItem(
    HOUSEWORK_STORAGE_KEY
  );

  if (savedData === null) {
    return [];
  }

  try {
    const parsedData = JSON.parse(savedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("家事記録を読み込めませんでした。", error);
    return [];
  }
}

function saveHouseworkRecords(records) {
  localStorage.setItem(
    HOUSEWORK_STORAGE_KEY,
    JSON.stringify(records)
  );
}

function getSelectedHousework(
  checkboxName,
  otherInput
) {
  const checkedItems = document.querySelectorAll(
    `input[name="${checkboxName}"]:checked`
  );

  const items = Array.from(checkedItems).map(
    (checkbox) => checkbox.value
  );

  const otherText = otherInput.value.trim();

  if (otherText !== "") {
    items.push(otherText);
  }

  return items;
}

function formatHouseworkDateTime(dateTimeText) {
  const date = new Date(dateTimeText);

  if (Number.isNaN(date.getTime())) {
    return "日時が不正です";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function setCurrentHouseworkDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(
    now.getHours()
  ).padStart(2, "0");
  const minutes = String(
    now.getMinutes()
  ).padStart(2, "0");

  manualHouseworkDatetime.value =
    `${year}-${month}-${day}T${hours}:${minutes}`;
}

function showHouseworkStatus(message) {
  houseworkStatusMessage.textContent = message;

  window.setTimeout(() => {
    if (
      houseworkStatusMessage.textContent === message
    ) {
      houseworkStatusMessage.textContent = "";
    }
  }, 4000);
}

function displayHouseworkRecords() {
  const records = loadHouseworkRecords();

  if (records.length === 0) {
    houseworkRecordList.innerHTML = `
      <p class="empty-message">
        まだ家事記録はありません。
      </p>
    `;
    return;
  }

  const sortedRecords = [...records].sort(
    (recordA, recordB) =>
      new Date(recordB.datetime).getTime() -
      new Date(recordA.datetime).getTime()
  );

  houseworkRecordList.innerHTML = sortedRecords
    .map((record) => {
      const itemText = record.items
        .map((item) => escapeHtml(item))
        .join("、");

      const noteText =
        record.note !== ""
          ? escapeHtml(record.note)
          : "なし";

      return `
        <article class="housework-record-card">
          <div class="housework-record-header">
            <div>
              <h3>家事</h3>

              <p class="housework-datetime">
                ${formatHouseworkDateTime(
                  record.datetime
                )}
              </p>
            </div>

            <button
              type="button"
              class="delete-button housework-delete-button"
              data-housework-id="${record.id}"
            >
              削除
            </button>
          </div>

          <p class="housework-items">
            ${itemText}
          </p>

          <p class="record-note">
            <strong>メモ：</strong>
            ${noteText}
          </p>
        </article>
      `;
    })
    .join("");
}

currentHouseworkForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const items = getSelectedHousework(
      "current-housework",
      currentHouseworkOther
    );

    if (items.length === 0) {
      alert("行った家事を1つ以上選択してください。");
      return;
    }

    const records = loadHouseworkRecords();

    records.push({
      id: createHouseworkId(),
      items,
      datetime: new Date().toISOString(),
      note: currentHouseworkNote.value.trim()
    });

    saveHouseworkRecords(records);
    displayHouseworkRecords();

    currentHouseworkForm.reset();

    showHouseworkStatus(
      "現在時刻で家事を記録しました。"
    );
  }
);

manualHouseworkForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const items = getSelectedHousework(
      "manual-housework",
      manualHouseworkOther
    );

    if (items.length === 0) {
      alert("行った家事を1つ以上選択してください。");
      return;
    }

    if (manualHouseworkDatetime.value === "") {
      alert("実施日時を入力してください。");
      return;
    }

    const houseworkDate = new Date(
      manualHouseworkDatetime.value
    );

    if (Number.isNaN(houseworkDate.getTime())) {
      alert("実施日時を正しく入力してください。");
      return;
    }

    const records = loadHouseworkRecords();

    records.push({
      id: createHouseworkId(),
      items,
      datetime: houseworkDate.toISOString(),
      note: manualHouseworkNote.value.trim()
    });

    saveHouseworkRecords(records);
    displayHouseworkRecords();

    manualHouseworkForm.reset();
    setCurrentHouseworkDateTime();

    showHouseworkStatus("家事記録を保存しました。");
  }
);

houseworkRecordList.addEventListener(
  "click",
  (event) => {
    const deleteButton = event.target.closest(
      ".housework-delete-button"
    );

    if (deleteButton === null) {
      return;
    }

    const houseworkId =
      deleteButton.dataset.houseworkId;

    if (!confirm("この家事記録を削除しますか？")) {
      return;
    }

    const records = loadHouseworkRecords();

    const updatedRecords = records.filter(
      (record) => record.id !== houseworkId
    );

    saveHouseworkRecords(updatedRecords);
    refreshAllScreens();
  }
);

setCurrentHouseworkDateTime();
displayHouseworkRecords();

