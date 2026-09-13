export const getStorage = (key) => new Promise(resolve => {
    if (!chrome?.storage?.local) { resolve({}); return; }
    chrome.storage.local.get(key, resolve);
})

export const setStorage = (key, value) => new Promise(resolve => {
    if (!chrome?.storage?.local) { resolve(); return; }
    chrome.storage.local.set({[key]: value}, resolve);
})

export const removeStorage = (key) => new Promise(resolve => {
    if (!chrome?.storage?.local) { resolve(); return; }
    chrome.storage.local.remove(key, resolve);
})

export const saveAllTabs = async (key) => {
    const tabs = await chrome.tabs.query({});
    await setStorage(key, tabs)
}

const openTabsInWindows = async (tabs) => {
    let windowGroup = {};

    tabs.map(tab => {
        if (!windowGroup.hasOwnProperty(tab.windowId)) {
            windowGroup[tab.windowId] = [];
        }
        windowGroup[tab.windowId].push(tab);
    })

    const windowCreatePromises = Object.values(windowGroup).map(tabs => {
        const url = tabs.map(tab => tab.url)
        return chrome.windows.create({ url: url });
    })
    await Promise.all(windowCreatePromises);
}

export const createAllTabs = async (key) => {
    const result = await getStorage(key);
    if (!result.hasOwnProperty(key)) { return ;}
    await openTabsInWindows(result[key]);
}

const GROUPS = "groups";
const LEGACY_TABS = "tabs";

// One-time migration from the old single flat "tabs" list to the new
// named-group format, so existing saved pages aren't lost when upgrading.
export const migrateLegacyTabs = async () => {
    const legacy = await getStorage(LEGACY_TABS);
    if (!legacy.hasOwnProperty(LEGACY_TABS)) { return; }
    const legacyTabs = legacy[LEGACY_TABS];
    await removeStorage(LEGACY_TABS);
    if (!Array.isArray(legacyTabs) || legacyTabs.length === 0) { return; }

    const groups = await getGroups();
    groups.unshift({
        id: `group_${Date.now()}`,
        name: "Saved Pages",
        createdAt: Date.now(),
        tabs: legacyTabs,
    });
    await setStorage(GROUPS, groups);
}

export const getGroups = async () => {
    const result = await getStorage(GROUPS);
    return result[GROUPS] || [];
}

export const saveTabsAsGroup = async (name) => {
    const tabs = await chrome.tabs.query({});
    const groups = await getGroups();
    const newGroup = {
        id: `group_${Date.now()}`,
        name,
        createdAt: Date.now(),
        tabs,
    };
    groups.unshift(newGroup);
    await setStorage(GROUPS, groups);
    return newGroup;
}

export const renameGroup = async (groupId, name) => {
    const groups = await getGroups();
    const group = groups.find(group => group.id === groupId);
    if (!group) { return; }
    group.name = name;
    await setStorage(GROUPS, groups);
}

export const removeGroup = async (groupId) => {
    const groups = await getGroups();
    await setStorage(GROUPS, groups.filter(group => group.id !== groupId));
}

export const removeTabFromGroup = async (groupId, index) => {
    const groups = await getGroups();
    const group = groups.find(group => group.id === groupId);
    if (!group) { return; }
    group.tabs = group.tabs.filter((_, i) => i !== index);
    await setStorage(GROUPS, groups);
}

export const openGroupTabs = async (groupId) => {
    const groups = await getGroups();
    const group = groups.find(group => group.id === groupId);
    if (!group) { return; }
    await openTabsInWindows(group.tabs);
}

export const getRecentlyClosedTabs = async (limit=20) => {
    if (!chrome?.sessions) { return []; }
    const recentlyClosed = await chrome.sessions.getRecentlyClosed();
    let tabs = recentlyClosed.flatMap(v => {
        if(v.hasOwnProperty("tab")) {
            return v["tab"]
        } else if (v.hasOwnProperty("window")) {
            const window = v["window"];
            return window["tabs"]
        }
    })
    tabs = tabs.slice(0, limit);
    return tabs;
}