// Constants
const BASE_URL = "https://api.tvmaze.com";
const PLACEHOLDER_IMG = "https://via.placeholder.com/300x420?text=No+Image";

// DOM Elements
const elements = {
  movieContainer: document.getElementById("movieContainer"),
  sectionTitle: document.getElementById("sectionTitle"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  categorySelect: document.getElementById("categorySelect"),
  modal: document.getElementById("modal"),
  modalContent: document.getElementById("modalContent"),
  modalClose: document.getElementById("modalClose"),
  overlaySearch: document.getElementById("overlaySearch"),
  mobileSearchBtn: document.getElementById("mobileSearchBtn")
};

// Favorites Management
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

const favoritesManager = {
  isFavorite: (showId) => favorites.some(f => f.id === showId),

  save: () => localStorage.setItem("favorites", JSON.stringify(favorites)),

  toggle: (show) => {
    const exists = favorites.find(f => f.id === show.id);
    if (exists) {
      favorites = favorites.filter(f => f.id !== show.id);
      showToast(`Removed "${show.name}" from Favorites`, 'info');
    } else {
      favorites.push({
        id: show.id,
        name: show.name,
        image: show.image?.medium || show.image?.original || "",
        genres: show.genres || [],
        summary: show.summary ? show.summary.replace(/<[^>]*>/g, "") : "",
        url: show.officialSite || show.url || ""
      });
      showToast(`Added "${show.name}" to Favorites`, 'success');
    }
    favoritesManager.save();
  }
};

// Toast Notification
function showToast(message, type = 'info') {
  if (typeof Toastify === 'function') {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: type === 'success' ? '#10b981' :
          type === 'error' ? '#ef4444' : '#3b82f6'
      }
    }).showToast();
  } else {
    alert(message);
  }
}

// API Calls
async function fetchShows(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Show Loading/Display Functions
async function loadShows(category = "trending") {
  elements.movieContainer.innerHTML = `<p class="text-gray-400">Loading...</p>`;
  elements.sectionTitle.textContent = "🎬 " + formatCategory(category);

  try {
    const url = category === "trending" ?
      `${BASE_URL}/shows` :
      `${BASE_URL}/search/shows?q=${encodeURIComponent(category)}`;

    const data = await fetchShows(url);
    const shows = Array.isArray(data) ?
      data.map(item => item.show || item) : [];

    displayShows(shows);
  } catch (err) {
    elements.movieContainer.innerHTML =
      `<p class="text-red-500">Failed to load shows.</p>`;
    showToast('Failed to load shows', 'error');
  }
}

function displayShows(shows) {
  if (!shows?.length) {
    elements.movieContainer.innerHTML =
      `<p class="text-gray-400">No results found.</p>`;
    return;
  }

  elements.movieContainer.innerHTML = shows
    .slice(0, 40)
    .map(show => createShowCard(show))
    .join('');

  // Add event listeners to all cards
  elements.movieContainer.querySelectorAll('.show-card').forEach(card => {
    const showId = card.dataset.showId;
    const show = shows.find(s => s.id.toString() === showId);

    card.addEventListener('click', () => openModal(show));

    const favBtn = card.querySelector('.fav-btn');
    favBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      favoritesManager.toggle(show);
      updateFavButton(favBtn, show.id);
    });
  });
}

function createShowCard(show) {
  const image = show.image?.medium || show.image?.original || PLACEHOLDER_IMG;
  const isFav = favoritesManager.isFavorite(show.id);
  return `
    <div class="show-card bg-gray-800 w-80 sm:w-72 md:w-64 lg:w-64 mx-auto rounded-lg overflow-hidden shadow hover:scale-105 transform transition cursor-pointer" width:"50px" data-show-id="${show.id}">
      <img src="${image}" alt="${escapeHtml(show.name)}" class="w-full  h-80 object-cover">
      <div class="p-3">
        <h5 class="text-md font-semibold truncate">${escapeHtml(show.name)}</h5>
        <p class="text-gray-400 text-sm">${show.genres?.join(", ") || "No Genre"}</p>
        <div class="mt-2 flex justify-end gap-2">
          <button class="fav-btn px-3 py-2 text-sm rounded ${isFav ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}">
            ${isFav ? '💖 Favorited' : '🤍 Favorite'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function updateFavButton(btn, showId) {
  const isFav = favoritesManager.isFavorite(showId);
  btn.className = `fav-btn px-3 py-2 text-sm rounded ${isFav ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
    }`;
  btn.textContent = isFav ? '💖 Favorited' : '🤍 Favorite';
}

function openModal(show) {
  if (!show || !elements.modal) return;

  const image = show.image?.original || show.image?.medium || PLACEHOLDER_IMG;
  const rating = show.rating?.average || "N/A";
  const trailerSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(show.name + " trailer")
    }`;
  const officialLink = show.officialSite || show.url ||
    `https://www.google.com/search?q=${encodeURIComponent(show.name + " TV show")}`;

  elements.modalContent.innerHTML = `
    <div class="flex flex-col md:flex-row gap-6">
      <img src="${image}" alt="${escapeHtml(show.name)}" 
           class="w-full md:w-1/3 rounded-lg object-cover">
      <div>
        <h2 class="text-2xl font-bold mb-2">${escapeHtml(show.name)}</h2>
        <p class="text-gray-400 mb-3">${show.genres?.join(", ") || "Genre unknown"}</p>
        <p class="mb-3">
          <span class="text-yellow-400 text-xl">⭐</span>
          <span class="font-semibold">${rating}</span> / 10
        </p>
        <p class="mb-4 text-sm">${show.summary ? show.summary.replace(/<[^>]*>/g, "") : "No description available."
    }</p>
        <div class="flex gap-3 justify-end mt-auto">
          <a href="${officialLink}" target="_blank" 
             class="bg-red-600 px-4 py-2 rounded hover:bg-red-700 text-white no-underline">
            Official Site
          </a>
          <a href="${trailerSearch}" target="_blank" 
             class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white no-underline">
            🎬 Watch Trailer
          </a>
        </div>
      </div>
    </div>
  `;

  elements.modal.classList.remove("hidden");
  elements.modal.classList.add("flex");
}

// Event Listeners
elements.modalClose?.addEventListener("click", () => {
  elements.modal.classList.add("hidden");
  elements.modal.classList.remove("flex");
});

elements.modal?.addEventListener("click", (e) => {
  if (e.target === elements.modal) {
    elements.modal.classList.add("hidden");
  }
});

elements.searchBtn?.addEventListener("click", async () => {
  const query = elements.searchInput?.value.trim();
  if (!query) return;

  elements.sectionTitle.textContent = `🔍 Results for "${query}"`;
  elements.movieContainer.innerHTML = `<p class="text-gray-400">Searching...</p>`;

  try {
    const data = await fetchShows(
      `${BASE_URL}/search/shows?q=${encodeURIComponent(query)}`
    );
    displayShows(data.map(d => d.show));
  } catch (err) {
    elements.movieContainer.innerHTML =
      `<p class="text-red-500">Search failed.</p>`;
    showToast('Search failed', 'error');
  }
});

elements.categorySelect?.addEventListener("change", (e) => {
  loadShows(e.target.value);
});

// Utilities
function formatCategory(cat) {
  if (!cat) return '';
  const categories = {
    trending: "Trending",
    drama: "Drama",
    comedy: "Comedy",
    action: "Action",
    romance: "Romance",
    thriller: "Thriller",
    horror: "Horror",
    sci: "Sci-Fi"
  };
  return categories[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

function escapeHtml(text = "") {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize
loadShows("trending");

// Make sure handleSearch is defined and exported
window.handleSearch = ({ query, category }) => {
  console.log('handleSearch called with:', { query, category }); // Debug log
  // Your existing search logic here
};
window.handleSearch = handleSearch;

window.loaded = true;
  // if exists

