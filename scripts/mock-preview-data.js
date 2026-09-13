// Dev-only helper: paste this into the DevTools console (or save it as a
// DevTools "Snippet") while viewing main.html on a local static server
// (see README.md > Running Locally > Quick visual check).
//
// It fills the tab lists with sample rows so you can preview the styling
// without loading the extension, since chrome.storage is unavailable outside
// the extension context.
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
