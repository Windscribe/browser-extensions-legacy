import _ from 'underscore';
import Immutable from 'immutable';
import pacStore from '../store/pacStore.js'
import listsStore from '../store/listsStore.js'
import userInfoStore from '../store/userInfoStore.js'

import { fetchLocations } from './Utilities';

import {
    changeLocation,
    setDeviceId,
    setIsJustLogged,
    setIsPremiumValue,
    setOurIP,
    setOurLocation,
    setPremiumExpiryDate,
    setProxy,
    setProxyStateBeforeExpiration,
    setRebill,
    setRemainingTraffic,
    setSessionAuthHash,
    setUserStatus,
    setInstallationDate,
    setAuthCredentials,
    setRateUsPopShown,
    setProxyShouldBeTurnedOffAfterLeftOurLocation,
    setNeedMigration
} from '../actions/userInfoActionsCreators';

import {
    addUser,
    putToProxyWhiteList,
    putToWhiteList,
    changeSplitPersonality,
    changePrivacyOption
} from '../actions/listsActionsCreators';

const BROWSER = ENV;

// Firefox migration utils
function firefoxMigrateLocationUtil(currentLocation) {
    // EXAMPLE OF LOCATION OBJECT:
    // - cruise control
    // {"code":"Automatic","name":"Automatic"}
    //
    // - manual
    // {"code":"CA","name":"Canada East","country_code":"CA"}

    if (currentLocation['code'] === "Automatic"  ) {
        const cruiseControl = Immutable.Map({
            country_code : "",
            name : "Cruise control",
            short_name : "CR",
            status : 1,
            premium_only : 0
        });
        userInfoStore.dispatch(changeLocation({selectedLocation: cruiseControl}));
    } else {
        const locations = userInfoStore.getState().userInfo.get('locations');

        const correspondingLocation = locations.find( (location) => location.get('short_name') === currentLocation["code"]);
        userInfoStore.dispatch(changeLocation({selectedLocation: correspondingLocation}));
    }
}

function migrateWhiteLists(whitelist) {
    const adsWhitelist = _.chain( whitelist )
        .filter( entry => entry['adsOnly'] || _.isUndefined(entry['adsOnly']) )
        .map( entry => entry['url'])
        .value()

    const proxyWhitelist = _.chain( whitelist )
        .filter( entry => !entry['adsOnly'] && !_.isUndefined(entry['adsOnly']) )
        .map( entry => entry['url']  )
        .value()

    const difAdsWhitelist = _.difference( adsWhitelist, listsStore.getState().listsInfo.getIn(['lists', 'proxyWhiteList']).toJS() )
    const difProxyWhitelist = _.difference( proxyWhitelist, listsStore.getState(listsStore.getState().listsInfo.getIn(['lists', 'proxyWhiteList']).toJS() ) )

    _.each(difAdsWhitelist, url => listsStore.dispatch( putToWhiteList( url ) ) )
    _.each(difProxyWhitelist, url => listsStore.dispatch( putToProxyWhiteList( url ) ) )

}

function migrateData(oldData) {

    userInfoStore.dispatch(setSessionAuthHash(oldData.session_auth_hash));
    userInfoStore.dispatch(setProxy( oldData.proxy_state_must === 'On' ));

    const adBlocker = oldData['adblocker'].toString() === 'true';
    const antiSocial = oldData['antiSocial'].toString() === 'true';
    const untraceable = oldData['untraceable'].toString() === 'true';
    const splitPersonality = oldData['splitPersonality'].toString() === 'true';

    listsStore.dispatch(changePrivacyOption('CHANGE_ADBLOCKER', adBlocker));
    listsStore.dispatch(changePrivacyOption('CHANGE_ANTISOCIAL', antiSocial));
    listsStore.dispatch(changePrivacyOption('CHANGE_UNTRACEABLE', untraceable));
    listsStore.dispatch(changeSplitPersonality(splitPersonality));

    userInfoStore.dispatch(setProxyShouldBeTurnedOffAfterLeftOurLocation(oldData.proxyBeforeOurLocation === 'Off'))

    firefoxMigrateLocationUtil(oldData.current_country);

    migrateWhiteLists(oldData.whitelist);

    userInfoStore.dispatch(setNeedMigration(false));

    return Promise.resolve();
}
// END of Firefox migration utils

// Chrome migration utils
function chromeMigrationUtil() {
    // notes: skipping error setting, will not parse 'locationsList', 'fileContentLines'
    // as it will be set on start automatically; 'currentLocationView' is not used anywhere - skip;
    const changeUntraceable = _.partial(changePrivacyOption, 'CHANGE_UNTRACEABLE');
    const changeAntiSocial = _.partial(changePrivacyOption, 'CHANGE_ANTISOCIAL');
    const changeAdBlocker = _.partial(changePrivacyOption, 'CHANGE_ADBLOCKER');
    const pac = atob(pacStore.getState().pacFile.get("pac"));
    const setProxyUtil = _.partial(setProxy, _, pac)

    const listsStatesToBoolMap = {
        splitPersonality: changeSplitPersonality,
        untraceable: changeUntraceable,
        antiSocial: changeAntiSocial,
        adBlocker: changeAdBlocker
    };

    const simpleUserInfoStateMap = {
        userStatus: setUserStatus,
        isPremium: setIsPremiumValue,
        our_location: setOurLocation,
        our_ip: setOurIP,
        remainingTraffic: setRemainingTraffic,
        installationDate: setInstallationDate,
        rebill: setRebill,
        premium_expiry_date: setPremiumExpiryDate,
        device_id: setDeviceId
    };

    const listsCanBeParsedMap = {
        users: addUser,
        proxyWhitelist: putToProxyWhiteList,
        whiteList: putToWhiteList
    }

    const userInfoCanBeParsedMap = {
        authCredentials: setAuthCredentials, // object
        rateUsPopShown: setRateUsPopShown,// 'true',
        // below keys has '1' or '0' inside
        isSetProxy: setProxyUtil,
        isJustLogged: setIsJustLogged,
        proxyStateBeforeExpiration: setProxyStateBeforeExpiration
    };

    _.each(listsStatesToBoolMap, (setFunction, key) => {
        localStorage.getItem(key) && convertToBool(JSON.parse(localStorage.getItem(key)), setFunction, listsStore)
    });

    _.each(simpleUserInfoStateMap, (setFunction, key) => {
        localStorage.getItem(key) && simpleSet( localStorage.getItem(key), setFunction, userInfoStore)
    })

    _.each(listsCanBeParsedMap, (setFunction, key) => {
        localStorage.getItem(key) && simpleSet( JSON.parse(localStorage.getItem(key)), setFunction, listsStore)
    })

    _.each(userInfoCanBeParsedMap, (setFunction, key) => {
        // console.log('proxyCheck', key, JSON.parse(localStorage.getItem(key)))
        localStorage.getItem(key) && simpleSet( JSON.parse(localStorage.getItem(key)), setFunction, userInfoStore)
    })

    localStorage.getItem('currentLocation') && chromeMigrateLocationUtil(JSON.parse(localStorage.getItem('currentLocation')))

    userInfoStore.dispatch(setNeedMigration(false));
    return Promise.resolve()
}

function simpleSet(value, method, store) {
    _.isArray(value) ? _.each(value, item => store.dispatch(method(item))) : store.dispatch( method( value));
}

function convertToBool(value, method, store) {
    store.dispatch(method(!!value));
}

function chromeMigrateLocationUtil(currentLocation) {
    // EXAMPLE OF LOCATION OBJECT:
    // country = {
    //     code: country.code || defaultCountryCode,
    //     countryCode: country.countryCode || defaultCountryCode,
    //     countryName: country.countryName || defaultCountryName
    // };

    if (JSON.parse(localStorage.getItem('isCruiseControlOn') ) ) {
        const cruiseControl = Immutable.Map({
            country_code : "",
            name : "Cruise control",
            short_name : "CR",
            status : 1,
            premium_only : 0
        });
        userInfoStore.dispatch(changeLocation({selectedLocation: cruiseControl}));
    } else {
        const locations = userInfoStore.getState().userInfo.get('locations');

        const correspondingLocation = locations.find( (location) => location.get('short_name') === currentLocation.countryCode);
        userInfoStore.dispatch(changeLocation({selectedLocation: correspondingLocation}));
    }
}
// END of Chrome migration utils

function migrateFirefox() {
    if ( !userInfoStore.getState().userInfo.getIn(['current', 'needMigration']) ||
        userInfoStore.getState().userInfo.get('session_auth_hash') ) return Promise.resolve();


    let oldData;
    return browser.runtime.sendMessage({todo: 'checkUserStatus' })
        .then(reply => {
            console.log('checkUserStatus reply', reply)
            if (reply) {
                userInfoStore.dispatch(setSessionAuthHash(reply))
                return browser.runtime.sendMessage({todo: 'migrateData' });
            }

            return Promise.reject('user not authorized');
        }).then((reply) => {
            console.log('migrateData reply', reply)
            oldData = reply;
            return fetchLocations()
        }).then(() => {
            return migrateData(oldData);
        }).catch(err => {
            console.log('migration_err', err);
            return Promise.resolve();
        });
}

function migrateChrome() {
    if ( !userInfoStore.getState().userInfo.getIn(['current', 'needMigration']) ||
        userInfoStore.getState().userInfo.get('session_auth_hash') ) return Promise.resolve();

    const sessionHash = localStorage.getItem('session_auth_hash');
    sessionHash && userInfoStore.dispatch(setSessionAuthHash(sessionHash));

    return  ( sessionHash && userInfoStore.getState().userInfo.getIn(['current', 'needMigration']) ) ? fetchLocations()
        .then(chromeMigrationUtil)
        .catch(err => {
            console.log('migration_err', err);
            Promise.resolve();
        }) : Promise.resolve();
}

export default function migrationScript() {
    console.log(`migrations script started for ${BROWSER}`);

    if ( BROWSER === 'firefox') {
        return migrateFirefox();
    } else if ( BROWSER === 'chrome' ) {
        return migrateChrome();
    }
}


