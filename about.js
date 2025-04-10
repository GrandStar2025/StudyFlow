// Get DOM elements
const themeSwitch = document.getElementById('themeSwitch');

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Use ThemeManager if available
    if (window.ThemeManager) {
        const themeSettings = window.ThemeManager.getLocalTheme();
        window.ThemeManager.applyTheme(themeSettings);
        
        // Add theme switch event listener
        if (themeSwitch) {
            themeSwitch.addEventListener('change', () => {
                const themeSettings = window.ThemeManager.getLocalTheme();
                themeSettings.theme = themeSettings.theme === 'light' ? 'dark' : 'light';
                window.ThemeManager.saveTheme(themeSettings);
            });
        }
    } else {
        // Fallback if ThemeManager is not available
        const savedTheme = localStorage.getItem('themeSettings');
        const themeMode = savedTheme ? JSON.parse(savedTheme).theme : 'light';
        document.documentElement.setAttribute('data-bs-theme', themeMode);
        
        if (themeSwitch) {
            themeSwitch.checked = themeMode === 'dark';
            
            themeSwitch.addEventListener('change', () => {
                const currentTheme = document.documentElement.getAttribute('data-bs-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-bs-theme', newTheme);
                localStorage.setItem('themeSettings', JSON.stringify({
                    theme: newTheme,
                    primaryColor: '#4361ee'
                }));
            });
        }
    }
});

// Handle storage events to sync theme changes from other pages
window.addEventListener('storage', (e) => {
    if (e.key === 'themeSettings') {
        try {
            const newTheme = JSON.parse(e.newValue);
            if (window.ThemeManager) {
                window.ThemeManager.applyTheme(newTheme);
            } else {
                document.documentElement.setAttribute('data-bs-theme', newTheme.theme);
                if (themeSwitch) {
                    themeSwitch.checked = newTheme.theme === 'dark';
                }
            }
        } catch (error) {
            console.error('Error applying theme from storage event:', error);
        }
    }
}); 