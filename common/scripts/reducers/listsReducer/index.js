import Immutable, { Map } from 'immutable';
import { combineReducers } from 'redux';
import { extensionLanguages } from '../../settings';

const initialState = Immutable.fromJS({
    lists: {
        usersList: [],
        userAgentsList: null,
        notificationsList: [],
        notificationsShown: [],
        whiteList: ["windscribe.com", "secure.link"],
        cookieWhiteList: [],
        proxyWhiteList: [],
        languagesList: extensionLanguages,
        recentLinks: null
    },
    state: {
        untraceable: true,
        antiSocial: false,
        adBlocker: true,
        splitPersonality: false,
        // newInstall helps to determine all notifications during 1st hour after install as read
        newInstall: false,
        currentLng: '',
        time: false,
        cookieMonsterStatus: { current: 0, previous: 0 }
    }
});

const isItemInList = (list, entry) => list.toJSON().includes(entry)

function listsReducer(state = initialState, action) {
    switch (action.type) {
        case "SET_USER_AGENTS_LIST":
            return state.setIn(["lists", "userAgentsList"], action.data);
        case "SET_NOTIFICATIONS_LIST":
            return state.setIn(["lists", "notificationsList"], action.data);
        case "SET_RECENT_LINKS":
            return state.setIn(["lists", "recentLinks"], action.data);
        case "ADD_SHOWN_NOTIFICATION":
            const shownNotificationsUpdated = state.getIn(['lists', 'notificationsShown']).push(action.data);
            // saving only ids of the notifications
            return state.setIn(["lists", "notificationsShown"], shownNotificationsUpdated);
        case "PUT_TO_WHITE_LIST":
            const newList = state.getIn(['lists', 'whiteList'])
            // Check to see if entry is already whitelisted
            if (!isItemInList(newList, action.data)) {
                return state.setIn(["lists", "whiteList"], newList.push(action.data));
            }
            return state
        case "PUT_TO_PROXY_WHITE_LIST":
            const updatedList = state.getIn(['lists', 'proxyWhiteList']);
            // Check to see if entry is already whitelisted
            if (!isItemInList(updatedList, action.data)) {
                return state.setIn(["lists", "proxyWhiteList"], updatedList.push(action.data));
            }
            return state
        case "DELETE_FROM_WHITE_LIST":
            const currentWhiteListDomainIndex = state.getIn(['lists', 'whiteList']).indexOf(action.data);
            const newWhiteList = currentWhiteListDomainIndex === -1 ?
                state.getIn(['lists', 'whiteList']) :
                state.getIn(['lists', 'whiteList']).delete(currentWhiteListDomainIndex);
            return state.setIn(['lists', 'whiteList'], newWhiteList)
        case 'DELETE_FROM_COOKIE_WHITE_LIST':
            const currentCookieWhiteListDomainIndex = state.getIn(['lists', 'cookieWhiteList']).indexOf(action.data)
            const newCookieWhiteList = currentCookieWhiteListDomainIndex === -1 ?
                state.getIn(['lists', 'cookieWhiteList']) :
                state.getIn(['lists', 'cookieWhiteList']).delete(currentCookieWhiteListDomainIndex)
            return state.setIn(['lists', 'cookieWhiteList'], newCookieWhiteList)
        case 'DELETE_FROM_PROXY_WHITE_LIST':
            const currentProxyWhiteListDomainIndex = state.getIn(['lists', 'proxyWhiteList']).indexOf(action.data);
            const newProxyWhiteList = currentProxyWhiteListDomainIndex === -1 ?
                state.getIn(['lists', 'proxyWhiteList']) :
                state.getIn(['lists', 'proxyWhiteList']).delete(currentProxyWhiteListDomainIndex);
            return state.setIn(['lists', 'proxyWhiteList'], newProxyWhiteList)

        case 'ADD_TO_COOKIE_WHITE_LIST':
            const cookieList = state.getIn(['lists', 'cookieWhiteList']).push(action.data)
            return state.setIn(['lists', 'cookieWhiteList'], cookieList)
        case 'CHANGE_UNTRACEABLE':
            return state.setIn(["state", "untraceable"], action.data);
        case 'CHANGE_ANTISOCIAL':
            return state.setIn(["state", "antiSocial"], action.data);
        case 'CHANGE_ADBLOCKER':
            return state.setIn(["state", "adBlocker"], action.data);
        case 'CHANGE_SPLITPERSONALITY':
            return state.setIn(["state", "splitPersonality"], action.data);
        case 'CHANGE_TIME':
            return state.setIn(["state", "time"], action.data);
        case 'CHANGE_NEW_INSTALL':
            return state.setIn(["state", "newInstall"], action.data);
        case 'UPDATE_COOKIE_MONSTER_FLAG':
            return state.setIn(['state', 'cookieMonsterStatus'], Map(action.data));
        case 'CHANGE_CURRENT_LNG':
            localStorage.setItem('i18nextLng', action.data)
            return state.setIn(["state", "currentLng"], action.data);
        case 'ADD_USER':
            return state.setIn(["lists", "usersList"], state.getIn(['lists', 'usersList']).push(action.data));
        case 'RESET_STATE':
            return initialState.setIn(['lists', 'usersList'], state.getIn(['lists', 'usersList']))
                                .setIn(["state", "currentLng"], state.getIn(["state", "currentLng"]));
        case 'UPDATE_STATE':
            return Immutable.fromJS(action.data);
        default:
            return state;
    }

}

export default combineReducers({listsInfo : listsReducer});
