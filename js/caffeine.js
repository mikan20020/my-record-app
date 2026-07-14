const CAFFEINE_STORAGE_KEY = "myCaffeineRecords";
const CAFFEINE_PRESET_STORAGE_KEY = "myCaffeinePresets";

const caffeineQuickList = document.querySelector("#caffeine-quick-list");
const caffeinePresetForm = document.querySelector("#caffeine-preset-form");
const editingCaffeinePresetIdInput = document.querySelector("#editing-caffeine-preset-id");
const caffeinePresetFormTitle = document.querySelector("#caffeine-preset-form-title");
const caffeinePresetNameInput = document.querySelector("#caffeine-preset-name");
const caffeinePresetAmountInput = document.querySelector("#caffeine-preset-amount");
const caffeinePresetNoteInput = document.querySelector("#caffeine-preset-note");
const caffeinePresetSubmit = document.querySelector("#caffeine-preset-submit");
const cancelCaffeinePresetEditButton = document.querySelector("#cancel-caffeine-preset-edit");
const registeredCaffeinePresetList = document.querySelector("#registered-caffeine-preset-list");
const currentCaffeineForm = document.querySelector("#current-caffeine-form");
const currentCaffeineType = document.querySelector("#current-caffeine-type");
const currentCaffeineOtherLabel = document.querySelector("#current-caffeine-other-label");
const currentCaffeineOther = document.querySelector("#current-caffeine-other");
const currentCaffeineAmount = document.querySelector("#current-caffeine-amount");
const currentCaffeineNote = document.querySelector("#current-caffeine-note");
const manualCaffeineForm = document.querySelector("#manual-caffeine-form");
const manualCaffeineType = document.querySelector("#manual-caffeine-type");
const manualCaffeineOtherLabel = document.querySelector("#manual-caffeine-other-label");
const manualCaffeineOther = document.querySelector("#manual-caffeine-other");
const manualCaffeineDatetime = document.querySelector("#manual-caffeine-datetime");
const manualCaffeineAmount = document.querySelector("#manual-caffeine-amount");
const manualCaffeineNote = document.querySelector("#manual-caffeine-note");
const caffeineRecordList = document.querySelector("#caffeine-record-list");
const caffeineStatusMessage = document.querySelector("#caffeine-status-message");
const todayCaffeineTotal = document.querySelector("#today-caffeine-total");

function loadCaffeineRecords() {
  return loadArrayFromStorage(CAFFEINE_STORAGE_KEY);
}

function saveCaffeineRecords(records) {
  saveArrayToStorage(CAFFEINE_STORAGE_KEY, records);
}

function loadCaffeinePresets() {
  return loadArrayFromStorage(CAFFEINE_PRESET_STORAGE_KEY);
}

function saveCaffeinePresets(presets) {
  saveArrayToStorage(CAFFEINE_PRESET_STORAGE_KEY, presets);
}

function setCurrentCaffeineDateTime() {
  manualCaffeineDatetime.value = formatDateTimeLocalValue(new Date().toISOString());
}

function updateCaffeineOtherInput(selectElement, labelElement, inputElement) {
  const visible = selectElement.value === "その他";
  labelElement.style.display = visible ? "block" : "none";
  if (!visible) inputElement.value = "";
}

function getCaffeineTypeName(selectElement, otherInputElement) {
  return selectElement.value === "その他"
    ? otherInputElement.value.trim()
    : selectElement.value;
}

function showCaffeineStatus(message) {
  caffeineStatusMessage.textContent = message;
  window.setTimeout(() => {
    if (caffeineStatusMessage.textContent === message) {
      caffeineStatusMessage.textContent = "";
    }
  }, 4000);
}

function displayCaffeinePresets() {
  const presets = loadCaffeinePresets();

  if (presets.length === 0) {
    caffeineQuickList.innerHTML = '<p class="empty-message">まだよく使う項目は登録されていません。</p>';
    registeredCaffeinePresetList.innerHTML = '<p class="empty-message">まだよく使う項目は登録されていません。</p>';
    return;
  }

  caffeineQuickList.innerHTML = presets.map((preset) => `
    <button type="button" class="quick-record-button caffeine-quick-button"
      data-preset-id="${preset.id}">
      <strong>${escapeHtml(preset.name)}</strong>
      <span>${Number(preset.amount)}mg</span>
    </button>
  `).join("");

  registeredCaffeinePresetList.innerHTML = presets.map((preset) => `
    <div class="registered-medicine-card">
      <div class="registered-medicine-information">
        <p class="registered-medicine-name">${escapeHtml(preset.name)}</p>
        <p class="registered-medicine-dose">${Number(preset.amount)}mg</p>
        <p class="registered-medicine-dose">メモ：${escapeHtml(preset.note || "なし")}</p>
      </div>
      <div class="record-action-buttons">
        <button type="button" class="edit-button caffeine-preset-edit-button"
          data-preset-id="${preset.id}">編集</button>
        <button type="button" class="delete-button caffeine-preset-delete-button"
          data-preset-id="${preset.id}">削除</button>
      </div>
    </div>
  `).join("");
}

function displayCaffeineRecords() {
  const records = loadCaffeineRecords();
  const todayKey = formatLocalDateKey(new Date());
  const todayTotal = records
    .filter((record) => getLocalDateKeyFromDateTime(record.datetime) === todayKey)
    .reduce((sum, record) => sum + Number(record.amount), 0);

  todayCaffeineTotal.textContent = `今日の合計：${todayTotal}mg`;

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
  );

  if (sortedRecords.length === 0) {
    caffeineRecordList.innerHTML = '<p class="empty-message">まだカフェイン記録はありません。</p>';
    return;
  }

  caffeineRecordList.innerHTML = sortedRecords.map((record) => `
    <article class="caffeine-record-card">
      <div class="caffeine-record-header">
        <div>
          <h3>${escapeHtml(record.type)}</h3>
          <p class="caffeine-record-datetime">${formatJapaneseDateTime(record.datetime)}</p>
        </div>
        <button type="button" class="delete-button caffeine-delete-button"
          data-caffeine-id="${record.id}">削除</button>
      </div>
      <p class="caffeine-amount">${Number(record.amount)}mg</p>
      <p class="caffeine-note"><strong>メモ：</strong>${escapeHtml(record.note || "なし")}</p>
    </article>
  `).join("");
}

function addCaffeineRecord(type, amount, note, datetime) {
  const records = loadCaffeineRecords();

  records.push({
    id: createRecordId(),
    type,
    amount: Number(amount),
    note,
    datetime
  });

  saveCaffeineRecords(records);

  displayCaffeineRecords();

  if (typeof displayCalendar === "function") {
    displayCalendar();
  }

  if (typeof displayStatistics === "function") {
    displayStatistics();
  }

  if (typeof displayDataCounts === "function") {
    displayDataCounts();
  }
}

function cancelCaffeinePresetEditing() {
  editingCaffeinePresetIdInput.value = "";
  caffeinePresetForm.reset();
  caffeinePresetFormTitle.textContent = "よく使う項目を登録";
  caffeinePresetSubmit.textContent = "項目を登録";
  cancelCaffeinePresetEditButton.classList.add("hidden-button");
}

function startCaffeinePresetEditing(presetId) {
  const preset = loadCaffeinePresets().find((item) => item.id === presetId);
  if (!preset) return;

  editingCaffeinePresetIdInput.value = preset.id;
  caffeinePresetNameInput.value = preset.name;
  caffeinePresetAmountInput.value = preset.amount;
  caffeinePresetNoteInput.value = preset.note || "";
  caffeinePresetFormTitle.textContent = "よく使う項目を編集";
  caffeinePresetSubmit.textContent = "変更を保存";
  cancelCaffeinePresetEditButton.classList.remove("hidden-button");
  caffeinePresetForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

caffeinePresetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = caffeinePresetNameInput.value.trim();
  const amountText = caffeinePresetAmountInput.value;
  const amount = Number(amountText);
  const note = caffeinePresetNoteInput.value.trim();
  const editingId = editingCaffeinePresetIdInput.value;

  if (!name) {
    alert("項目の名前を入力してください。");
    return;
  }
  if (amountText === "" || Number.isNaN(amount) || amount < 0) {
    alert("カフェイン量を正しく入力してください。");
    return;
  }

  const presets = loadCaffeinePresets();
  const duplicate = presets.some((preset) =>
    preset.id !== editingId && preset.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    alert("同じ名前の項目がすでに登録されています。");
    return;
  }

  if (editingId) {
    const preset = presets.find((item) => item.id === editingId);
    if (!preset) return;
    preset.name = name;
    preset.amount = amount;
    preset.note = note;
  } else {
    presets.push({ id: createRecordId(), name, amount, note });
  }

  saveCaffeinePresets(presets);
  cancelCaffeinePresetEditing();
  displayCaffeinePresets();
  showCaffeineStatus(editingId ? "よく使う項目を変更しました。" : "よく使う項目を登録しました。");
});

cancelCaffeinePresetEditButton.addEventListener("click", cancelCaffeinePresetEditing);

caffeineQuickList.addEventListener("click", (event) => {
  const button = event.target.closest(".caffeine-quick-button");
  if (!button) return;

  const preset = loadCaffeinePresets().find((item) => item.id === button.dataset.presetId);
  if (!preset) return;

  addCaffeineRecord(preset.name, preset.amount, preset.note || "", new Date().toISOString());
  showCaffeineStatus(`${preset.name}を現在時刻で記録しました。`);
});

registeredCaffeinePresetList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".caffeine-preset-edit-button");
  if (editButton) {
    startCaffeinePresetEditing(editButton.dataset.presetId);
    return;
  }

  const deleteButton = event.target.closest(".caffeine-preset-delete-button");
  if (!deleteButton || !confirm("このよく使う項目を削除しますか？\n過去の記録は残ります。")) return;

  saveCaffeinePresets(
    loadCaffeinePresets().filter((preset) => preset.id !== deleteButton.dataset.presetId)
  );
  cancelCaffeinePresetEditing();
  displayCaffeinePresets();
});

currentCaffeineType.addEventListener("change", () => {
  updateCaffeineOtherInput(currentCaffeineType, currentCaffeineOtherLabel, currentCaffeineOther);
});

manualCaffeineType.addEventListener("change", () => {
  updateCaffeineOtherInput(manualCaffeineType, manualCaffeineOtherLabel, manualCaffeineOther);
});

currentCaffeineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const type = getCaffeineTypeName(currentCaffeineType, currentCaffeineOther);
  const amountText = currentCaffeineAmount.value;
  const amount = Number(amountText);

  if (!type) {
    alert("飲み物・食品を選択または入力してください。");
    return;
  }
  if (amountText === "" || Number.isNaN(amount) || amount < 0) {
    alert("カフェイン量を正しく入力してください。");
    return;
  }

  addCaffeineRecord(type, amount, currentCaffeineNote.value.trim(), new Date().toISOString());
  currentCaffeineForm.reset();
  updateCaffeineOtherInput(currentCaffeineType, currentCaffeineOtherLabel, currentCaffeineOther);
  showCaffeineStatus("現在時刻でカフェインを記録しました。");
});

manualCaffeineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const type = getCaffeineTypeName(manualCaffeineType, manualCaffeineOther);
  const amountText = manualCaffeineAmount.value;
  const amount = Number(amountText);

  if (!type || !manualCaffeineDatetime.value) {
    alert("飲み物・食品と摂取日時を入力してください。");
    return;
  }
  if (amountText === "" || Number.isNaN(amount) || amount < 0) {
    alert("カフェイン量を正しく入力してください。");
    return;
  }

  addCaffeineRecord(
    type,
    amount,
    manualCaffeineNote.value.trim(),
    new Date(manualCaffeineDatetime.value).toISOString()
  );
  manualCaffeineForm.reset();
  setCurrentCaffeineDateTime();
  updateCaffeineOtherInput(manualCaffeineType, manualCaffeineOtherLabel, manualCaffeineOther);
  showCaffeineStatus("カフェイン記録を保存しました。");
});

caffeineRecordList.addEventListener("click", (event) => {
  const button = event.target.closest(".caffeine-delete-button");
  if (!button || !confirm("このカフェイン記録を削除しますか？")) return;

  saveCaffeineRecords(
    loadCaffeineRecords().filter((record) => record.id !== button.dataset.caffeineId)
  );
  refreshAllScreens();
});

setCurrentCaffeineDateTime();
displayCaffeinePresets();
displayCaffeineRecords();
