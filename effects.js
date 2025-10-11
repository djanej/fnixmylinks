function copyAddress(id) {
    const svgElement = document.getElementById(id + 'Input');
    const title = svgElement.getAttribute('title');

    navigator.clipboard.writeText(title).then(() => {
        alert('copied the discord to clipboard: @' + title);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function removeOverlay() {
    var overlay = document.getElementById('overlay');
    var userpage = document.getElementById('user-page');
    var audio = document.getElementById('backgroundsong')

    overlay.style.opacity = '0';
    userpage.style.display = 'flex';
    audio.volume = 0.3;
    audio.play();

    setTimeout(function() { 
        overlay.style.display = 'none';
    }, 2000);
}

// Volume control functionality
document.addEventListener("DOMContentLoaded", () => {
    const volumeSlider = document.getElementById("volume-slider");
    const volumeIcon = document.getElementById("volume-icon");
    const volumeWaves = document.getElementById("volume-waves");
    const audio = document.getElementById("backgroundsong");
    let previousVolume = 45;
    let audioStarted = false;
    
    if (volumeSlider && audio && volumeIcon) {
        // Set initial volume
        audio.volume = volumeSlider.value / 100;
        
        // Auto-play on first user interaction
        const startAudio = () => {
            if (!audioStarted) {
                audio.play().catch(err => console.log("Audio play failed:", err));
                audioStarted = true;
            }
        };
        
        document.body.addEventListener('click', startAudio, { once: true });
        document.body.addEventListener('touchstart', startAudio, { once: true });
        
        // Update volume when slider changes
        volumeSlider.addEventListener("input", (e) => {
            const volume = e.target.value / 100;
            audio.volume = volume;
            
            // Update icon appearance based on volume
            if (volume === 0) {
                volumeWaves.style.display = 'none';
            } else {
                volumeWaves.style.display = 'block';
                previousVolume = e.target.value;
            }
        });
        
        // Click volume icon to mute/unmute
        volumeIcon.addEventListener("click", () => {
            if (audio.volume > 0) {
                // Mute
                previousVolume = volumeSlider.value;
                volumeSlider.value = 0;
                audio.volume = 0;
                volumeWaves.style.display = 'none';
            } else {
                // Unmute to previous volume
                volumeSlider.value = previousVolume;
                audio.volume = previousVolume / 100;
                volumeWaves.style.display = 'block';
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const prefix = "⠐ ";
    const titleText = "sky";
    let index = 0;
    let isDeleting = false;

function typeWriter() {
    document.title = prefix + titleText.substring(0, index);

    if (!isDeleting && index < titleText.length) {
        index++;
    setTimeout(typeWriter, 200);

    } else if (isDeleting && index > 0) {
        index--;
    setTimeout(typeWriter, 200);

    } else {
        isDeleting = !isDeleting;
    setTimeout(typeWriter, 1000);
    }
}

typeWriter();
});

document.addEventListener("DOMContentLoaded", function () {
const elements = document.querySelectorAll('.typewriter');
const texts = ["Jesus loves you", "\"The Lord is my shepherd.\" Psalm 23:1", "Jesus is enough.", "\"The Lord is near to the brokenhearted.\" Psalm 34:18", "Saved by grace", "\"Create in me a clean heart, O God.\" Psalm 51:10", "Jesus is the way.", "\"Lead me, O Lord, in your righteousness.\" Psalm 5:8"];
const typingSpeed = 100;
const pauseDuration = 1000;
let currentIndex = 0;

elements.forEach((element) => {
element.textContent = '';
let textIndex = 0;
let forward = true;

function typeWriter() {
    const currentText = texts[currentIndex];

    if (forward) {
        if (textIndex < currentText.length) {
            element.textContent += currentText.charAt(textIndex);
            textIndex++;
            setTimeout(typeWriter, typingSpeed);
        } else {
            setTimeout(() => {
                forward = false;
                typeWriter();
            }, pauseDuration);
        }
    } else {
        if (textIndex > 0) {
            textIndex--;
            element.textContent = currentText.substring(0, textIndex);
            setTimeout(typeWriter, typingSpeed);
        } else {
            currentIndex = (currentIndex + 1) % texts.length;
            forward = true;
            setTimeout(typeWriter, pauseDuration);
        }
    }
}

typeWriter();
});
});