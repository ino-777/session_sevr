# Session Savr

A Chrome extension for saving and restoring your open tabs and windows.

## Features

- **Save Pages** — Save the currently open tabs/windows as a named session and reopen them later.
- **Backup Pages** — Automatically back up all currently open pages on a periodic basis.
- **Recently Closed Pages** — Quickly reopen any of the 20 most recently closed pages.

## Installation

Install from the Chrome Web Store:
https://chromewebstore.google.com/detail/session-savr/mplbjgcblllekbcpligaamdpkcpmecel

## Running Locally

This extension is built with plain HTML/CSS/JavaScript and [UIkit](https://getuikit.com/), so no build step is required.

1. Clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the project directory.
5. Click the Session Savr icon in the toolbar to open the app (`main.html`) in a new tab.

Any changes you make to the source files can be picked up by clicking the reload button for the extension on the `chrome://extensions` page.

### Quick visual check (without loading the extension)

If you only want to check the look and layout of `main.html` (not the actual tab-saving behavior), you can serve it with any static file server instead of loading it as an extension. This avoids CORS restrictions that Chrome applies to ES module scripts when opened directly via `file://`.

```sh
# from the project root
python3 -m http.server 8000

# then open http://localhost:8000/main.html in your browser.
```

Note that features relying on `chrome.*` APIs (saving/restoring tabs, backup, recently closed pages) won't work in this mode since those APIs only exist inside the extension context — use this only to preview styling/layout.

Since the lists are populated from `chrome.storage` at runtime, they'll be empty on `localhost`. To preview the styling with sample data, open the DevTools console on the page and paste in:

```js
["list-tab", "list-tab-backup", "list-tab-recently"].forEach(id => {
    document.getElementById(id).innerHTML = `
        <li>
            <div class="uk-flex uk-flex-middle">
                <div class="uk-width-auto uk-margin-small-right">
                    <input class="uk-checkbox" type="checkbox">
                </div>
                <div class="uk-width-auto uk-margin-small-right">
                    <img src="icon-chrome.png" width="25" height="25">
                </div>
                <div class="uk-width-expand">
                    <a href="#" target="_blank" class="uk-link-text">Sample Tab Title</a>
                </div>
            </div>
        </li>
    `.repeat(3);
});
```
