export const getStorage = (key) => new Promise(resolve => {
    if (!chrome?.storage?.local) { resolve({}); return; }
    chrome.storage.local.get(key, resolve);
})

export const setStorage = (key, value) => new Promise(resolve => {
    if (!chrome?.storage?.local) { resolve(); return; }
    chrome.storage.local.set({[key]: value}, resolve);
})

export const saveAllTabs = async (key) => {
    const tabs = await chrome.tabs.query({});
    await setStorage(key, tabs)
}

export const createAllTabs = async (key) => {
    const result = await getStorage(key);
    if (!result.hasOwnProperty(key)) { return ;}
    const tabs = result[key];
    let windowGroup = {};

    tabs.map(tab => {
        if (!windowGroup.hasOwnProperty(tab.windowId)) {
            windowGroup[tab.windowId] = [];
        }
        windowGroup[tab.windowId].push(tab);
    })

    const windowCreatePromises = Object.values(windowGroup).map(tabs => {
        const url = tabs.map(tab => tab.url)
        chrome.windows.create({ url: url });
    })
    await Promise.all(windowCreatePromises);
}


export const removeTabs = async (key, indices) => {
    const result = await getStorage(key);
    if(!result.hasOwnProperty(key)) { return; }
    const tabs = result[key];
    const newTabs = tabs.filter((_, i) => !indices.includes(i));
    await setStorage(key, newTabs);
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