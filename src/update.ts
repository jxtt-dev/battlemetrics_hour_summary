import browser from 'webextension-polyfill';
import { updateMessages } from './shared/updateMessages';
import { setVersionNumber } from './utils/extensionOptionHelpers';

document.addEventListener('DOMContentLoaded', () => {
    setVersionNumber('version-number-header');
    setVersionNumber('version-number-footer');

    const version = browser.runtime.getManifest().version;

    const messageElement = document.getElementById('update-message');
    if (messageElement) {
        const message =
            updateMessages[version] ??
            'BattleMetrics Hour Summary has been updated.';
        messageElement.innerHTML = message;
    }
});
