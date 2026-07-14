const MEDICINE_LIST_STORAGE_KEY = "myRegisteredMedicines";
const MEDICINE_RECORD_STORAGE_KEY = "myMedicineRecords";

const medicineQuickList = document.querySelector("#medicine-quick-list");
const medicineRegistrationForm = document.querySelector("#medicine-registration-form");
const editingMedicineIdInput = document.querySelector("#editing-medicine-id");
const medicineFormTitle = document.querySelector("#medicine-form-title");
const medicineNameInput = document.querySelector("#medicine-name");
const medicineDefaultDoseInput = document.querySelector("#medicine-default-dose");
const medicineDefaultNoteInput = document.querySelector("#medicine-default-note");
const medicineRegistrationSubmit = document.querySelector("#medicine-registration-submit");
const cancelMedicineEditButton = document.querySelector("#cancel-medicine-edit");
const registeredMedicineList = document.querySelector("#registered-medicine-list");
const currentMedicineForm = document.querySelector("#current-medicine-form");
const currentMedicineSelect = document.querySelector("#current-medicine-select");
const currentMedicineDoseInput = document.querySelector("#current-medicine-dose");
const currentMedicineNoteInput = document.querySelector("#current-medicine-note");
const manualMedicineForm = document.querySelector("#manual-medicine-form");
const manualMedicineSelect = document.querySelector("#manual-medicine-select");
const manualMedicineDatetimeInput = document.querySelector("#manual-medicine-datetime");
const manualMedicineDoseInput = document.querySelector("#manual-medicine-dose");
const manualMedicineNoteInput = document.querySelector("#manual-medicine-note");
const medicineRecordList = document.querySelector("#medicine-record-list");
const medicineStatusMessage = document.querySelector("#medicine-status-message");

function loadRegisteredMedicines() {
  return loadArrayFromStorage(MEDICINE_LIST_STORAGE_KEY).map((medicine) => ({
    ...medicine,
    defaultNote: medicine.defaultNote || ""
  }));
}

function saveRegisteredMedicines(medicines) {
  saveArrayToStorage(MEDICINE_LIST_STORAGE_KEY, medicines);
}

function loadMedicineRecords() {
  return loadArrayFromStorage(MEDICINE_RECORD_STORAGE_KEY);
}

function saveMedicineRecords(records) {
  saveArrayToStorage(MEDICINE_RECORD_STORAGE_KEY, records);
}

function findMedicineById(medicineId) {
  return loadRegisteredMedicines().find((medicine) => medicine.id === medicineId);
}

function showMedicineStatus(message) {
  medicineStatusMessage.textContent = message;
  window.setTimeout(() => {
    if (medicineStatusMessage.textContent === message) {
      medicineStatusMessage.textContent = "";
    }
  }, 4000);
}

function setCurrentMedicineDateTime() {
  manualMedicineDatetimeInput.value = formatDateTimeLocalValue(new Date().toISOString());
}

function updateMedicineSelects() {
  const medicines = loadRegisteredMedicines();
  const options = medicines.map((medicine) => (
    `<option value="${medicine.id}">${escapeHtml(medicine.name)}</option>`
  )).join("");

  currentMedicineSelect.innerHTML = `<option value="">薬を選択してください</option>${options}`;
  manualMedicineSelect.innerHTML = `<option value="">薬を選択してください</option>${options}`;
}

function displayMedicineQuickButtons() {
  const medicines = loadRegisteredMedicines();

  if (medicines.length === 0) {
    medicineQuickList.innerHTML = '<p class="empty-message">まだ薬は登録されていません。</p>';
    return;
  }

  medicineQuickList.innerHTML = medicines.map((medicine) => `
    <button type="button" class="quick-record-button medicine-quick-button"
      data-medicine-id="${medicine.id}">
      <strong>${escapeHtml(medicine.name)}</strong>
      <span>${escapeHtml(medicine.defaultDose || "服用量未設定")}</span>
    </button>
  `).join("");
}

function displayRegisteredMedicines() {
  const medicines = loadRegisteredMedicines();

  if (medicines.length === 0) {
    registeredMedicineList.innerHTML = '<p class="empty-message">まだ薬は登録されていません。</p>';
    updateMedicineSelects();
    displayMedicineQuickButtons();
    return;
  }

  registeredMedicineList.innerHTML = medicines.map((medicine) => `
    <div class="registered-medicine-card">
      <div class="registered-medicine-information">
        <p class="registered-medicine-name">${escapeHtml(medicine.name)}</p>
        <p class="registered-medicine-dose">通常量：${escapeHtml(medicine.defaultDose || "未設定")}</p>
        <p class="registered-medicine-dose">メモ：${escapeHtml(medicine.defaultNote || "なし")}</p>
      </div>
      <div class="record-action-buttons">
        <button type="button" class="edit-button registered-medicine-edit-button"
          data-medicine-id="${medicine.id}">編集</button>
        <button type="button" class="delete-button registered-medicine-delete-button"
          data-medicine-id="${medicine.id}">削除</button>
      </div>
    </div>
  `).join("");

  updateMedicineSelects();
  displayMedicineQuickButtons();
}

function displayMedicineRecords() {
  const records = loadMedicineRecords().sort(
    (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
  );

  if (records.length === 0) {
    medicineRecordList.innerHTML = '<p class="empty-message">まだ服用記録はありません。</p>';
    return;
  }

  medicineRecordList.innerHTML = records.map((record) => `
    <article class="medicine-record-card">
      <div class="medicine-record-header">
        <div>
          <h3>${escapeHtml(record.medicineName)}</h3>
          <p class="medicine-record-datetime">${formatJapaneseDateTime(record.datetime)}</p>
        </div>
        <button type="button" class="delete-button medicine-record-delete-button"
          data-medicine-record-id="${record.id}">削除</button>
      </div>
      <div class="medicine-record-details">
        <p><strong>服用量：</strong>${escapeHtml(record.dose || "未入力")}</p>
        <p><strong>メモ：</strong>${escapeHtml(record.note || "なし")}</p>
      </div>
    </article>
  `).join("");
}

function cancelMedicineEditing() {
  editingMedicineIdInput.value = "";
  medicineRegistrationForm.reset();
  medicineFormTitle.textContent = "薬を登録";
  medicineRegistrationSubmit.textContent = "薬を登録";
  cancelMedicineEditButton.classList.add("hidden-button");
}

function startMedicineEditing(medicineId) {
  const medicine = findMedicineById(medicineId);
  if (!medicine) return;

  editingMedicineIdInput.value = medicine.id;
  medicineNameInput.value = medicine.name;
  medicineDefaultDoseInput.value = medicine.defaultDose || "";
  medicineDefaultNoteInput.value = medicine.defaultNote || "";
  medicineFormTitle.textContent = "薬を編集";
  medicineRegistrationSubmit.textContent = "変更を保存";
  cancelMedicineEditButton.classList.remove("hidden-button");
  medicineRegistrationForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addMedicineRecord(
  medicine,
  dose,
  note,
  datetime
) {
  const records = loadMedicineRecords();

  records.push({
    id: createRecordId(),
    medicineId: medicine.id,
    medicineName: medicine.name,
    dose,
    note,
    datetime
  });

  saveMedicineRecords(records);

  displayMedicineRecords();

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

medicineRegistrationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = medicineNameInput.value.trim();
  const defaultDose = medicineDefaultDoseInput.value.trim();
  const defaultNote = medicineDefaultNoteInput.value.trim();
  const editingId = editingMedicineIdInput.value;

  if (!name) {
    alert("薬の名前を入力してください。");
    return;
  }

  const medicines = loadRegisteredMedicines();
  const duplicate = medicines.some((medicine) =>
    medicine.id !== editingId && medicine.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    alert("同じ名前の薬がすでに登録されています。");
    return;
  }

  if (editingId) {
    const medicine = medicines.find((item) => item.id === editingId);
    if (!medicine) return;
    medicine.name = name;
    medicine.defaultDose = defaultDose;
    medicine.defaultNote = defaultNote;
  } else {
    medicines.push({
      id: createRecordId(),
      name,
      defaultDose,
      defaultNote
    });
  }

  saveRegisteredMedicines(medicines);
  cancelMedicineEditing();
  refreshAllScreens();
  showMedicineStatus(editingId ? "薬の設定を変更しました。" : "薬を登録しました。");
});

cancelMedicineEditButton.addEventListener("click", cancelMedicineEditing);

medicineQuickList.addEventListener("click", (event) => {
  const button = event.target.closest(".medicine-quick-button");
  if (!button) return;

  const medicine = findMedicineById(button.dataset.medicineId);
  if (!medicine) return;

  addMedicineRecord(
    medicine,
    medicine.defaultDose || "",
    medicine.defaultNote || "",
    new Date().toISOString()
  );
  showMedicineStatus(`${medicine.name}を現在時刻で記録しました。`);
});

currentMedicineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const medicine = findMedicineById(currentMedicineSelect.value);
  if (!medicine) {
    alert("薬を選択してください。");
    return;
  }

  addMedicineRecord(
    medicine,
    currentMedicineDoseInput.value.trim() || medicine.defaultDose || "",
    currentMedicineNoteInput.value.trim(),
    new Date().toISOString()
  );
  currentMedicineForm.reset();
  showMedicineStatus("現在時刻で服用を記録しました。");
});

manualMedicineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const medicine = findMedicineById(manualMedicineSelect.value);
  if (!medicine) {
    alert("薬を選択してください。");
    return;
  }
  if (!manualMedicineDatetimeInput.value) {
    alert("服用日時を入力してください。");
    return;
  }

  addMedicineRecord(
    medicine,
    manualMedicineDoseInput.value.trim() || medicine.defaultDose || "",
    manualMedicineNoteInput.value.trim(),
    new Date(manualMedicineDatetimeInput.value).toISOString()
  );
  manualMedicineForm.reset();
  setCurrentMedicineDateTime();
  showMedicineStatus("服用記録を保存しました。");
});

currentMedicineSelect.addEventListener("change", () => {
  const medicine = findMedicineById(currentMedicineSelect.value);
  currentMedicineDoseInput.value = medicine?.defaultDose || "";
  currentMedicineNoteInput.value = medicine?.defaultNote || "";
});

manualMedicineSelect.addEventListener("change", () => {
  const medicine = findMedicineById(manualMedicineSelect.value);
  manualMedicineDoseInput.value = medicine?.defaultDose || "";
  manualMedicineNoteInput.value = medicine?.defaultNote || "";
});

registeredMedicineList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".registered-medicine-edit-button");
  if (editButton) {
    startMedicineEditing(editButton.dataset.medicineId);
    return;
  }

  const deleteButton = event.target.closest(".registered-medicine-delete-button");
  if (!deleteButton || !confirm("この薬を登録一覧から削除しますか？\n過去の服用記録は残ります。")) return;

  saveRegisteredMedicines(
    loadRegisteredMedicines().filter((medicine) => medicine.id !== deleteButton.dataset.medicineId)
  );
  cancelMedicineEditing();
  refreshAllScreens();
});

medicineRecordList.addEventListener("click", (event) => {
  const button = event.target.closest(".medicine-record-delete-button");
  if (!button || !confirm("この服用記録を削除しますか？")) return;

  saveMedicineRecords(
    loadMedicineRecords().filter((record) => record.id !== button.dataset.medicineRecordId)
  );
  refreshAllScreens();
});

setCurrentMedicineDateTime();
displayRegisteredMedicines();
displayMedicineRecords();
