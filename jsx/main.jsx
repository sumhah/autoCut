function start() {
    var doc = app.activeDocument;
    time('start', function () {
        try {
            doc.suspendHistory('autoCut script...', 'Controller.start()');
            $.sleep(100);
            undo(doc);
        } catch (e) {
            console.log(e);
        }
    })
    return '';
}

function selectLayerHandler() {
    console.log('\n\n\n------------new CSS------------\n');
    new CSS(app.activeDocument.activeLayer)
}

var toggle = true;
var t = 0;
var i = 0

function tryBtnHandler() {
    i += 1
    toggle = !toggle
    var layer = app.activeDocument.activeLayer;
    var doc = app.activeDocument;

    var b = layer.bounds;
    var fileOut = new File(sourcePath + 'just' + ++i + '.png');
    if (toggle) {

        // countTime('exportDocument', function () {
        //     // exportPng24AM(fileOut)
        //     // quickExportAsPng()
        //     newDocFromLayer()
        //     trimCurrentDocument()
        //     var doc = app.activeDocument;
        //     doc.exportDocument(fileOut, ExportType.SAVEFORWEB, AUTO_CUT_EXPORT_OPTION);
        //     doc.close(SaveOptions.DONOTSAVECHANGES)
        // }, 1)
        // temp.close(SaveOptions.DONOTSAVECHANGES);
    }
}