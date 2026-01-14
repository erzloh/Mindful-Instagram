// ------------------------- Countdown -------------------------

// Helper function to safely call Chrome storage API
function safeChromeStorageGet(keys, callback) {
	try {
		if (chrome && chrome.storage && chrome.storage.sync) {
			chrome.storage.sync.get(keys, callback);
		}
	} catch (error) {
		console.warn('Chrome storage API unavailable:', error);
	}
}

// Check for settings and then initiate the timer popup if enabled
safeChromeStorageGet(['timerEnabled', 'timerDuration'], function(result) {
    if (result && result.timerEnabled !== false) { // If timer is enabled
        const timerDuration = result.timerDuration || 10; // Default to 10 seconds
        showPopupAndStartCountdown(timerDuration);
    }
});

function showPopupAndStartCountdown(duration) {
    const overlayHTML = `
    <div id="mindfulOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.75); z-index: 10000; display: flex; justify-content: center; align-items: center;">
        <div style="background: black; padding: 20px; border-radius: 10px; text-align: center; color: white;">
            <p id="timerText">Please wait for ${duration} seconds...</p>
        </div>
    </div>
    `;

	// Function to disable page interaction and prevent scrolling
	function disablePageInteraction() {
		document.body.style.overflow = 'hidden'; // Prevent scrolling
		document.body.style.pointerEvents = 'none';
		document.body.insertAdjacentHTML('beforeend', overlayHTML);
		document.addEventListener('touchmove', preventScrolling, { passive: false }); // Prevent touch scrolling
	}

	// Function to enable page interaction and allow scrolling
	function enablePageInteraction() {
		document.body.style.overflow = 'auto'; // Re-enable scrolling
		document.body.style.pointerEvents = 'all';
		const overlay = document.getElementById('mindfulOverlay');
		if (overlay) {
			overlay.remove();
		}
		document.removeEventListener('touchmove', preventScrolling); // Re-enable touch scrolling
	}

	// Function to prevent touch scrolling
	function preventScrolling(event) {
		event.preventDefault();
	}

    // Initially disable interaction and prevent scrolling
    disablePageInteraction();

    // Start the countdown
    let counter = duration;
    const interval = setInterval(() => {
        counter--;
        if (document.getElementById('timerText')) { // Check if element exists
            document.getElementById('timerText').textContent = 'Please wait for ' + counter + ' seconds...';
        }
        if (counter <= 0) {
            clearInterval(interval);
			document.getElementById('timerText').textContent = 'You can now use Instagram mindfully.';
            // Allow a brief moment before enabling interaction to let the user acknowledge the message
            setTimeout(enablePageInteraction, 1000); // Re-enable interaction and scrolling after 1 second
        }
    }, 1000);
}


// ------------------------- Hide Elements -------------------------

// Function to hide or show an element by selector
function toggleElementVisibility(selector, displayStyle) {
	const element = document.querySelector(selector);
	if (element) {
		element.style.display = displayStyle;
	}
}

// ------------------------- Reel Viewer Detection -------------------------

let reelViewerDetected = false;
let reelScrollBlocked = false;

// Function to prevent scrolling for reel viewer
function preventReelScrolling(event) {
	event.preventDefault();
}

// Function to block scrolling when reel viewer is open
function blockReelScrolling() {
	if (!reelScrollBlocked) {
		document.body.style.overflow = 'hidden';
		document.addEventListener('touchmove', preventReelScrolling, { passive: false });
		document.addEventListener('wheel', preventReelScrolling, { passive: false });
		reelScrollBlocked = true;
		console.log('Scroll blocked for reel viewer');
	}
}

// Function to unblock scrolling when reel viewer is closed
function unblockReelScrolling() {
	if (reelScrollBlocked) {
		document.body.style.overflow = 'auto';
		document.removeEventListener('touchmove', preventReelScrolling);
		document.removeEventListener('wheel', preventReelScrolling);
		reelScrollBlocked = false;
		console.log('Scroll unblocked - reel viewer closed');
	}
}

// Function to check if a reel viewer is currently open (by DOM structure)
function detectReelViewer() {
	// Check if countdown overlay is active - don't interfere with it
	const countdownOverlay = document.getElementById('mindfulOverlay');
	const countdownActive = countdownOverlay !== null;
	
	// Check for reel viewer elements based on the HTML structure
	const reelVideoPlayers = document.querySelectorAll('div[aria-label="Video player"][role="group"]');
	const reelSections = document.querySelectorAll('section.x78zum5.xdt5ytf.x1iyjqo2.x5yr21d.xh8yej3');
	
	let isReelOpen = false;
	
	// Check if any of these elements are visible and likely part of a reel viewer
	for (let player of reelVideoPlayers) {
		const rect = player.getBoundingClientRect();
		// Reel viewers are typically large, taking up significant screen space
		if (rect.width > 300 && rect.height > 400 && rect.top >= 0) {
			const section = player.closest('section');
			if (section) {
				const video = section.querySelector('video[playsinline]');
				if (video) {
					const videoStyle = window.getComputedStyle(video);
					if (videoStyle.objectFit === 'cover' || video.hasAttribute('playsinline')) {
						isReelOpen = true;
						break;
					}
				}
			}
		}
	}
	
	// Alternative check: look for sections with reel-specific structure
	if (!isReelOpen) {
		for (let section of reelSections) {
			const video = section.querySelector('video[playsinline]');
			if (video) {
				const rect = section.getBoundingClientRect();
				if (rect.width > 300 && rect.height > 400 && rect.top >= 0 && rect.left >= 0) {
					const videoStyle = window.getComputedStyle(video);
					if (videoStyle.display !== 'none' && videoStyle.visibility !== 'hidden') {
						isReelOpen = true;
						break;
					}
				}
			}
		}
	}
	
	// Handle scroll blocking based on reel viewer state
	if (isReelOpen && !countdownActive) {
		if (!reelViewerDetected) {
			reelViewerDetected = true;
			console.log('Reel viewer detected!');
		}
		blockReelScrolling();
	} else {
		// If no reel viewer found, reset the flag and unblock scrolling
		if (reelViewerDetected) {
			reelViewerDetected = false;
			if (!countdownActive) {
				unblockReelScrolling();
			}
		}
	}
	
	return isReelOpen;
}

// Function to handle changes in the URL or content
function handleContentChanges() {
	const currentUrl = window.location.href;

	// Detect reel viewer
	try {
		detectReelViewer();
	} catch (error) {
		console.warn('Error detecting reel viewer:', error);
	}

	// Selector constants
	const reelsTabSelector = `a[href="/reels/"].x1i10hfl.x1ejq31n.x1hl2dhg`;
	// const homeFeedSelector = '.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x6s0dn4.x1oa3qoh.x1nhvcw1';
	const homeFeedSelector = '.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x6s0dn4.x1oa3qoh.x1nhvcw1';
	const exploreFeedSelector = '.x78zum5.xdt5ytf.x11lt19s.x1n2onr6.xph46j.x7x3xai.xsybdxg.x194l6zq';
	const exploreFeedLoadingSelector = '.xemfg65.xa4qsjk.x1ka1v4i.xbv57ra';
	const topBarSelector = '._ab16._ab17';
	const storiesSelector = '.x1qjc9v5.x78zum5.x1q0g3np.xl56j7k.xh8yej3';

	// Get elements
	const topBar = document.querySelector(topBarSelector);
	const stories = document.querySelector(storiesSelector);

	// Hide Reels tab
	safeChromeStorageGet(['hideReelsTab'], function(result) {
		if (result && result.hideReelsTab !== false) {
			toggleElementVisibility(reelsTabSelector, 'none');
		} else {
			toggleElementVisibility(reelsTabSelector, 'block');
		}
	});

	// Conditional display based on the current URL
	if (currentUrl === 'https://www.instagram.com/') {
		console.log('home feed', document.querySelector(homeFeedSelector));
		// check if the setting is enabled
		safeChromeStorageGet(['hideMainFeed'], function(result) {
			if (result && result.hideMainFeed !== false) {
				toggleElementVisibility(homeFeedSelector, 'none');
			} else {
				toggleElementVisibility(homeFeedSelector, 'block');
			}
		});
	
		// move top bar to the bottom
		if (topBar) {
			topBar.style.position = 'fixed';
			topBar.style.bottom = '149px';
		}

		// move stories to the bottom
		if (stories) {
			stories.style.position = 'fixed';
			stories.style.bottom = '48px';
		}

		// remove alt from stories for yomitan support (avoid popups when clicking on stories)
		const storiesContainer = document.querySelector('.x5lxg6s.x78zum5.x1q0g3np.x1wkxgih.x1sxyh0.xurb0ha.xqh3lvm')

		if (storiesContainer) {
			storiesContainer.childNodes[0].childNodes.forEach((item, index) => {
				if (index != 0) {
				item.childNodes[0].childNodes[0].childNodes[1].childNodes[0].alt = ''
				}
			})	
		}

	} else if (currentUrl.includes('/?variant=following')) {
		toggleElementVisibility(homeFeedSelector, 'block');

		// set top bar to its default position
		if (topBar) {
			topBar.style.position = 'static';
			topBar.style.bottom = 'auto';
		}

		// set stories to its default position
		if (stories) {
			stories.style.position = 'static';
			stories.style.bottom = 'auto';
		}
		
	} else if (currentUrl.includes('/explore/')) {
		// check if the setting is enabled
		safeChromeStorageGet(['hideExplorePosts'], function(result) {
			if (result && result.hideExplorePosts !== false) {
				toggleElementVisibility(exploreFeedSelector, 'none');
				toggleElementVisibility(exploreFeedLoadingSelector, 'none');
			} else {
				toggleElementVisibility(exploreFeedSelector, 'block');
				toggleElementVisibility(exploreFeedLoadingSelector, 'block');
			}
		});
	}
}

// Observer for page mutations
const observer = new MutationObserver(handleContentChanges);

// Start observing
observer.observe(document.body, { childList: true, subtree: true });

console.log('hello test 01')