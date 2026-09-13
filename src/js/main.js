import { saveAllTabs, createAllTabs, removeTabs, getStorage, getRecentlyClosedTabs } from "./tab.js";


const TABS = "tabs";
const TABS_BACKUP = "tabs_backup";
const TABS_RECENTLY = "tabs_recently";

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
            <img class="tab-item-favicon" src="${tab.favIconUrl || defaultIcon}" width="20" height="20" onerror="this.src='${defaultIcon}'">
            <a href="${tab.url}" target="_blank" class="tab-item-title" title="${tab.url}">
                ${tab.title}
            </a>
        </li>
        `
        );
    })
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


window.onload = async () => {

    // Insert Tab Information
    const listTab = document.getElementById("list-tab");
    refreshTabInfo(TABS, listTab);

    const listTabBackup = document.getElementById("list-tab-backup");
    refreshTabInfo(TABS_BACKUP, listTabBackup);

    const listTabRecently = document.getElementById("list-tab-recently");
    const recentlyClosedTabs = await getRecentlyClosedTabs();
    insertTabHTML(recentlyClosedTabs, listTabRecently, TABS_RECENTLY);

    // Save button
    const btnTabSave = document.getElementById("btn-tab-save") || document.createElement("button");
    btnTabSave.addEventListener("click", async (e) => {
        await saveAllTabs(TABS);
        await refreshTabInfo(TABS, listTab);
        alert("Pages have been successfully saved.");
    })

    // Open button
    const btnTabCreate = document.getElementById("btn-tab-create") || document.createElement("button");
    btnTabCreate.addEventListener("click", async (e) => {
        await createAllTabs(TABS);
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
        await refreshTabInfo(TABS, listTab);
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


    // Remove button
    const tabRemove = document.getElementById("tab-remove") || document.createElement("button");
    tabRemove.addEventListener("click", async (e) => {
        let result = confirm("Are you sure you want to delete this page?");
        if (!result) { return }
        const checks = document.getElementsByClassName("checkbox-tabs");
        let checkedIndices = Array.from(checks).filter(check => check.checked).map(check => parseInt(check.getAttribute("name")));
        await removeTabs(TABS, checkedIndices);
        await refreshTabInfo(TABS, listTab);
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




