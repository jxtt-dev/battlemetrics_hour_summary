# BattleMetrics Hour Summary

A browser extension to summarize a players hours on BattleMetrics.

![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/gnajpegpiielkdlhiggjmojcnlihmfal?style=flat&logo=googlechrome&logoColor=%23FFFFFF&label=Chrome%20Users)
![Mozilla Add-on Users](https://img.shields.io/amo/users/battlemetrics-hour-summary?logo=firefoxbrowser&logoColor=%23FFFFFF&label=Firefox%20Users)

**Youtube Demo:**

[![Youtube Demo](https://img.youtube.com/vi/k_Jnh_QnnqI/0.jpg)](https://www.youtube.com/watch?v=k_Jnh_QnnqI)

### Installation

#### Chrome/Opera/Brave/Edge:
1. Visit the extensions page on the [Chrome Web Store](https://chromewebstore.google.com/detail/battlemetrics-hour-summar/gnajpegpiielkdlhiggjmojcnlihmfal)
2. Press "Add to Chrome"

#### Firefox
1. Visit the extensions page on [Firefox Add-Ons](https://addons.mozilla.org/en-GB/firefox/addon/battlemetrics-hour-summary/)
2. Press "Add to Firefox"

### Adding an API key to the extension

As of v1.2.1, the previous identifier and session history features require a BattleMetrics API key. Follow the video tutorial below to set this up.

[![API Key Tutorial](https://img.youtube.com/vi/XiUS0lbnTdw/0.jpg)](https://www.youtube.com/watch?v=XiUS0lbnTdw)

### Building from source
1. Download the source code as a zip, using the green "Code" button on GitHub
2. Unzip the zip file
3. Install Node and NPM
4. Run `npm i`
5. Depending on the browser, build with this command in the project root:
   - Chrome: `npm build:prod`
   - Firefox: `npm build:firefox:prod`

##### Chrome
1. Go to `chrome://extensions/` in Chrome and turn on Developer mode (top right)
2. Click "Load unpacked" (top left)
3. Select the "dist" folder created in the build step

##### Firefox
1. Go to `about:debugging#/runtime/this-firefox` in Firefox
2. Click "Load Temporary Add-on..."
3. Select `manifest.json` from the "dist" folder created in the build step