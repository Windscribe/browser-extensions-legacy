import events from './events';

function eventsListener(request, sender, sendResponse) {
    if (events.hasOwnProperty(request.action)) {
        events[request.action](request, sendResponse);
    }
};

function proxy() {
    !chrome.runtime.onMessage.hasListener(eventsListener) && chrome.runtime.onMessage.addListener(eventsListener)
}

export default proxy
