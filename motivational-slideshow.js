// Motivational quotes in Hinglish
const motivationalQuotes = [
    "Success ka raasta thoda difficult hota hai, lekin failure ka raasta bohot easy hota hai. Aap dono mein se koi bhi choose kar sakte hain.",
    "Agar aap apne dreams ko achieve karna chahte hain, toh aapko apne comfort zone se bahar aana hoga.",
    "Koi bhi kaam impossible nahi hai, agar aap usse possible banana chahte hain.",
    "Agar aap apne goals ko achieve karna chahte hain, toh aapko apne actions ko change karna hoga.",
    "Success ka matlab hai ki aap apne goals ko achieve kar rahe hain, failure ka matlab hai ki aap kuch naya seekh rahe hain.",
    "Agar aap apne dreams ko achieve karna chahte hain, toh aapko apne fears ko overcome karna hoga.",
    "Koi bhi kaam chota ya bada nahi hota, har kaam ka apna importance hota hai.",
    "Agar aap apne goals ko achieve karna chahte hain, toh aapko apne mindset ko change karna hoga.",
    "Success ka matlab hai ki aap apne best efforts de rahe hain, failure ka matlab hai ki aap kuch naya try kar rahe hain.",
    "Agar aap apne dreams ko achieve karna chahte hain, toh aapko apne actions ko align karna hoga.",
    "Koi bhi kaam easy nahi hota, lekin koi bhi kaam impossible bhi nahi hota.",
    "Agar aap apne goals ko achieve karna chahte hain, toh aapko apne habits ko change karna hoga.",
    "Success ka matlab hai ki aap apne goals ko achieve kar rahe hain, failure ka matlab hai ki aap kuch naya seekh rahe hain.",
    "Agar aap apne dreams ko achieve karna chahte hain, toh aapko apne fears ko overcome karna hoga.",
    "Koi bhi kaam chota ya bada nahi hota, har kaam ka apna importance hota hai.",
    "Zindagi mein kuch bhi impossible nahi hai, agar aap usse possible banana chahte hain.",
    "Agar aap apne goals ko achieve karna chahte hain, toh aapko apne actions ko change karna hoga.",
    "Success ka matlab hai ki aap apne goals ko achieve kar rahe hain, failure ka matlab hai ki aap kuch naya seekh rahe hain.",
    "Agar aap apne dreams ko achieve karna chahte hain, toh aapko apne fears ko overcome karna hoga.",
    "Koi bhi kaam chota ya bada nahi hota, har kaam ka apna importance hota hai.",
    "Agar aap apne goals ko achieve karna chahte hain, toh aapko apne mindset ko change karna hoga.",
    "Success ka matlab hai ki aap apne best efforts de rahe hain, failure ka matlab hai ki aap kuch naya try kar rahe hain.",
    "Agar aap apne dreams ko achieve karna chahte hain, toh aapko apne actions ko align karna hoga.",
    "Koi bhi kaam easy nahi hota, lekin koi bhi kaam impossible bhi nahi hota.",
    "Agar aap apne goals ko achieve karna chahte hain, toh aapko apne habits ko change karna hoga.",
    "Success ka matlab hai ki aap apne goals ko achieve kar rahe hain, failure ka matlab hai ki aap kuch naya seekh rahe hain.",
    "Agar aap apne dreams ko achieve karna chahte hain, toh aapko apne fears ko overcome karna hoga.",
    "Koi bhi kaam chota ya bada nahi hota, har kaam ka apna importance hota hai.",
    "Zindagi mein kuch bhi impossible nahi hai, agar aap usse possible banana chahte hain.",
    "Agar aap apne goals ko achieve karna chahte hain, toh aapko apne actions ko change karna hoga.",
    "Success ka matlab hai ki aap apne goals ko achieve kar rahe hain, failure ka matlab hai ki aap kuch naya seekh rahe hain.",
    "Agar aap apne dreams ko achieve karna chahte hain, toh aapko apne fears ko overcome karna hoga.",
    "Koi bhi kaam chota ya bada nahi hota, har kaam ka apna importance hota hai.",
    "Agar aap apne goals ko achieve karna chahte hain, toh aapko apne mindset ko change karna hoga.",
    "Success ka matlab hai ki aap apne best efforts de rahe hain, failure ka matlab hai ki aap kuch naya try kar rahe hain.",
    "Agar aap apne dreams ko achieve karna chahte hain, toh aapko apne actions ko align karna hoga.",
    "Koi bhi kaam easy nahi hota, lekin koi bhi kaam impossible bhi nahi hota."
];

// Slideshow functionality
class MotivationalSlideshow {
    constructor(elementId, interval = 5000) {
        this.element = document.getElementById(elementId);
        this.interval = interval;
        this.currentIndex = 0;
        this.isPlaying = true;
        this.timer = null;
        
        // Create the slideshow container
        this.createSlideshow();
        
        // Start the slideshow
        this.startSlideshow();
    }
    
    createSlideshow() {
        // Create quote container
        this.quoteContainer = document.createElement('div');
        this.quoteContainer.className = 'motivational-quote-container';
        
        // Create quote text element
        this.quoteText = document.createElement('div');
        this.quoteText.className = 'motivational-quote-text';
        
        // Add click event to pause/resume
        this.quoteContainer.addEventListener('click', () => this.togglePlay());
        
        // Append elements
        this.quoteContainer.appendChild(this.quoteText);
        this.element.appendChild(this.quoteContainer);
        
        // Show first quote
        this.showQuote();
    }
    
    showQuote() {
        // Add fade out effect
        this.quoteText.style.opacity = '0';
        
        // Wait for fade out to complete, then change text and fade in
        setTimeout(() => {
            this.quoteText.textContent = motivationalQuotes[this.currentIndex];
            this.quoteText.style.opacity = '1';
        }, 300);
    }
    
    nextQuote() {
        this.currentIndex = (this.currentIndex + 1) % motivationalQuotes.length;
        this.showQuote();
    }
    
    startSlideshow() {
        if (this.isPlaying) {
            this.timer = setInterval(() => this.nextQuote(), this.interval);
        }
    }
    
    stopSlideshow() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            this.startSlideshow();
            this.quoteContainer.classList.remove('paused');
        } else {
            this.stopSlideshow();
            this.quoteContainer.classList.add('paused');
        }
    }
}

// Initialize the slideshow when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create a container for the slideshow between navbar and welcome section
    const navbar = document.querySelector('.navbar');
    const welcomeSection = document.querySelector('.welcome-section');
    
    if (navbar && welcomeSection) {
        // Create slideshow container
        const slideshowContainer = document.createElement('div');
        slideshowContainer.id = 'motivational-slideshow';
        slideshowContainer.className = 'motivational-slideshow-section';
        
        // Insert after navbar but before the container with welcome section
        const container = document.querySelector('.container.mt-5');
        if (container) {
            container.parentNode.insertBefore(slideshowContainer, container);
            
            // Initialize slideshow
            new MotivationalSlideshow('motivational-slideshow');
        }
    }
}); 