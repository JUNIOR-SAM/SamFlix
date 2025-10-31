// script.js — SamFlix main logic with Favorites support
const BASE_URL = "https://api.tvmaze.com";

const movieContainer = document.getElementById("movieContainer");
const sectionTitle = document.getElementById("sectionTitle");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const categorySelect = document.getElementById("categorySelect");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

// favorites stored in localStorage
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Utility to simplify show object saved in favorites
function makeSaveableShow(show) {
  return {
    id: show.id,
    name: show.name,
    image: show.image?.medium || show.image?.original || "",
    genres: show.genres || [],
    summary: show.summary ? show.summary.replace(/<[^>]*>/g, "") : "",
    url: show.officialSite || show.url || ""
  };
}

function isFavorite(showId) {
  return favorites.some(f => f.id === showId);
}

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

// Toggle favorite and alert user
function toggleFavorite(show) {
  const exists = favorites.find(f => f.id === show.id);
  if (exists) {
    favorites = favorites.filter(f => f.id !== show.id);
    saveFavorites();
    alert(`Removed "${show.name}" from Favorites ❌`);
  } else {
    favorites.push(makeSaveableShow(show));
    saveFavorites();
    alert(`Added "${show.name}" to Favorites ✅\nOpen Favorites page to view.`);
  }
}

// Fetch shows (all or search)
async function loadShows(category = "trending") {
  movieContainer.innerHTML = `<p class="text-gray-400">Loading...</p>`;
  sectionTitle.textContent = "🎬 " + formatCategory(category);

  try {
    let url;
    if (category === "trending") {
      url = `${BASE_URL}/shows`;
    } else if (category && category !== "") {
      // For genres we try search endpoint (TVMaze doesn't have strict genre endpoint)
      url = `${BASE_URL}/search/shows?q=${encodeURIComponent(category)}`;
    } else {
      url = `${BASE_URL}/shows`;
    }

    const res = await fetch(url);
    const data = await res.json();

    // search format: [{score, show}, ...] ; shows endpoint format: [show, ...]
    const shows = Array.isArray(data) ? data.map(item => item.show || item) : [];

    displayShows(shows);
  } catch (err) {
    console.error(err);
    movieContainer.innerHTML = `<p class="text-red-500">Failed to load shows.</p>`;
  }
}

function displayShows(shows) {
  movieContainer.innerHTML = "";

  if (!shows || shows.length === 0) {
    movieContainer.innerHTML = `<p class="text-gray-400">No results found.</p>`;
    return;
  }

  // limit results for layout/perf
  shows.slice(0, 40).forEach(show => {
    const image = show.image ? (show.image.medium || show.image.original) : "https://via.placeholder.com/300x420?text=No+Image";
    const title = show.name || "Untitled";

    const card = document.createElement("div");
card.className =
  "bg-gray-800 w-80 sm:w-72 md:w-64 lg:w-64 mx-auto rounded-lg overflow-hidden shadow hover:scale-105 transform transition cursor-pointer";


    // favorite button style depends on whether it's already fav
    const favClass = isFavorite(show.id) ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200";

    card.innerHTML = `
      <img src="${image}" alt="${escapeHtml(title)}" class="w-full h-80 object-cover">
      <div class="p-3">
        <h5 class="text-md font-semibold truncate">${escapeHtml(title)}</h5>
        <p class="text-gray-400 text-sm">${(show.genres && show.genres.join(", ")) || "No Genre"}</p>
        <div class="mt-2 d-flex justify-content-end  gap-2">
          <button class="fav-btn px-3 py-2 text-sm rounded ${favClass}">${isFavorite(show.id) ? '💖 Favorited' : '🤍 Favorite'}</button>
        </div>
      </div>
    `;

    // details button
    // card.querySelector(".details-btn").addEventListener("click", (e) => {
    //   e.stopPropagation();
    //   openModal(show);
    // });

    // favorite button
    card.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(show);
      const btn = e.currentTarget;
      if (isFavorite(show.id)) {
        btn.classList.remove("bg-gray-700", "text-gray-200");
        btn.classList.add("bg-blue-600", "text-white");
        btn.textContent = "💖 Favorited";
      } else {
        btn.classList.remove("bg-blue-600", "text-white");
        btn.classList.add("bg-gray-700", "text-gray-200");
        btn.textContent = "🤍 Favorite";
      }
    });

    // clicking card itself also opens details
    card.addEventListener("click", () => openModal(show));
    movieContainer.appendChild(card);
  });
}

// Open modal with more data + trailer link
// function openModal(show) {
//   const image = show.image ? (show.image.original || show.image.medium) : "https://via.placeholder.com/400x600?text=No+Image";
//   const trailerSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(show.name + " trailer")}`;
//   modalContent.innerHTML = `
//     <div class="flex flex-col md:flex-row gap-6">
//       <img src="${image}" alt="${escapeHtml(show.name)}" class="w-full md:w-1/3 rounded-lg object-cover">
//       <div>
//         <h2 class="text-2xl font-bold mb-2">${escapeHtml(show.name)}</h2>
//         <p class="text-gray-400 mb-3">${(show.genres && show.genres.join(", ")) || "Genre unknown"}</p>
//         <p class="mb-4 text-sm">${show.summary ? show.summary.replace(/<[^>]*>/g, "") : "No description available."}</p>
//         <div class="flex gap-3 justify-content-end mt-20">
//           ${show.officialSite ? `<a href="${show.officialSite}" target="_blank" class="bg-red-600 px-4 py-2 rounded hover:bg-red-700 text-decoration-none text-white">Official Site</a>` : ""}
//           <a href="${trailerSearch}" target="_blank" class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white text-decoration-none">🎬 Watch Trailer</a>
//         </div>
//       </div>
//     </div>
//   `;

//   // wire up modal favorite button
//   const modalFavBtn = document.getElementById("modalFavBtn");
//   if (modalFavBtn) {
//     modalFavBtn.addEventListener("click", () => {
//       toggleFavorite(show);
//       modalFavBtn.classList.toggle("bg-red-600");
//       modalFavBtn.classList.toggle("bg-gray-700");
//       modalFavBtn.textContent = isFavorite(show.id) ? '💖 Favorited' : '🤍 Favorite';
//     });
//   }

//   modal.classList.remove("hidden");
//   modal.classList.add("flex");
// }



function openModal(show) {
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  const image = show.image ? (show.image.original || show.image.medium)
                           : "https://via.placeholder.com/400x600?text=No+Image";

  // ✅ Rating (TVMaze average rating)
  const rating = show.rating?.average ? show.rating.average : "N/A";

  // ✅ Trailer Search
  const trailerSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(show.name + " trailer")}`;

  // ✅ Fallback official site
  const officialLink =
    show.officialSite ||
    show.url ||
    `https://www.google.com/search?q=${encodeURIComponent(show.name + " TV show")}`;

  modalContent.innerHTML = `
    <div class="flex flex-col md:flex-row gap-6">

      <!-- IMAGE -->
      <img src="${image}" 
           alt="${escapeHtml(show.name)}" 
           class="w-full md:w-1/3 rounded-lg object-cover">

      <!-- DETAILS -->
      <div>
        <h2 class="text-2xl font-bold mb-2">${escapeHtml(show.name)}</h2>

        <p class="text-gray-400 mb-3">
          ${(show.genres && show.genres.join(", ")) || "Genre unknown"}
        </p>

        <!-- ⭐ RATING ONLY -->
        <p class="mb-3">
          <span class="text-yellow-400 text-xl">⭐</span>
          <span class="font-semibold">${rating}</span> / 10
        </p>

        <p class="mb-4 text-sm">
          ${show.summary ? show.summary.replace(/<[^>]*>/g, "") : "No description available."}
        </p>

        <!-- BUTTONS -->
        <div class="flex gap-3 justify-end mt-20">
          <a href="${officialLink}" target="_blank" 
             class="bg-red-600 px-4 py-2 rounded hover:bg-red-700 text-decoration-none text-white">
             Official Site
          </a>

          <a href="${trailerSearch}" target="_blank" 
             class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white text-decoration-none">
             🎬 Watch Trailer
          </a>
        </div>
      </div>
    </div>
  `;
}


// close modal
modalClose?.addEventListener("click", () => {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

// Search
searchBtn?.addEventListener("click", async () => {
  const query = (searchInput && searchInput.value.trim()) || "";
  if (!query) return;
  sectionTitle.textContent = `🔍 Results for "${query}"`;
  movieContainer.innerHTML = `<p class="text-gray-400">Searching...</p>`;

  try {
    const res = await fetch(`${BASE_URL}/search/shows?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const shows = data.map(d => d.show);
    displayShows(shows);
  } catch (err) {
    console.error(err);
    movieContainer.innerHTML = `<p class="text-red-500">Search failed.</p>`;
  }
});

// Category select (genres)
categorySelect?.addEventListener("change", (e) => {
  const category = e.target.value;
  if (category === "trending") {
    loadShows("trending");
  } else {
    // TVMaze doesn't provide clean genre endpoints — use search by genre string
    // update title and run loadShows which uses search endpoint for non-trending
    loadShows(category);
  }
});

// Small helper
function formatCategory(cat){
  if(!cat) return '';
  const map = {
    trending: "Trending",
    drama: "Drama",
    comedy: "Comedy",
    action: "Action",
    romance: "Romance",
    thriller: "Thriller",
    horror: "Horror",
    "science-fiction": "Sci-Fi",
    "science-fiction": "Sci-Fi",
    "sci": "Sci-Fi"
  };
  return map[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// initial load
loadShows("trending");
