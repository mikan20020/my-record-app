/* ========================================
   カレンダー
======================================== */

const calendarMonthTitle = document.querySelector(
  "#calendar-month-title"
);

const calendarGrid = document.querySelector(
  "#calendar-grid"
);

const previousMonthButton = document.querySelector(
  "#previous-month-button"
);

const nextMonthButton = document.querySelector(
  "#next-month-button"
);

const calendarTodayButton = document.querySelector(
  "#calendar-today-button"
);

const selectedDateTitle = document.querySelector(
  "#selected-date-title"
);

const selectedDateRecords = document.querySelector(
  "#selected-date-records"
);

const currentCalendarDate = new Date();
currentCalendarDate.setDate(1);

let selectedCalendarDate = null;

/**
 * 日付を YYYY-MM-DD 形式にします。
 */
function formatLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * ISO形式などの日時を、端末の現地日付に変換します。
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
 * その日の記録数を種類ごとに取得します。
 */
function getRecordCountsForDate(dateKey) {
  const dailyCount = loadRecords().filter(
    (record) => record.date === dateKey
  ).length;

  const sleepCount = loadSleepRecords().filter(
    (record) =>
      getLocalDateKeyFromDateTime(
        record.waketime || record.bedtime
      ) === dateKey
  ).length;

  const medicineCount = loadMedicineRecords().filter(
    (record) =>
      getLocalDateKeyFromDateTime(record.datetime) ===
      dateKey
  ).length;

  const caffeineCount = loadCaffeineRecords().filter(
    (record) =>
      getLocalDateKeyFromDateTime(record.datetime) ===
      dateKey
  ).length;

  const outingCount = loadOutingRecords().filter(
    (record) =>
      getLocalDateKeyFromDateTime(record.startTime) ===
      dateKey
  ).length;

  const houseworkCount = loadHouseworkRecords().filter(
    (record) =>
      getLocalDateKeyFromDateTime(record.datetime) ===
      dateKey
  ).length;

  return {
    dailyCount,
    sleepCount,
    medicineCount,
    caffeineCount,
    outingCount,
    houseworkCount,
    total:
      dailyCount +
      sleepCount +
      medicineCount +
      caffeineCount +
      outingCount +
      houseworkCount
  };
}

/**
 * カレンダーを表示します。
 */
function displayCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  calendarMonthTitle.textContent =
    `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstWeekday = firstDay.getDay();
  const numberOfDays = lastDay.getDate();

  const todayKey = formatLocalDateKey(new Date());

  let calendarHtml = "";

  for (let index = 0; index < firstWeekday; index += 1) {
    calendarHtml += `
      <div class="calendar-day empty-day"></div>
    `;
  }

  for (let day = 1; day <= numberOfDays; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = formatLocalDateKey(date);
    const counts = getRecordCountsForDate(dateKey);

    const todayClass =
      dateKey === todayKey ? "today" : "";

    const selectedClass =
      dateKey === selectedCalendarDate
        ? "selected-day"
        : "";

    const countHtml =
      counts.total > 0
        ? `
          <span class="calendar-record-count">
            ${counts.total}件
          </span>
        `
        : "";

    calendarHtml += `
      <button
        type="button"
        class="calendar-day ${todayClass} ${selectedClass}"
        data-calendar-date="${dateKey}"
      >
        <span class="calendar-day-number">
          ${day}
        </span>

        ${countHtml}
      </button>
    `;
  }

  calendarGrid.innerHTML = calendarHtml;
}

/**
 * 選択日の見出しを表示します。
 */
function formatSelectedDateTitle(dateKey) {
  const [year, month, day] = dateKey.split("-");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);
}

/**
 * 選択日の「今日の状態」を作ります。
 */
function createDailyCalendarHtml(dateKey) {
  const records = loadRecords()
    .filter((record) => record.date === dateKey)
    .sort((recordA, recordB) =>
      recordA.time.localeCompare(recordB.time)
    );

  if (records.length === 0) {
    return "";
  }

  const items = records
    .map((record) => {
      const conditions =
        record.conditions.length > 0
          ? record.conditions
              .map((condition) => escapeHtml(condition))
              .join("、")
          : "特になし";

      const note =
        record.note !== ""
          ? escapeHtml(record.note).replace(/\n/g, "<br>")
          : "なし";

      return `
        <div class="calendar-record-item">
          <strong>${record.time}</strong><br>
          気分：${record.mood || "未選択"} ／
          眠気：${record.sleepiness || "未選択"} ／
          やる気：${record.motivation || "未選択"}<br>
          体調：${conditions}<br>
          メモ：${note}
        </div>
      `;
    })
    .join("");

  return `
    <div class="calendar-record-group">
      <h3>今日の状態</h3>
      ${items}
    </div>
  `;
}

/**
 * 選択日の睡眠記録を作ります。
 * 就寝した日を基準に表示します。
 */
function createSleepCalendarHtml(dateKey) {
  const records = loadSleepRecords()
    .filter(
      (record) =>
        getLocalDateKeyFromDateTime(
          record.waketime || record.bedtime
        ) === dateKey
    )
    .sort(
      (recordA, recordB) =>
        new Date(recordA.bedtime).getTime() -
        new Date(recordB.bedtime).getTime()
    );

  if (records.length === 0) {
    return "";
  }

  const items = records
    .map((record) => {
      return `
        <div class="calendar-record-item">
          就寝：${formatSleepDateTime(record.bedtime)}<br>
          起床：${formatSleepDateTime(record.waketime)}<br>
          睡眠時間：
          ${formatSleepDuration(
            record.bedtime,
            record.waketime
          )}
        </div>
      `;
    })
    .join("");

  return `
    <div class="calendar-record-group">
      <h3>睡眠</h3>
      ${items}
    </div>
  `;
}

function createMedicineCalendarHtml(dateKey) {
  const records = loadMedicineRecords()
    .filter(
      (record) =>
        getLocalDateKeyFromDateTime(record.datetime) ===
        dateKey
    )
    .sort(
      (recordA, recordB) =>
        new Date(recordA.datetime).getTime() -
        new Date(recordB.datetime).getTime()
    );

  if (records.length === 0) {
    return "";
  }

  const items = records
    .map((record) => {
      return `
        <div class="calendar-record-item">
          <strong>
            ${escapeHtml(record.medicineName)}
          </strong><br>
          ${formatMedicineDateTime(record.datetime)}<br>
          服用量：
          ${record.dose !== ""
            ? escapeHtml(record.dose)
            : "未入力"}<br>
          メモ：
          ${record.note !== ""
            ? escapeHtml(record.note)
            : "なし"}
        </div>
      `;
    })
    .join("");

  return `
    <div class="calendar-record-group">
      <h3>薬</h3>
      ${items}
    </div>
  `;
}

function createCaffeineCalendarHtml(dateKey) {
  const records = loadCaffeineRecords()
    .filter(
      (record) =>
        getLocalDateKeyFromDateTime(record.datetime) ===
        dateKey
    )
    .sort(
      (recordA, recordB) =>
        new Date(recordA.datetime).getTime() -
        new Date(recordB.datetime).getTime()
    );

  if (records.length === 0) {
    return "";
  }

  const total = records.reduce(
    (sum, record) => sum + Number(record.amount),
    0
  );

  const items = records
    .map((record) => {
      return `
        <div class="calendar-record-item">
          <strong>${escapeHtml(record.type)}</strong><br>
          ${formatCaffeineDateTime(record.datetime)}<br>
          ${record.amount}mg<br>
          メモ：
          ${record.note !== ""
            ? escapeHtml(record.note)
            : "なし"}
        </div>
      `;
    })
    .join("");

  return `
    <div class="calendar-record-group">
      <h3>カフェイン（合計 ${total}mg）</h3>
      ${items}
    </div>
  `;
}

function createOutingCalendarHtml(dateKey) {
  const records = loadOutingRecords()
    .filter(
      (record) =>
        getLocalDateKeyFromDateTime(record.startTime) ===
        dateKey
    )
    .sort(
      (recordA, recordB) =>
        new Date(recordA.startTime).getTime() -
        new Date(recordB.startTime).getTime()
    );

  if (records.length === 0) {
    return "";
  }

  const items = records
    .map((record) => {
      return `
        <div class="calendar-record-item">
          <strong>${escapeHtml(record.purpose)}</strong><br>
          外出：${formatOutingDateTime(record.startTime)}<br>
          帰宅：${formatOutingDateTime(record.returnTime)}<br>
          外出時間：
          ${formatOutingDuration(
            record.startTime,
            record.returnTime
          )}<br>
          メモ：
          ${record.note !== ""
            ? escapeHtml(record.note)
            : "なし"}
        </div>
      `;
    })
    .join("");

  return `
    <div class="calendar-record-group">
      <h3>外出</h3>
      ${items}
    </div>
  `;
}

function createHouseworkCalendarHtml(dateKey) {
  const records = loadHouseworkRecords()
    .filter(
      (record) =>
        getLocalDateKeyFromDateTime(record.datetime) ===
        dateKey
    )
    .sort(
      (recordA, recordB) =>
        new Date(recordA.datetime).getTime() -
        new Date(recordB.datetime).getTime()
    );

  if (records.length === 0) {
    return "";
  }

  const items = records
    .map((record) => {
      const houseworkItems = record.items
        .map((item) => escapeHtml(item))
        .join("、");

      return `
        <div class="calendar-record-item">
          <strong>${houseworkItems}</strong><br>
          ${formatHouseworkDateTime(record.datetime)}<br>
          メモ：
          ${record.note !== ""
            ? escapeHtml(record.note)
            : "なし"}
        </div>
      `;
    })
    .join("");

  return `
    <div class="calendar-record-group">
      <h3>家事</h3>
      ${items}
    </div>
  `;
}

/**
 * 選択した日のすべての記録を表示します。
 */
function displaySelectedDateRecords(dateKey) {
  selectedCalendarDate = dateKey;

  selectedDateTitle.textContent =
    formatSelectedDateTitle(dateKey);

  const html = [
    createDailyCalendarHtml(dateKey),
    createSleepCalendarHtml(dateKey),
    createMedicineCalendarHtml(dateKey),
    createCaffeineCalendarHtml(dateKey),
    createOutingCalendarHtml(dateKey),
    createHouseworkCalendarHtml(dateKey)
  ].join("");

  selectedDateRecords.innerHTML =
    html !== ""
      ? html
      : `
        <p class="empty-message">
          この日の記録はありません。
        </p>
      `;

  displayCalendar();
}

calendarGrid.addEventListener("click", (event) => {
  const dayButton = event.target.closest(
    "[data-calendar-date]"
  );

  if (dayButton === null) {
    return;
  }

  displaySelectedDateRecords(
    dayButton.dataset.calendarDate
  );
});

previousMonthButton.addEventListener("click", () => {
  currentCalendarDate.setMonth(
    currentCalendarDate.getMonth() - 1
  );

  selectedCalendarDate = null;
  displayCalendar();
});

nextMonthButton.addEventListener("click", () => {
  currentCalendarDate.setMonth(
    currentCalendarDate.getMonth() + 1
  );

  selectedCalendarDate = null;
  displayCalendar();
});

calendarTodayButton.addEventListener("click", () => {
  const today = new Date();

  currentCalendarDate.setFullYear(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  displaySelectedDateRecords(
    formatLocalDateKey(today)
  );
});

