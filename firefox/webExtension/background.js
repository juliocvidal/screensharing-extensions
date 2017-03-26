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
