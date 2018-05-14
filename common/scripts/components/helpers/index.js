import tld from 'tldjs';
import _ from 'underscore';

export function addToWhiteListUtil(url, noProxy, fromHome, context) {
    if (!url) return;
    const domain = tld.getDomain(url);
    chrome.runtime.sendMessage({
        action: "ADD_TO_WHITELIST",
        data : {
            domain,
            noProxy
        }
    });
    fromHome && context.router.push('/whitelist');
}

export function isUrl(s) {
    var regexp = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
    return regexp.test(s);
};

export function canBeSecureLink(url) {
    return !/chrome:\/\//.test(url) && !/chrome-extension:\/\//.test(url)
};

export function haveNetworkErr(errors) {
    const networkErrNames = ['session', 'locations', 'pacFile', 'userAgentList',
        'secureLink', 'secureLinkOptions', 'adList',
        'trackersList', 'antiSocialList', 'notificationsList'];
    const networkErr = _.find(networkErrNames, name => errors[name]);
    return !!networkErr;
}


function getDays(a1, a2) {
    var date1 = new Date(a1);
    var date2 = new Date(a2);
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

function convertTrafficToGB(traffic) {
    return (traffic/1073741824).toFixed(1)
}

export function showRateUsPopup(userInfo) {
    // console.log('userInfo:', userInfo);

    var isReadyForOpenRateUsDialog = userInfo.installationDate && !userInfo.current.rateUsPopShown;
    // console.log('isReadyForOpenRateUsDialog:', isReadyForOpenRateUsDialog);

    if (isReadyForOpenRateUsDialog) {
        var isTimePassed = getDays(new Date(), userInfo.installationDate) >= 7;
        var usedTrafficInGB = userInfo.session.data && ( convertTrafficToGB(userInfo.session.data.traffic_used) - convertTrafficToGB(userInfo.current.trafficOnLogin) );
        var isTrafficUsed = Number(usedTrafficInGB) >= 1;

        return !!(isTimePassed && isTrafficUsed);
    }
}

export function changeClientHeight(height = 390) {
    if (
        parseInt(document.querySelector('html').style.height) === height
        && parseInt(document.body.style.height) === height
    ) return;

    document.querySelector('html').style.height = height
    document.body.style.height = height
}
