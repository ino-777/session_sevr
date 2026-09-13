// Dev-only helper: paste this into the DevTools console (or save it as a
// DevTools "Snippet") while viewing main.html on a local static server
// (see README.md > Running Locally > Quick visual check).
//
// It fills the tab lists with sample rows so you can preview the styling
// without loading the extension, since chrome.storage is unavailable outside
// the extension context.

// Saved Pages: sample named groups
document.getElementById("group-list").innerHTML = [
    { name: "Work", count: 3, expanded: true },
    { name: "Reading list", count: 2, expanded: false },
].map(({ name, count, expanded }) => `
    <div class="group-card${expanded ? " is-expanded" : ""}">
        <div class="group-card-header">
            <div class="group-card-title">
                <span uk-icon="icon: chevron-right; ratio: 0.8" class="group-toggle-icon"></span>
                <span class="group-card-name">${name}</span>
                <span uk-icon="icon: pencil; ratio: 0.8" class="icon-btn icon-btn-sm"></span>
                <span class="group-card-meta">${count} pages · 2026/09/13 12:00</span>
            </div>
            <div class="group-card-actions">
                <a href="#" class="group-action-link">
                    <span uk-icon="icon: link; ratio: 0.75"></span>
                    Open all
                </a>
                <span uk-icon="icon: trash; ratio: 0.9" class="icon-btn icon-btn-danger"></span>
            </div>
        </div>
        <ul class="tab-list">
            ${`
            <li class="tab-item">
                <img class="tab-item-favicon" src="icon-chrome.png" width="20" height="20">
                <a href="#" target="_blank" class="tab-item-title">Sample Tab Title</a>
                <span uk-icon="icon: close; ratio: 0.8" class="icon-btn icon-btn-sm icon-btn-danger"></span>
            </li>
            `.repeat(count)}
        </ul>
    </div>
`).join("");

// Backup / Recently closed: flat lists
["list-tab-backup", "list-tab-recently"].forEach(id => {
    document.getElementById(id).innerHTML = `
        <li class="tab-item">
            <label class="tab-item-checkbox">
                <input class="uk-checkbox" type="checkbox">
            </label>
            <img class="tab-item-favicon" src="icon-chrome.png" width="20" height="20">
            <a href="#" target="_blank" class="tab-item-title">Sample Tab Title</a>
        </li>
    `.repeat(3);
});
