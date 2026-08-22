# BattleMetrics Hour Summary

A browser extension to summarize a players hours on BattleMetrics.

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