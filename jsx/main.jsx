function start() {
    var doc = app.activeDocument;
    try {
        Controller.start();
    } catch (e) {
        console.log(e);
    }
    // doc.suspendHistory('please wait...', 'main()');
    // undo(doc);
    // console.log('\n\n\n------------new CSS------------\n');
    // new CSS(doc.activeLayer)
    return '';
}

function selectLayer() {
    console.log('\n\n\n------------new CSS------------\n');
    new CSS(app.activeDocument.activeLayer)
}

function getLayerCss() {
    var doc = app.activeDocument;
    var css = Layer.getLayerCss(doc.activeLayer);

    return css;
}

var descCache = {}
