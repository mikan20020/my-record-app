const screens = document.querySelectorAll(".screen");
const menuButtons = document.querySelectorAll(".menu-button");

const backButton = document.querySelector("#back-button");
const screenTitle = document.querySelector("#screen-title");
const homeDate = document.querySelector("#home-date");

function showScreen(screenId, title) {
  screens.forEach((screen) => {
    screen.classList.remove("active-screen");
  });

  const selectedScreen = document.querySelector(`#${screenId}`);

  if (selectedScreen === null) {
    console.error(`画面が見つかりません: ${screenId}`);
    return;
  }

  selectedScreen.classList.add("active-screen");
  screenTitle.textContent = title;

  if (screenId === "home-screen") {
    backButton.classList.add("hidden");
  } else {
    backButton.classList.remove("hidden");
  }

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

/**
 * ホーム画面の日付を表示します。
 */
function displayHomeDate() {
  const now = new Date();

  const formattedDate = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(now);

  homeDate.textContent = formattedDate;
}

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const screenId = button.dataset.screen;
    const title = button.dataset.title;

    showScreen(screenId, title);
  });
});

backButton.addEventListener("click", () => {
  showScreen("home-screen", "わたしの記録");
});

displayHomeDate();

