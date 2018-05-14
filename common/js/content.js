function setUserAgent(element) {
    chrome.runtime.sendMessage(
        {action: "GET_USERAGENT"},

        function (customUserAgent) {
            // console.log('customUserAgent', customUserAgent)
            if (!customUserAgent)
                return false;
            var a = document.createElement("script");
            a.type = "text/javascript";
            a.innerText += "Object.defineProperty(window.navigator, 'userAgent', { get: function(){ return '" +
                customUserAgent + "'; } });";
            element.documentElement.insertBefore(a, element.documentElement.firstChild)
        }
    );
}

function setDate(element) {
    const utcShift = parseInt(localStorage.getItem('wsUtcShift'), 10);
    const timezone = localStorage.getItem('wsTimezone');

    if ( isNaN(utcShift) ) return;

    try {
        const code = `
            var bind = Function.bind;
            var unbind = bind.bind(bind);

            function instantiate(constructor, args) {
                return new (unbind(constructor, null).apply(null, args));
            }
            
            function modifyDateStr(dateStr) {
                var sign = ${utcShift} < 0 ? '-' : '+';
                if (${utcShift} > -10 && ${utcShift} < 10) {
                    dateStr = dateStr.replace(/(\\+|\\-)(\\d{2})/, sign + '0' + ${Math.abs(utcShift)});
                } else {
                    dateStr = dateStr.replace(/(\\+|\\-)(\\d{2})/, sign + ${Math.abs(Math.floor(utcShift))});
                }
                dateStr = dateStr.replace(/\\(\\w{1,5}/, '(' + '${timezone}');                            
                return dateStr
            }
            
            Date = (function (Date) {
                if (Date.isModified) {
                    return Date;
                }
                
                MyDate.prototype = Date.prototype;
                
                var someDate = new Date();

                Object.defineProperty(MyDate, 'originalTimezone', {
                    enumerable: false,
                    configurable: true,
                    writable: false,
                    value: someDate.getTimezoneOffset()
                });
                
                MyDate.prototype.getTimezoneOffset = function(){return ${-utcShift * 60}};
                MyDate.prototype.toGMTStringOriginal = Date.prototype.toGMTString;
                MyDate.prototype.toUTCStringOriginal = Date.prototype.toUTCString;
                MyDate.prototype.toISOStringOriginal = Date.prototype.toISOString;
                
                function toStringConstructor(method) {
                    var date = new MyDate();
                    date.setUTCHours(date.getHours() - ${utcShift});

                    return date[method]();
                }
                
                MyDate.prototype.toGMTString = function() {
                    return toStringConstructor('toGMTStringOriginal');
                };
                
                MyDate.prototype.toUTCString = function() {
                    return toStringConstructor('toUTCStringOriginal');
                };
                
                MyDate.prototype.toISOString = function() {
                    return toStringConstructor('toISOStringOriginal');
                };
            
                var names = Object.getOwnPropertyNames(Date);
                for (var i = 0; i < names.length; i++) {
                    if (names[i] in MyDate) { continue; };
                    var desc = Object.getOwnPropertyDescriptor(Date, names[i]);
                    Object.defineProperty(MyDate, names[i], desc);
                }
                
                MyDate.now = function now(){return Date.now() + ${utcShift * 60 * 60 * 1000} + MyDate.originalTimezone * 60 * 1000};

                
                Object.defineProperty(MyDate, 'name', {
                    enumerable: false,
                    configurable: true,
                    writable: false,
                    value: 'Date'
                });
            
                Object.defineProperty(MyDate, 'isModified', {
                    enumerable: false,
                    configurable: true,
                    writable: false,
                    value: true
                });
            
                return MyDate; 
            
                function MyDate() {
                    var date = instantiate(Date, arguments);
            
                    if (new.target) {
                        if (!arguments[0]) {
                            date.setHours(date.getUTCHours() + ${utcShift});
                        }
                        return date;
                    } else {
                        date.setHours(date.getUTCHours() + ${utcShift});
                        
                        return modifyDateStr(date.toString());
                    }
                }
            })(Date);
            `;

        const a = document.createElement("script");
        a.type = "text/javascript";
        a.innerText += code.replace(/\n/gm, '');

        element.documentElement.insertBefore(a, element.documentElement.firstChild);
        // console.log('im here', a, element.documentElement.firstChild)
    } catch (e) {
        console.log('er', e)
    }
}

setUserAgent(document);

setDate(document)

document.addEventListener("load", function (event) {
    var element = event.target;

    if (/^i?frame$/.test(element.localName)) {
        try {
            setUserAgent(element.contentWindow.document);
        } catch (e) {
            e.message.indexOf('cross-origin') > -1 ?
                console.log('Error: Cannot set user agent for iframe with location different to this page') :
                    console.log('setting user agent error');
        }
    }
}, true);
