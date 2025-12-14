// ------------------------- Countdown -------------------------


// Check for settings and then initiate the timer popup if enabled
chrome.storage.sync.get(['timerEnabled', 'timerDuration'], function(result) {
    if (result.timerEnabled !== false) { // If timer is enabled
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

// Function to handle changes in the URL or content
function handleContentChanges() {
	const currentUrl = window.location.href;

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
	chrome.storage.sync.get(['hideReelsTab'], function(result) {
		if (result.hideReelsTab !== false) {
			toggleElementVisibility(reelsTabSelector, 'none');
		} else {
			toggleElementVisibility(reelsTabSelector, 'block');
		}
	});

	// Conditional display based on the current URL
	if (currentUrl === 'https://www.instagram.com/') {
		console.log('home feed', document.querySelector(homeFeedSelector));
		// check if the setting is enabled
		chrome.storage.sync.get(['hideMainFeed'], function(result) {
			if (result.hideMainFeed !== false) {
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
		chrome.storage.sync.get(['hideExplorePosts'], function(result) {
			if (result.hideExplorePosts !== false) {
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