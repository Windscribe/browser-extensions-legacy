export const setCurrentTabUrl = (url) => {
    return {
        type: 'SET_CURRENT_TAB_URL',
        data: url
    }
};

export const setTabs = (tabs) => {
    return {
        type: 'SET_TABS',
        data: tabs
    }
};

export const setUserAgent = (userAgent) => {
    return {
        type: 'SET_USER_AGENT',
        data: userAgent
    }
}

export const setLastActiveTab = (tab) => {
    return {
        type: 'SET_LAST_ACTIVE_TAB',
        data: tab
    }
}