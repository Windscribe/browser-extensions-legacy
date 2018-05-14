export const changeAppIsOn = (response) => {
    return {
        type: 'CHANGE_APP_IS_ON',
        data : response
    }
};

export const changeLocation = (dataObj) => {
    return {
        type: 'CHANGE_LOCATION',
        data : dataObj
    }
};

export const errored = (event, error) => {
    return {
        type: 'ERROR',
        event: event,
        error : error
    }
};

export const setConnectionMode = (mode) => {
    return {
        type: 'SET_CONNECTION_MODE',
        data: mode
    }
}

export const setDeviceId = (id) => {
    return {
        type: 'SET_DEVICE_ID',
        data: id
    }
}

export const setExtensionStatus = (status) => {
    return {
        type: 'SET_EXTENSION_STATUS',
        data: status
    }
}

export const setIcon = (mode) => {
    return {
        type: 'SET_ICON',
        data: mode
    }
}

export const setInstallationDate = (date) => {
    return {
        type: 'SET_INSTALLATION_DATE',
        data: date
    }
}

export const setIsJustLogged = (state) => {
    return {
        type: 'SET_IS_JUST_LOGGED',
        data: state
    }
}

export const setIsOtherExtensionPresent = (val) => {
    return {
        type: 'SET_IS_OTHER_EXTENSION_PRESENT',
        data : val
    }
}

export const setIsPremiumValue = (val) => {
    return {
        type: 'SET_IS_PREMIUM_VALUE',
        data : val
    }
}

export const setLocations = (locations) => {
    return {
        type: 'SET_LOCATIONS',
        data : locations
    }
}

export const setLocationsRevision = (revision) => {
    return {
        type: 'SET_LOCATIONS_REVISION',
        data : revision
    }
}

export const setOldIsOurLocationPresent = (state) => {
    return {
        type: 'SET_OLD_IS_OUR_LOCATION_PRESENT',
        data: state
    }
}

export const setOurIP = (ip) => {
    return {
        type: 'OUR_IP',
        data : ip
    }
}

export const setOurLocation = (location) => {
    return {
        type: 'SET_OUR_LOCATION',
        data : location
    }
}

export const setPremiumExpiryDate = (date) => {
    return {
        type: 'SET_PREMIUM_EXPIRY_DATE',
        data : date
    }
}

export const setProxy = (mode, pac) => {
    return {
        type: 'SET_PROXY',
        data : {
            mode,
            pac
        }
    }
}

export const setProxyLoginErrorCounter = (counter) => {
    return {
        type: 'SET_PROXY_LOGIN_ERROR_COUNTER',
        data: counter
    }
};

export const setProxyShouldBeTurnedOffAfterLeftOurLocation = (state) => {
    return {
        type: 'SET_PROXY_AFTER_LEFT_OUR_LOCATION',
        data : state
    }
}

export const setProxyStateBeforeExpiration = (state) => {
    return {
        type: 'SET_PROXY_STATE_BEFORE_EXPIRATION',
        data : state
    }
}

export const setRateUsPopShown = (val) => {
    return {
        type: 'SET_RATE_US_POPUP_SHOWN',
        data : val
    }
}

export const setRebill = (val) => {
    return {
        type: 'SET_REBILL',
        data : val
    }
}

export const setRemainingTraffic = (val) => {
    return {
        type: 'SET_REMAINING_TRAFFIC',
        data : val
    }
}

export const setReportedWebsite = (status) => {
    return {
        type: 'SET_REPORTED_WEBSITE',
        data: status
    }
}

export const setSecureLink = (responseData) => {
    return {
        type: 'SET_SECURE_LINK',
        secureLink : responseData.secure_url,
        secureLinkId : responseData.secure_link_display_id
    }
}

export const setSession = (response) => {
    return {
        type: 'SET_SESSION',
        data : response.data
    }
};

export const setSessionAuthHash = (session_hash) => {
    return {
        type: 'SET_SESSION_AUTH_HASH',
        data : session_hash
    }
}

export const setUserStatus = (status) => {
    return {
        type: 'SET_USER_STATUS',
        data : status
    }
}

export const updateSecureLink = (response) => {
    return {
        type: 'UPDATE_SECURE_LINK',
        enable : response.enable,
        link : response.link
    }
}

export const setAuthCredentials = (authObj) => {
    return {
        type: 'SET_AUTH_CREDENTIALS',
        data: authObj
    }
}

export const setNeedMigration = (state) => {
    return {
        type: 'SET_NEED_MIGRATION',
        data: state
    }
}

export const setTrafficOnLogin = (val) => {
    return {
        type: 'SET_TRAFFIC_ON_LOGIN',
        data : val
    }
}

export const setLoggingOut = (val) => {
    return {
        type: 'SET_LOGGING_OUT',
        data : val
    }
}

export const setIsDefaultPacSet = (val) => {
    return {
        type: 'SET_IS_DEFAULT_PAC_SET',
        data : val
    }
}

export const setLocationSetByUser = (val) => {
    return {
        type: 'SET_LOCATION_SET_BY_USER',
        data : val
    }
}

export const setLocationBeforeOurLocation = (locObj) => {
    return {
        type: 'SET_LOCATION_BEFORE_OUR_LOCATION',
        data : locObj
    }
}

export const setUseBackUp = (val) => {
    return {
        type: 'SET_USE_BACK_UP',
        data : val
    }
}

export const setRefetchingCredentials = (val) => {
    return {
        type: 'SET_REFETCHING_CREDENTIALS',
        data : val
    }
}

export const setBandwidthWarning90 = (val) => {
    return {
        type: 'SET_BANDWIDTH_WARNING_90',
        data : val
    }
}

export const setBandwidthWarning99 = (val) => {
    return {
        type: 'SET_BANDWIDTH_WARNING_99',
        data : val
    }
}

export const setBandwidthWarningOut = (val) => {
    return {
        type: 'SET_BANDWIDTH_WARNING_OUT',
        data : val
    }
}

export const setInitialPACSetFF = (val) => {
    return {
        type: 'SET_INITIAL_PAC_SET_FF',
        data : val
    }
}