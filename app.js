const API_BASE = "https://media2.edu.metropolia.fi/restaurant";

let currentRestaurantId = null;
let viewMode = "day";
let restaurantsList = [];

document.addEventListener("DOMContentLoaded", function () {
  fetchRestaurants();
  setupDayStrip();

  const cityFilter = document.getElementById("cityFilter");
  cityFilter.addEventListener("change", function () {
    const selectedCity = cityFilter.value;
    let filtered = restaurantsList;

    if (selectedCity !== "") {
      filtered = [];
      for (let i = 0; i < restaurantsList.length; i++) {
        if (restaurantsList[i].city === selectedCity) {
          filtered.push(restaurantsList[i]);
        }
      }
    }

    populateRestaurantSelect(filtered);

    if (filtered.length > 0) {
      currentRestaurantId = filtered[0]._id;
      updateHeader(filtered[0]);
      loadMenu();
    }
  });

  const citySelect = document.getElementById("citySelect");
  citySelect.addEventListener("change", function () {
    currentRestaurantId = citySelect.value;
    for (let i = 0; i < restaurantsList.length; i++) {
      if (restaurantsList[i]._id === currentRestaurantId) {
        updateHeader(restaurantsList[i]);
      }
    }
    loadMenu();
  });

  const dayBtn = document.getElementById("dayToggleBtn");
  const weekBtn = document.getElementById("weekToggleBtn");

  dayBtn.addEventListener("click", function () {
    viewMode = "day";
    dayBtn.classList.add("active");
    weekBtn.classList.remove("active");
    loadMenu();
  });

  weekBtn.addEventListener("click", function () {
    viewMode = "week";
    weekBtn.classList.add("active");
    dayBtn.classList.remove("active");
    loadMenu();
  });

  const dayTabs = document.querySelectorAll(".day-tab");
  for (let i = 0; i < dayTabs.length; i++) {
    dayTabs[i].addEventListener("click", function () {
      for (let j = 0; j < dayTabs.length; j++) {
        dayTabs[j].classList.remove("today");
      }
      this.classList.add("today");

      showDayFromWeek(i);
    });
  }
});

function setupDayStrip() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const dayTabs = document.querySelectorAll(".day-tab");

  for (let i = 0; i < dayTabs.length; i++) {
    const tabDate = new Date(monday);
    tabDate.setDate(monday.getDate() + i);
    const label = tabDate.getDate() + "." + (tabDate.getMonth() + 1);
    dayTabs[i].querySelector(".day-date").textContent = label;
  }
}

function fetchRestaurants() {
  fetch(API_BASE + "/api/v1/restaurants")
    .then(function (response) {
      return response.json();
    })
    .then(function (restaurants) {
      restaurants.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

      restaurantsList = restaurants;
      populateCityFilter(restaurants);
      populateRestaurantSelect(restaurants);

      currentRestaurantId = restaurants[0]._id;
      updateHeader(restaurants[0]);
      loadMenu();
    })
    .catch(function (error) {
      console.log("Error fetching restaurants:", error);
    });
}

function populateCityFilter(restaurants) {
  const cityFilter = document.getElementById("cityFilter");
  cityFilter.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All cities";
  cityFilter.appendChild(allOption);

  const cities = [];
  for (let i = 0; i < restaurants.length; i++) {
    if (cities.indexOf(restaurants[i].city) === -1) {
      cities.push(restaurants[i].city);
    }
  }
  cities.sort();

  for (let i = 0; i < cities.length; i++) {
    const option = document.createElement("option");
    option.value = cities[i];
    option.textContent = cities[i];
    cityFilter.appendChild(option);
  }
}

function populateRestaurantSelect(restaurants) {
  const citySelect = document.getElementById("citySelect");
  citySelect.innerHTML = "";

  for (let i = 0; i < restaurants.length; i++) {
    const option = document.createElement("option");
    option.value = restaurants[i]._id;
    option.textContent = restaurants[i].name;
    citySelect.appendChild(option);
  }
}
function focusRestaurant(id) {
  const cityFilter = document.getElementById("cityFilter");
  cityFilter.value = "";
  populateRestaurantSelect(restaurantsList);

  const citySelect = document.getElementById("citySelect");
  citySelect.value = id;

  currentRestaurantId = id;
  for (let i = 0; i < restaurantsList.length; i++) {
    if (restaurantsList[i]._id === id) {
      updateHeader(restaurantsList[i]);
    }
  }
  loadMenu();
}

function updateHeader(restaurant) {
  document.getElementById("restaurantName").textContent = restaurant.name;
  document.querySelector(".restaurant-address").textContent =
    restaurant.address;
}

function loadMenu() {
  if (!currentRestaurantId) {
    return;
  }
  if (viewMode === "day") {
    fetchDailyMenu(currentRestaurantId);
  } else {
    fetchWeeklyMenu(currentRestaurantId);
  }
}

function fetchDailyMenu(restaurantId) {
  fetch(API_BASE + "/api/v1/restaurants/daily/" + restaurantId + "/en")
    .then(function (response) {
      return response.json();
    })
    .then(function (menu) {
      if (!menu.courses) {
        const dishList = document.getElementById("dishList");
        dishList.innerHTML =
          "<li class='dish-row'>No menu available for this day.</li>";
        return;
      }
      showMenu(menu.courses);
    })
    .catch(function (error) {
      console.log("Error fetching daily menu:", error);
    });
}

function showMenu(courses) {
  const dishList = document.getElementById("dishList");
  dishList.innerHTML = "";

  for (let i = 0; i < courses.length; i++) {
    addDishRow(dishList, courses[i]);
  }
}
function addDishRow(dishList, course) {
  const li = document.createElement("li");
  li.className = "dish-row";

  const div = document.createElement("div");
  div.className = "dish-info";

  const span = document.createElement("span");
  span.className = "dish-name";
  span.textContent = course.name;
  div.appendChild(span);

  const diets = cleanDiets(course.diets);
  if (diets) {
    const dietSpan = document.createElement("span");
    dietSpan.className = "dish-diets";
    dietSpan.textContent = "(" + diets + ")";
    div.appendChild(dietSpan);
  }

  li.appendChild(div);
  dishList.appendChild(li);
}

function cleanDiets(diets) {
  if (!diets) {
    return "";
  }

  let parts;
  if (Array.isArray(diets)) {
    parts = diets;
  } else {
    parts = diets.split(",");
  }

  const cleanParts = [];
  for (let i = 0; i < parts.length; i++) {
    const code = String(parts[i]).trim();
    if (code !== "" && code !== "*") {
      cleanParts.push(code);
    }
  }
  return cleanParts.join(", ");
}
function fetchWeeklyMenu(restaurantId) {
  fetch(API_BASE + "/api/v1/restaurants/weekly/" + restaurantId + "/en")
    .then(function (response) {
      return response.json();
    })
    .then(function (weeklyMenu) {
      if (!weeklyMenu.days) {
        const dishList = document.getElementById("dishList");
        dishList.innerHTML =
          "<li class='dish-row'>No weekly menu available for this restaurant.</li>";
        return;
      }
      showWeekMenu(weeklyMenu);
    })
    .catch(function (error) {
      console.log("Error fetching weekly menu:", error);
    });
}

function showWeekMenu(weeklyMenu) {
  const dishList = document.getElementById("dishList");
  dishList.innerHTML = "";

  const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  for (let i = 0; i < weeklyMenu.days.length; i++) {
    const day = weeklyMenu.days[i];

    const dayHeading = document.createElement("li");
    dayHeading.className = "dish-row";
    dayHeading.innerHTML =
      "<strong>" + (weekdayNames[i] || day.date) + "</strong>";
    dishList.appendChild(dayHeading);

    for (let j = 0; j < day.courses.length; j++) {
      addDishRow(dishList, day.courses[j]);
    }
  }
}

function showDayFromWeek(dayIndex) {
  if (!currentRestaurantId) {
    return;
  }
  fetch(API_BASE + "/api/v1/restaurants/weekly/" + currentRestaurantId + "/en")
    .then(function (response) {
      return response.json();
    })
    .then(function (weeklyMenu) {
      if (!weeklyMenu.days || !weeklyMenu.days[dayIndex]) {
        const dishList = document.getElementById("dishList");
        dishList.innerHTML =
          "<li class='dish-row'>No menu available for this day.</li>";
        return;
      }
      showMenu(weeklyMenu.days[dayIndex].courses);
    })
    .catch(function (error) {
      console.log("Error fetching weekly menu:", error);
    });
}
