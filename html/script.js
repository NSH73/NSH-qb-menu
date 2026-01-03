let buttonParams = [];
let images = [];

let isMenuOpen = false;

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const isImageIcon = (icon) => {
    if (!icon) return false;
    const s = String(icon).trim();
    // common qb-menu patterns: http(s) URLs, nui://, and image extensions
    return /^(https?:\/\/|nui:\/\/)/i.test(s) || /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(s);
};

const setMenuOpen = (open) => {
    isMenuOpen = open;
    const container = document.getElementById('container');
    if (container) container.classList.toggle('open', open);

    const hint = document.querySelector('.keyboard-hint');
    if (hint) hint.classList.toggle('visible', open);
};

// Sound Effects System
const SoundManager = {
    enabled: true,
    volume: 0.3,
    sounds: {},
    audioContext: null,
    customAudio: {},
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
            this.audioContext = null;
        }

        // Professional UI Sounds
        this.sounds.hover = this.createHoverSound();
        this.sounds.click = this.createClickSound();
        this.sounds.locked = this.createLockedSound();
        
        this.loadCustomSounds();
    },

    createHoverSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            this.resumeContext();

            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            // "Matte" Click - Soft, neutral, professional
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);
            
            gain.gain.setValueAtTime(0.04 * this.volume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            
            osc.start(t);
            osc.stop(t + 0.04);
        };
    },

    createClickSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            this.resumeContext();

            const t = this.audioContext.currentTime;
            
            // Simple "Pop" - Clean, short, and responsive
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.type = 'sine';
            
            // Quick pitch drop for a "tactile" feel
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);
            
            // Short, punchy envelope
            gain.gain.setValueAtTime(0.3 * this.volume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            
            osc.start(t);
            osc.stop(t + 0.08);
        };
    },

    createLockedSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            this.resumeContext();

            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            // "Access Denied" - Professional "Thud/Error"
            // Using a square wave for a more "digital" lock sound, but low pitch
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
            
            // Quick decay
            gain.gain.setValueAtTime(0.2 * this.volume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            
            osc.start(t);
            osc.stop(t + 0.1);
        };
    },

    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }
    },
    
    loadCustomSounds() {
        // Optional: Load custom sound files if they exist
        const soundPaths = {
            hover: './sounds/hover.mp3',
            click: './sounds/click.mp3',
            locked: './sounds/locked.mp3'
        };
        
        Object.keys(soundPaths).forEach((key) => {
            const audio = new Audio(soundPaths[key]);
            audio.preload = 'auto';
            audio.volume = this.volume;

            // If custom sound loads successfully, use it instead
            audio.addEventListener('canplaythrough', () => {
                this.customAudio[key] = audio;
                this.sounds[key] = () => {
                    if (!this.enabled) return;
                    const a = this.customAudio[key];
                    if (!a) return;
                    a.currentTime = 0;
                    a.volume = this.volume;
                    a.play().catch(() => {});
                };
            });
        });
    },
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
};

// Initialize sound system
SoundManager.init();

// Keyboard Navigation System
const KeyboardNav = {
    enabled: true,
    selectedIndex: -1,
    buttons: [],

    centerSelectedInView(smooth = true) {
        const scroller = document.getElementById('buttons');
        if (!scroller) return;

        if (this.selectedIndex < 0 || this.selectedIndex >= this.buttons.length) return;
        const el = this.buttons[this.selectedIndex];
        if (!el) return;

        // Robust horizontal centering inside the scroll container.
        // scrollIntoView() can pick the wrong ancestor in NUI and sometimes won't center reliably.
        const scrollerRect = scroller.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
        const elCenter = elRect.left + elRect.width / 2;
        const delta = elCenter - scrollerCenter;

        // If we're already basically centered, skip.
        if (Math.abs(delta) < 2) return;

        scroller.scrollTo({
            left: scroller.scrollLeft + delta,
            behavior: smooth ? 'smooth' : 'auto'
        });
    },
    
    init() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    },
    
    updateButtons() {
        this.buttons = Array.from(document.querySelectorAll('.button:not(.disabled)'));
        if (this.selectedIndex >= this.buttons.length) {
            this.selectedIndex = this.buttons.length - 1;
        }
    },
    
    handleKeyPress(e) {
        if (!isMenuOpen) return;
        if (!this.enabled || this.buttons.length === 0) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.selectPrevious();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                this.selectNext();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.activateSelected();
                break;
        }
    },
    
    selectNext() {
        if (this.selectedIndex === -1) {
            this.selectedIndex = 0;
        } else {
            this.selectedIndex = Math.min(this.selectedIndex + 1, this.buttons.length - 1);
        }
        this.updateSelection();
    },
    
    selectPrevious() {
        if (this.selectedIndex === -1) {
            this.selectedIndex = 0;
        } else {
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        }
        this.updateSelection();
    },
    
    updateSelection() {
        // Remove previous selection
        document.querySelectorAll('.button.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Add new selection
        if (this.selectedIndex >= 0 && this.selectedIndex < this.buttons.length) {
            const selected = this.buttons[this.selectedIndex];
            selected.classList.add('selected');
            
            // Play hover sound
            SoundManager.play('hover');

            // Keep the selected item visible/centered in the horizontal scroller.
            this.centerSelectedInView(true);
        }
    },
    
    activateSelected() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.buttons.length) {
            const selected = this.buttons[this.selectedIndex];
            // Don't activate if disabled (though updateButtons filters these out already)
            if (!$(selected).hasClass('disabled')) {
                SoundManager.play('click');
                $(selected).click();
            }
        }
    },
    
    reset() {
        this.selectedIndex = -1;
        document.querySelectorAll('.button.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
};

// Initialize keyboard navigation
KeyboardNav.init();

// Scroll Wheel Navigation
const ScrollNav = {
    enabled: true,
    scrollTimeout: null,
    
    init() {
        const buttonsContainer = document.getElementById('buttons');
        if (buttonsContainer) {
            // Use passive event listener for better performance
            buttonsContainer.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        }
    },
    
    handleWheel(e) {
        if (!isMenuOpen) return;
        if (!this.enabled) return;
        
        const buttonsContainer = e.currentTarget;
        const isScrollable = buttonsContainer.scrollWidth > buttonsContainer.clientWidth;
        
        // Only handle wheel events when content is scrollable
        if (!isScrollable) return;
        
        e.preventDefault();
        
        // Smooth horizontal scroll
        // Support both vertical wheel (deltaY) and horizontal trackpad (deltaX)
        const primaryDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const scrollAmount = primaryDelta * 1.5;
        buttonsContainer.scrollLeft += scrollAmount;
        
        // Reset keyboard selection to prevent jumping
        KeyboardNav.reset();
    }
};

// Initialize scroll navigation
ScrollNav.init();

// Initialize Arrow Click Listeners
document.addEventListener('DOMContentLoaded', () => {
    const arrowLeft = document.getElementById('scroll-arrow-left');
    const arrowRight = document.getElementById('scroll-arrow-right');
    const container = document.getElementById('buttons');

    if (arrowLeft && container) {
        arrowLeft.addEventListener('click', () => {
            container.scrollBy({ left: -300, behavior: 'smooth' });
            SoundManager.play('hover');
        });
    }

    if (arrowRight && container) {
        arrowRight.addEventListener('click', () => {
            container.scrollBy({ left: 300, behavior: 'smooth' });
            SoundManager.play('hover');
        });
    }
});

const openMenu = (data = null) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[qb-menu] openMenu called with invalid data');
        return;
    }
    
    let headerHtml = "";
    let html = "";
    
    data.forEach((item, index) => {
        if(!item.hidden) {
            let header = item.header;
            let message = item.txt || item.text;
            let isMenuHeader = item.isMenuHeader;
            let isDisabled = item.disabled;
            let icon = item.icon;
            images[index] = item;
            
            // Separate title headers from regular items
            if (isMenuHeader) {
                headerHtml = getHeaderRender(header, message);
            } else {
                html += getButtonRender(header, message, index, isDisabled, icon);
                if (item.params) buttonParams[index] = item.params;
            }
        }
    });

    // Insert header above buttons if exists
    if (headerHtml) {
        $("body").append(headerHtml);
        setTimeout(() => $("#menu-header").addClass('visible'), 50);
    }
    
    $("#buttons").html(html);

    setMenuOpen(true);

    // Apply curved arc effect
    applyCurvedLayout();

    // Re-check after layout/fonts settle (NUI/CEF can report widths slightly later)
    requestAnimationFrame(() => applyCurvedLayout());
    setTimeout(() => applyCurvedLayout(), 60);
    
    // Update keyboard navigation
    KeyboardNav.updateButtons();
    KeyboardNav.reset();

    // Add sound effects to buttons
    $('.button, .title').off('mouseenter').on('mouseenter', function() {
        if (!$(this).hasClass('disabled')) {
            // Sync keyboard selection with mouse hover for seamless switching
            const index = $(this).index();
            // Adjust index because titles might be in the list, but our buttons array in KeyboardNav filters them?
            // Actually KeyboardNav.buttons is just .button:not(.disabled)
            // So we need to find the index in that specific array
            const btnElement = this;
            const btnIndex = KeyboardNav.buttons.indexOf(btnElement);
            
            if (btnIndex !== -1) {
                KeyboardNav.selectedIndex = btnIndex;
                // We don't call updateSelection() here to avoid double-visuals (hover + selected class)
                // But we remove .selected from others to keep it clean
                document.querySelectorAll('.button.selected').forEach(btn => {
                    btn.classList.remove('selected');
                });
            }
            
            SoundManager.play('hover');
        } else {
            // Ensure disabled items don't get selected class
            $(this).removeClass('selected');
        }
    });

    $('.button').off('click').on('click', function() {
        const target = $(this);
        if (!target.hasClass('title')) {
            if (target.hasClass('disabled')) {
                // Play locked/error sound for disabled items
                SoundManager.play('locked');
            } else {
                // Clear keyboard selection on mouse click
                KeyboardNav.reset();
                // Play click sound for active items
                SoundManager.play('click');
                postData(target.attr('id'));
            }
        }
    });
};

const getHeaderRender = (header, message = null) => {
    const safeHeader = escapeHtml(header);
    const safeMessage = escapeHtml(message);
    
    return `
        <div id="menu-header">
            <div class="header">${safeHeader}</div>
            ${message ? `<div class="text">${safeMessage}</div>` : ""}
        </div>
    `;
};

const getButtonRender = (header, message = null, id, isDisabled, icon) => {
    const safeHeader = escapeHtml(header);
    const safeMessage = escapeHtml(message);
    const safeId = escapeHtml(id);
    const iconStr = String(icon ?? "").trim();
    
    // Build icon HTML - only if icon exists and is valid
    let iconHtml = '';
    if (iconStr && iconStr.length > 0) {
        if (isImageIcon(iconStr)) {
            iconHtml = `<div class="icon"><img src="${escapeHtml(iconStr)}" alt="" onerror="this.parentElement.style.display='none';"></div>`;
        } else if (iconStr.includes('fa-') || iconStr.includes('fas') || iconStr.includes('far') || iconStr.includes('fab') || iconStr.includes('fal') || iconStr.includes('fad')) {
            iconHtml = `<div class="icon"><i class="${escapeHtml(iconStr)}"></i></div>`;
        }
    }

    return `
        <div class="button ${isDisabled ? "disabled" : ""}" id="${safeId}">
            ${iconHtml}
            <div class="column">
                <div class="header">${safeHeader}</div>
                ${message ? `<div class="text">${safeMessage}</div>` : ""}
            </div>
        </div>
    `;
};

const closeMenu = () => {
    $("#menu-header").remove();
    $("#buttons").html(" ");
    $('#buttons').removeClass('scrollable');
    const buttonsEl = document.getElementById('buttons');
    if (buttonsEl) buttonsEl.scrollLeft = 0;
    $('#imageHover').css('display' , 'none');
    buttonParams = [];
    images = [];
    KeyboardNav.reset();

    // Clear curve offsets so next open starts clean
    const buttons = document.querySelectorAll('.button, .title');
    buttons.forEach((el) => {
        el.style.removeProperty('--scroll-y');
        el.style.removeProperty('--scroll-scale');
        el.style.removeProperty('--scroll-opacity');
        el.style.animationDelay = '';
    });

    setMenuOpen(false);
};

const postData = (id) => {
    $.post(`https://${GetParentResourceName()}/clickedButton`, JSON.stringify(parseInt(id) + 1));
    return closeMenu();
};

const cancelMenu = () => {
    $.post(`https://${GetParentResourceName()}/closeMenu`);
    return closeMenu();
};

// Dynamic Carousel Effect - Updates on scroll for premium feel
const updateCarouselVisuals = () => {
    const container = document.getElementById('buttons');
    if (!container) return;
    
    const buttons = container.querySelectorAll('.button');
    if (buttons.length === 0) return;
    
    const maxScroll = container.scrollWidth - container.clientWidth;
    const progressTrack = document.querySelector('.scroll-progress-track');
    const arrowLeft = document.getElementById('scroll-arrow-left');
    const arrowRight = document.getElementById('scroll-arrow-right');

    if (maxScroll > 0) {
        // Update Progress Handle
        const progress = Math.max(0, Math.min(1, container.scrollLeft / maxScroll));
        const handle = document.querySelector('.scroll-progress-handle');
        
        if (handle) {
            // Calculate handle position (0% to 100%)
            handle.style.left = `${progress * 100}%`;
        }
        if (progressTrack) progressTrack.classList.add('visible');

        // Update Arrows Visibility
        if (arrowLeft) {
            if (container.scrollLeft > 10) arrowLeft.classList.add('visible');
            else arrowLeft.classList.remove('visible');
        }
        
        if (arrowRight) {
            if (container.scrollLeft < maxScroll - 10) arrowRight.classList.add('visible');
            else arrowRight.classList.remove('visible');
        }

    } else {
        if (progressTrack) progressTrack.classList.remove('visible');
        if (arrowLeft) arrowLeft.classList.remove('visible');
        if (arrowRight) arrowRight.classList.remove('visible');
    }
    
    const containerCenter = container.scrollLeft + (container.clientWidth / 2);
    
    buttons.forEach((btn) => {
        // Calculate center of this button relative to the scroll container
        const btnCenter = btn.offsetLeft + (btn.offsetWidth / 2);
        
        // Distance from center of view
        const dist = Math.abs(containerCenter - btnCenter);
        
        // Normalize distance (0 at center, 1 at ~600px away)
        const maxDist = container.clientWidth * 0.6;
        const normalizedDist = Math.min(dist / maxDist, 1);
        
        // Calculate effects
        // Scale: 1.0 at center, 0.85 at edges (more depth)
        const scale = 1 - (normalizedDist * 0.15);
        
        // Y-Offset: 0 at center, 25px down at edges (more pronounced curve)
        const yOffset = Math.pow(normalizedDist, 2) * 25;
        
        // Opacity: 1.0 at center, 0.6 at edges (focus effect)
        const opacity = 1 - (Math.pow(normalizedDist, 1.5) * 0.4);
        
        // Apply CSS variables for performant transform
        btn.style.setProperty('--scroll-scale', scale.toFixed(3));
        btn.style.setProperty('--scroll-y', `${yOffset.toFixed(1)}px`);
        btn.style.setProperty('--scroll-opacity', opacity.toFixed(2));
    });
};

// Setup layout and scroll listeners
const applyCurvedLayout = () => {
    const buttonsContainer = $('#buttons');
    const buttons = buttonsContainer.find('.button');
    const totalButtons = buttons.length;
    
    if (totalButtons === 0) return;
    
    // Calculate if scrollable based on fixed card width (240px) + gaps
    const container = buttonsContainer[0];
    const cardWidth = 240;
    const gap = 16; // --space-md
    const padding = 160; // 80px each side
    const totalContentWidth = (cardWidth * totalButtons) + (gap * (totalButtons - 1)) + padding;
    const isScrollable = totalContentWidth > container.clientWidth;
    
    buttonsContainer.toggleClass('scrollable', isScrollable);
    
    // Initial visual update
    updateCarouselVisuals();
    
    // Bind scroll listener for dynamic updates
    $(container).off('scroll.visuals').on('scroll.visuals', () => {
        window.requestAnimationFrame(updateCarouselVisuals);
    });
};



window.addEventListener("message", (event) => {
    const data = event.data;
    const buttons = data.data;
    const action = data.action;
    switch (action) {
        case "OPEN_MENU":
        case "SHOW_HEADER":
            openMenu(buttons);
            return;
        case "CLOSE_MENU":
            return closeMenu();
        default:
            return;
    }
});

window.addEventListener('mousemove', (event) => {
    let $target = $(event.target);
    const $hoveredButton = $target.closest('.button');
    if ($hoveredButton.length && $('.button').is(":visible")) {
        const id = $hoveredButton.attr('id');
        if (!images[id]) return;
        if (images[id].image) {
            $('#image').attr('src', images[id].image);
            $('#imageHover').css('display' , 'block');
        }
    }
    else {
        $('#imageHover').css('display' , 'none');
    }
})

document.onkeyup = function (event) {
    const charCode = event.key;
    if (charCode == "Escape") {
        if (isMenuOpen) {
            cancelMenu();
        }
    }
};
