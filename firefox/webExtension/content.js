sessionStorage.getScreenMediaJSExtensionId = browser.runtime.id;

/* The browser content script which can listen to the page dom events */
var channel = browser.runtime.connect();
channel.onMessage.addListener(function (message) {
    console.log('Janus extension channel message', message);
    window.postMessage(message, '*');
});

window.addEventListener('message', function (event) {
    if (event.source != window)
        return;
    if (!event.data && (
			event.data.type == 'janusGetScreen' ||
			event.data.type == 'janusCancelGetScreen'))
        return;
    channel.postMessage(event.data);
});

/* Background page, responsible for actually choosing media */
browser.runtime.onConnect.addListener(function (channel) {
    channel.onMessage.addListener(function (message) {
        switch(message.type) {
        case 'janusGetScreen':
            var pending = browser.desktopCapture.chooseDesktopMedia(message.options || ['screen', 'window'],
                                                                   channel.sender.tab, function (streamid) {
                // Communicate this string to the app so it can call getUserMedia with it
                message.type = 'janusGotScreen';
                message.sourceId = streamid;
                channel.postMessage(message);
            });
            // Let the app know that it can cancel the timeout
            message.type = 'janusGetScreenPending';
            message.request = pending;
            channel.postMessage(message);
            break;
        case 'janusCancelGetScreen':
            browser.desktopCapture.cancelChooseDesktopMedia(message.request);
            message.type = 'janusCanceledGetScreen';
            channel.postMessage(message);
            break;
        }
    });
});

var div = document.createElement('div');
div.id = "janus-extension-installed";
div.style = "display: none;";
document.body.appendChild(div);
