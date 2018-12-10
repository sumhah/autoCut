﻿function start() {
    var doc = app.activeDocument;
    time('start', function () {
        try {
            doc.suspendHistory('autoCut script...', 'Controller.start()');
            $.sleep(200);
            undo(doc);
        } catch (e) {
            console.error(e);
        }
    })
    return '';
}

function selectLayerHandler() {
    console.log('\n\n\n------------new CSS------------\n');
    return JSON.stringify(new CSS(app.activeDocument.activeLayer, {
        noExportImg: true,
        noHide: true,
    }))
}

var toggle = true;
var t = 0;
var i = 0

function tryBtnHandler() {
    i += 1
    toggle = !toggle
    var layer = app.activeDocument.activeLayer;
    var doc = app.activeDocument;

    doc.trim(TrimType.TRANSPARENT);
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