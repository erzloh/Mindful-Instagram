// Initialize form elements with saved settings
document.addEventListener('DOMContentLoaded', () => {	
	// Get settings from storage and update form elements
    chrome.storage.sync.get(['timerEnabled', 'timerDuration', 'hideMainFeed', 'hideExplorePosts', 'hideReelsTab'], function(result) {
        document.getElementById('timerEnabled').checked = result.timerEnabled !== false; // default to true
        document.getElementById('timerDuration').value = result.timerDuration || 10; // default to 10 seconds
        document.getElementById('hideMainFeed').checked = result.hideMainFeed !== false;
        document.getElementById('hideExplorePosts').checked = result.hideExplorePosts !== false;
        document.getElementById('hideReelsTab').checked = result.hideReelsTab !== false;
    });

	// Update the disabled state of the timer input based on the timer checkbox
	const timerEnabledCheckbox = document.getElementById('timerEnabled');
    const timerDurationInput = document.getElementById('timerDuration');

    function updateTimerDurationDisabledState() {
      timerDurationInput.disabled = !timerEnabledCheckbox.checked;
    }

    timerEnabledCheckbox.addEventListener('change', updateTimerDurationDisabledState);
});

// Save settings when the save button is clicked
document.getElementById('saveSettings').addEventListener('click', () => {
    const timerEnabled = document.getElementById('timerEnabled').checked;
    const timerDuration = parseInt(document.getElementById('timerDuration').value, 10);
    const hideMainFeed = document.getElementById('hideMainFeed').checked;
    const hideExplorePosts = document.getElementById('hideExplorePosts').checked;
    const hideReelsTab = document.getElementById('hideReelsTab').checked;

    chrome.storage.sync.set({timerEnabled, timerDuration, hideMainFeed, hideExplorePosts, hideReelsTab}, function() {
        alert('Settings saved.');
    });
});
