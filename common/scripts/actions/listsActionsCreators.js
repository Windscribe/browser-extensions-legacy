export const addUser = (userId) => {
    return {
        type: 'ADD_USER',
        data : userId
    }
};

export const deleteFromWhiteList = (domain) => {
    return {
        type: 'DELETE_FROM_WHITE_LIST',
        data : domain
    }
};

export const deleteFromCookieWhiteList = domain => ({
    type: 'DELETE_FROM_COOKIE_WHITE_LIST',
    data: domain
})

export const deleteFromProxyWhiteList = domain => ({
    type: 'DELETE_FROM_PROXY_WHITE_LIST',
    data: domain
})

export const putToProxyWhiteList = (domain) => {
    return {
        type: 'PUT_TO_PROXY_WHITE_LIST',
        data : domain
    }
};

export const putToWhiteList = (domain) => {
    return {
        type: 'PUT_TO_WHITE_LIST',
        data : domain
    }
};

export const addToCookieWhitelist = domain => ({
    type: 'ADD_TO_COOKIE_WHITE_LIST',
    data: domain
})

export const setUserAgentsList = (response) => {
    return {
        type: 'SET_USER_AGENTS_LIST',
        data : response.data
    }
};

export const setNotificationsList = (list) => {
    return {
        type: 'SET_NOTIFICATIONS_LIST',
        data : list
    }
};

export const setRecentLinks = (data) => {
    return {
        type: 'SET_RECENT_LINKS',
        data : data
    }
}

export const changeNewInstall = (state) => {
    return {
        type: 'CHANGE_NEW_INSTALL',
        data : state
    }
};

export const addShownNotification = (id) => {
    return {
        type: 'ADD_SHOWN_NOTIFICATION',
        data: id
    }
}

export const changeCurrentLng = (lng) => {
    return {
        type: 'CHANGE_CURRENT_LNG',
        data: lng
    }
}

export const changeSplitPersonality = (state) => {
    return {
        type: 'CHANGE_SPLITPERSONALITY',
        data: state
    }
};

export const setCookieMonsterFlag = val => {
    return {
        type: 'UPDATE_COOKIE_MONSTER_FLAG',
        data: val
    }
}

export const changePrivacyOption = (type, data) => {
    return { type, data }
}