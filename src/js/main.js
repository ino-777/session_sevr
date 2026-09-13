import {
    createAllTabs,
    getStorage,
    getRecentlyClosedTabs,
    migrateLegacyTabs,
    getGroups,
    saveTabsAsGroup,
    renameGroup,
    removeGroup,
    removeTabFromGroup,
    openGroupTabs,
} from "./tab.js";


const TABS_BACKUP = "tabs_backup";
const TABS_RECENTLY = "tabs_recently";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
}[ch]));

const formatDate = (timestamp) => new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
}).format(new Date(timestamp));

// Manifest V3 extension pages forbid inline event handlers (e.g. onerror="..."),
// so the favicon fallback has to be wired up from JS after insertion instead.
const bindFaviconFallback = (target) => {
    const defaultIcon = "icon-chrome.png";
    target.querySelectorAll(".tab-item-favicon").forEach(img => {
        img.addEventListener("error", () => { img.src = defaultIcon; }, { once: true });
    });
}

const insertTabHTML = (tabs, target, key = "") => {
    const defaultIcon = "icon-chrome.png";

    tabs.map((tab, index) => {
        target.insertAdjacentHTML(
            "beforeend",
            `
        <li class="tab-item">
            <label class="tab-item-checkbox">
                <input class="uk-checkbox checkbox-${key}" type="checkbox" name="${index}">
            </label>
            <img class="tab-item-favicon" src="${escapeHtml(tab.favIconUrl || defaultIcon)}" width="20" height="20">
            <a href="${escapeHtml(tab.url)}" target="_blank" class="tab-item-title" title="${escapeHtml(tab.url)}">
                ${escapeHtml(tab.title)}
            </a>
        </li>
        `
        );
    })
    bindFaviconFallback(target);
    updateEmptyState(target, tabs.length === 0);
}

const updateEmptyState = (target, isEmpty) => {
    const emptyState = document.querySelector(`[data-empty-for="${target.id}"]`);
    if (!emptyState) { return; }
    emptyState.style.display = isEmpty ? "block" : "none";
}

const refreshTabInfo = async (key, target) => {
    target.innerHTML = "";
    const result = await getStorage(key);
    if (!result.hasOwnProperty(key)) { updateEmptyState(target, true); return; }
    const tabs = result[key];
    insertTabHTML(tabs, target, key);
}

// Groups whose tab list is currently expanded (in-memory only; every group
// starts collapsed so a long list of saved sessions doesn't force a lot of
// scrolling to reach the ones further down).
const expandedGroups = new Set();

const renderGroup = (group, target) => {
    const defaultIcon = "icon-chrome.png";
    const isExpanded = expandedGroups.has(group.id);

    const tabItemsHTML = group.tabs.map((tab, index) => `
        <li class="tab-item">
            <img class="tab-item-favicon" src="${escapeHtml(tab.favIconUrl || defaultIcon)}" width="20" height="20">
            <a href="${escapeHtml(tab.url)}" target="_blank" class="tab-item-title" title="${escapeHtml(tab.url)}">
                ${escapeHtml(tab.title)}
            </a>
            <span uk-icon="icon: close; ratio: 0.8" class="icon-btn icon-btn-sm icon-btn-danger tab-item-remove" data-index="${index}" uk-tooltip="Remove"></span>
        </li>
    `).join("");

    target.insertAdjacentHTML(
        "beforeend",
        `
        <div class="group-card${isExpanded ? " is-expanded" : ""}" data-group-id="${escapeHtml(group.id)}">
            <div class="group-card-header">
                <div class="group-card-title">
                    <span uk-icon="icon: chevron-right; ratio: 0.8" class="group-toggle-icon"></span>
                    <span class="group-card-name">${escapeHtml(group.name)}</span>
                    <span uk-icon="icon: pencil; ratio: 0.8" class="icon-btn icon-btn-sm group-rename" uk-tooltip="Rename"></span>
                    <span class="group-card-meta">${group.tabs.length} page${group.tabs.length === 1 ? "" : "s"} · ${formatDate(group.createdAt)}</span>
                </div>
                <div class="group-card-actions">
                    <a href="#" class="group-action-link group-open-all" uk-tooltip="Open all pages in this group">
                        <span uk-icon="icon: link; ratio: 0.75"></span>
                        Open all
                    </a>
                    <span uk-icon="icon: trash; ratio: 0.9" class="icon-btn icon-btn-danger group-delete" uk-tooltip="Delete group"></span>
                </div>
            </div>
            <ul class="tab-list">${tabItemsHTML}</ul>
        </div>
        `
    );
}

const renderGroups = async (target) => {
    await migrateLegacyTabs();
    const groups = await getGroups();
    target.innerHTML = "";
    updateEmptyState(target, groups.length === 0);
    groups.forEach(group => renderGroup(group, target));
    bindFaviconFallback(target);
}


window.onload = async () => {

    // Saved Pages (named groups)
    const groupList = document.getElementById("group-list");
    await renderGroups(groupList);

    // Backup / Recently closed (flat lists)
    const listTabBackup = document.getElementById("list-tab-backup");
    refreshTabInfo(TABS_BACKUP, listTabBackup);

    const listTabRecently = document.getElementById("list-tab-recently");
    const recentlyClosedTabs = await getRecentlyClosedTabs();
    insertTabHTML(recentlyClosedTabs, listTabRecently, TABS_RECENTLY);

    // Save button
    const btnTabSave = document.getElementById("btn-tab-save") || document.createElement("button");
    btnTabSave.addEventListener("click", async (e) => {
        const suggestedName = `Session ${new Date().toLocaleString()}`;
        const name = prompt("Name this saved session:", suggestedName);
        if (name === null) { return; }
        const group = await saveTabsAsGroup(name.trim() || suggestedName);
        expandedGroups.add(group.id);
        await renderGroups(groupList);
    })

    // Group actions (open all / delete group / remove single tab)
    groupList.addEventListener("click", async (e) => {
        const card = e.target.closest(".group-card");
        if (!card) { return; }
        const groupId = card.getAttribute("data-group-id");

        if (e.target.closest(".group-open-all")) {
            e.preventDefault();
            await openGroupTabs(groupId);
            return;
        }

        if (e.target.closest(".group-rename")) {
            const currentName = card.querySelector(".group-card-name").textContent.trim();
            const name = prompt("Rename this saved session:", currentName);
            if (name === null || !name.trim() || name.trim() === currentName) { return; }
            await renameGroup(groupId, name.trim());
            await renderGroups(groupList);
            return;
        }

        if (e.target.closest(".group-delete")) {
            if (!confirm("Delete this saved group?")) { return; }
            await removeGroup(groupId);
            expandedGroups.delete(groupId);
            await renderGroups(groupList);
            return;
        }

        const removeBtn = e.target.closest(".tab-item-remove");
        if (removeBtn) {
            const index = parseInt(removeBtn.getAttribute("data-index"));
            await removeTabFromGroup(groupId, index);
            await renderGroups(groupList);
            return;
        }

        // Anywhere else on the header toggles the tab list open/closed.
        if (e.target.closest(".group-card-header")) {
            if (expandedGroups.has(groupId)) {
                expandedGroups.delete(groupId);
            } else {
                expandedGroups.add(groupId);
            }
            card.classList.toggle("is-expanded");
        }
    })

    const btnTabBackupCreate = document.getElementById("btn-tab-backup-create") || document.createElement("button");
    btnTabBackupCreate.addEventListener("click", async (e) => {
        await createAllTabs(TABS_BACKUP);
    })

    const btnTabRecentlyCreate = document.getElementById("btn-tab-recently-create") || document.createElement("button");
    btnTabRecentlyCreate.addEventListener("click", async (e) => {
        const url = recentlyClosedTabs.map(tab => tab.url);
        await chrome.windows.create({ url: url });
    })

    // Refresh button
    const tabRefresh = document.getElementById("tab-refresh") || document.createElement("button");
    tabRefresh.addEventListener("click", async (e) => {
        await renderGroups(groupList);
    })

    const tabBackupRefresh = document.getElementById("tab-backup-refresh") || document.createElement("button");
    tabBackupRefresh.addEventListener("click", async (e) => {
        await refreshTabInfo(TABS_BACKUP, listTabBackup);
    })

    const tabRecentlyRefresh = document.getElementById("tab-recently-refresh") || document.createElement("button");
    tabRecentlyRefresh.addEventListener("click", async (e) => {
        const recentlyClosedTabs = await getRecentlyClosedTabs();
        listTabRecently.innerHTML = "";
        await insertTabHTML(recentlyClosedTabs, listTabRecently, TABS_RECENTLY);
    })

    // Show backup date
    const textBackupDate = document.getElementById("backup-date") || document.createElement("span");
    const resultBackupDate = await getStorage("backup_date");
    if (resultBackupDate.hasOwnProperty("backup_date")) {
        const date = new Date(resultBackupDate["backup_date"]);
        const fDate = new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).format(date);
        textBackupDate.innerHTML = "Auto saved at " + fDate;
    }
}
