var cookie = document.getElementById("ws_ext_auth").value;
chrome.runtime.sendMessage({"cookie": cookie}, function(response) {
    //console.log(response);
});