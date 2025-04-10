const API_KEY = 'AIzaSyC69EEczOrJMTalUNIdMq2WdHsoYg1DV4Q';
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResults = document.getElementById('searchResults');
const searchHistoryDropdown = document.getElementById('searchHistoryDropdown');
const searchDropdown = document.getElementById('searchDropdown');
const homeTab = document.getElementById('homeTab');
const historyTab = document.getElementById('historyTab');
const homeSection = document.getElementById('homeSection');
const historySection = document.getElementById('historySection');
const watchHistory = document.getElementById('watchHistory');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const themeSwitch = document.getElementById('themeSwitch');

// Load YouTube API
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Tab switching functionality
homeTab.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('home');
});

historyTab.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('history');
});

function showSection(section) {
    // Update nav links
    homeTab.classList.toggle('active', section === 'home');
    historyTab.classList.toggle('active', section === 'history');
    
    // Show/hide sections
    homeSection.style.display = section === 'home' ? 'block' : 'none';
    historySection.style.display = section === 'history' ? 'block' : 'none';
    
    if (section === 'history') {
        displayWatchHistory();
    }
}

// Watch history functionality
function addToWatchHistory(video) {
    let watchedVideos = getWatchHistory();
    
    // Remove if already exists
    watchedVideos = watchedVideos.filter(v => v.id.videoId !== video.id.videoId);
    
    // Add to beginning of array
    watchedVideos.unshift({
        ...video,
        watchedAt: new Date().toISOString()
    });
    
    // Keep only last 50 videos
    if (watchedVideos.length > 50) {
        watchedVideos = watchedVideos.slice(0, 50);
    }
    
    localStorage.setItem('watchHistory', JSON.stringify(watchedVideos));
}

function getWatchHistory() {
    const history = localStorage.getItem('watchHistory');
    return history ? JSON.parse(history) : [];
}

function displayWatchHistory() {
    const watchedVideos = getWatchHistory();
    watchHistory.innerHTML = '';
    
    if (watchedVideos.length === 0) {
        watchHistory.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No watched videos yet</p>
            </div>
        `;
        return;
    }
    
    watchedVideos.forEach((video, index) => {
        const videoCard = document.createElement('div');
        videoCard.className = 'col-md-4 col-sm-6';
        videoCard.innerHTML = `
            <div class="video-card">
                <div class="video-card-content" onclick="openVideo('${video.id.videoId}')">
                    <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}" class="video-thumbnail">
                    <div class="video-info">
                        <h5 class="video-title">${video.snippet.title}</h5>
                        <p class="video-channel">${video.snippet.channelTitle}</p>
                        <p class="video-stats">
                            <small class="text-muted">Watched on ${formatWatchDate(video.watchedAt)}</small>
                        </p>
                    </div>
                </div>
                <div class="video-actions">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteFromWatchHistory(${index})">
                        <i class="bi bi-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
        watchHistory.appendChild(videoCard);
    });
}

function formatWatchDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Clear watch history
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your watch history?')) {
        localStorage.removeItem('watchHistory');
        displayWatchHistory();
    }
});

// Search videos
async function searchVideos(query) {
    try {
        // Add to search history
        addToSearchHistory(query);
        
        // Hide dropdown after search
        hideSearchDropdown();
        
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`);
        const data = await response.json();
        
        // Save last search query and results to localStorage
        saveLastSearch(query, data.items);
        
        displayResults(data.items);
    } catch (error) {
        console.error('Error searching videos:', error);
        searchResults.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Error searching videos. Please try again.</p></div>';
    }
}

// Save last search data
function saveLastSearch(query, results) {
    const searchData = {
        query: query,
        results: results,
        timestamp: new Date().getTime()
    };
    localStorage.setItem('lastSearch', JSON.stringify(searchData));
}

// Load last search data
function loadLastSearch() {
    const searchData = localStorage.getItem('lastSearch');
    if (searchData) {
        const { query, results, timestamp } = JSON.parse(searchData);
        // Only restore if less than 24 hours old
        if (new Date().getTime() - timestamp < 24 * 60 * 60 * 1000) {
            searchInput.value = query;
            displayResults(results);
        }
    }
}

// Display search results
function displayResults(videos) {
    searchResults.innerHTML = '';
    
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'col-md-4 col-sm-6';
        videoCard.innerHTML = `
            <div class="video-card" onclick="openVideo('${video.id.videoId}')">
                <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}" class="video-thumbnail">
                <div class="video-info">
                    <h5 class="video-title">${video.snippet.title}</h5>
                    <p class="video-channel">${video.snippet.channelTitle}</p>
                    <p class="video-stats">${formatDate(video.snippet.publishedAt)}</p>
                </div>
            </div>
        `;
        searchResults.appendChild(videoCard);
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Open video and add to watch history
function openVideo(videoId) {
    // Find video data from search results or watch history
    const lastSearch = JSON.parse(localStorage.getItem('lastSearch') || '{}');
    const video = lastSearch.results?.find(v => v.id.videoId === videoId) || 
                 getWatchHistory().find(v => v.id.videoId === videoId);
    
    if (video) {
        addToWatchHistory(video);
    }
    
    window.location.href = `player.html?id=${videoId}`;
}

// Search history functionality
function addToSearchHistory(query) {
    let searchHistory = getSearchHistory();
    
    // Remove if already exists (to move it to the top)
    searchHistory = searchHistory.filter(item => item !== query);
    
    // Add to the beginning of the array
    searchHistory.unshift(query);
    
    // Keep only the last 10 searches
    if (searchHistory.length > 10) {
        searchHistory = searchHistory.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    
    // Update the UI
    displaySearchHistoryDropdown();
}

function getSearchHistory() {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
}

function displaySearchHistoryDropdown() {
    const searchHistory = getSearchHistory();
    searchHistoryDropdown.innerHTML = '';
    
    if (searchHistory.length === 0) {
        searchHistoryDropdown.innerHTML = '<div class="list-group-item text-muted">No recent searches</div>';
        return;
    }
    
    searchHistory.forEach((query, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        historyItem.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-clock-history me-2"></i>
                <span class="search-query">${query}</span>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteFromHistory(${index}, event)">
                <i class="bi bi-trash"></i>
            </button>
        `;
        historyItem.addEventListener('click', (e) => {
            if (!e.target.closest('.btn')) {
                searchFromHistory(query);
            }
        });
        searchHistoryDropdown.appendChild(historyItem);
    });
}

function searchFromHistory(query) {
    searchInput.value = query;
    searchVideos(query);
}

function deleteFromHistory(index, event) {
    if (event) {
        event.stopPropagation(); // Prevent triggering the parent click event
    }
    let searchHistory = getSearchHistory();
    searchHistory.splice(index, 1);
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    displaySearchHistoryDropdown();
}

function showSearchDropdown() {
    searchDropdown.classList.add('show');
}

function hideSearchDropdown() {
    searchDropdown.classList.remove('show');
}

// Event listeners
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        searchVideos(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            searchVideos(query);
        }
    }
});

searchInput.addEventListener('focus', () => {
    displaySearchHistoryDropdown();
    showSearchDropdown();
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        hideSearchDropdown();
    }
});

// Load initial state
displaySearchHistoryDropdown();
loadLastSearch();
loadYouTubeAPI();

function deleteFromWatchHistory(index) {
    let watchedVideos = getWatchHistory();
    watchedVideos.splice(index, 1);
    localStorage.setItem('watchHistory', JSON.stringify(watchedVideos));
    displayWatchHistory();
}

// Theme switching functionality
function initTheme() {
    if (window.ThemeManager) {
        const themeSettings = window.ThemeManager.getLocalTheme();
        window.ThemeManager.applyTheme(themeSettings);
    } else {
        // Fallback if ThemeManager is not available
        const savedTheme = localStorage.getItem('themeSettings');
        const themeMode = savedTheme ? JSON.parse(savedTheme).theme : 'light';
        document.documentElement.setAttribute('data-bs-theme', themeMode);
        if (themeSwitch) {
            themeSwitch.checked = themeMode === 'dark';
        }
    }
}

function toggleTheme() {
    if (window.ThemeManager) {
        const themeSettings = window.ThemeManager.getLocalTheme();
        themeSettings.theme = themeSettings.theme === 'light' ? 'dark' : 'light';
        window.ThemeManager.saveTheme(themeSettings);
    } else {
        // Fallback if ThemeManager is not available
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('themeSettings', JSON.stringify({theme: newTheme, primaryColor: '#4361ee'}));
    }
}

if (themeSwitch) {
    themeSwitch.addEventListener('change', toggleTheme);
}

// Initialize theme immediately
initTheme();

// Also initialize when DOM is fully loaded (fallback)
document.addEventListener('DOMContentLoaded', initTheme); 