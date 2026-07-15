/* ========================================
   統計
======================================== */

const statisticsPeriod = document.querySelector(
  "#statistics-period"
);

const statisticsPeriodText = document.querySelector(
  "#statistics-period-text"
);

const averageMood = document.querySelector(
  "#average-mood"
);

const averageSleepiness = document.querySelector(
  "#average-sleepiness"
);

const averageMotivation = document.querySelector(
  "#average-motivation"
);

const averageSleepDuration = document.querySelector(
  "#average-sleep-duration"
);

const totalCaffeine = document.querySelector(
  "#total-caffeine"
);

const averageCaffeine = document.querySelector(
  "#average-caffeine"
);

const outingCount = document.querySelector(
  "#outing-count"
);

const outingTotalDuration = document.querySelector(
  "#outing-total-duration"
);

const medicineCount = document.querySelector(
  "#medicine-count"
);

const houseworkCount = document.querySelector(
  "#housework-count"
);

const moodBar = document.querySelector("#mood-bar");
const sleepinessBar = document.querySelector(
  "#sleepiness-bar"
);
const motivationBar = document.querySelector(
  "#motivation-bar"
);

const moodBarValue = document.querySelector(
  "#mood-bar-value"
);

const sleepinessBarValue = document.querySelector(
  "#sleepiness-bar-value"
);

const motivationBarValue = document.querySelector(
  "#motivation-bar-value"
);

const houseworkStatisticsList = document.querySelector(
  "#housework-statistics-list"
);


/**
 * 集計期間の開始日時を取得します。
 */
function getStatisticsStartDate() {
  const selectedPeriod = statisticsPeriod.value;

  if (selectedPeriod === "all") {
    return null;
  }

  const numberOfDays = Number(selectedPeriod);
  const startDate = new Date();

  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(
    startDate.getDate() - (numberOfDays - 1)
  );

  return startDate;
}

/**
 * 日時が選択期間内か判定します。
 */
function isWithinStatisticsPeriod(dateTimeText) {
  const date = new Date(dateTimeText);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const startDate = getStatisticsStartDate();

  if (startDate === null) {
    return true;
  }

  return date >= startDate;
}

/**
 * YYYY-MM-DD形式の日付が期間内か判定します。
 */
function isDateKeyWithinStatisticsPeriod(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const startDate = getStatisticsStartDate();

  if (startDate === null) {
    return true;
  }

  return date >= startDate;
}

function calculateAverage(values) {
  const validValues = values
    .map(Number)
    .filter((value) => !Number.isNaN(value));

  if (validValues.length === 0) {
    return null;
  }

  const total = validValues.reduce(
    (sum, value) => sum + value,
    0
  );

  return total / validValues.length;
}

function formatAverage(value) {
  return value === null ? "―" : value.toFixed(1);
}

function setAverageBar(
  barElement,
  valueElement,
  average
) {
  if (average === null) {
    barElement.style.width = "0%";
    valueElement.textContent = "―";
    return;
  }

  const percentage = Math.min(
    100,
    Math.max(0, (average / 5) * 100)
  );

  barElement.style.width = `${percentage}%`;
  valueElement.textContent = average.toFixed(1);
}

function formatMinutesAsDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  return `${hours}時間${minutes}分`;
}

/**
 * 項目別の内訳を棒グラフ風に表示します。
 */
function displayCategoryStatistics(
  container,
  countMap,
  emptyMessage
) {
    if (!container) {
    console.warn(
      "統計を表示するHTML要素が見つかりません。"
    );
    return;
  }
  const entries = Object.entries(countMap).sort(
    (entryA, entryB) => entryB[1] - entryA[1]
  );

  if (entries.length === 0) {
    container.innerHTML = `
      <p class="empty-message">
        ${emptyMessage}
      </p>
    `;
    return;
  }

  const maximumCount = Math.max(
    ...entries.map((entry) => entry[1])
  );

  container.innerHTML = entries
    .map(([name, count]) => {
      const percentage =
        maximumCount > 0
          ? (count / maximumCount) * 100
          : 0;

      return `
        <div class="statistics-list-row">
          <span>${escapeHtml(name)}</span>

          <div class="statistics-small-bar">
            <div
              class="statistics-small-bar-fill"
              style="width: ${percentage}%"
            ></div>
          </div>

          <span class="statistics-list-count">
            ${count}回
          </span>
        </div>
      `;
    })
    .join("");
}

/**
 * 統計を更新します。
 */
function displayStatistics() {
  const selectedPeriod = statisticsPeriod.value;

  if (selectedPeriod === "all") {
    statisticsPeriodText.textContent =
      "保存されている全記録を集計しています。";
  } else {
    statisticsPeriodText.textContent =
      `今日を含む過去${selectedPeriod}日間を集計しています。`;
  }

  const dailyRecords = loadRecords().filter(
    (record) =>
      isDateKeyWithinStatisticsPeriod(record.date)
  );

  const moodAverage = calculateAverage(
    dailyRecords
      .filter((record) => record.mood !== "")
      .map((record) => record.mood)
  );

  const sleepinessAverage = calculateAverage(
    dailyRecords
      .filter((record) => record.sleepiness !== "")
      .map((record) => record.sleepiness)
  );

  const motivationAverage = calculateAverage(
    dailyRecords
      .filter((record) => record.motivation !== "")
      .map((record) => record.motivation)
  );

  averageMood.textContent = formatAverage(moodAverage);
  averageSleepiness.textContent =
    formatAverage(sleepinessAverage);
  averageMotivation.textContent =
    formatAverage(motivationAverage);

  setAverageBar(
    moodBar,
    moodBarValue,
    moodAverage
  );

  setAverageBar(
    sleepinessBar,
    sleepinessBarValue,
    sleepinessAverage
  );

  setAverageBar(
    motivationBar,
    motivationBarValue,
    motivationAverage
  );

  const sleepRecords = loadSleepRecords().filter(
    (record) =>
      record.waketime &&
      isWithinStatisticsPeriod(record.waketime)
  );

  const sleepMinutes = sleepRecords
    .map((record) =>
      calculateSleepDuration(
        record.bedtime,
        record.waketime
      )
    )
    .filter((duration) => duration !== null)
    .map((duration) => duration.totalMinutes);

  if (sleepMinutes.length === 0) {
    averageSleepDuration.textContent = "―";
  } else {
    const totalSleepMinutes = sleepMinutes.reduce(
      (sum, minutes) => sum + minutes,
      0
    );

    const averageMinutes =
      totalSleepMinutes / sleepMinutes.length;

    averageSleepDuration.textContent =
      formatMinutesAsDuration(averageMinutes);
  }

  const caffeineRecords = loadCaffeineRecords().filter(
    (record) =>
      isWithinStatisticsPeriod(record.datetime)
  );

  const caffeineTotal = caffeineRecords.reduce(
    (sum, record) => sum + Number(record.amount),
    0
  );

  totalCaffeine.textContent = `${caffeineTotal}mg`;

  let periodDays;

  if (selectedPeriod === "all") {
    const recordDates = caffeineRecords
      .map((record) => new Date(record.datetime))
      .filter(
        (date) => !Number.isNaN(date.getTime())
      );

    if (recordDates.length === 0) {
      periodDays = 0;
    } else {
      const oldestDate = new Date(
        Math.min(
          ...recordDates.map((date) => date.getTime())
        )
      );

      const today = new Date();
      oldestDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      periodDays =
        Math.floor(
          (today - oldestDate) /
            (1000 * 60 * 60 * 24)
        ) + 1;
    }
  } else {
    periodDays = Number(selectedPeriod);
  }

  const caffeineDailyAverage =
    periodDays > 0
      ? caffeineTotal / periodDays
      : 0;

  averageCaffeine.textContent =
    `1日平均 ${caffeineDailyAverage.toFixed(1)}mg`;

  const outingRecords = loadOutingRecords().filter(
    (record) =>
      isWithinStatisticsPeriod(record.startTime)
  );

  outingCount.textContent =
    `${outingRecords.length}回`;

  const totalOutingMinutes = outingRecords.reduce(
    (sum, record) => {
      if (!record.returnTime) {
        return sum;
      }

      const startDate = new Date(record.startTime);
      const returnDate = new Date(record.returnTime);

      const difference =
        returnDate.getTime() - startDate.getTime();

      if (difference <= 0) {
        return sum;
      }

      return sum + difference / (1000 * 60);
    },
    0
  );

  outingTotalDuration.textContent =
    `合計 ${formatMinutesAsDuration(
      totalOutingMinutes
    )}`;

  const medicineRecords =
    loadMedicineRecords().filter((record) =>
      isWithinStatisticsPeriod(record.datetime)
    );

  medicineCount.textContent =
    `${medicineRecords.length}回`;

  const medicineMap = {};

  medicineRecords.forEach((record) => {
    const name = record.medicineName || "名称不明";

    medicineMap[name] =
      (medicineMap[name] || 0) + 1;
  });


  const houseworkRecords =
    loadHouseworkRecords().filter((record) =>
      isWithinStatisticsPeriod(record.datetime)
    );

  houseworkCount.textContent =
    `${houseworkRecords.length}回`;

  const houseworkMap = {};

  houseworkRecords.forEach((record) => {
    record.items.forEach((item) => {
      houseworkMap[item] =
        (houseworkMap[item] || 0) + 1;
    });
  });

  displayCategoryStatistics(
    houseworkStatisticsList,
    houseworkMap,
    "集計対象の家事記録はありません。"
  );
}

statisticsPeriod.addEventListener(
  "change",
  displayStatistics
);

displayCalendar();
displayStatistics();

