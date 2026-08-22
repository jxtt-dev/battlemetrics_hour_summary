import browser from 'webextension-polyfill';

// Show update page after update is installed
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
        browser.tabs.create({
            url: browser.runtime.getURL('update/update.html'),
        });
    }
});
