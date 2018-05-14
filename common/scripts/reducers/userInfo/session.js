import Immutable from 'immutable';
import { setBrowserProxy, unsetBrowserProxy, setExtensionIcon } from '../../background/Utilities';
import settings, {wsUrl} from '../../settings';

const initialState = Immutable.fromJS({
    session: {},
    session_auth_hash: '',
    installationDate: '',
    // To-do: change to locations;
    locations: [],
    current: {
        appIsOn: '',
        country: '',
        proxy: false,
        toSecureLink: '',
        secureLinkCoppied: false,
        secureLink: '',
        secureLinkId: '',
        deviceId: '',
        proxyShouldBeTurnedOn: false,
        proxyShouldBeTurnedOff: false,
        proxyStateBeforeExpiration: '',
        userStatus: '',
        isPremium: '',
        rebill: '',
        premiumExpiryDate: '',
        ourLocation: '',
        ourIP: '',
        oldIsOurLocationPresent: false,
        proxyShouldBeTurnedOffAfterLeftOurLocation: false,
        icon: '',
        // authCredentials have 2 fields: username and password
        authCredentials: {
            username: '',
            password: ''
        },
        remainingTraffic: '',
        cruiseControl: '',
        currentMode: '',
        extensionStatus: '', // 1 || 2 || 3
        isJustLogged: '',
        isFirstLogin: '',
        reportedWebsite: false,
        isOtherExtensionPresent: false,
        rateUsPopShown: false,
        fromContextMenu: false,
        browserOpened: true,
        WS_GRP: null,
        locationsRevision: null,
        needMigration: true,
        trafficOnLogin: null,
        loggingOut: false,
        locationSetByUser: false,
        locationBeforeOurLocation: {},
        isDefaultPacSet: false,
        useBackUp: false,
        initialPACSetFF: false,
        bandwidthWarnings: {
            at90: false,
            at99: false,
            out: false
        }
    },
    errors: {
        loginError: false,
        session: false,
        locations: false,
        pacFile: false,
        userAgentList: false,
        secureLink: false,
        secureLinkOptions: false,
        adList: false,
        trackersList: false,
        antiSocialList: false,
        notificationsList: false,
        proxyLoginErrorCounter: 0
    },
    // write rootUrl directly because ES6 modules load asyncrynosly
    rootUrl: wsUrl.rootUrl,
    webStoreUrl: wsUrl.webStoreUrl
});

const SET_SESSION = "SET_SESSION";
const SET_LOCATIONS = "SET_LOCATIONS";
const CHANGE_LOCATION = "CHANGE_LOCATION";
const SET_PROXY = "SET_PROXY";
const UPDATE_SECURE_LINK = "UPDATE_SECURE_LINK";
const SET_SECURE_LINK = "SET_SECURE_LINK";
const CHANGE_APP_IS_ON = "CHANGE_APP_IS_ON";
const SUFFIX = "SUFFIX";
const ERROR = "ERROR";
const SET_PROXY_LOGIN_ERROR_COUNTER = "SET_PROXY_LOGIN_ERROR_COUNTER";
const SET_USER_STATUS = "SET_USER_STATUS";
const SET_PROXY_STATE_BEFORE_EXPIRATION = "SET_PROXY_STATE_BEFORE_EXPIRATION";
const SET_DEVICE_ID = "SET_DEVICE_ID";
const SET_IS_PREMIUM_VALUE = "SET_IS_PREMIUM_VALUE";
const SET_REBILL = "SET_REBILL";
const SET_PREMIUM_EXPIRY_DATE = "SET_PREMIUM_EXPIRY_DATE";
const SET_OUR_LOCATION = "SET_OUR_LOCATION";
const SET_OUR_IP = "SET_OUR_IP";
const SET_PROXY_AFTER_LEFT_OUR_LOCATION = "SET_PROXY_AFTER_LEFT_OUR_LOCATION";
const SET_OLD_IS_OUR_LOCATION_PRESENT = "SET_OLD_IS_OUR_LOCATION_PRESENT";
const SET_ICON = "SET_ICON";
const SET_AUTH_CREDENTIALS = "SET_AUTH_CREDENTIALS";
const SET_REMAINING_TRAFFIC = "SET_REMAINING_TRAFFIC";
const SET_SESSION_AUTH_HASH = "SET_SESSION_AUTH_HASH";
const SET_INSTALLATION_DATE = "SET_INSTALLATION_DATE";
const RESET_STATE = "RESET_STATE";
const SET_EXTENSION_STATUS = "SET_EXTENSION_STATUS";
const SET_IS_JUST_LOGGED = "SET_IS_JUST_LOGGED";
const SET_CURRENT_MODE = "SET_CURRENT_MODE";
const SET_REPORTED_WEBSITE = "SET_REPORTED_WEBSITE";
const SET_IS_OTHER_EXTENSION_PRESENT = "SET_IS_OTHER_EXTENSION_PRESENT";
const SET_RATE_US_POPUP_SHOWN = "SET_RATE_US_POPUP_SHOWN";
const SET_FROM_CONTEXT_MENU = "SET_FROM_CONTEXT_MENU";
const SET_BROWSER_OPENED = "SET_BROWSER_OPENED";
const SET_CONNECTION_MODE = "SET_CONNECTION_MODE";
const SET_LOCATIONS_REVISION = "SET_LOCATIONS_REVISION";
const SET_NEED_MIGRATION = "SET_NEED_MIGRATION";
const SET_TRAFFIC_ON_LOGIN = "SET_TRAFFIC_ON_LOGIN"
const SET_LOGGING_OUT = "SET_LOGGING_OUT"
const SET_LOCATION_SET_BY_USER = "SET_LOCATION_SET_BY_USER"
const SET_LOCATION_BEFORE_OUR_LOCATION = "SET_LOCATION_BEFORE_OUR_LOCATION"
const SET_IS_DEFAULT_PAC_SET = "SET_IS_DEFAULT_PAC_SET"
const UPDATE_STATE = "UPDATE_STATE"
const SET_USE_BACK_UP = "SET_USE_BACK_UP"
const SET_BANDWIDTH_WARNING_90 = "SET_BANDWIDTH_WARNING_90"
const SET_BANDWIDTH_WARNING_99 = "SET_BANDWIDTH_WARNING_99"
const SET_BANDWIDTH_WARNING_OUT = "SET_BANDWIDTH_WARNING_OUT"
const SET_INITIAL_PAC_SET_FF = "SET_INITIAL_PAC_SET_FF";

const modes = {
    cruiseControl: {
        short_name: "CR",
        name: "Cruise Control"
    },
    manual: {
        short_name: "ML",
        name: "Manual"
    },
    externalApp: {
        short_name: 'EA',
        name: 'External App'
    },
    doubleHop: {
        short_name: 'DH',
        name: 'Double Hop'
    }
};

export default function session(state = initialState, action) {
    switch (action.type) {

        case SET_SESSION:
            const appIsOn = action.data.data.status <= 1;
            return state.set("session", action.data);
        case SET_LOCATIONS:
            return state.set("locations", Immutable.fromJS(action.data));
        case SET_LOCATIONS_REVISION:
            return state.setIn(["current", "locationsRevision"], action.data);
        case CHANGE_APP_IS_ON:
            return state.setIn(["current", "appIsOn"], action.data);
        case CHANGE_LOCATION:
            return state.setIn(["current", "country"], action.data.selectedLocation)
        case SET_CONNECTION_MODE:
            return state.setIn(["current", "currentMode"], modes[action.data] );
        case SET_PROXY: {
            // console.log('set_proxy', !!action.data.mode);

            let WS_GRP = state.getIn(['current', 'WS_GRP']);

            if (action.data.mode && !WS_GRP) {
                WS_GRP = Math.floor(Math.random() * settings.WS_GRP_MAX );
            }
            if (!action.data.mode ) WS_GRP = '';
            
            action.data.mode ? setBrowserProxy(action.data.pac) : unsetBrowserProxy();

            return state.setIn(["current", "proxy"], !!action.data.mode)
                .setIn(["current", 'WS_GRP'], WS_GRP);
        }
        case UPDATE_SECURE_LINK:
            chrome.contextMenus.update("copySecureLink", {
                enabled: action.enable
            }, () => chrome.runtime.lastError && console.log('upadate_sec_link_err', chrome.runtime.lastError));
            return state.setIn(["current", "toSecureLink"], action.link);
        case SET_SECURE_LINK:
            let copy = copyTextToClipboard(action.secureLink);
            return state.setIn(["current", "secureLinkCoppied"], copy)
                        .setIn(["current", "secureLink"], action.secureLink)
                        .setIn(["current", "secureLinkId"], action.secureLinkId);
        case ERROR:
            return state.setIn(["errors", action.event], action.error);
        case SET_USER_STATUS:
            return state.setIn(["current", 'userStatus'], action.data);
        case SET_PROXY_STATE_BEFORE_EXPIRATION:
            return state.setIn(["current", "proxyStateBeforeExpiration"], action.data);
        case SET_DEVICE_ID:
            return state.setIn(["current", "deviceId"], action.data);
        case SET_IS_PREMIUM_VALUE:
            return state.setIn(["current", "isPremium"], action.data);
        case SET_REBILL:
            return state.setIn(["current", "rebill"], action.data);
        case SET_PREMIUM_EXPIRY_DATE:
            return state.setIn(["current", "premiumExpiryDate"], action.data);
        case SET_OUR_LOCATION:
            return state.setIn(["current", "ourLocation"], action.data);
        case SET_OUR_IP:
            return state.setIn(["current", "ourIP"], action.data);
        case SET_PROXY_AFTER_LEFT_OUR_LOCATION:
            return state.setIn(["current", "proxyShouldBeTurnedOffAfterLeftOurLocation"], action.data);
        case SET_OLD_IS_OUR_LOCATION_PRESENT:
            return state.setIn(["current", "oldIsOurLocationPresent"], action.data);
        case SET_ICON:
            setExtensionIcon(action);
            return state.setIn(["current", "icon"], action.data);
        case SET_PROXY_LOGIN_ERROR_COUNTER:
            return state.setIn(["errors", "proxyLoginErrorCounter"], action.data);
        case SET_AUTH_CREDENTIALS:
            return state.setIn(["current", "authCredentials", 'username'], action.data.username)
                        .setIn(["current", "authCredentials", 'password'], action.data.password);
        case SET_REMAINING_TRAFFIC:
            return state.setIn(["current", "remainingTraffic"], action.data);
        case SET_SESSION_AUTH_HASH:
            return state.set("session_auth_hash", action.data);
        case SET_INSTALLATION_DATE:
            return state.set("installationDate", action.data.toString());
        case RESET_STATE:
            return initialState
                .set('installationDate', state.get('installationDate') || '')
                .setIn(['current', 'needMigration'], state.getIn(['current', 'needMigration'])) // that should be always false
                .setIn(['current', 'rateUsPopShown'], state.getIn(['current', 'rateUsPopShown']));
        case SET_EXTENSION_STATUS:
            return state.setIn(['current', 'extensionStatus'], action.data);
        case SET_IS_JUST_LOGGED:
            return state.setIn(['current', 'isJustLogged'], action.data);
        case SET_REPORTED_WEBSITE:
            return state.setIn(["current", "reportedWebsite"], action.data);
        case SET_IS_OTHER_EXTENSION_PRESENT:
            return state.setIn(["current", 'isOtherExtensionPresent'], action.data);
        case SET_RATE_US_POPUP_SHOWN:
            return state.setIn(["current", "rateUsPopShown"], action.data);
        case SET_FROM_CONTEXT_MENU:
            return state.setIn(['current', 'fromContextMenu'], action.data);
        case SET_BROWSER_OPENED:
            return state.setIn(['current', 'browserOpened'], action.data);
        case SET_NEED_MIGRATION:
            return state.setIn(['current', 'needMigration'], action.data);
        case SET_TRAFFIC_ON_LOGIN:
            return state.setIn(['current', 'trafficOnLogin'], action.data);
        case SET_LOGGING_OUT:
            return state.setIn(['current', 'loggingOut'], action.data);
        case SET_LOCATION_SET_BY_USER:
            return state.setIn(['current', 'locationSetByUser'], action.data);
        case SET_LOCATION_BEFORE_OUR_LOCATION:
            return state.setIn(['current', 'locationBeforeOurLocation'], action.data);
        case SET_IS_DEFAULT_PAC_SET:
            return state.setIn(['current', 'isDefaultPacSet'], action.data);
        case SET_USE_BACK_UP:
            return state.setIn(['current', 'useBackUp'], action.data);
        case SET_BANDWIDTH_WARNING_90:
            return state.setIn(['current', 'bandwidthWarnings', 'at90'], action.data);
        case SET_BANDWIDTH_WARNING_99:
            return state.setIn(['current', 'bandwidthWarnings', 'at99'], action.data);
        case SET_BANDWIDTH_WARNING_OUT:
            return state.setIn(['current', 'bandwidthWarnings', 'out'], action.data);
        case SET_INITIAL_PAC_SET_FF:
            return state.setIn(['current', 'initialPACSetFF'], action.data);
        case UPDATE_STATE:
            return Immutable.fromJS(action.data);
        default:
            return state;
    }
}

function copyTextToClipboard(text) {
    let textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.className = "unvisibleInput";
    document.body.appendChild(textArea);
    textArea.select();
    let successful = false;
    try {
        successful = document.execCommand('copy');
    } catch (err) {
        successful = false;
    }
    document.body.removeChild(textArea);
    return successful
}
