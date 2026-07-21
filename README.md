# BattleMetrics Hour Summary

A browser extension to summarize a players hours on BattleMetrics.

![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/gnajpegpiielkdlhiggjmojcnlihmfal?style=flat&logo=googlechrome&logoColor=%23FFFFFF&label=Chrome%20Users)
![Mozilla Add-on Users](https://img.shields.io/amo/users/battlemetrics-hour-summary?logo=firefoxbrowser&logoColor=%23FFFFFF&label=Firefox%20Users)

**Youtube Demo:**

[![Youtube Demo](https://img.youtube.com/vi/k_Jnh_QnnqI/0.jpg)](https://www.youtube.com/watch?v=k_Jnh_QnnqI)

### API token (required)

BattleMetrics now requires an API token for the endpoints this extension uses.
After installing:

1. Create a token at [battlemetrics.com/developers](https://www.battlemetrics.com/developers)
2. Open the extension popup (or its settings page) and paste the token into the
   "BattleMetrics API token" field, then press "Save"
3. Refresh the BattleMetrics page

The token is stored in `storage.local`, so it stays on the machine and is never
pushed to browser account sync.

### Installation

#### Chrome/Opera/Brave/Edge:
1. Visit the extensions page on the [Chrome Web Store](https://chromewebstore.google.com/detail/battlemetrics-hour-summar/gnajpegpiielkdlhiggjmojcnlihmfal)
2. Press "Add to Chrome"

#### Firefox
1. Visit the extensions page on [Firefox Add-Ons](https://addons.mozilla.org/en-GB/firefox/addon/battlemetrics-hour-summary/)
2. Press "Add to Firefox"

### Building from source
1. Download the source code as a zip, using the green "Code" button on GitHub
2. Unzip the zip file
3. Install Node and NPM
4. Run `npm i` and `npm build` in the project root

##### Chrome
1. Go to `chrome://extensions/` in Chrome and turn on Developer mode (top right)
2. Click "Load unpacked" (top left)
3. Select the "dist" folder created in the build step

##### Firefox
1. Go to `about:debugging#/runtime/this-firefox` in Firefox
2. Click "Load Temporary Add-on..."
3. Select `manifest.json` from the "dist" folder created in the build step