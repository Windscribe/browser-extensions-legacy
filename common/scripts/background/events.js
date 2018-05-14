import Immutable from 'immutable'
import _ from 'underscore';
import userInfoStore from '../store/userInfoStore.js'
import pacStore from '../store/pacStore.js'
import listsStore from '../store/listsStore.js'
import tabsStore from '../store/tabsStore'
import i18n from '../i18n'

import {
    startApp,
    fetchSecureLink,
    fetchSecureLinkOptions,
    loadRules,
    getSessionBasedMandatoryAuthParams,
    getBasicMandatoryAuthParams,
    rotateUserAgent,
    addToWhiteList,
    addToProxyWhiteList,
    addCookieWhitelistItem,
    removeFromWhiteList,
    reportWebsite,
    checkIfWhitelisted,
    checkForOtherExtension,
    fetchSession,
    setExtensionState,
    logoutApiCall,
    loginApiCall,
    getRecentLinksCall,
    deleteLinkCall,
    changeLocationUtil,
    fetchLocations,
    ping,
    updateTabsTime,
    notifications,
    toggleAppIsOn
} from './Utilities.js'

import {
    changeAppIsOn,
    errored,
    setIcon,
    setIsJustLogged,
    setProxy,
    setRateUsPopShown,
    setReportedWebsite,
    setSessionAuthHash,
    updateSecureLink,
    setLoggingOut
} from '../actions/userInfoActionsCreators';

import {
    addShownNotification,
    changeCurrentLng,
    changeSplitPersonality,
    changePrivacyOption,
    setCookieMonsterFlag
} from '../actions/listsActionsCreators';

function returnPlainObject(object) {
    return Immutable.Iterable.isIterable(object) ? object.toJS() : object;
}

const updatePopup = () => {
    let oldState;
    return () => {
        const popupState = {
            userInfo: returnPlainObject( userInfoStore.getState().userInfo),
            listsStates: returnPlainObject( listsStore.getState().listsInfo.get('state') ),
            lists: {
                whiteList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'whiteList']) ),
                cookieWhiteList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'cookieWhiteList']) ),
                proxyWhiteList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'proxyWhiteList']) ),
                notificationsList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'notificationsList']) ),
                notificationsShown: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'notificationsShown']) ),
                languagesList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'languagesList']) )
            }
        };

        if (!_.isEqual(popupState, oldState)) {
            chrome.runtime.sendMessage({type: "SET_POPUP_STATE", data: popupState});
            oldState = popupState;
        }
    }
};

const sendNewData = updatePopup();

userInfoStore.subscribe(sendNewData);

listsStore.subscribe(sendNewData);

const updateAsyncStorage = () => {
    // console.log('updateAsyncStorage')
    let oldState;
    return () => {
        const currentState = {
            userInfo: userInfoStore.getState().userInfo.toJS(),
            listsInfo: listsStore.getState().listsInfo.toJS(),
            pacFile: pacStore.getState().pacFile.toJS(),
            tabs: tabsStore.getState().tabs.toJS()
        };

        if (!_.isEqual(currentState, oldState) && userInfoStore.getState().userInfo.get("session_auth_hash") &&
            userInfoStore.getState().userInfo.getIn(["current", 'country', 'short_name']) ) {
            // console.log('updating_storage_local')

            chrome.storage.local.set(currentState, () => {
                if (chrome.runtime.lastError) {
                    console.log('error_saving_to_storage_local', chrome.runtime.lastError)
                    return;
                }

                oldState = currentState;
            })
        }
    }
}

const saveToStorage = updateAsyncStorage();

userInfoStore.subscribe(saveToStorage);
listsStore.subscribe(saveToStorage);
tabsStore.subscribe(saveToStorage);
pacStore.subscribe(saveToStorage);

export default {
    RESTART_APP: (request) => {
        // console.log('restart_app')
        startApp();

        loadRules();
        userInfoStore.dispatch(errored('secureLink', false));
        userInfoStore.dispatch(errored('secureLinkOptions', false));
    },

    GET_POPUP_STATE: (request) => {
        // console.log('get_popup_state');

        checkForOtherExtension().then(() => {
            const popupState = {
                userInfo: returnPlainObject( userInfoStore.getState().userInfo ),
                listsStates: returnPlainObject( listsStore.getState().listsInfo.get('state') ),
                lists: {
                    whiteList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'whiteList']) ),
                    cookieWhiteList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'cookieWhiteList']) ),
                    proxyWhiteList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'proxyWhiteList']) ),
                    notificationsList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'notificationsList']) ),
                    notificationsShown: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'notificationsShown']) ),
                    languagesList: returnPlainObject( listsStore.getState().listsInfo.getIn(['lists', 'languagesList']) )
                }
            };

            if (userInfoStore.getState().userInfo.get('session_auth_hash')) {
                chrome.runtime.sendMessage({type: "SET_POPUP_STATE", data: popupState});
                fetchSession().then(setExtensionState);
            } else {
                chrome.runtime.sendMessage({type: "SET_POPUP_STATE", data: popupState});
            };

        }).catch(err => console.log('get_popup_err', err));
    },

    LOGOUT: (request) => {
        userInfoStore.dispatch(setLoggingOut(true));
        const payload = getSessionBasedMandatoryAuthParams();
        if (userInfoStore.getState().userInfo.getIn(["current", "deviceId"]))
            payload.device_id = userInfoStore.getState().userInfo.getIn(["current", "deviceId"]);

        logoutApiCall(payload);
    },

    SIGN_IN: (request) => {
        // console.log('BACKGROUND_SIGN_IN');
        userInfoStore.dispatch(setIsJustLogged(true));
        const data = {
            password: request.data.password,
            username: request.data.username.trim(),
            session_type_id: 2
        };
        const basicParams = getBasicMandatoryAuthParams();
        const matchData = Object.assign({}, data, basicParams);

        loginApiCall(matchData)
    },

    SET_PROXY: (request) => {
        console.log('request_proxy', request)
        const pac = atob(pacStore.getState().pacFile.get("pac"));
        userInfoStore.dispatch(setProxy(request.data, pac));
        request.data && ping();
        updateTabsTime();
    },

    SET_ICON: (request) => {
        userInfoStore.dispatch(setIcon(request.data));
    },

    CHANGE_APP_IS_ON: (request) => {
        // userInfoStore.dispatch(changeAppIsOn(request.data));
        toggleAppIsOn(request.data)
    },

    SET_SECURE_LINK: (request) => {
        fetchSecureLink(request.link);
    },

    SET_LINK_OPTIONS: (request) => {
        fetchSecureLinkOptions(request.data);
    },

    UPDATE_SECURE_LINK: (request) => {
        userInfoStore.dispatch(updateSecureLink({enable: true, link: request.link}));
    },

    CHANGE_LOCATION: (request) => {
        // console.log('change-location');
        changeLocationUtil(Immutable.Map(request.data));
        ping();
    },

    RECENT_LINKS: () => {
        getRecentLinksCall()
    },

    DELETE_LINK: (request) => {
        deleteLinkCall(request.data);
    },

    // CHANGE_PRIVACY_OPTION: (request) => {
    //     listsStore.dispatch(changePrivacyOption(request.action, request.data));
    //     loadRules();
    // },

    CHANGE_UNTRACEABLE: (request) => {
        // console.log('change_untracable')

        // order matters
        listsStore.dispatch(changePrivacyOption(request.action, request.data));
        loadRules();
    },

    CHANGE_ANTISOCIAL: (request) => {
        // console.log('change_anti_social');

        // order matters
        listsStore.dispatch(changePrivacyOption(request.action, request.data));
        loadRules();
    },

    CHANGE_ADBLOCKER: (request) => {
        // console.log('change_ad_blocker', request)

        // order matters
        listsStore.dispatch(changePrivacyOption(request.action, request.data));
        loadRules();
    },

    CHANGE_TIME: (request) => {
        // console.log('change_ad_blocker', request)

        // order matters
        listsStore.dispatch(changePrivacyOption(request.action, request.data));
        updateTabsTime();
    },

    CHANGE_SPLITPERSONALITY: (request) => {
        listsStore.dispatch(changeSplitPersonality(request.data));
        request.data && rotateUserAgent();
    },

    UPDATE_COOKIE_MONSTER_FLAG(request) {
        listsStore.dispatch(setCookieMonsterFlag(request.data));
    },

    ROTATE_USER_AGENT: () => {
        rotateUserAgent();
    },

    ADD_TO_WHITELIST: request => addToWhiteList(request.data),

    ADD_TO_PROXY_WHITELIST: request => addToProxyWhiteList(request.data),

    ADD_TO_COOKIE_WHITELIST: request => addCookieWhitelistItem(request.data),

    REMOVE_FROM_WHITELIST: (request) => {
        removeFromWhiteList(request.data);
    },

    REPORT_WEBSITE: (request) => {
        reportWebsite(request.data).then(response => {
            userInfoStore.dispatch(setReportedWebsite(response.data.data.success));
        }).catch(err => {
            console.log(err)
            userInfoStore.dispatch(setReportedWebsite(0));
        });
    },

    RESET_REPORTED_WEBSITE: (request) => {
        userInfoStore.dispatch(setReportedWebsite(0));
    },

    GET_USERAGENT: (request, sendResponse) => {
        if (checkIfWhitelisted(tabsStore.getState().tabs.get('currentTabUrl') ) || !listsStore.getState().listsInfo.getIn(['state', 'splitPersonality']) ) {
            return sendResponse(null);
        }

        sendResponse(tabsStore.getState().tabs.get('userAgent'));
    },

    CREATE_NOTIFICATION: (request) => {
        chrome.notifications.create(notifications[request.data.type](request.data.countryName));
    },

    SET_RATEUS_SHOWN: (request) => {
        userInfoStore.dispatch(setRateUsPopShown(request.data));
    },

    LOGIN_AFTER_SIGNUP: (request) => {
        // console.log('login_after_signup');
        if ( userInfoStore.getState().userInfo.get('session_auth_hash') ) return;
        userInfoStore.dispatch(setSessionAuthHash(request.cookie));
        checkForOtherExtension().then(() => {
            if (userInfoStore.getState().userInfo.getIn(['current', 'isOtherExtensionPresent'])) return Promise.resolve();
            userInfoStore.dispatch(setIsJustLogged(true));
            startApp();
        });
    },

    SET_LOGIN_ERROR: (request) => {
        // console.log('set_login_err')
        userInfoStore.dispatch(errored('loginError', request.data));
    },

    ADD_SHOWN_NOTIFICATION: (request) => {
        listsStore.dispatch(addShownNotification(request.data))
    },

    CHANGE_CURRENT_LNG: (request) => {
        i18n.changeLanguage(request.data);
        listsStore.dispatch(changeCurrentLng(request.data));
        fetchLocations().then(fetchSession).then(setExtensionState);
    }

}