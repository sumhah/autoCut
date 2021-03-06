'use strict';
var xLib;
try {
    xLib = new ExternalObject('lib:\PlugPlugExternalObject');
}
catch (err) {
    alert('Missing ExternalObject: ' + err.message);
}

// send an event to the CEP JavaScript VM
function dispatch(type, data) {
    if (!xLib) {
        return;
    }
    var eventObj = new CSXSEvent();
    eventObj.type = type;
    eventObj.data = data || '';
    eventObj.dispatch();
}

function log(type) {
    return function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }
        var safeArgs = args.map(function (arg) {
            try {
                JSON.stringify(arg);
                return arg;
            }
            catch (e) {
                return arg.toString();
            }
        });
        dispatch('CONSOLE_' + type, JSON.stringify(safeArgs));
    };
}

$.global.console = {
    log: log('LOG'),
    warn: log('WARN'),
    error: log('ERROR'),
};