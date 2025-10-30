const favContainer = document.getElementById('favoritesContainer');

function loadFavorites() {
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  favContainer.innerHTML = '';

  if (favs.length === 0) {
    favContainer.innerHTML = '<p class="text-center text-gray-500">No favorite meals yet 😢</p>';
    return;
  }

  favs.forEach(meal => {
    const card = document.createElement('div');
    card.className = 'bg-white shadow rounded-xl overflow-hidden';
    card.innerHTML = `
      <img src="${meal.strMealThumb}" class="w-full h-48 object-cover" />
      <div class="p-4">
        <h2 class="font-semibold text-lg">${meal.strMeal}</h2>
        <button class="bg-red-500 text-white px-3 py-1 rounded-md mt-2" onclick="removeFavorite('${meal.idMeal}')">Remove</button>
      </div>
    `;
    favContainer.appendChild(card);
  });
}

function removeFavorite(id) {
  let favs = JSON.parse(localStorage.getItem('favorites')) || [];
  favs = favs.filter(f => f.idMeal !== id);
  localStorage.setItem('favorites', JSON.stringify(favs));
  loadFavorites();
}

document.addEventListener('DOMContentLoaded', loadFavorites);
