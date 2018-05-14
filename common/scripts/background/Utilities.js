import axios from 'axios';
import _ from 'underscore';
import tld from 'tldjs';
import md5 from 'js-md5';
import Immutable from 'immutable';
import cookie from 'cookie'

import {
    changeAppIsOn,
    changeLocation,
    errored,
    setConnectionMode,
    setDeviceId,
    setExtensionStatus,
    setIcon,
    setIsJustLogged,
    setIsOtherExtensionPresent,
    setIsPremiumValue,
    setLocations,
    setLocationsRevision,
    setOldIsOurLocationPresent,
    setOurIP,
    setOurLocation,
    setPremiumExpiryDate,
    setProxy,
    setProxyLoginErrorCounter,
    setProxyShouldBeTurnedOffAfterLeftOurLocation,
    setProxyStateBeforeExpiration,
    setRebill,
    setRemainingTraffic,
    setSecureLink,
    setSession,
    setSessionAuthHash,
    setUserStatus,
    updateSecureLink,
    setAuthCredentials,
    setInstallationDate,
    setTrafficOnLogin,
    setLocationSetByUser,
    setLocationBeforeOurLocation,
    setIsDefaultPacSet,
    setUseBackUp,
    setRefetchingCredentials,
    setLoggingOut,
    setBandwidthWarning90,
    setBandwidthWarning99,
    setBandwidthWarningOut,
    setInitialPACSetFF
} from "../actions/userInfoActionsCreators";

import {changePACLocation, setPac} from "../actions/pacActionsCreators";

import {
    addUser,
    deleteFromWhiteList,
    deleteFromCookieWhiteList,
    deleteFromProxyWhiteList,
    putToProxyWhiteList,
    putToWhiteList,
    addToCookieWhitelist,
    setUserAgentsList,
    setNotificationsList,
    changeNewInstall,
    setRecentLinks,
} from '../actions/listsActionsCreators';

import {setCurrentTabUrl, setTabs, setUserAgent, setLastActiveTab} from "../actions/tabsActionsCreators";
import {resetState, updateState} from "../actions/commonActionsCreators";
import i18n from "../i18n";
import pacStore from "../store/pacStore.js";
import listsStore from "../store/listsStore.js";
import userInfoStore from "../store/userInfoStore.js";
import tabsStore from "../store/tabsStore.js";
import settings, {wsUrl, APIUrl, defaultPac/* timeShifts */} from "../settings";

// ENV is variable set in webpack for conditional usage of functions
const BROWSER = ENV
let TABS = {}

// need to check at startup if previous state has all the properties of the new state. Can cause break at extension update
export function updateExtensionState() {
    const listsState = listsStore.getState().listsInfo.toJS();
    listsStore.dispatch(resetState());
    const resettedListsState = listsStore.getState().listsInfo.toJS();
    const listsPropsDiff = _.difference(_.keys(resettedListsState.lists), _.keys(listsState.lists));
    const statePropsDiff = _.difference(_.keys(resettedListsState.lists), _.keys(listsState.lists));

    if ( listsPropsDiff.length > 0 || statePropsDiff.length > 0 ) {
        const lists = Object.assign({}, resettedListsState.lists, listsState.lists);
        const state = Object.assign({}, resettedListsState.state, listsState.state);
        listsStore.dispatch(updateState({lists, state}));
    } else {
        listsStore.dispatch(updateState(listsState));
    }
};

updateExtensionState();

let WHITELIST = listsStore.getState().listsInfo.getIn(['lists', 'cookieWhiteList']).toJSON();

listsStore.subscribe(() =>{
    bullshitDelete()
})

export function isUrl(s) {
    var regexp = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
    return regexp.test(s);
};


export function getBasicMandatoryAuthParams() {
    const time = Date.now();
    const clientAuthHash = md5("952b4412f002315aa50751032fcaab03" + time);
    return {
        time: time.toString(),
        client_auth_hash: clientAuthHash
    }
};

export function getSessionBasedMandatoryAuthParams() {
    let basicParams = getBasicMandatoryAuthParams();

    // checking if we are calling this function from fetchLocations from migrationScript
    const session_auth_hash = ( userInfoStore.getState().userInfo.getIn(['current', "needMigration"]) && localStorage.getItem('session_auth_hash') ) ||
        userInfoStore.getState().userInfo.get("session_auth_hash");

    basicParams.session_auth_hash = session_auth_hash;
    return basicParams;
};

export function isSameAsCurrentLocation(ourLocation) {
    const currentShortName = userInfoStore.getState().userInfo.getIn(["current", 'country', 'short_name']);
    if(currentShortName){
        const isSame = ourLocation === currentShortName;
        return isSame;
    } else {
        return false;
    }
};

function isPlainHostName(host) {
    return (host.search('.') === -1);
}

function shExpMatch(url, pattern) {
    pattern = pattern.replace(/\./g, '\\.');
    pattern = pattern.replace(/\*/g, '.*');
    pattern = pattern.replace(/\?/g, '.');
    var newRe = new RegExp('^' + pattern + '$');
    // browser.runtime.sendMessage(`shExpMatch, url - ${url}, pattern - ${pattern}, result - ${newRe.test(url)}` );
    return newRe.test(url);
}

function makeBandwidthWarning(trafficUsed, trafficMax, userStatus) {
    function setBandwidthWarningsFalse() {
        userInfoStore.dispatch(setBandwidthWarning90(false));
        userInfoStore.dispatch(setBandwidthWarning99(false));
        userInfoStore.dispatch(setBandwidthWarningOut(false));
    };

    const usedBandwidth = Math.floor( trafficUsed / trafficMax * 100);
    const bandwidthWarningOut = userInfoStore.getState().userInfo.getIn(["current", 'bandwidthWarnings', 'out']);

    if (userStatus === 2 && !bandwidthWarningOut) {
        userInfoStore.dispatch(setBandwidthWarningOut(true));
        chrome.notifications.create(notifications['outOfBandwidth']());
    } else if ( userStatus === 1 && usedBandwidth >= 90) {
        const bandwidthWarning90 = userInfoStore.getState().userInfo.getIn(["current", 'bandwidthWarnings', 'at90']);
        const bandwidthWarning99 = userInfoStore.getState().userInfo.getIn(["current", 'bandwidthWarnings', 'at99']);

        if (usedBandwidth >= 90 && usedBandwidth < 99 && !bandwidthWarning90) {
            userInfoStore.dispatch(setBandwidthWarning90(true));
            chrome.notifications.create(notifications['runningOutBandwidth'](usedBandwidth));
        }
        else if (usedBandwidth === 99 && !bandwidthWarning99) {
            userInfoStore.dispatch(setBandwidthWarning99(true));
            chrome.notifications.create(notifications['runningOutBandwidth'](usedBandwidth));
        }

        // when user is premium usedBandwidth will be negative or 0
    } else if ( (userStatus === 1 && usedBandwidth < 90) || userStatus === 3 ) return setBandwidthWarningsFalse();
}

export function fetchSession(useBackUp, timeout) {
    console.log('fetchSession');
    userInfoStore.dispatch(setRefetchingCredentials(true));
    let payload = getSessionBasedMandatoryAuthParams();
    //session_type_id = 2, identifier for extension for server;
    payload.session_type_id = 2;
    if (userInfoStore.getState().userInfo.getIn(["current", 'deviceId'])) {
        payload.device_id = userInfoStore.getState().userInfo.getIn(["current", 'deviceId']);
    }
    
    const usedSessionURL = userInfoStore.getState().userInfo.getIn(["current", 'usedSessionURL']);
    
    const url = ( useBackUp || timeout ) ? wsUrl.backupApiUrl : wsUrl.apiUrl;
    
    const reqConfig = {
        params: payload
    };

    !timeout ? reqConfig.timeout = 2000 : null;

    return axios.get(url + APIUrl.session, reqConfig)
        .then(function (res) {
            // console.log('fetchSession data', res);
            // returns device_id if not specified in reqs params;
            // in case device_id is present in response must save it;
            // none of these - no action
            
            const is_premium__old = userInfoStore.getState().userInfo.getIn(["current", 'isPremium'])
            const cc = Immutable.Map({
                country_code : "",
                name : "Cruise control",
                short_name : "CR",
                status : 1,
                premium_only : 0
            });

            let proxyShouldBeTurnedOn = false;
            // proxyShouldBeTurnedOff has higher priority over proxyShouldBeTurnedOn
            let proxyShouldBeTurnedOff = false;
            if (res.data.data.status === 1 /* user ok */) {
                // no status - user OK
                userInfoStore.getState().userInfo.getIn(["current", 'userStatus']) && userInfoStore.dispatch(setUserStatus(''));

                // set proxyStateBeforeExpiration when traffic is over
                const proxyStateBeforeExpirationWasOn =  userInfoStore.getState().userInfo.getIn(["current", 'proxyStateBeforeExpiration']);
                if (proxyStateBeforeExpirationWasOn) {
                    proxyShouldBeTurnedOn = true;
                    userInfoStore.dispatch(setProxyStateBeforeExpiration(''));
                }
            }

            if (res.data.data.status === 2) {
                userInfoStore.dispatch(setUserStatus('UPGRADE'));

                userInfoStore.dispatch(changeAppIsOn(false));
                userInfoStore.dispatch(setDeviceId(''));
                const proxyStateBeforeExpiration = userInfoStore.getState().userInfo.getIn(["current", 'proxy']);
                // set proxe state to activate after user validate himself
                userInfoStore.dispatch(setProxyStateBeforeExpiration(proxyStateBeforeExpiration));
                proxyShouldBeTurnedOff = true;
            }

            if (res.data.data.status === 3) {
                userInfoStore.dispatch(setUserStatus('BANNED'));
                // userInfoStore.dispatch(changeAppIsOn(false));
                proxyShouldBeTurnedOff = true;
            }

            var is_premium = Number(res.data.data.is_premium);
            const currentProxyState = userInfoStore.getState().userInfo.getIn(["current", 'proxy'])

            // data.is_premium - optional parameter
            if ( is_premium > 0) {
                if (userInfoStore.getState().userInfo.getIn(["current", 'isPremium']) !== 1) {
                    userInfoStore.dispatch(setIsPremiumValue(1));
                    if (is_premium__old === 0) {
                        currentProxyState && changeLocationUtil(cc);
                        // ping();
                        setTimeout(() => ping(), 500)
                    }
                }

                if (is_premium === 1 || is_premium === 3) {
                    userInfoStore.dispatch(setRebill(res.data.data.rebill));
                    userInfoStore.dispatch(setPremiumExpiryDate(res.data.data.premium_expiry_date));
                }
            } else {
                // console.log('You are not premium')
                userInfoStore.dispatch(setIsPremiumValue(0));
                const currentProxy = userInfoStore.getState().userInfo.getIn(["current", 'country', 'short_name']);
                // Default to cruise control
                if (is_premium__old === 1) {
                    currentProxyState && changeLocationUtil(cc);
                    // ping();
                    setTimeout(() => ping(), 500)
                }
            }

            // our_location or our_ip is legacy property, our - windscribe's vpn server location (from desktop client)
            if(res.data.data.our_location){
                userInfoStore.dispatch(setOurLocation(res.data.data.our_location))
                // debugger;
            } else {
                userInfoStore.dispatch(setOurLocation(''))
            }

            if(res.data.data.our_ip){
                userInfoStore.dispatch(setOurIP(res.data.data.our_ip))
            }

            const isCruiseControlOn = userInfoStore.getState().userInfo.getIn(["current", 'country', 'short_name']) === 'CR';
            const isConnected = userInfoStore.getState().userInfo.getIn(["current", 'proxy']);
            const locationBeforeOurLocation = userInfoStore.getState().userInfo.getIn(["current", 'locationBeforeOurLocation']);
            const locationSetByUser = userInfoStore.getState().userInfo.getIn(["current", 'locationSetByUser']);

            const ourLocation = userInfoStore.getState().userInfo.getIn(["current", 'ourLocation']);
            const isOurLocationPresent = !!ourLocation;
            let isSameLocation = isSameAsCurrentLocation(ourLocation);

            if (isCruiseControlOn) {
                isSameLocation = false;
                // console.log('isCruiseControlOn: isSameLocation = false;');
            }

            let oldIsOurLocationPresent = userInfoStore.getState().userInfo.getIn(["current", 'oldIsOurLocationPresent']);
            let proxyShouldBeTurnedOffAfterLeftOurLocation = userInfoStore.getState()
                                                .userInfo.getIn(["current", 'proxyShouldBeTurnedOffAfterLeftOurLocation']);

            if( isOurLocationPresent && !oldIsOurLocationPresent && !isConnected ){
                proxyShouldBeTurnedOffAfterLeftOurLocation = true;
                userInfoStore.dispatch(setProxyShouldBeTurnedOffAfterLeftOurLocation(true));
                // console.log('THAT CASE registering');
            } else if (isOurLocationPresent && !oldIsOurLocationPresent && isConnected) {
                const location = userInfoStore.getState().userInfo.getIn(["current", 'country']);
                userInfoStore.dispatch(setLocationBeforeOurLocation(location));
            }

            if( (!isOurLocationPresent && oldIsOurLocationPresent) ){
                userInfoStore.dispatch(setLocationSetByUser(false));
                
                if(proxyShouldBeTurnedOffAfterLeftOurLocation){
                    proxyShouldBeTurnedOff = true;
                    proxyShouldBeTurnedOffAfterLeftOurLocation = false;
                    userInfoStore.dispatch(setProxyShouldBeTurnedOffAfterLeftOurLocation(false));
                    // console.log('THAT CASE fired');
                } else {
                    proxyShouldBeTurnedOn = true;
                }
            }

            isOurLocationPresent && !oldIsOurLocationPresent && userInfoStore.dispatch(setLocationSetByUser(false));

            // means that we should enable 'external app' mode
            if (isOurLocationPresent && !locationSetByUser ) {
                isSameLocation = true;
            }

            oldIsOurLocationPresent = isOurLocationPresent;
            userInfoStore.dispatch(setOldIsOurLocationPresent(isOurLocationPresent));

            // need to set proxy manually, sendMessage("SET_PROXY"...) is not working from background
            const pac = atob(pacStore.getState().pacFile.get("pac"));

            makeBandwidthWarning(res.data.data.traffic_used, res.data.data.traffic_max, res.data.data.status);

            if(isOurLocationPresent){
                // external program is turned ON
                console.log('external app is present flow');
                if(!proxyShouldBeTurnedOff){
                    if(isSameLocation){
                        // console.log('OUR case, isOurLocationPresent && isSameLocation, proxy is NOT turning on');
                        // show like it is turned on
                        // but proxy must be turned off
                        userInfoStore.dispatch(setIcon('on'));
                        userInfoStore.dispatch(setProxy(false, null));
                        // console.log('Proxy turning off')

                        const location = userInfoStore.getState().userInfo.get('locations').find(location => {
                            return location.get('short_name') === ourLocation;
                        });
                        // console.log('locationnn', location.toJS())
                        changeLocationUtil(location, true);
                    } else {
                        // console.log('OUR case, isOurLocationPresent && !isSameLocation, proxy is turning on',
                        //     proxyShouldBeTurnedOn, isConnected, locationSetByUser);
                        if(proxyShouldBeTurnedOn){
                            // console.log('should show DOUBLE HOP');
                            userInfoStore.dispatch(setProxy(true, pac));
                            userInfoStore.dispatch(setIcon('doubleHop'));

                        } else {
                            if(isConnected && locationSetByUser){
                                userInfoStore.dispatch(setProxy(true, pac));
                                userInfoStore.dispatch(setIcon('doubleHop'));
                            } else {
                                userInfoStore.dispatch(setIcon('on'));
                                // console.log('external app is ON, proxy shoult not be turned OF, but also it should not be turned ON, so skipping this, causes no changes, and only icon is keptkep');
                            }
                        }
                    }

                    // means that desktop vpn is working
                    userInfoStore.dispatch(changeAppIsOn(true));
                } else {
                    // console.log('Proxy turning off')
                    // console.log('proxyShouldBeTurnedOff is true and isOurLocationPresent TRUE');
                    userInfoStore.dispatch(setProxy(false, null));
                    userInfoStore.dispatch(setIcon('off'));
                    userInfoStore.dispatch(changeAppIsOn(false));
                    updateTabsTime()

                }
            } else {
                // classical flow
                console.log('classical_flow')
                if(!proxyShouldBeTurnedOff){
                    // console.log('none of cases above, nothing to change', locationBeforeOurLocation.toJS());
                    if(proxyShouldBeTurnedOn){
                        // console.log('proxyShouldBeTurnedOn')
                        changeLocationUtil(locationBeforeOurLocation, true);
                        
                        userInfoStore.dispatch(setProxy(true, pac));
                        userInfoStore.dispatch(setIcon('on'));
                        userInfoStore.dispatch(changeAppIsOn(true));
                    } else {
                        if(isConnected){
                            // console.log('isConnected')
                            userInfoStore.dispatch(setProxy(true, pac));
                            userInfoStore.dispatch(setIcon('on'));
                            userInfoStore.dispatch(changeAppIsOn(true));
                        } else {
                            userInfoStore.dispatch(setIcon('off'));
                            userInfoStore.dispatch(changeAppIsOn(false));
                        }
                    }

                } else {
                    // console.log('proxyShouldBeTurnedOff is true and isOurLocationPresent FALSE');
                    // console.log('Proxy turning off')
                    userInfoStore.dispatch(setProxy(false, null));
                    userInfoStore.dispatch(changeAppIsOn(false));
                    userInfoStore.dispatch(setIcon('off'));

                }
            }

            if (res.data.data.ext_username) {
                userInfoStore.dispatch(setDeviceId(res.data.data.ext_username));
                userInfoStore.dispatch(setAuthCredentials({ username: res.data.data.ext_username, password: res.data.data.ext_password}));
                userInfoStore.dispatch(setProxyLoginErrorCounter(0));
            }

            // console.log('remainingTraffic', remainingTraffic);
            const remainingTrafficInBytes = parseInt(res.data.data.traffic_max, 10) - parseInt(res.data.data.traffic_used, 10);
            const remainingTraffic = (remainingTrafficInBytes/1073741824).toFixed(2)

            userInfoStore.dispatch(setRemainingTraffic(remainingTraffic));
            userInfoStore.dispatch(setUseBackUp(false));

            userInfoStore.dispatch(setSession(res));
            userInfoStore.dispatch(setRefetchingCredentials(false));
            userInfoStore.dispatch(errored('session', false));

            // Diff the new revision with the current.  If it's different fetch new locations
            // Also the premium should be diffed too
            const currentSession = userInfoStore.getState().userInfo.getIn(['current', 'locationsRevision']);
            if (res.data.data.loc_rev !== currentSession || is_premium__old !== userInfoStore.getState().userInfo.getIn(["current", 'isPremium'])) {
                // console.log('Is not the same!')
                // Set new revision whenever it changes while polling
                userInfoStore.dispatch(setLocationsRevision(res.data.data.loc_rev))
                fetchLocations().then(setExtensionState);
            }

            return Promise.resolve();
        })
        .catch(function (error) {
            if (error.response && error.response.data.errorCode === 701) {
                console.log('fetch session err', error.response.data.errorCode);
                userInfoStore.dispatch(setLoggingOut(true));
                const payload = getSessionBasedMandatoryAuthParams();
                if (userInfoStore.getState().userInfo.getIn(["current", "deviceId"]))
                    payload.device_id = userInfoStore.getState().userInfo.getIn(["current", "deviceId"]);

                chrome.alarms.clearAll();
                userInfoStore.dispatch(setIcon('off'));
                userInfoStore.dispatch(setProxy(false, null));
                userInfoStore.dispatch(resetState());
                listsStore.dispatch(resetState());
                chrome.contextMenus.removeAll();

                removeListeners();

                chrome.storage.local.clear();
                launchAdblock([]);
                chrome.windows.onCreated.removeListener(onWindowsCreatedListener);

                chrome.runtime.sendMessage({type: 'RM_SESSION'});

                return;
            }
            if ( (/timeout/.test(error.message) || /Network\sError/.test(error.message) ) && !timeout ) {
                return fetchSession(false, true);
            }

            if (!useBackUp) {
                userInfoStore.dispatch(setUseBackUp(true));
                return fetchSession(true, true);
            };

            userInfoStore.dispatch(errored('session', true));
            return Promise.reject()
        });
}

export function fetchLocations(useBackUp) {
    // console.trace('Fetching locations')
    let locationsRevision;
    let isFirstLoad = false; // Just set inital first
    // Assuming the locations array being empty means it's first load
    if (userInfoStore.getState().userInfo.get('locations').size === 0) {
        locationsRevision = 0
        isFirstLoad = true;
    } else {
        locationsRevision = userInfoStore.getState().userInfo.getIn(['current', 'locationsRevision'])
    }

    let is_pro = userInfoStore.getState().userInfo.getIn(['current', 'isPremium']);

    if (isFirstLoad && is_pro === '') {
        is_pro = 0;
    }

    // Set url
    const baseUrl = useBackUp ? wsUrl.backupAssetsUrl : wsUrl.assetsUrl;
    const url = `${baseUrl}/serverlist/extension/${is_pro}/${locationsRevision}`;


    /**
     * Response get's parsed in .catch if error is 501 so might as well place it here
     * @param {object} response - Response from an ajax request
     */
    const parseResponse = (response) => {
        // console.log('parseing response')
        // This block should only get run on first load of the ext
        if (isFirstLoad) {
            // console.log('IS FIRST LOAD');
            userInfoStore.dispatch(setLocationsRevision(response.data.info.revision))
        }
        userInfoStore.dispatch(setLocations(response.data.data));

        userInfoStore.dispatch(errored('locations', false));

        return fetchPacFile();
    }

    return axios.get(url)
        .then(parseResponse)
        .catch(error => {
            // We can safely ignore 501 errors so you can still parse the response
            if (error.response.status === 501) {
                return parseResponse(error.response)
            }

            if (!useBackUp) {
                fetchLocations(true);
                return;
            }

            // If nothing works it'll just reject
            userInfoStore.dispatch(errored('locations', true));
            console.log(error);
            return Promise.reject(error);
        });
}

export function fetchPacFile(useBackUp) {
    // console.trace('Fetching pac file');
    const hostname = pacStore.getState().pacFile.get("hostname");
    const url = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;
    
    let payload = getSessionBasedMandatoryAuthParams();
    payload.hostname = hostname ? hostname : '';
    console.log('payload', payload);

    // NEEDED for web extension
    if (BROWSER === 'firefox') payload.browser = 'ffwebext';

    return axios.get(url + APIUrl.pacFile, {params: payload})
        .then(function (response) {
            // console.log('got new pac')
            const cruiseControl = Immutable.Map({
                country_code : "",
                name : "Cruise control",
                short_name : "CR",
                status : 1,
                premium_only: 0
            });
            
            const PAC = whitelistToPac(response.data);
            pacStore.dispatch(setPac(PAC));

            // checking if locations is present in PAC file received from server
            let locations = userInfoStore.getState().userInfo.get('locations').map(location => {
                if (!new RegExp('"' + location.get('short_name') + '"' + ':').test(PAC) &&
                    !new RegExp('"' + location.get('short_name') + '"' + ' :').test(PAC)) {
                    return location.set('status', 2);
                }
                return location
            });

            userInfoStore.dispatch(setLocations(locations.toJS()));
            const isPremium = userInfoStore.getState().userInfo.getIn(['current', 'isPremium']);

            let data = {
                locations,
                isPremium
            };
            if (userInfoStore.getState().userInfo.getIn(['current', 'country']) ) {
                data.selectedLocation = userInfoStore.getState().userInfo.getIn(['current', 'country']);

                // console.log('locations', userInfoStore.getState().userInfo.get('country'))
                if (_.isUndefined(userInfoStore.getState().userInfo.get('locations')) ) return fetchLocations()
                pacStore.dispatch(changePACLocation(data));
            } else {
                data.selectedLocation = cruiseControl;
                pacStore.dispatch(changePACLocation(data));
            }

            userInfoStore.dispatch(setExtensionStatus(1));
            userInfoStore.dispatch(errored('pacFile', false));

            return Promise.resolve()
        })
        .catch(function (error) {
            if (!useBackUp) {
                fetchPacFile(true);
                return;
            }
            userInfoStore.dispatch(errored('pacFile', true));
            console.log(error);
            return Promise.reject(error);
        });
}

export function reloadActiveTab() {
    function onReloaded() {
        console.log(`Reloaded active tab`);
    }
    if (BROWSER === 'firefox') {
        var reloading = browser.tabs.reload();
        reloading.then(onReloaded);
    }
}
export function setExtensionState() {
    const cruiseControl = Immutable.Map({
        country_code : "",
        name : "Cruise control",
        short_name : "CR",
        status : 1,
        premium_only : 0
    });

    const ourLocation = userInfoStore.getState().userInfo.getIn(['current', 'ourLocation']);
    const proxy = userInfoStore.getState().userInfo.getIn(['current', 'proxy']);

    const selectedLocation = userInfoStore.getState().userInfo.getIn(["current", 'country']) || cruiseControl;

    if (userInfoStore.getState().userInfo.getIn(["current", 'isJustLogged'])) {
        changeLocationUtil(selectedLocation);
        userInfoStore.dispatch(setIsJustLogged(false));
    } else {
        if ( ( proxy && !ourLocation ) || ( !proxy && !ourLocation )) {
            selectedLocation.get('short_name') === 'CR' ? userInfoStore.dispatch(setConnectionMode('cruiseControl') ) :
                                                            userInfoStore.dispatch(setConnectionMode('manual') );
        } else if (proxy && ourLocation) {
            (selectedLocation.get('short_name') === 'CR' || location.short_name !== ourLocation) ? userInfoStore.dispatch(setConnectionMode('doubleHop') ) :
                userInfoStore.dispatch(setConnectionMode('externalApp') )
        } else if (!proxy && ourLocation) {
            userInfoStore.dispatch(setConnectionMode('externalApp') );
        }
    }

    // reloadTabs();
    return Promise.resolve();
}

export function changeLocationUtil(selectedLocation, usedProgrammatically) {
    const locations = userInfoStore.getState().userInfo.get('locations');
    const isPremium = userInfoStore.getState().userInfo.getIn(['current', 'isPremium']);
    const ourLocation = userInfoStore.getState().userInfo.getIn(['current', 'ourLocation']);
    const proxy = userInfoStore.getState().userInfo.getIn(['current', 'proxy']);
    const isJustLogged = userInfoStore.getState().userInfo.getIn(['current', 'isJustLogged']);

    let data = {
        selectedLocation,
        locations,
        isPremium
    };

    pacStore.dispatch(changePACLocation(data));
    userInfoStore.dispatch(changeLocation(data));
    
    ((!isJustLogged || !usedProgrammatically) && ourLocation) && userInfoStore.dispatch(setLocationSetByUser(true));
    !usedProgrammatically && userInfoStore.dispatch(setLocationBeforeOurLocation(selectedLocation));
    
    updateTabsTime();

    if ( (!proxy && !ourLocation) || ( proxy && !ourLocation ) ) {
        const pac = atob(pacStore.getState().pacFile.get("pac"));

        userInfoStore.dispatch(setIcon('on'));
        userInfoStore.dispatch(changeAppIsOn(true));
        !usedProgrammatically && chrome.notifications.create(notifications['on'](selectedLocation.get('name')));
        userInfoStore.dispatch(setProxy(true, pac));

        selectedLocation.get('short_name') === 'CR' ? userInfoStore.dispatch(setConnectionMode('cruiseControl') ) : userInfoStore.dispatch(setConnectionMode('manual') )

    } else if ( ( ourLocation && !proxy ) || ( ourLocation && proxy ) ) {
    
        if ( ( selectedLocation.get('short_name') === ourLocation ) || isJustLogged  ) {
            userInfoStore.dispatch(setIcon('on'));
            userInfoStore.dispatch(changeAppIsOn(true));
            !usedProgrammatically && chrome.notifications.create(notifications['onExternalMode']());
            userInfoStore.dispatch(setProxy(false, null));

            userInfoStore.dispatch(setConnectionMode('externalApp') );
        } else if ( selectedLocation.get('short_name') !== ourLocation) {
            const pac = atob(pacStore.getState().pacFile.get("pac"));

            userInfoStore.dispatch(setIcon('doubleHop'));
            userInfoStore.dispatch(changeAppIsOn(true));
            !usedProgrammatically && chrome.notifications.create(notifications['onDoubleHop'](selectedLocation.get('name')));
            userInfoStore.dispatch(setProxy(true, pac));

            userInfoStore.dispatch(setConnectionMode('doubleHop') );
        }
    }
}

export function fetchUserAgentsList(useBackUp) {
    const url = useBackUp ? wsUrl.backupAssetsUrl : wsUrl.assetsUrl;

    return axios.get(url + APIUrl.userAgentList)
        .then(function (response) {
            listsStore.dispatch(setUserAgentsList(response));
            userInfoStore.dispatch(errored('userAgentList', false));
            return Promise.resolve();
        })
        .catch(function (error) {
            if (!useBackUp) {
                fetchUserAgentsList(true);
                return;
            }
            userInfoStore.dispatch(errored('userAgentList', true));
            console.log(error);
            return Promise.reject(error);
        });
}

export function fetchSecureLink(url, useBackUp) {
    let payload = getSessionBasedMandatoryAuthParams();
    const apiUrl = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;

    // if (!userInfoStore.getState().userInfo.getIn(["current", "appIsOn"])) return;
    if (!isUrl(url)) return;
    payload.url = url;
    axios({
        method: 'post',
        url: apiUrl + APIUrl.secureLink,
        headers: {
            "Content-Type": "application/json;charset=UTF-8"
        },
        data: JSON.stringify(payload)
    }).then(function (response) {
        userInfoStore.dispatch(setSecureLink(response.data.data));
        userInfoStore.dispatch(errored('secureLink', false));
    })
        .catch(function (err) {
            if (!useBackUp) {
                fetchSecureLink(url, true);
                return;
            }
            console.log(err);
            userInfoStore.dispatch(errored('secureLink', true));
        })
}

export function fetchSecureLinkOptions(data, useBackUp) {
    let payload = getSessionBasedMandatoryAuthParams();
    if (!userInfoStore.getState().userInfo.getIn(['current', 'appIsOn'])) return false;
    if (!data) return false;

    const apiUrl = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;
    axios({
        method: 'put',
        url: apiUrl + APIUrl.secureLink + "/" + data.secure_link_display_id,
        headers: {
            "Content-Type": "application/json;charset=UTF-8"
        },
        data: JSON.stringify(_.extend(payload, data))
    })
        .then((response) => {
            userInfoStore.dispatch(setSecureLink(response.data.data));
            userInfoStore.dispatch(errored('secureLinkOptions', false));
        })
        .catch(() => {
            if (!useBackUp) {
                fetchSecureLinkOptions(data, true);
                return;
            }
            userInfoStore.dispatch(errored('secureLinkOptions', true));
        })
}

function actualizeSecureLink (query, onUpdated) {
    if (!userInfoStore.getState().userInfo.get('session_auth_hash')) {
        return false;
    }

    const tabsQuery = Object.assign({}, {active: true, currentWindow: true}, query);
    chrome.tabs.query( tabsQuery, function (tabs) {
        if (!tabs[0])   return;

        if (onUpdated) {
            let storedTabs = tabsStore.getState().tabs.toJS().tabs;
            storedTabs[tabs[0].id] = tabs[0];
            tabsStore.dispatch(setTabs(storedTabs));
        }

        tabsStore.dispatch(setCurrentTabUrl(tabs[0].url));

        if (tabs[0].url === 'chrome://newtab/') {
            userInfoStore.dispatch(updateSecureLink({enable: false, link: ''}))
        } else {
            userInfoStore.dispatch(updateSecureLink({enable: true, link: tabs[0].url}));
        }
    });
}

export function copySecureLink() {
    const query = {
        currentWindow: true
    };

    actualizeSecureLink(query)
}

export function secureLinkOnUpdatedListener(tabId, changeInfo, tab) {
    const query = {
        windowId: tab.windowId
    };

    actualizeSecureLink(query, true);
}

export function secureLinkOnActivatedListener(activeInfo) {
    const query = {
        windowId: activeInfo.windowId
    };

    actualizeSecureLink(query);
}

export function fetchNotificationsList(useBackUp) {
    const payload = getSessionBasedMandatoryAuthParams();
    const url = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;

    return axios.get(url + APIUrl.notifications, {params: payload})
        .then(res => {
            listsStore.dispatch(setNotificationsList(res.data.data.notifications));
            userInfoStore.dispatch(errored('notificationsList', false));
        }).catch(err => {
            if (!useBackUp) {
                fetchNotificationsList(true);
                return;
            }

            userInfoStore.dispatch(errored('notificationsList', true));
            console.log(err);
        })
}

export function onRemovedListener(tabId) {
    let tabs = tabsStore.getState().tabs.toJS().tabs;
    delete tabs[tabId];
    tabsStore.dispatch(setTabs(tabs));
    localStorage.setItem('ws_tabs', JSON.stringify(tabs));
};

export function rotateUserAgent() {
    // 'splitPersonality' setting is 'false' by default so not signed user will not be able to use it
    const currentTabDomain = tld.getDomain( tabsStore.getState().tabs.get('currentTabUrl') );
    if ( !listsStore.getState().listsInfo.getIn(['state', 'splitPersonality']) ) return;
    if ( listsStore.getState().listsInfo.getIn(['lists', 'whiteList']).indexOf(currentTabDomain) > -1 ) return;
    
    const userAgentsList = listsStore.getState().listsInfo.getIn(['lists', 'userAgentsList']);
    if ( !userAgentsList ) return fetchUserAgentsList().then(rotateUserAgent);

    let OSName = "Unknown OS";
    if (navigator.appVersion.indexOf("Win") != -1 || (navigator.oscpu && navigator.oscpu.indexOf("Win") != -1)) OSName = "Win";
    if (navigator.appVersion.indexOf("Mac") != -1 || (navigator.oscpu && navigator.oscpu.indexOf("Mac") != -1)) OSName = "Mac";
    if (navigator.appVersion.indexOf("Linux") != -1 || (navigator.oscpu && navigator.oscpu.indexOf("Linux") != -1)) OSName = "Linux";
    let fileContentLines = userAgentsList.split('\n').filter(el => el.indexOf(OSName) >= 0);
    fileContentLines = fileContentLines.map(el => el.trim());
    const userAgentsByBrowser = fileContentLines.filter(el => el.toLowerCase().indexOf(BROWSER) > -1);
    if ( listsStore.getState().listsInfo.getIn(['state', 'splitPersonality']) ) {
        tabsStore.dispatch(setUserAgent(userAgentsByBrowser[Math.floor(Math.random() * userAgentsByBrowser.length)]));
    }

    return Promise.resolve();
};

export function initTabs() {
    return new Promise( resolve => {
        chrome.tabs.query({}, results => {
            let tabs = {};
            results.forEach(tab => {
                tabs[tab.id] = tab;
                changeTABSObj(tab.id, {status: tab.status}, tab);
            });
            tabsStore.dispatch(setTabs(tabs));

            // chrome.storage.local.set({ws_tabs: tabs}, () => {
            //     // console.log('tabs_saved')
            // })
            localStorage.setItem('ws_tabs', JSON.stringify(tabs));

            resolve();
        });
    });
}

export function onErrorOccurredListener(details) {
    if (!userInfoStore.getState().userInfo.get('session_auth_hash'))
        return;
    if (new RegExp('ERR_SSL_PROTOCOL_ERROR').test(details.error))
        chrome.tabs.reload(details.tabId);
}

export function onBeforeSendHeadersListener(details) {
    // console.log('onBeforeSendHeaders url and originUrl', details.url, details.originUrl);
    const windscribeDomains = ["windscribe.com", "secure.link"];
    const tab = tabsStore.getState().tabs.get('tabs')[details.tabId.toString()];
    const tabUrl = tab && tld.getDomain(tab.url);

    const refererIndex = _.findIndex(details.requestHeaders, header => header.name === 'Referer' )
    if (refererIndex > -1 && details.requestHeaders[refererIndex].value.indexOf(tabUrl) === -1 && tabUrl) {
        details.requestHeaders.splice(refererIndex, 1);
    }

    if (listsStore.getState().listsInfo.getIn(['state', 'splitPersonality']) &&
        !checkIfWhitelisted(tabUrl || details.url) ) {
        const userAgent = tabsStore.getState().tabs.get('userAgent');
        const userAgentIndex = _.findIndex(details.requestHeaders, header => header.name === 'User-Agent' )

        userAgentIndex > -1 ? details.requestHeaders[userAgentIndex].value = userAgent : null;
    }

    if (userInfoStore.getState().userInfo.get('session_auth_hash') && (windscribeDomains.indexOf(tld.getDomain(getLocation(details.url).host)) >= 0)) {
        const headerValue = userInfoStore.getState().userInfo.getIn(["current", "proxy"]) ? '1' : '0';
        details.requestHeaders.push({
            name: "WS-EXTENSION",
            value: headerValue
        });
    }

    return {requestHeaders: details.requestHeaders};
}

function setChromePac() {
    const useBackUp = userInfoStore.getState().userInfo.getIn(['current', 'useBackUp']);
    const url = useBackUp ? wsUrl.backupExStartUrl : wsUrl.exStartUrl;

    let pac = `function FindProxyForURL(url, host) {
                    if (isPlainHostName(host) ||  shExpMatch(host, "*.local") || shExpMatch(host, "*.int") ||
                        shExpMatch(url, "*://api.windscribe.com/*") || shExpMatch(url, "*://*.windscribe.com/*"))
                        return "DIRECT";

                    var lanIps = /(^127\.)|(^192\.168\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)/;
                    if(lanIps.test(host))
                        return "DIRECT";


                    if (url.substring(0, 5) == 'http:' || url.substring(0, 6) == 'https:' || url.substring(0, 4) == 'ftp:' || url.substring(0, 3) == 'ws:') {
                        return "HTTPS ${url}";
                    }

                    return 'DIRECT';
                }`;

    console.log('url', url)
    chrome.proxy.settings.set({
        value: {
            mode: 'pac_script',
            pacScript: {
                data: pac
            }
        },
        scope: 'regular'
    }, () => {
        userInfoStore.dispatch(setIsDefaultPacSet(true))
        console.log('default_pac_set')
    });
}

export function setDefaultPac() {
    const proxy = userInfoStore.getState().userInfo.getIn(["current", 'proxy']);

    if (BROWSER === 'firefox' || !proxy) return;
    fetchSession().then(() => {
        setChromePac()
    }).catch(err => setChromePac());
}

export function onWindowsRemoveListener() {
    chrome.windows.getAll(windows => {
        if (windows.length == 0) {
            rotateUserAgent();
            setDefaultPac();
        }
    });
};

export function reloadTabs() {
    if ( BROWSER === 'firefox' ) return Promise.resolve();

    return new Promise(resolve => {
        const defaultPacSet = userInfoStore.getState().userInfo.getIn(['current', 'isDefaultPacSet'])
        const proxy = userInfoStore.getState().userInfo.getIn(["current", 'proxy']);

        if ( !defaultPacSet && proxy ) {
            chrome.tabs.query({}, tabs => {
                if (!tabs[0]) return resolve();
                const lastActiveTab = tabsStore.getState().tabs.toJS().lastActiveTab;
                // console.log('lastActiveTab', lastActiveTab)
                _.each(tabs, tab => {
                    tab.id > -1 && (/http/.test(tab.url) || tab.url.length === 0) && chrome.tabs.reload(tab.id, () => {
                        // console.log(`reloaded tab ${tab.id}, url = ${tab.url}`)
                    })

                });
                return resolve();
            })
        } else { return resolve() }
    })
}

export function updateTabsTime() {
    chrome.tabs.query({}, tabs => {
        try {
            _.each(tabs, tab => insertTimezone(tab, {url: true}))
        } catch(err) {
            console.log('err injecting timezone', err)
        }

    });
}

export function onWindowsCreatedListener() {
    console.log('window_created')
    try {
        chrome.windows.getAll(windows => {
            windows.length === 1 && userInfoStore.getState().userInfo.get('session_auth_hash') &&
            checkForOtherExtension().then(() => {
                if ( userInfoStore.getState().userInfo.getIn(['current', 'isOtherExtensionPresent']) ) return;
                startApp();
            });

            const changeTime = listsStore.getState().listsInfo.getIn(['state', 'time']);

            if (!changeTime) return;

            chrome.tabs.query({}, tabs => {
                try {
                    _.each(tabs, tab => {
                        insertTimezone(tab).then(tab => {
                            if (tab.status === 'complete') {
                                setTimeout(() => {
                                    chrome.tabs.reload(tab.id, {bypassCache: true}, function() {console.log('reloaded')});
                                }, 1000);
                            }
                        });
                    })
                } catch(err) {
                    console.log('err injecting timezone', err)
                }

            });
        });
    } catch(err) {
        console.log(err)
    }
};

export function removeListeners() {
    // removing listeners to avoid errors in console
    chrome.tabs.onRemoved.removeListener(onRemovedListener);

    chrome.tabs.onRemoved.removeListener(onTabRemoval);

    chrome.webRequest.onErrorOccurred.removeListener(onErrorOccurredListener);

    chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersListener);

    chrome.webRequest.onHeadersReceived.removeListener(onHeaders);

    chrome.windows.onRemoved.removeListener(onWindowsRemoveListener);

    chrome.windows.onCreated.removeListener(onWindowsCreatedListener);

    chrome.tabs.onUpdated.removeListener(handleTabUpdate);

    // onUpdated tabs listener also updates tabs in the tabsStore
    // chrome.tabs.onUpdated.removeListener(secureLinkOnUpdatedListener);
    // chrome.tabs.onActivated.removeListener(secureLinkOnActivatedListener);



    chrome.alarms.onAlarm.removeListener(alarmsListener);
    // chrome.cookies.onChanged.addListener((changeInfo) => {
    //     console.info(changeInfo)
    // })
}

function isCookieMonsterOn() {
    const CMStatus = listsStore.getState().listsInfo.getIn(['state', 'cookieMonsterStatus', 'current'])
    // Is not on
    if (CMStatus === 0) {
        return false
    }
    // Return flag
    return CMStatus
}

function insertTimezone(tab, changeInfo) {
    return new Promise((resolve, reject) => {
        const hoursShift = getHoursShift();
        // console.log('changeInfo', changeInfo)
        const changeTime = listsStore.getState().listsInfo.getIn(['state', 'time']);
        changeTime && changeInfo && changeInfo.url && chrome.tabs.executeScript(tab.id, {
            code: `try {
            if (!localStorage.getItem("wsUtcShift") || ( parseInt(localStorage.getItem("wsUtcShift"), 10) !== ${hoursShift.utcShift} ) ) {
                localStorage.setItem("wsUtcShift", "${hoursShift.utcShift}");
            }

            if (!localStorage.getItem("wsTimezone") || ( localStorage.getItem("wsTimezone") !== "${hoursShift.timezone}" ) ) {
                localStorage.setItem("wsTimezone", "${hoursShift.timezone}");
            }
            } catch(err) {console.log("err", err)};`,
            matchAboutBlank: true
        }, () => {
            // console.log('inserted timezone');
            if (chrome.runtime.lastError) console.log('error while injecting script', tab, chrome.runtime.lastError.message);
            resolve(tab);
        });
    })
}

function handleTabUpdate(tabId, tabInfo, tab) {
    changeTABSObj(tabId, tabInfo, tab)
    // secureLinkOnUpdatedListener(tabId, tabInfo, tab)
}

function changeTABSObj(tabId, tabInfo, tab) {
    insertTimezone(tab, tabInfo);
    // if (!isCookieMonsterOn()) {
    //     // console.warn('Cookie monster disabled, tab update will not fire')
    //     return;
    // }
    const domain = extractDomain(tab);
    const rootDomain = extractRootDomain(tab);
    // Check if entry already exists
    if (TABS[tabId]) {
        if (TABS[tabId].domain !== domain) {
            TABS[tabId].domain = domain;
            TABS[tabId].tabs[domain] = { url: tab.url, domain, rootDomain, cookies: {} };
        } else {
            TABS[tabId].domain = domain;
            TABS[tabId].tabs[domain].url = tab.url;
            TABS[tabId].tabs[domain].domain = domain;
            TABS[tabId].tabs[domain].rootDomain = rootDomain;
        }
    } else {
        TABS[tabId] = { tabs: {}, domain };
        TABS[tabId].tabs[domain] = { url: tab.url, domain, rootDomain, cookies: {} };
    }

    if (tabInfo.status === 'complete') {
        chrome.tabs.query({}, function(tabs) {
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].id === tabId) {
                    chrome.tabs.sendMessage(
                        tabs[i].id,
                        { action: 'CM_REQUESTING_DOC_COOKIES' },
                        data => {
                            if (data) {
                                TABS[tabId].tabs[domain].cookies['local'] = data
                            }
                        }
                    )
                }
            }
        })
    }
}

function bullshitDelete() {
    chrome.cookies.remove({ url: 'https://windscribe.com', name: 'bullshit' })
}

function onTabRemoval(tabId) {
    if (!isCookieMonsterOn()) {
        // console.warn('Cookie monster disabled, tab removal will not fire')
        delete TABS[tabId];
        return;
    }
    // Make sure that entries are removed when no longer needed
    if (tabId in TABS) {
        const tabs = TABS[tabId].tabs
        for (let i in tabs) {
            try {
                console.log('----')
                console.log(tabs[i])
                console.log('----')
                const cookieStore = tabs[i].cookies;
                const domain = tabs[i].domain;
                const rootDomain = tabs[i] && extractRootDomain(tabs[i]);
                const url = tabs[i].url
                if (Object.keys(tabs[i].cookies).length > 0) {
                    removeCookiesFromDomain(
                        { tabId, cookieStore, domain, rootDomain, url }
                    );
                }
            } catch(err) {
                console.log('error removing cookie', err)
            }
        }
        delete TABS[tabId];
    }
}

function onHeaders(details) {
    const domain = extractRootDomain(details);
    // if (!isCookieMonsterOn()) {
    //     // console.warn('Headers will not save state');
    //     return;
    // }
    for (let i = 0; i < details.responseHeaders.length; i++) {
        const responseHeader = details.responseHeaders[i];
        if (responseHeader.name.toLowerCase() === 'set-cookie') {
            updateTabStore(responseHeader.value, details.tabId, domain, details.url);
        }
    }
}

function removeCookiesFromDomain ({ tabId, cookieStore, domain, rootDomain, url }) {
    console.log('remove cookies from domain', cookieStore);
    const deleteAllCookiesInStore = (name, url) => chrome.cookies.remove({ url, name })
    // Loop through cookieStores
    for (let i in cookieStore) {
        const keys = Object.keys(cookieStore);
        const arr = cookieStore[i].cookieStore;
        const cookieUrl = cookieStore[i].url;
        const hostname = cookieStore[i].hostname;
        // Loop through cookieStore arr
        for (let i in arr) {
            const isWhiteListed = WHITELIST.includes(domain) || WHITELIST.includes(rootDomain);
            const cookieName = arr[i].split(';')[0].split('=')[0];

            if (isCookieMonsterOn() === 1) {
                const cookieFirstParty = isFirstPartyCookie(domain.split('.')[0], hostname.split('.')[0]) ||
                    isFirstPartyCookie(rootDomain.split('.')[0], hostname.split('.')[0]);
                
                if (!cookieFirstParty && (domain !== 'newtab' || rootDomain !== 'newtab') && !isWhiteListed) {
                    deleteAllCookiesInStore(cookieName, cookieUrl);
                } else {
                    console.log(`😄 😄 😄 🚀 ${domain} is fine`);
                }
            } else if (isCookieMonsterOn() === 2) {
                if (!isWhiteListed) {
                    chrome.cookies.getAll(
                        { domain: cleanDomain(hostname) },
                        cookies => {
                            console.log('cookies', cookies);
                            for (let i = 0; i < cookies.length; i++) {
                                chrome.cookies.remove({ name: cookies[i].name, url: cookieUrl })
                            }
                        }
                    )
                }
            }
        }
    }
}

export function setTabsListeners() {
    return new Promise ( resolve => {
        try {
            !chrome.tabs.onRemoved.hasListener(onRemovedListener) &&
                chrome.tabs.onRemoved.addListener(onRemovedListener);

            !chrome.tabs.onRemoved.hasListener(onTabRemoval) &&
                chrome.tabs.onRemoved.addListener(onTabRemoval);

            !chrome.webRequest.onErrorOccurred.hasListener(onErrorOccurredListener) &&
                chrome.webRequest.onErrorOccurred.addListener(
                    onErrorOccurredListener,
                    { urls: [ "<all_urls>" ] }
                );

            !chrome.webRequest.onBeforeSendHeaders.hasListener(onBeforeSendHeadersListener) &&
                chrome.webRequest.onBeforeSendHeaders.addListener(
                    onBeforeSendHeadersListener,
                    { urls: [ "<all_urls>" ] },
                    ["blocking", "requestHeaders"]
                );

            !chrome.webRequest.onBeforeSendHeaders.hasListener(onBeforeSendHeadersListener) &&
            chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeadersListener, {urls: ["<all_urls>"]},
                ["blocking", "requestHeaders"]);

            !chrome.windows.onRemoved.hasListener(onWindowsRemoveListener) &&
                chrome.windows.onRemoved.addListener(onWindowsRemoveListener);

            !chrome.windows.onCreated.hasListener(onWindowsCreatedListener) &&
                chrome.windows.onCreated.addListener(onWindowsCreatedListener);

            !chrome.webRequest.onHeadersReceived.hasListener(onHeaders) &&
                chrome.webRequest.onHeadersReceived.addListener(onHeaders, {
                    urls: ['*://*/*']
                }, ['blocking', 'responseHeaders']);

            !chrome.windows.onRemoved.hasListener(onWindowsRemoveListener) &&
                chrome.windows.onRemoved.addListener(onWindowsRemoveListener);

            // !chrome.tabs.onUpdated.hasListener(secureLinkOnUpdatedListener) &&
            //     chrome.tabs.onUpdated.addListener(secureLinkOnUpdatedListener);
            !chrome.tabs.onUpdated.hasListener(handleTabUpdate) &&
                chrome.tabs.onUpdated.addListener(handleTabUpdate)

            // !chrome.tabs.onActivated.hasListener(secureLinkOnActivatedListener) &&
            //     ;


            // chrome.tabs.onActivated.addListener(secureLinkOnActivatedListener);

            chrome.runtime.setUninstallURL(wsUrl.uninstallUrl);

        } catch(err) {
            console.log('err_setting_listeners', err);
        }

        resolve();
    });
}

function extractSecondLevelDomain (domain) {
    if (domain === null) return null;

    const match = domain.match(/([^\.]+\.[^\.]{2,3}\.[^\.]{2,4}|[^\.]+\.[^\.]+)$/);
    return (match !== null ? match[1] : domain);
}

function extractHostnameFromUrl (url) {
    const match = url.match(/:\/\/([^\/:]+)/);
    return (match !== null ? match[1] : null);
}

function extractRootDomain (tab) {
    const hostname = extractHostnameFromUrl(tab.url);
    const domain = extractSecondLevelDomain(hostname);

    return domain;
}

function extractDomain({ url }) {
    let hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    if (hostname.indexOf('www.') > -1) {
        hostname = hostname.split('www.')[1]
    }

    return hostname.split(':')[0].split('?')[0];
}

function extrapolateUrlFromCookie(cookie) {
    let prefix = cookie.secure ? "https://" : "http://";
    if (cookie.domain.charAt(0) == ".")
        prefix += "www";

    return prefix + cookie.domain + cookie.path;
}

function extractDomainFromCookie(domain) {
    if (domain.charAt(0) === '.') {
        return domain.substring(1)
    }
    return domain;
}

function extractCookieUrl (cookie) {
	return "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
}

function cleanDomain (domain) {
    // console.log(domain)
    if (domain.indexOf('www') > -1) {
        return domain.split('www')[1]
    }
    return domain
}

function isFirstPartyCookie (domain, cookieDomain) {
    return domain === cookieDomain;
}

function isWhiteListed (domain) {
    let isWhitelisted = false

    for (let i = 0; i < WHITELIST.length; i++) {
        if (domain === WHITELIST[i]) {
            return isWhitelisted = true
        }
    }

    return isWhitelisted
}

function updateTabStore(data, tabId, cookieDomain, cookieUrl) {
    if (TABS[tabId]) {
        const domain = TABS[tabId].domain
        // Push cookies into
        if (TABS[tabId].tabs[domain].cookies[cookieDomain]) {
            TABS[tabId].tabs[domain].cookies[cookieDomain].cookieStore.push(data)
        } else {
            TABS[tabId].tabs[domain].cookies[cookieDomain] = {}
            TABS[tabId].tabs[domain].cookies[cookieDomain].hostname = cookieDomain
            TABS[tabId].tabs[domain].cookies[cookieDomain].url = cookieUrl
            TABS[tabId].tabs[domain].cookies[cookieDomain].cookieStore = [data]
        }
        // console.log(TABS[tabId])
    }
}


function launchAdblock(lists) {
    try {
        // using uBlock's API
        window.µBlock.applyFilterListSelection({
            what: 'applyFilterListSelection',
            toSelect: lists,
            toImport: '',
            toRemove: []
        }, (res) => {
            window.µBlock.loadFilterLists();
            console.log('adblock lists loaded');
        })
    } catch(e) {
        console.log('error', e)
    }
}

export function loadRules() {
    const listsFilters = {
        antiSocial: 'fanboy-social',
        untraceable: 'easyprivacy',
        adBlocker: 'easylist'
    };

    const filters = _.filter(listsFilters, (filter, key) => listsStore.getState().listsInfo.getIn(['state', key]) );

    // checking if user is logged in and userStatus
    userInfoStore.getState().userInfo.get("session_auth_hash") ? launchAdblock(filters) : launchAdblock([]);
}

export function recordInstall(useBackUp) {
    const payload = getBasicMandatoryAuthParams();
    const url = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;

    axios({
        method: 'post',
        url: url + APIUrl.recordInstall,
        headers: {
            "Content-Type": "application/json;charset=UTF-8"
        },
        data: JSON.stringify(payload)
    }).then((response) => {
        //
    }).catch((err) => {
        if (!useBackUp) {
            recordInstall(true);
            return;
        }
        console.log(err);
    })
}

export function ping(useBackUp) {
    const url = useBackUp ? wsUrl.backupPingUrl : wsUrl.pingUrl;
    return axios.get(url).then(() => Promise.resolve())
        .catch(err => {
            if (!useBackUp) {
                ping(true);
                return;
            }
            console.log('pingErr', err)
            return Promise.resolve()
        });
}

export function auth(response) {
    userInfoStore.dispatch(setSessionAuthHash(response.data.session_auth_hash));
    if (response.data.status === 1) {
        userInfoStore.dispatch(setUserStatus(''));
    }
    if (response.data.status === 2) {
        userInfoStore.dispatch(setUserStatus('UPGRADE'));
        userInfoStore.dispatch(changeAppIsOn(false));
    }
    if (response.data.status === 3) {
        userInfoStore.dispatch(setUserStatus('BANNED'));
        userInfoStore.dispatch(changeAppIsOn(false));
    }
    if (Number(response.data.is_premium) > 0) {
        userInfoStore.dispatch(setIsPremiumValue(1));
    } else {
        userInfoStore.dispatch(setIsPremiumValue(0));
    }

    if(response.data.our_location){
        userInfoStore.dispatch(setOurLocation(response.data.our_location));
    } else {
        userInfoStore.dispatch(setOurLocation(''));
    }

    if(response.data.our_ip){
        userInfoStore.dispatch(setOurIP(response.data.our_ip));
    } else {
        userInfoStore.dispatch(setOurIP(''));
    }

    const remainingTraffic = ((Number(response.data.traffic_max) - Number(response.data.traffic_used)) / 1073741824).toFixed(2);
    userInfoStore.dispatch(setRemainingTraffic(remainingTraffic));
    userInfoStore.dispatch(setTrafficOnLogin(Number(response.data.traffic_used)))

    if (listsStore.getState().listsInfo.getIn(['lists', 'usersList']).indexOf(response.data.user_id) === -1) {
        listsStore.dispatch(addUser(response.data.user_id))
        chrome.tabs.create({url: wsUrl.rootUrl + 'installed/extension?user_id=' + response.data.user_id});
    }

    return Promise.resolve()
}

export function handleSuccessfulRequest(details) {
    const errcount = userInfoStore.getState().userInfo.getIn(['errors', 'proxyLoginErrorCounter'])
    if (errcount > 0) {
        userInfoStore.dispatch(setProxyLoginErrorCounter(0)); // reset the fail counter
    }
}

export function handleAuthRequest(details) {
    // console.log('details url', details)
    if (details.realm === "Windscribe-Proxy") {
        let proxyLoginErrorCounter = userInfoStore.getState().userInfo.getIn(["errors", 'proxyLoginErrorCounter']);

        // Whitelist Proxy
        var time = new Date();
        if(wsUrl.pingUrl+'/' === details.url || wsUrl.backupPingUrl +'/' === details.url) {
            console.info(time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + ' - Ignore #' + proxyLoginErrorCounter + ' - ' + details.url);
            // console.info(details);
        } else {
            proxyLoginErrorCounter = proxyLoginErrorCounter + 1
            userInfoStore.dispatch(setProxyLoginErrorCounter(proxyLoginErrorCounter));
            console.info(time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + ' - Oh snap #' + proxyLoginErrorCounter + ' - ' + details.url);
            console.info(details);
        }

        const refetchingCredentials = userInfoStore.getState().userInfo.getIn(["current", 'refetchingCredentials'])

        if (proxyLoginErrorCounter >= 50 && !refetchingCredentials) { // credentials are probably wiped on the server, fetch new ones
            userInfoStore.dispatch(setDeviceId(''));
            const proxy = userInfoStore.getState().userInfo.getIn(["current", 'proxy']);
            userInfoStore.dispatch(setProxyStateBeforeExpiration(proxy));
            userInfoStore.dispatch(setProxy(false, null));
            console.info('Fetch session + credentials');
            fetchSession()
        } else {
            console.info('Reloading', details.tabId);
            setTimeout(function(){
                if(details.tabId > 0){
                    chrome.tabs.reload(details.tabId, {bypassCache: true});
                }
            }, 700)
        }
        const authCredentials = {
            username: userInfoStore.getState().userInfo.getIn(["current", 'authCredentials', 'username']),
            password: userInfoStore.getState().userInfo.getIn(["current", 'authCredentials', 'password'])
        };
        console.info('authCredentials', authCredentials);
        return {
            authCredentials
        };
    } else {
        userInfoStore.dispatch(setProxyLoginErrorCounter(0)); // reset the fail counter
        console.info('reset counter');
    }
}

export function getLocation(href) {
    var link = document.createElement("a");
    link.href = href;
    return link;
};

export function checkIfWhitelisted(url) {
    if (!url) return true;
    var whitelist = listsStore.getState().listsInfo.getIn(['lists', 'whiteList']);
    // var proxyWhiteList = listsStore.getState().listsInfo.getIn(['lists', 'proxyWhiteList']);
    return whitelist.indexOf(tld.getDomain(getLocation(url).host)) >= 0;
};

function updateuBlockWhiteList() {
    // syncing uBlock's whitelist with ours
    try {
        const whiteList = listsStore.getState().listsInfo.getIn(['lists', 'whiteList']).toJS();

        const uBlockWhiteListString = whiteList.join('\n') + '\n' + window.µBlock.netWhitelistDefault;

        // console.log('whitelist string', uBlockWhiteListString)
        window.µBlock.netWhitelist = window.µBlock.whitelistFromString(uBlockWhiteListString);
        window.µBlock.saveWhitelist();
    } catch(err) {
        console.log('ERROR updateuBlockWhiteList', err)
    }
}

export function addToWhiteList(urlData) {
    if (urlData.domain.indexOf('netflix.com') > -1) {
        listsStore.dispatch(putToWhiteList("nflxvideo.net"))
    }
    if (urlData.domain.indexOf('youtube.com') > -1) {
        listsStore.dispatch(putToWhiteList("googlevideo.com"))
    }

    listsStore.dispatch(putToWhiteList(urlData.domain))

    whitelistChanged()
    updateuBlockWhiteList()
}

export function addToProxyWhiteList(urlData) {
    if (urlData.domain.indexOf('netflix.com') > -1) {
        listsStore.dispatch(putToProxyWhiteList("nflxvideo.net"))
    }
    if (urlData.domain.indexOf('youtube.com') > -1) {
        listsStore.dispatch(putToProxyWhiteList("googlevideo.com"))
    }

    listsStore.dispatch(putToProxyWhiteList(urlData.domain))
    whitelistChanged()
}

export function addCookieWhitelistItem({ domain }) {
    listsStore.dispatch(addToCookieWhitelist(domain))
    WHITELIST = listsStore.getState().listsInfo.getIn(['lists', 'cookieWhiteList']).toJSON()
    console.log('reee', WHITELIST)
}

export function removeFromWhiteList({ domain, name }) {
    const netFlixDomains = ['netflix.com', "nflxvideo.net"];
    const youtubeDomains = ['youtube.com', "googlevideo.com"];

    const deleteOtherNetFlixDomain = _.filter(netFlixDomains, dom => dom !== domain);
    const deleteOtherYoutubeDomain = _.filter(youtubeDomains, dom => dom !== domain);

    switch(name) {
        case 'ads':
            console.log('----')
            console.log('Delete from ad lists')
            console.log('----')
            if (deleteOtherYoutubeDomain.length > 0) {
                listsStore.dispatch(deleteFromWhiteList(deleteOtherYoutubeDomain[0]))
            }
            if (deleteOtherNetFlixDomain.length > 0) {
                listsStore.dispatch(deleteFromWhiteList(deleteOtherNetFlixDomain[0]))
            }
            listsStore.dispatch(deleteFromWhiteList(domain))
            break;
        case 'cookies':
            console.log('----')
            console.log('Delete from cookie lists')
            console.log('----')
            listsStore.dispatch(deleteFromCookieWhiteList(domain))
            WHITELIST = listsStore.getState().listsInfo.getIn(['lists', 'cookieWhiteList']).toJSON()
            break;
        case 'proxy':
            console.log('----')
            console.log('Delete from proxy lists')
            console.log('----')
            if (deleteOtherYoutubeDomain.length > 0) {
                listsStore.dispatch(deleteFromProxyWhiteList(deleteOtherYoutubeDomain[0]))
            }
            if (deleteOtherNetFlixDomain.length > 0) {
                listsStore.dispatch(deleteFromProxyWhiteList(deleteOtherNetFlixDomain[0]))
            }
            listsStore.dispatch(deleteFromProxyWhiteList(domain))
            break;
        default:
            console.log('----')
            console.log('Delete from all lists')
            console.log('----')
            if (deleteOtherYoutubeDomain.length > 0) {
                listsStore.dispatch(deleteFromWhiteList(deleteOtherYoutubeDomain[0]))
                listsStore.dispatch(deleteFromProxyWhiteList(deleteOtherYoutubeDomain[0]))
            }
            if (deleteOtherNetFlixDomain.length > 0) {
                listsStore.dispatch(deleteFromWhiteList(deleteOtherNetFlixDomain[0]))
                listsStore.dispatch(deleteFromProxyWhiteList(deleteOtherNetFlixDomain[0]))
            }
            listsStore.dispatch(deleteFromWhiteList(domain))
            listsStore.dispatch(deleteFromCookieWhiteList(domain))
            listsStore.dispatch(deleteFromProxyWhiteList(domain))
            WHITELIST = listsStore.getState().listsInfo.getIn(['lists', 'cookieWhiteList']).toJSON()
            break;
    }

    whitelistChanged()
    updateuBlockWhiteList();
}

export function reportWebsite(url, useBackUp) {
    let payload = getSessionBasedMandatoryAuthParams();
    if (!isUrl(url)) return;
    payload.rep_url = url;

    const apiUrl = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;

    return axios({
        method: 'post',
        url: apiUrl + APIUrl.reportWebsite,
        headers: {
            "Content-Type": "application/json;charset=UTF-8"
        },
        data: JSON.stringify(payload)
    })
        .catch(() => {
            if (!useBackUp) {
                reportWebsite(url, true);
                return;
            }
        })
}

function whitelistToPac(pac) {
    let PAC = atob(pac);
    var patternList = [];
    var proxyWhitelist = listsStore.getState().listsInfo.getIn(['lists', 'proxyWhiteList']);

    proxyWhitelist.forEach(function (domain) {
        patternList.push('*://' + domain + '/*');
        patternList.push('*://' + domain + '(:[0-9]*)?/*');

        patternList.push('*.' + domain + '/*');
        patternList.push('*.' + domain + '(:[0-9]*)?/*');
    });

    PAC = PAC.replace(/(.*whitelist = )(.*?)(;.*)/mg, '$1' + JSON.stringify(patternList) + '$3');
    return PAC;
}

export function whitelistChanged() {
    let PAC = whitelistToPac( pacStore.getState().pacFile.get('pac') );
    pacStore.dispatch(setPac(PAC));
    userInfoStore.getState().userInfo.getIn(["current", "proxy"]) && userInfoStore.dispatch(setProxy(true, PAC));
};

export function checkForOtherExtension() {
    if (BROWSER === 'firefox') return Promise.resolve();

    return new Promise( (resolve) => {
        chrome.proxy.settings.get({}, function (details) {
            if (details.levelOfControl === "controlled_by_other_extensions") {
                userInfoStore.dispatch(setIsOtherExtensionPresent(true));
                userInfoStore.dispatch(setIcon('off'));
                userInfoStore.dispatch(setProxy(false, null));
            } else {
                userInfoStore.dispatch(setIsOtherExtensionPresent(false));
            }
            resolve();
        });
    });
};

export function setContextMenuOption() {
    return new Promise ( (resolve, reject) => {
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                "id": "copySecureLink",
                "type": "normal",
                "title": "Copy Secure.link",
                "contexts": ["all"],
                documentUrlPatterns: ['http://*/*', 'https://*/*'],
                'onclick': (info) => {
                    if (userInfoStore.getState().userInfo.getIn(['current', 'userStatus'])) return false;
                    if (!isUrl(info.pageUrl)) return false;
                    // must have for server request
                    fetchSecureLink(info.pageUrl);

                    if (BROWSER === 'firefox') {
                        var secureLinkWindow = browser.windows.create({
                            url: '../html/reactPopUp.html?securelinkdialog',
                            width: 355,
                            height: 390,
                            type: 'panel'
                        } ).then((createdWin) => {
                            
                            // for some reason firefox does not show anything from popup when opened from context menu
                            // addin this temporary, need to investigate more, may be this is firefox's bug
                            browser.windows.update(createdWin.id, {width: 356})
                                .then(() => console.log('updated window'));
                        });
                    } else if (BROWSER === 'chrome') {
                        var secureLinkWindow = window.open('../html/reactPopUp.html?securelinkdialog',
                            'name', 'height=390, width=355');
                    }

                    if (navigator.appVersion.indexOf("Win") != -1) {
                        secureLinkWindow.resizeTo(370, 429);
                    }
                    if (navigator.appVersion.indexOf("Linux") != -1) {
                        secureLinkWindow.resizeTo(355, 390);
                    }
                    if (navigator.appVersion.indexOf("Mac") != -1) {
                        secureLinkWindow.resizeTo(355, 390);
                    }
                }
            }, (res) => {
                chrome.runtime.lastError && console.log('creating_context_menu_err', chrome.runtime.lastError)
                chrome.runtime.lastError && reject('create context menu error');
                copySecureLink();
                resolve();
            });
        });
    });
};

export function logoutApiCall(payload, useBackUp) {
    const url = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;
    axios.delete(url + '/Session', {params: payload})
        .then(() => {
            // console.log('successful logout');
            chrome.alarms.clearAll();
            userInfoStore.dispatch(setIcon('off'));
            userInfoStore.dispatch(setProxy(false, null));
            userInfoStore.dispatch(resetState());
            listsStore.dispatch(resetState());
            chrome.contextMenus.removeAll();

            removeListeners();

            chrome.storage.local.clear();
            launchAdblock([]);
            chrome.windows.onCreated.removeListener(onWindowsCreatedListener);

            chrome.runtime.sendMessage({type: 'RM_SESSION'});
        })
        .catch(error => {
            if (!useBackUp) {
                logoutApiCall(payload, true);
                return;
            }
            console.log(error);
        });
}

export function loginApiCall(matchData, useBackUp) {
    let resp;

    const url = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;

    axios.post(url + '/Session', matchData)
        .then(res => {
            resp = res;

            return checkForOtherExtension();
        })
        .then(() => {
            if ( userInfoStore.getState().userInfo.getIn(['current', 'isOtherExtensionPresent']) ) return Promise.resolve();

            auth(resp.data);
            return startApp();
        })
        .then( () => {
            chrome.runtime.sendMessage({type: 'AUTH'}, () => {});
        })
        .catch(err => {
            if (!useBackUp) {
                loginApiCall(matchData, true);
                return;
            }

            userInfoStore.dispatch(errored('loginError', true));
            userInfoStore.dispatch(setIsJustLogged(false));

            console.log('login-err', err);
            if (err.noConnection) return;
        });
}

export function getRecentLinksCall(useBackUp) {
    const url = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;

    axios.get(url + '/SecureLinks', {params: getSessionBasedMandatoryAuthParams()})
        .then(res => {
            listsStore.dispatch(setRecentLinks(res.data.data));
            chrome.runtime.sendMessage({type: 'RLINKS_DATA', data: res.data.data})
        })
        .catch(() => {
            if (!useBackUp) {
                getRecentLinksCall(true);
                return;
            }
            const recentLinks = listsStore.getState().listsInfo.getIn(['lists', 'recentLinks']);

            chrome.runtime.sendMessage({type: 'RLINKS_DATA', data: recentLinks})
        });
}

export function deleteLinkCall(data, useBackUp) {
    const url = useBackUp ? wsUrl.backupApiUrl : wsUrl.apiUrl;
    const payload = getSessionBasedMandatoryAuthParams();

    axios({
        method: 'delete',
        url: url + '/SecureLinks/' + data,
        headers: {
            "Content-Type": "application/json;charset=UTF-8"
        },
        data: JSON.stringify(payload)
    }).catch(error => {
        if (!useBackUp) {
            deleteLinkCall(data, true);
            return;
        }
        console.log(error);
    });
}

export function loadLists() {
    // when user is not logined or has invalid user status we fetch adblock lists
    // from server but turn them off manually here
    ( !userInfoStore.getState().userInfo.get("session_auth_hash") ||
    userInfoStore.getState().userInfo.getIn(["current", 'userStatus']) ) && launchAdblock([]);

    fetchUserAgentsList().then(rotateUserAgent);
}

export function setAlarms() {
    // every 24 hours
    chrome.alarms.create('getAssetsData', {
        periodInMinutes: settings.INTERVALS.ASSETS_UPDATE
    });

    // every 1 hour
    chrome.alarms.create('getNotificationsData', {
        periodInMinutes: settings.INTERVALS.NOTIFICATIONS
    });

    // every 1 minute
    chrome.alarms.create('getSessionData', {
        periodInMinutes: settings.INTERVALS.SESSION_UPDATE
    });

    !chrome.alarms.onAlarm.hasListener(alarmsListener) && chrome.alarms.onAlarm.addListener(alarmsListener);
}

export function alarmsListener( alarm ) {
    switch (alarm.name) {
        case 'getAssetsData':
            fetchUserAgentsList();
            break;
        case 'getNotificationsData':
            listsStore.dispatch(changeNewInstall(false));
            fetchNotificationsList(false);
            break;
        case 'getSessionData':
            let errors = [];
            userInfoStore.subscribe(() => {
                userInfoStore.getState().userInfo.get('errors', Immutable.Map({})).mapEntries(item => {
                    if (item[1]) {
                        errors.push(item[1]);
                    }
                });
            });

            ( userInfoStore.getState().userInfo.get('locations').size === 0 ) && fetchLocations();

            fetchSession()
                .then(setExtensionState).catch(err => console.log('alarms: fetch session err', err));
            const errorExists = errors[0] ? true : false;

            if (errorExists) {
                fetchUserAgentsList();
                copySecureLink();
            }
            break;
        default:
            break;
    }
}

function onInstallHandler(details) {
    if (details.reason == "install") {
        chrome.tabs.create({url: wsUrl.rootUrl + 'signup?ws_ext'});
        recordInstall();
        userInfoStore.dispatch(setInstallationDate(new Date()));
        listsStore.dispatch(changeNewInstall(true));
    }
}

export function addOnInstallListener() {
    !chrome.runtime.onInstalled.hasListener(onInstallHandler) && chrome.runtime.onInstalled.addListener(onInstallHandler);
}

export function startApp() {
    // updateTabs();
    
    userInfoStore.dispatch(setInitialPACSetFF(false));
    
    // need to keep this function here to prevent app crash when chrome closes with broken state
    removeListeners();
    try {
        var contextAndListeners = setContextMenuOption()
            .then(initTabs)
            .then(setTabsListeners)
            .then(fetchLocations)
            .then(fetchSession)
            .then(setExtensionState)
            .catch(err => console.log(err));
    } catch (err) {
        console.log(err)
    }

    bullshitDelete()

    fetchNotificationsList(false);

    setAlarms();

    // launching adblock rules
    loadRules();

    updateuBlockWhiteList();

    return contextAndListeners;
};

export function toggleAppIsOn(data) {
    userInfoStore.dispatch(changeAppIsOn(data))
    updateTabsTime()
}

function pacErrListener(error) {
    console.error(`Proxy error: ${error.message}`);
}

let proxyScriptURL;

function handleMessage(message, sender) {
    // only handle messages from the proxy script
    if (sender.url !=  browser.extension.getURL(proxyScriptURL)) {
        return;
    }

    try {
        if (message === 'init' && userInfoStore.getState().userInfo.getIn(["current", 'proxy']) ) {
            const pac = atob(pacStore.getState().pacFile.get("pac"));
            console.log('initing pac', pac);
            userInfoStore.dispatch(setInitialPACSetFF(true));
            browser.runtime.sendMessage({wsFindProxyForUrl: pac}, {toProxyScript: true});
        }

        console.log('pac url', message)
    } catch(err) {
        console.log('err ', err)
    }

    // console.log('pacfile message - ', message);
}

export function setBrowserProxy(pac) {
    try {
        if (BROWSER === 'firefox') {
            return setFFProxy(pac);
        } else if (BROWSER === 'chrome') {
            return setChromeProxy(pac);
        }
    } catch (err) {
        console.log('setBrowserProxy err', err)
    }
}

function setFFProxy(pac) {
    const username = userInfoStore.getState().userInfo.getIn(['current', 'authCredentials', 'username']);
    const password = userInfoStore.getState().userInfo.getIn(['current', 'authCredentials', 'password']);
    const useBackUp = userInfoStore.getState().userInfo.getIn(['current', 'useBackUp']);
    const initialPACSetFF = userInfoStore.getState().userInfo.getIn(['current', 'initialPACSetFF']);
    
    if ( initialPACSetFF ) return browser.runtime.sendMessage({wsFindProxyForUrl: pac}, {toProxyScript: true});
    
    console.log('setFFProxy');

    proxyScriptURL = "../js/pac-script.js";
    
    browser.proxy.register(proxyScriptURL).then(() => {
        if (chrome.runtime.lastError) console.log('error setting proxy', chrome.runtime.lastError);
        
    }).catch(err => console.log('PAC file ERR', err));
    
    !browser.proxy.onProxyError.hasListener(pacErrListener) && browser.proxy.onProxyError.addListener(pacErrListener);
    
    !browser.webRequest.onAuthRequired.hasListener(handleAuthRequest) && browser.webRequest.onAuthRequired.addListener(handleAuthRequest,
        {urls: ["<all_urls>"]}, ["blocking"]);
    
    !browser.webRequest.onCompleted.hasListener(handleSuccessfulRequest) && browser.webRequest.onCompleted.addListener(
        handleSuccessfulRequest,
        { urls: ['<all_urls>'] }
    );
    
    !browser.runtime.onMessage.hasListener(handleMessage) && browser.runtime.onMessage.addListener(handleMessage);

};

function setChromeProxy(pac) {
    const useBackUp = userInfoStore.getState().userInfo.getIn(['current', 'useBackUp'])
    const url = useBackUp ? wsUrl.backupExStartUrl : wsUrl.exStartUrl;

    const googleWhitelistString = `\tif ( /accounts\\.google\\.com/.test(url) || /clients.\\.google\\.com/.test(url) ||
    /ssl\\.gstatic\\.com/.test(url) ) return "HTTPS ${url}";\n\n`;

    const replaceValue = /(FindProxyForURL.*\n{.*\n)/;

    // When trying to login to google account Chrome is making requests that do not have onAuthRequired listeners.
    // They (requests) go through PAC file but do not succeed because, they don't have these listeners.
    // Thus need to add rule to the pac file because Chrome crashes when trying to login to google account
    // if pac file uses server with authentication.
    // Looks like Chrome doesn't crash at startup because Chrome makes these requests only once when default pac is set
    const newPac = pac.replace(replaceValue, `$1 ${googleWhitelistString}`)

    return new Promise(resolve => {
        chrome.proxy.settings.set({
            value: {
                mode: 'pac_script',pacScript: {
                    data: newPac
                }
            },
            scope: 'regular'
        }, function (data) {
            userInfoStore.dispatch(setIsDefaultPacSet(false))
            return resolve();
        });

        !chrome.webRequest.onCompleted.hasListener(handleSuccessfulRequest) && chrome.webRequest.onCompleted.addListener(
            handleSuccessfulRequest,
            { urls: ['<all_urls>'] }
        )

        // adding authentication for proxy, need to check if listener exists,
        // cause Chrome adds listener with same name too resulting in tons of listeners with the same name
        !chrome.webRequest.onAuthRequired.hasListener(handleAuthRequest) && chrome.webRequest.onAuthRequired.addListener(handleAuthRequest,
            {urls: ["<all_urls>"]}, ["blocking"]);
    })
};

export function unsetBrowserProxy() {

    if (BROWSER === 'firefox') {
        return unsetFFProxy()
    } else if (BROWSER === 'chrome') {
        return unsetChromeProxy()
    }
}

function unsetFFProxy() {
    return new Promise((resolve) => {
        const unregisterProxy = browser.proxy.unregister();

        unregisterProxy.then(() => {
            console.log('pac UNREGISTERED');
            userInfoStore.dispatch(setInitialPACSetFF(false));
    
            browser.proxy.onProxyError.hasListener(pacErrListener) && browser.proxy.onProxyError.removeListener(pacErrListener);
    
            browser.webRequest.onAuthRequired.hasListener(handleAuthRequest) && browser.webRequest.onAuthRequired.removeListener(handleAuthRequest);
            browser.runtime.onMessage.hasListener(handleMessage) && browser.runtime.onMessage.removeListener(handleMessage);
            resolve();
        });
    })
}

function unsetChromeProxy() {
    return new Promise((resolve) => {
        chrome.proxy.settings.set({
            value: {mode: "direct"},
            scope: 'regular'
        }, resolve);
        chrome.webRequest.onAuthRequired.hasListener(handleAuthRequest) && chrome.webRequest.onAuthRequired.removeListener(handleAuthRequest);
        chrome.webRequest.onCompleted.removeListener(handleSuccessfulRequest);
    })
}

export function setExtensionIcon(action) {
    const iconMap = {
        'on': 'on', 'off': 'off', 'doubleHop': 'doublehop'
    }

    if (iconMap[action.data]) {
        const path = {
            "19": `../assets/extension_icons/19x19_${iconMap[action.data]}.png`,
            "38": `../assets/extension_icons/38x38_${iconMap[action.data]}.png`
        }

        chrome.browserAction.setIcon({
            path
        });
    }
}

export function updateLocalStorage() {
    console.log('updateLocalStorage')
    return new Promise( (resolve, reject) => {
        chrome.storage.local.get(['listsInfo', 'pacFile', 'tabs', 'userInfo'], (items) => {
            if (chrome.runtime.lastError) {
                console.log('error_getting_data_from_storage', chrome.runtime.lastError)
                return resolve();
            }

            if (items.userInfo && items.userInfo.session_auth_hash) {
                // console.log('tabs_from_storage', items.tabs)
                const activeTab = _.find(items.tabs.tabs, tab => tab.active);
                // console.log('activeTab', activeTab)

                console.log('items', items)
                userInfoStore.dispatch(updateState(returnValue(items.userInfo, 'wsextension_userInfo')))
                listsStore.dispatch(updateState(returnValue(items.listsInfo, 'wsextension_listsInfo')))
                pacStore.dispatch(updateState(returnValue(items.pacFile, 'wsextension_pacFile')))
                tabsStore.dispatch(updateState(returnValue(items.tabs, 'wsextension_tabs')))

                tabsStore.dispatch(setLastActiveTab(activeTab))

                updateExtensionState();

                // console.log('localStorage_after_update', localStorage);
                return resolve();
            } else { resolve() }
        } );
    })
}

function returnValue(prop, localStorageKey) {
    const value = prop ? prop : (localStorage.getItem(localStorageKey) || '');
    // console.log('setting_value', prop ? 'prop' : ( (localStorage.getItem(localStorageKey) && 'localStorage') || 'empty_strin') )
    return value;
}

export function getHoursShift() {
    function getOffset(locs, curLoc) {
        const locationData = locs.filter(
            location => location.short_name === curLoc
        );

        const offset = locationData.length > 0 ? locationData[0].tz_offset.split(',') : [NaN, ''];
        return {utcShift: offset[0], timezone: offset[1]};
    };

    const changeTime = listsStore.getState().listsInfo.getIn(['state', 'time']);
    const currentCountry = userInfoStore.getState().userInfo.getIn(['current', 'country', 'short_name']);
    const proxy = userInfoStore.getState().userInfo.getIn(['current', 'proxy']);
    const ourLocation = userInfoStore.getState().userInfo.getIn(['current', 'ourLocation']);

    const locations = userInfoStore.getState().userInfo.get('locations').toJS()

    if (!changeTime || !proxy) return { utcShift: NaN, timezone: '' };

    // console.log('locations', getOffset(locations, currentCountry));

    // console.log('getHoursShift: country, proxy, outLocation', currentCountry, proxy, ourLocation)
    if (currentCountry === 'CR') return {utcShift: NaN, timezone: ''};
    else if (proxy) return getOffset(locations, currentCountry);
    else if (ourLocation) return getOffset(locations, ourLocation);
    else return {utcShift: NaN, timezone: ''};
}

export const notifications = {
    "on":(countryName) => {
        return {
            type: "basic",
            title: "Windscribe",
            iconUrl: "../assets/extension_icons/38x38_on.png",
            message: `${i18n.t('messages:notificationOn.message')} (${countryName})`
        }
    },
    "off":() => {
        return {
            type: "basic",
            title: "Windscribe",
            iconUrl: "../assets/extension_icons/38x38_on.png",
            message: `${i18n.t('messages:notificationOff.message')}`
        }
    },
    "onDoubleHop":(countryName) => {
        return {
            type: "basic",
            title: "Windscribe",
            iconUrl: "../assets/extension_icons/38x38_on.png",
            message: `${i18n.t('messages:notificationOnDH1.message')} (${countryName}). ${i18n.t('messages:notificationOnDH2.message')}`
        }
    },
    "offDoubleHop":() => {
        return {
            type: "basic",
            title: "Windscribe",
            iconUrl: "../assets/extension_icons/38x38_on.png",
            message: `${i18n.t('messages:notificationOffDH.message')}`
        }
    },
    "onExternalMode":() => {
        return {
            type: "basic",
            title: "Windscribe",
            iconUrl: "../assets/extension_icons/38x38_on.png",
            message: `${i18n.t('messages:notificationOnEM.message')}`
        }
    },
    "externalApp": () => {
        return {
            type: "basic",
            title: "Windscribe",
            iconUrl: "../assets/extension_icons/38x38_on.png",
            message: `${i18n.t('messages:notificationEA.message')}`
        }
    },
    "runningOutBandwidth": (percentage) => {
        return {
            type: "basic",
            title: "Windscribe",
            iconUrl: "../assets/extension_icons/38x38_on.png",
            message: `${i18n.t('messages:notificationBandwidth1.message')} ${percentage}${i18n.t('messages:notificationBandwidth2.message')}`
        }
    },
    "outOfBandwidth": () => {
        return {
            type: "basic",
            title: "Windscribe",
            iconUrl: "../assets/extension_icons/38x38_on.png",
            message: `${i18n.t('messages:notificationBandwidthOut.message')}`
        }
    }
};