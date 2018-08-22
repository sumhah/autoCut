function start() {
    var doc = app.activeDocument;
    try {
        Controller.start();
    } catch (e) {
        console.log(e);
    }
    // doc.suspendHistory('please wait...', 'main()');
    // undo(doc);

    return '';
}

function getLayerCss() {
    var doc = app.activeDocument;
    var css = Layer.getLayerCss(doc.activeLayer);

    return css;
}

