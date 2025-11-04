// script.js — unified, cleaned, and fixed (Option C: single performSearch(query))

// Constants
const BASE_URL = "https://api.tvmaze.com";
const PLACEHOLDER_IMG = "https://via.placeholder.com/300x420?text=No+Image";

// Safe DOM references (may be null if your HTML doesn't have them)
const $ = (id) => document.getElementById(id);

const elements = {
  movieContainer: $("movieContainer"),
  sectionTitle: $("sectionTitle"),
  searchInput: $("searchInput"),
  searchBtn: $("searchBtn"),
  categorySelect: $("categorySelect"),
  mobileCategorySelect: $("mobileCategorySelect"),
  overlaySearch: $("overlaySearch"),
  mobileSearchBtn: $("mobileSearchBtn"),
  modal: $("modal"),
  modalContent: $("modalContent"),
  modalClose: $("modalClose")
};

// --- Favorites (localStorage) ---
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

const favoritesManager = {
  save() { localStorage.setItem("favorites", JSON.stringify(favorites)); },
  isFavorite(id) { return favorites.some(f => String(f.id) === String(id)); },
  add(show) {
    if (!this.isFavorite(show.id)) {
      favorites.push({
        id: show.id,
        name: show.name,
        image: show.image?.medium || show.image?.original || "",
        genres: show.genres || [],
        summary: show.summary ? show.summary.replace(/<[^>]*>/g, "") : "",
        url: show.officialSite || show.url || ""
      });
      this.save();
      toast(`${show.name} added to favorites ✅`, "success");
    }
  },
  remove(id) {
    const found = favorites.find(f => String(f.id) === String(id));
    if (found) {
      favorites = favorites.filter(f => String(f.id) !== String(id));
      this.save();
      toast(`${found.name} removed from favorites ❌`, "info");
    }
  },
  toggle(show) {
    if (this.isFavorite(show.id)) this.remove(show.id);
    else this.add(show);
  }
};

// --- Small utility helpers ---
function toast(text, type = "info") {
  if (typeof Toastify === "function") {
    Toastify({
      text,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: type === "success" ? "#10b981" : (type === "error" ? "#ef4444" : "#3b82f6")
      }
    }).showToast();
  } else {
    // fallback
    console.log("Toast:", text);
    try { alert(text); } catch (e) {}
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[s]);
}

function formatCategory(cat = "") {
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
  cat = cat.toLowerCase();
  return categories[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}


// --- Modal creation if missing (so details always work) ---
function ensureModal() {
  if (elements.modal && elements.modalContent && elements.modalClose) return;

  // create modal elements
  const modal = document.createElement("div");
  modal.id = "modal";
  modal.className = "fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center p-4 z-50";
  modal.style.display = "none"; // controlled via classes + inline display

  const inner = document.createElement("div");
  inner.className = "bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative";
  inner.style.maxHeight = "90vh";

  const closeBtn = document.createElement("button");
  closeBtn.id = "modalClose";
  closeBtn.className = "absolute top-4 right-4 text-gray-400 hover:text-white";
  closeBtn.innerHTML = "✕";

  const content = document.createElement("div");
  content.id = "modalContent";

  inner.appendChild(closeBtn);
  inner.appendChild(content);
  modal.appendChild(inner);
  document.body.appendChild(modal);

  // update local refs
  elements.modal = $("modal");
  elements.modalContent = $("modalContent");
  elements.modalClose = $("modalClose");

  // add listeners
  elements.modalClose.addEventListener("click", () => closeModal());
  elements.modal.addEventListener("click", (e) => { if (e.target === elements.modal) closeModal(); });
}

function openModal() {
  ensureModal();
  elements.modal.classList.remove("hidden");
  elements.modal.style.display = "flex";
  elements.modal.classList.add("flex");
  // allow body to scroll modal content (modal inner has overflow-y:auto)
}

function closeModal() {
  if (!elements.modal) return;
  elements.modal.classList.add("hidden");
  elements.modal.classList.remove("flex");
  elements.modal.style.display = "none";
}

// --- Render / UI helpers ---
function createShowCardHtml(show) {
  const image = show.image?.medium || show.image?.original || PLACEHOLDER_IMG;
  const isFav = favoritesManager.isFavorite(show.id);
  const favBtnText = isFav ? "💖 Favorited" : "🤍 Favorite";
  const favBtnClass = isFav ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200";

  // Use data-show-id for delegation
  return `
    <div class="show-card bg-gray-800 w-80 sm:w-72 md:w-64 lg:w-64 mx-auto rounded-lg overflow-hidden shadow hover:scale-105 transform transition cursor-pointer" data-show-id="${escapeHtml(String(show.id))}">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(show.name)}" class="w-full h-80 object-cover show-thumb" />
      <div class="p-3">
        <h5 class="text-md font-semibold truncate">${escapeHtml(show.name)}</h5>
        <p class="text-gray-400 text-sm">${escapeHtml((show.genres || []).join(", ") || "No Genre")}</p>
        <div class="mt-2 flex justify-end gap-2">
          <button class="fav-btn px-3 py-2 text-sm rounded ${favBtnClass}">${favBtnText}</button>
        </div>
      </div>
    </div>
  `;
}

function renderShows(shows = []) {
  if (!elements.movieContainer) return;
  if (!shows || shows.length === 0) {
    elements.movieContainer.innerHTML = `<p class="text-gray-400">No results found.</p>`;
    return;
  }

  elements.movieContainer.innerHTML = shows.slice(0, 40).map(createShowCardHtml).join("");

  // event delegation: card click -> open modal; fav button -> toggle favorite
  elements.movieContainer.querySelectorAll(".show-card").forEach(card => {
    const id = card.dataset.showId;
    // attach card click -> open modal (get show data from lastLoadedShows)
    card.addEventListener("click", (e) => {
      // If the click originates from fav button, we handle separately
      if (e.target.closest(".fav-btn")) return;
      const show = lastLoadedShows.find(s => String(s.id) === String(id));
      if (show) openDetailsForShow(show);
    });

    const favBtn = card.querySelector(".fav-btn");
    favBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const show = lastLoadedShows.find(s => String(s.id) === String(id));
      if (!show) return;
      favoritesManager.toggle(show);
      updateFavBtnUI(favBtn, show.id);
    });
  });
}

function updateFavBtnUI(btn, showId) {
  const isFav = favoritesManager.isFavorite(showId);
  btn.className = `fav-btn px-3 py-2 text-sm rounded ${isFav ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}`;
  btn.textContent = isFav ? "💖 Favorited" : "🤍 Favorite";
}

// --- Keep most recent loaded shows in memory for modal lookup ---
let lastLoadedShows = [];

// --- Core: loadShows (category) and performSearch(query) ---
async function loadShows(category = "trending") {
  if (elements.movieContainer) elements.movieContainer.innerHTML = `<p class="text-gray-400">Loading...</p>`;
  if (elements.sectionTitle) elements.sectionTitle.textContent = "🎬 " + formatCategory(category);

  try {
    const url = category === "trending" ? `${BASE_URL}/shows` : `${BASE_URL}/search/shows?q=${encodeURIComponent(category)}`;
    const data = await fetchJson(url);
    const shows = Array.isArray(data) ? data.map(item => item.show || item) : [];
    lastLoadedShows = shows;
    renderShows(shows);
  } catch (err) {
    console.error("loadShows failed:", err);
    if (elements.movieContainer) elements.movieContainer.innerHTML = `<p class="text-red-500">Failed to load shows.</p>`;
    toast("Failed to load shows", "error");
  }
}

/**
 * performSearch(query)
 * Single search function used by desktop search, mobile overlay search, and any other caller.
 */
async function performSearch(query = "") {
  query = (query || "").trim();
  if (!query) return;

  if (elements.sectionTitle) elements.sectionTitle.textContent = `🔍 Results for "${query}"`;
  if (elements.movieContainer) elements.movieContainer.innerHTML = `<p class="text-gray-400">Searching...</p>`;

  try {
    const data = await fetchJson(`${BASE_URL}/search/shows?q=${encodeURIComponent(query)}`);
    const shows = Array.isArray(data) ? data.map(item => item.show).filter(Boolean) : [];
    lastLoadedShows = shows;
    renderShows(shows);
  } catch (err) {
    console.error("performSearch failed:", err);
    if (elements.movieContainer) elements.movieContainer.innerHTML = `<p class="text-red-500">Search failed.</p>`;
    toast("Search failed", "error");
  }
}

// expose for mobile overlay and other callers
window.performSearch = performSearch;
window.handleSearch = ({ query } = {}) => performSearch(query);

// --- Modal details maker ---
function openDetailsForShow(show) {
  ensureModal();
  const image = show.image?.original || show.image?.medium || PLACEHOLDER_IMG;
  const rating = (show.rating && show.rating.average) ? show.rating.average : "N/A";
  const trailerSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(show.name + " trailer")}`;
  const officialLink = show.officialSite || show.url || `https://www.google.com/search?q=${encodeURIComponent(show.name + " TV show")}`;

  const summary = show.summary ? show.summary.replace(/<[^>]*>/g, "") : "No description available.";

  elements.modalContent.innerHTML = `
    <div class="flex flex-col md:flex-row gap-6">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(show.name)}" class="w-full md:w-1/3 rounded-lg object-cover" />
      <div class="flex-1 flex flex-col">
        <h2 class="text-2xl font-bold mb-2">${escapeHtml(show.name)}</h2>
        <p class="text-gray-400 mb-3">${escapeHtml((show.genres || []).join(", ") || "Genre unknown")}</p>
        <p class="mb-3"><span class="text-yellow-400 text-xl">⭐</span> <span class="font-semibold">${escapeHtml(String(rating))}</span> / 10</p>
        <p class="mb-4 text-sm">${escapeHtml(summary)}</p>
        <div class="flex gap-3 mt-auto justify-end">
          <a href="${escapeHtml(officialLink)}" target="_blank" class="bg-red-600 px-4 py-2 rounded hover:bg-red-700 text-white no-underline">Official Site</a>
          <a href="${escapeHtml(trailerSearchUrl)}" target="_blank" class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white no-underline">🎬 Watch Trailer</a>
        </div>
      </div>
    </div>
  `;

  openModal();
}

// --- Wire up UI events safely ---
function wireUI() {
  // Desktop search button / Enter on desktop search input
  if (elements.searchBtn && elements.searchInput) {
    elements.searchBtn.addEventListener("click", () => performSearch(elements.searchInput.value));
    elements.searchInput.addEventListener("keyup", (e) => { if (e.key === "Enter") performSearch(elements.searchInput.value); });
  }

  // Mobile overlay search (overlaySearch + mobileSearchBtn)
  if (elements.mobileSearchBtn && elements.overlaySearch) {
    elements.mobileSearchBtn.addEventListener("click", () => performSearch(elements.overlaySearch.value));
    elements.overlaySearch.addEventListener("keyup", (e) => { if (e.key === "Enter") performSearch(elements.overlaySearch.value); });
  }

  // Category selects (desktop + mobile)
  if (elements.categorySelect) {
    elements.categorySelect.addEventListener("change", (e) => loadShows(e.target.value || "trending"));
  }
  if (elements.mobileCategorySelect) {
    elements.mobileCategorySelect.addEventListener("change", (e) => {
      // keep desktop select in sync (if present)
      if (elements.categorySelect) elements.categorySelect.value = e.target.value;
      loadShows(e.target.value || "trending");
    });
  }

  // Close modal with ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // If modal exists in DOM initially, wire close event
  if (elements.modalClose) elements.modalClose.addEventListener("click", () => closeModal());
}

// --- Init on DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", () => {
  wireUI();
  loadShows("trending");
});
