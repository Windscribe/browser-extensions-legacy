const sendDocumentCookies = () => {
    if (document.cookies !== "") {
        return {
            cookieStore: document.cookie,
            hostname: window.location.hostname,
            url: window.location.href
        }
    } else {
        return null;
    }
}

chrome.runtime.onMessage.addListener((request, sender, respond) => {
    if (request.action === 'CM_REQUESTING_DOC_COOKIES') {
        // return respond(sendDocumentCookies())
        return respond(sendDocumentCookies())
    }
})