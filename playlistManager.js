import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

const db = getDatabase();

export async function handlePlaylistSelection(currentUser, playlistId, isChecked) {
    try {
        // Get video ID from URL or player
        let videoId;
        if (window.player && window.player.getVideoData) {
            videoId = window.player.getVideoData().video_id;
        }
        if (!videoId) {
            videoId = new URLSearchParams(window.location.search).get('v');
        }
        
        if (!videoId) {
            throw new Error('No video ID found');
        }

        if (isChecked) {
            // Add video to playlist
            await addVideoToPlaylist(currentUser, playlistId, videoId);
        } else {
            // Remove video from playlist
            await removeVideoFromPlaylist(currentUser, playlistId, videoId);
        }
    } catch (error) {
        console.error('Error handling playlist selection:', error);
        throw error;
    }
}

async function removeVideoFromPlaylist(currentUser, playlistId, videoId) {
    try {
        // 1. Get current playlist data
        const playlistRef = ref(db, `users/${currentUser.uid}/playlists/${playlistId}`);
        const snapshot = await get(playlistRef);
        const playlist = snapshot.val();
        
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        // 2. Check if video exists in playlist
        const videoExists = playlist.videos?.some(v => v.id.videoId === videoId);
        if (!videoExists) {
            throw new Error('Video not found in playlist');
        }
        
        // 3. Remove video from playlist
        const updatedVideos = playlist.videos.filter(v => v.id.videoId !== videoId);
        await set(ref(db, `users/${currentUser.uid}/playlists/${playlistId}/videos`), updatedVideos);
        
        // 4. Update playlist timestamp
        await set(ref(db, `users/${currentUser.uid}/playlists/${playlistId}/updatedAt`), new Date().toISOString());
        
        // 5. Update video count display
        if (window.updateVideoCount) {
            window.updateVideoCount(playlistId, updatedVideos.length);
        }
        
        // 6. Show notification
        showNotification(`Video removed from ${playlist.name}`, 'info');
    } catch (error) {
        console.error('Error removing video from playlist:', error);
        throw new Error('Failed to remove video from playlist');
    }
}

async function addVideoToPlaylist(currentUser, playlistId, videoId) {
    if (!videoId) {
        throw new Error('Video ID is required');
    }

    try {
        // 1. Get video details from YouTube API
        const videoData = await fetchVideoDetails(videoId);
        if (!videoData) {
            throw new Error('Could not fetch video details');
        }
        
        // 2. Get current playlist data
        const playlistRef = ref(db, `users/${currentUser.uid}/playlists/${playlistId}`);
        const snapshot = await get(playlistRef);
        const playlist = snapshot.val();
        
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        // 3. Check if video already exists
        const videoExists = playlist.videos?.some(v => v.id.videoId === videoId);
        if (videoExists) {
            showNotification('Video already exists in this playlist', 'warning');
            return;
        }
        
        // 4. Add video to playlist
        const updatedVideos = [...(playlist.videos || []), videoData];
        await set(ref(db, `users/${currentUser.uid}/playlists/${playlistId}/videos`), updatedVideos);
        
        // 5. Update playlist timestamp
        await set(ref(db, `users/${currentUser.uid}/playlists/${playlistId}/updatedAt`), new Date().toISOString());
        
        // 6. Update video count display
        if (window.updateVideoCount) {
            window.updateVideoCount(playlistId, updatedVideos.length);
        }
        
        // 7. Show success notification
        showSuccessNotification(playlist.name, playlistId);
    } catch (error) {
        console.error('Error adding video to playlist:', error);
        throw new Error('Failed to add video to playlist');
    }
}

async function fetchVideoDetails(videoId) {
    if (!videoId) {
        throw new Error('Video ID is required');
    }

    try {
        console.log('Fetching video details for ID:', videoId);
        
        // Try to get video details from the current player if available
        if (window.player && window.player.getVideoData) {
            const playerData = window.player.getVideoData();
            if (playerData && playerData.video_id === videoId) {
                return {
                    id: {
                        videoId: videoId
                    },
                    snippet: {
                        title: playerData.title,
                        description: '',  // Player doesn't provide description
                        thumbnails: {
                            default: {
                                url: `https://i.ytimg.com/vi/${videoId}/default.jpg`
                            },
                            medium: {
                                url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
                            },
                            high: {
                                url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                            }
                        },
                        channelTitle: playerData.author
                    }
                };
            }
        }

        // Fallback to YouTube API if player data is not available
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=AIzaSyD33YiLLyTxlIycnHcArDKbgxvK_se27eA`
        );
        
        if (!response.ok) {
            console.error('YouTube API Error:', response.status, response.statusText);
            throw new Error('Failed to fetch video details from YouTube');
        }

        const data = await response.json();
        console.log('YouTube API Response:', data);
        
        if (!data.items || data.items.length === 0) {
            console.error('No video found with ID:', videoId);
            throw new Error('Video not found on YouTube');
        }
        
        const video = data.items[0];
        return {
            id: {
                videoId: videoId
            },
            snippet: {
                title: video.snippet.title,
                description: video.snippet.description,
                thumbnails: video.snippet.thumbnails,
                channelTitle: video.snippet.channelTitle
            }
        };
    } catch (error) {
        console.error('Error in fetchVideoDetails:', error);
        showNotification('Error fetching video details: ' + error.message, 'error');
        return null;
    }
}

function showSuccessNotification(playlistName, playlistId) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-check-circle-fill me-2"></i>
            <div>
                <div>Video added to ${playlistName}</div>
                <a href="playlist-view.html?id=${playlistId}" class="btn btn-sm btn-outline-success mt-1">
                    View Playlist
                </a>
            </div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 5000);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 
                          type === 'warning' ? 'bi-exclamation-triangle-fill' : 
                          type === 'error' ? 'bi-x-circle-fill' : 
                          'bi-info-circle-fill'} me-2"></i>
            <div>${message}</div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
} 