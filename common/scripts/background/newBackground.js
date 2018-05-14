import eventProxy from './eventProxy.js'
import userInfoStore from '../store/userInfoStore';
import migrationScript from './migrationUtils';

import {
    loadRules,
    addOnInstallListener,
    loadLists,
    checkForOtherExtension,
    startApp,
    updateLocalStorage,
    reloadTabs,
    reloadActiveTab
} from './Utilities.js'

eventProxy();

addOnInstallListener();

loadRules();
loadLists();


// Only at firefox: ping addon
// browser.runtime.sendMessage({todo: 'msg-from-ext'}).then(reply => console.log('reply', reply))
console.log('background script run');

updateLocalStorage()
    .then(migrationScript)
    .then(() => {
        if ( userInfoStore.getState().userInfo.get('session_auth_hash') ) {
            console.log('startApp');
            return Promise.resolve();
        }
        return Promise.reject('not_authorized_user')
    })
    .then(checkForOtherExtension)
    .then(() => {
        if ( userInfoStore.getState().userInfo.getIn(['current', 'isOtherExtensionPresent']) ) return Promise.reject('other_extension_present');
        // if ( userInfoStore.getState().userInfo.getIn(['current', 'proxy']) ) {
        //     !chrome.webRequest.onAuthRequired.hasListener(handleAuthRequest) &&
        //         chrome.webRequest.onAuthRequired.addListener(handleAuthRequest,
        //             {urls: ["<all_urls>"]}, ["blocking"]);
        // }
        return Promise.resolve();
    })
    .then(reloadTabs)
    .then(startApp)
    .then(reloadActiveTab)
    .catch(err => console.log('initial_load_err ', err));
