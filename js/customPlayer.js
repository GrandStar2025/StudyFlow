class CustomVideoPlayer {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            autoplay: false,
            muted: false,
            ...options
        };
        
        this.initializePlayer();
        this.initializeControls();
        this.setupEventListeners();
    }

    initializePlayer() {
        // Create video element
        this.video = document.createElement('video');
        this.video.className = 'main-video';
        this.container.appendChild(this.video);

        // Create controls container
        this.controls = document.createElement('div');
        this.controls.className = 'custom-controls';
        this.container.appendChild(this.controls);

        // Create progress bar
        this.progressContainer = document.createElement('div');
        this.progressContainer.className = 'progress-container';
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        this.progressFilled = document.createElement('div');
        this.progressFilled.className = 'progress-filled';
        this.progressBar.appendChild(this.progressFilled);
        this.progressContainer.appendChild(this.progressBar);
        this.controls.appendChild(this.progressContainer);

        // Create main controls
        this.controlsMain = document.createElement('div');
        this.controlsMain.className = 'controls-main';
        this.controls.appendChild(this.controlsMain);

        // Left controls
        this.leftControls = document.createElement('div');
        this.leftControls.className = 'controls-left';
        this.controlsMain.appendChild(this.leftControls);

        // Right controls
        this.rightControls = document.createElement('div');
        this.rightControls.className = 'controls-right';
        this.controlsMain.appendChild(this.rightControls);

        this.createControlButtons();
    }

    createControlButtons() {
        // Left side controls
        this.playPauseBtn = this.createButton('playPauseBtn', '<i class="bi bi-play-fill"></i>', this.leftControls);
        this.rewindBtn = this.createButton('rewindBtn', '<i class="bi bi-arrow-counterclockwise"></i>', this.leftControls);
        this.forwardBtn = this.createButton('forwardBtn', '<i class="bi bi-arrow-clockwise"></i>', this.leftControls);
        
        // Volume control
        this.volumeControl = document.createElement('div');
        this.volumeControl.className = 'volume-control';
        this.muteBtn = this.createButton('muteBtn', '<i class="bi bi-volume-up-fill"></i>', this.volumeControl);
        
        this.volumeSlider = document.createElement('input');
        this.volumeSlider.type = 'range';
        this.volumeSlider.min = '0';
        this.volumeSlider.max = '100';
        this.volumeSlider.value = '100';
        this.volumeSlider.className = 'volume-slider';
        this.volumeControl.appendChild(this.volumeSlider);
        
        this.leftControls.appendChild(this.volumeControl);

        // Time display
        this.timeDisplay = document.createElement('div');
        this.timeDisplay.className = 'time-display';
        this.timeDisplay.innerHTML = '<span id="currentTime">0:00</span> / <span id="duration">0:00</span>';
        this.leftControls.appendChild(this.timeDisplay);

        // Right side controls
        this.playbackBtn = this.createButton('playbackBtn', '1x', this.rightControls);
        this.qualityBtn = this.createButton('qualityBtn', 'Auto', this.rightControls);
        this.fullscreenBtn = this.createButton('fullscreenBtn', '<i class="bi bi-fullscreen"></i>', this.rightControls);

        // Create panels
        this.createPlaybackPanel();
        this.createQualityPanel();
    }

    createButton(id, innerHTML, parent) {
        const button = document.createElement('button');
        button.id = id;
        button.className = 'control-btn';
        button.innerHTML = innerHTML;
        parent.appendChild(button);
        return button;
    }

    createPlaybackPanel() {
        this.playbackPanel = document.createElement('div');
        this.playbackPanel.className = 'playback-panel';
        const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        
        speeds.forEach(speed => {
            const button = document.createElement('button');
            button.className = 'playback-option';
            button.textContent = `${speed}x`;
            button.dataset.speed = speed;
            if (speed === 1) button.classList.add('active');
            this.playbackPanel.appendChild(button);
        });

        this.rightControls.appendChild(this.playbackPanel);
    }

    createQualityPanel() {
        this.qualityPanel = document.createElement('div');
        this.qualityPanel.className = 'quality-panel';
        const qualities = ['Auto', '1080p', '720p', '480p', '360p'];
        
        qualities.forEach(quality => {
            const button = document.createElement('button');
            button.className = 'quality-option';
            button.textContent = quality;
            if (quality === 'Auto') button.classList.add('active');
            this.qualityPanel.appendChild(button);
        });

        this.rightControls.appendChild(this.qualityPanel);
    }

    setupEventListeners() {
        // Video events
        this.video.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.video.addEventListener('ended', () => this.onEnded());

        // Control events
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.rewindBtn.addEventListener('click', () => this.rewind());
        this.forwardBtn.addEventListener('click', () => this.forward());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.playbackBtn.addEventListener('click', () => this.togglePlaybackPanel());

        // Progress bar events
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.progressBar.addEventListener('mousemove', (e) => this.showProgressHover(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeypress(e));

        // Auto-hide controls
        this.container.addEventListener('mousemove', () => this.showControls());
        this.container.addEventListener('mouseleave', () => this.hideControls());
    }

    loadVideo(src) {
        this.video.src = src;
        this.video.load();
        if (this.options.autoplay) {
            this.video.play();
        }
    }

    togglePlay() {
        if (this.video.paused) {
            this.video.play();
            this.playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        } else {
            this.video.pause();
            this.playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        }
    }

    rewind() {
        this.video.currentTime = Math.max(0, this.video.currentTime - 10);
    }

    forward() {
        this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 10);
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
        this.updateVolumeUI();
    }

    updateVolume(value) {
        this.video.volume = value / 100;
        this.video.muted = value === 0;
        this.updateVolumeUI();
    }

    updateVolumeUI() {
        const value = this.video.muted ? 0 : this.video.volume * 100;
        this.volumeSlider.value = value;
        
        const icon = this.video.muted ? 'volume-mute-fill' :
                    value > 50 ? 'volume-up-fill' :
                    value > 0 ? 'volume-down-fill' : 'volume-off-fill';
        
        this.muteBtn.innerHTML = `<i class="bi bi-${icon}"></i>`;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen();
            this.fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
        } else {
            document.exitFullscreen();
            this.fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen"></i>';
        }
    }

    seek(e) {
        const pos = (e.pageX - this.progressBar.offsetLeft) / this.progressBar.offsetWidth;
        this.video.currentTime = pos * this.video.duration;
    }

    showProgressHover(e) {
        const pos = (e.pageX - this.progressBar.offsetLeft) / this.progressBar.offsetWidth;
        const time = pos * this.video.duration;
        // Update hover time display
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    onLoadedMetadata() {
        document.getElementById('duration').textContent = this.formatTime(this.video.duration);
        this.loadSavedProgress();
    }

    onTimeUpdate() {
        document.getElementById('currentTime').textContent = this.formatTime(this.video.currentTime);
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.progressFilled.style.width = `${progress}%`;
        this.saveProgress();
    }

    onEnded() {
        this.playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    }

    handleKeypress(e) {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

        switch(e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'j':
                this.rewind();
                break;
            case 'l':
                this.forward();
                break;
            case 'm':
                this.toggleMute();
                break;
            case 'f':
                this.toggleFullscreen();
                break;
        }
    }

    showControls() {
        this.controls.style.opacity = '1';
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            if (!this.video.paused) {
                this.controls.style.opacity = '0';
            }
        }, 2000);
    }

    hideControls() {
        if (!this.video.paused) {
            this.controls.style.opacity = '0';
        }
    }

    saveProgress() {
        const videoId = new URLSearchParams(window.location.search).get('id');
        const progress = {
            currentTime: this.video.currentTime,
            duration: this.video.duration,
            progress: (this.video.currentTime / this.video.duration) * 100,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`videoProgress_${videoId}`, JSON.stringify(progress));
    }

    loadSavedProgress() {
        const videoId = new URLSearchParams(window.location.search).get('id');
        const savedProgress = localStorage.getItem(`videoProgress_${videoId}`);
        if (savedProgress) {
            const { currentTime } = JSON.parse(savedProgress);
            if (currentTime && !isNaN(currentTime)) {
                this.video.currentTime = currentTime;
            }
        }
    }
}

// Export the class
window.CustomVideoPlayer = CustomVideoPlayer; 