var cookie = document.getElementById("ws_ext_auth") && document.getElementById("ws_ext_auth").value;

cookie && chrome.runtime.sendMessage({action: "LOGIN_AFTER_SIGNUP", cookie: cookie});
console.log('content_script_after_signup');