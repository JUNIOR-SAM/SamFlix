const mealContainer = document.getElementById('mealContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const randomBtn = document.getElementById('randomBtn');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const categorySelect = document.getElementById('categorySelect');

const API_URL = "https://nifoda.vercel.app/api/foods";

// ======== FETCH ALL MEALS ========
async function fetchAllMeals() {
  const res = await fetch(API_URL);
  const data = await res.json();
  return data;
}

// ======== DISPLAY MEALS ========
function displayMeals(meals) {
  mealContainer.innerHTML = '';
  if (!meals || meals.length === 0) {
    mealContainer.innerHTML = `<p class="col-span-full text-center text-gray-500">No meals found 😢</p>`;
    return;
  }

  meals.forEach(meal => {
    const card = document.createElement('div');
    card.className = 'bg-white shadow rounded-xl overflow-hidden hover:scale-105 transition';
    card.innerHTML = `
      <img src="${meal.image}" class="w-full h-48 object-cover" alt="${meal.name}" />
      <div class="p-4">
        <h2 class="font-semibold text-lg">${meal.name}</h2>
        <p class="text-sm text-gray-500">${meal.origin || 'Nigeria'}</p>
        <div class="mt-3 flex justify-between">
          <button class="bg-green-600 text-white px-3 py-1 rounded-md" onclick="showRecipe('${meal.name}')">View</button>
          <button class="bg-yellow-500 text-white px-3 py-1 rounded-md" onclick="addFavorite('${meal.name}')">❤️</button>
        </div>
      </div>
    `;
    mealContainer.appendChild(card);
  });
}

// ======== SEARCH ========
async function searchMeal() {
  const term = searchInput.value.trim().toLowerCase();
  const allMeals = await fetchAllMeals();
  const filtered = allMeals.filter(meal => meal.name.toLowerCase().includes(term));
  displayMeals(filtered);
}

// ======== RANDOM ========
async function randomMeal() {
  const allMeals = await fetchAllMeals();
  const random = allMeals[Math.floor(Math.random() * allMeals.length)];
  displayMeals([random]);
}

// ======== FILTER BY CATEGORY ========
async function filterByCategory() {
  const category = categorySelect.value;
  if (!category) return;
  const allMeals = await fetchAllMeals();
  const filtered = allMeals.filter(meal =>
    meal.category && meal.category.toLowerCase().includes(category.toLowerCase())
  );
  displayMeals(filtered);
}

// ======== SHOW RECIPE ========
async function showRecipe(name) {
  const allMeals = await fetchAllMeals();
  const meal = allMeals.find(m => m.name === name);
  if (!meal) return;

  modal.classList.remove('hidden');
  modalContent.innerHTML = `
    <h2 class="text-xl font-bold mb-2">${meal.name}</h2>
    <img src="${meal.image}" class="rounded-md mb-3" style="height:300px;width:300px;" />
    <p class="text-sm text-gray-700 mb-3">${meal.description || 'No instructions available.'}</p>
  `;
}

modalClose.addEventListener('click', () => modal.classList.add('hidden'));

// ======== FAVORITES ========
function addFavorite(name) {
  fetchAllMeals().then(allMeals => {
    const meal = allMeals.find(m => m.name === name);
    if (!meal) return;

    let favs = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favs.find(f => f.name === name)) {
      alert('Already in favorites');
      return;
    }
    favs.push(meal);
    localStorage.setItem('favorites', JSON.stringify(favs));
    alert('Meal added to favorites!');
  });
}

// ======== EVENT LISTENERS ========
searchBtn.addEventListener('click', searchMeal);
randomBtn.addEventListener('click', randomMeal);
categorySelect.addEventListener('change', filterByCategory);

// Load some meals on page start
fetchAllMeals().then(displayMeals);
