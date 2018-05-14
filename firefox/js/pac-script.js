function isPlainHostName(host) {
    return (host.search('\\.') === -1);
}

function shExpMatch(url, pattern) {
    url = url[url.length - 1] && url + '/';
    pattern = pattern.replace(/\./g, '\\.');
    pattern = pattern.replace(/\*/g,  '.*');
    pattern = pattern.replace(/\?/g, '.');

    var newRe = new RegExp('^'+pattern+'$');
    // browser.runtime.sendMessage(`shExpMatch, url - ${url}, pattern - ${newRe}, result - ${newRe.test(url)}` );
    return newRe.test(url);
}

var wsFindProxyForURL = (url, host) => {
    return "DIRECT";
}

browser.runtime.sendMessage("init");

browser.runtime.onMessage.addListener((message) => {
    wsFindProxyForURL = message.wsFindProxyForUrl ? eval('(function(){ return ' + message.wsFindProxyForUrl + '})()') : wsFindProxyForURL;
});

function FindProxyForURL(url, host) {
    // can be useful for future debug
    // browser.runtime.sendMessage('url - ' + url + ' host - ' + host + ' wsFindProxyForURL - ' + wsFindProxyForURL(url, host));

    return wsFindProxyForURL(url, host);
}
