function makeLayerVisible(item) {
    item.layer.visible = true;

    var current = item.parent;
    while (current) {
        if (!current.layer.visible) {
            current.layer.visible = true;
        }
        current = current.parent;
    }
}

function makeLayerHide(layer) {
    layer.visible = false;

    while (layer.visible) {
        layer.visible = false;
    }
}

function undo(doc) {
    doc.activeHistoryState = doc.historyStates[doc.historyStates.length - 2];
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

function each(arr, callback) {
    for (var i = 0, len = arr.length; i < len; i += 1) {
        callback(arr[i], i, len);
    }
}

function pushArr(arr, subArr) {
    each(subArr, function (item) {
        arr.push(item);
    });
}

function filter(arr, callback) {
    var newArr = [];
    for (var i = 0, len = arr.length; i < len; i += 1) {
        var item = arr[i];
        if (callback(item, i, len)) {
            newArr.push(item);
        }
    }
    return newArr;
}

function exportDirty(layer) {
    var doc = app.activeDocument;

    var exportOptions = new ExportOptionsSaveForWeb();
    exportOptions.PNG8 = false;
    exportOptions.format = SaveDocumentType.PNG;
    exportOptions.transparency = true;
    exportOptions.interlaced = false;
    exportOptions.quality = 100;

    var filePath = sourcePath + layer.name.substr(0, layer.name.length - 1) + '.png';
    var fileOut = new File(filePath);
    var b1 = layer.bounds;
    var w = b1[2] - b1[0];
    var h = b1[3] - b1[1];
    var temp;

    layer.copy();
    app.documents.add(w, h, 72, 'temp', NewDocumentMode.RGB, DocumentFill.TRANSPARENT, 1);
    temp = app.activeDocument;
    temp.paste();
    temp.exportDocument(fileOut, ExportType.SAVEFORWEB, exportOptions);
    temp.close(SaveOptions.DONOTSAVECHANGES);
}

function exportLayer(layer) {
    function dupLayers() {
        var desc143 = new ActionDescriptor();
        var ref73 = new ActionReference();
        ref73.putClass(charIDToTypeID('Dcmn'));
        desc143.putReference(charIDToTypeID('null'), ref73);
        desc143.putString(charIDToTypeID('Nm  '), activeDocument.activeLayer.name);
        var ref74 = new ActionReference();
        ref74.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
        desc143.putReference(charIDToTypeID('Usng'), ref74);
        executeAction(charIDToTypeID('Mk  '), desc143, DialogModes.NO);
    };

    function SavePNG(saveFile) {
        var pngOpts = new ExportOptionsSaveForWeb;
        pngOpts.format = SaveDocumentType.PNG;
        pngOpts.PNG8 = false;
        pngOpts.transparency = true;
        pngOpts.interlaced = false;
        pngOpts.quality = 100;
        activeDocument.exportDocument(new File(saveFile), ExportType.SAVEFORWEB, pngOpts);
    }

    function main() {
        if (!documents.length) return;
        var activeDocument = app.activeDocument;
        var oldPath = activeDocument.path;

        var outFolder = new Folder(oldPath + '/images');
        if (!outFolder.exists) {
            outFolder.create();
        }

        function saveLayer(layer, lname, path, shouldMerge) {
            activeDocument.activeLayer = layer;
            dupLayers();
            activeDocument.trim(TrimType.TRANSPARENT, true, true, true, true);
            var saveFile = File(path + lname);
            SavePNG(saveFile);
            app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }

        saveLayer(layer, layer.name.substring(0, -1), outFolder, false);
    }

    function onlyCurrentLayerVisible() {
        var idShw = charIDToTypeID('Shw ');
        var desc38 = new ActionDescriptor();
        var idnull = charIDToTypeID('null');
        var list10 = new ActionList();
        var ref13 = new ActionReference();
        var idLyr = charIDToTypeID('Lyr ');
        var idOrdn = charIDToTypeID('Ordn');
        var idTrgt = charIDToTypeID('Trgt');
        ref13.putEnumerated(idLyr, idOrdn, idTrgt);
        list10.putReference(ref13);
        desc38.putList(idnull, list10);
        var idTglO = charIDToTypeID('TglO');
        desc38.putBoolean(idTglO, true);
        executeAction(idShw, desc38, DialogModes.NO);
    }

    exportDirty(layer);
}

function id(string) {
    return app.stringIDToTypeID(string);
}

function makeID(keyStr) {
    if (keyStr[0] == '\'')	// Keys with single quotes 'ABCD' are charIDs.
        return app.charIDToTypeID(eval(keyStr));
    else
        return app.stringIDToTypeID(keyStr);
}

const AUTO_CUT_EXPORT_OPTION = new ExportOptionsSaveForWeb();
AUTO_CUT_EXPORT_OPTION.PNG8 = false;
AUTO_CUT_EXPORT_OPTION.format = SaveDocumentType.PNG;
AUTO_CUT_EXPORT_OPTION.transparency = true;
AUTO_CUT_EXPORT_OPTION.interlaced = false;
AUTO_CUT_EXPORT_OPTION.quality = 100;

function cropToCurrentLayer() {
    // var doc = app.activeDocument
    // doc.crop(doc.activeLayer.bounds);

    var idCrop = charIDToTypeID('Crop');
    var desc1711 = new ActionDescriptor();
    var idT = charIDToTypeID('T   ');
    var desc1712 = new ActionDescriptor();
    var idTop = charIDToTypeID('Top ');
    var idPxl = charIDToTypeID('#Pxl');
    desc1712.putUnitDouble(idTop, idPxl, -80.000000);
    var idLeft = charIDToTypeID('Left');
    var idPxl = charIDToTypeID('#Pxl');
    desc1712.putUnitDouble(idLeft, idPxl, 594.000000);
    var idBtom = charIDToTypeID('Btom');
    var idPxl = charIDToTypeID('#Pxl');
    desc1712.putUnitDouble(idBtom, idPxl, 91.000000);
    var idRght = charIDToTypeID('Rght');
    var idPxl = charIDToTypeID('#Pxl');
    desc1712.putUnitDouble(idRght, idPxl, 720.000000);
    var idRctn = charIDToTypeID('Rctn');
    desc1711.putObject(idT, idRctn, desc1712);
    var idAngl = charIDToTypeID('Angl');
    var idAng = charIDToTypeID('#Ang');
    desc1711.putUnitDouble(idAngl, idAng, 0.000000);
    var idDlt = charIDToTypeID('Dlt ');
    desc1711.putBoolean(idDlt, true);
    var idcropAspectRatioModeKey = stringIDToTypeID('cropAspectRatioModeKey');
    var idcropAspectRatioModeClass = stringIDToTypeID('cropAspectRatioModeClass');
    var idpureAspectRatio = stringIDToTypeID('pureAspectRatio');
    desc1711.putEnumerated(idcropAspectRatioModeKey, idcropAspectRatioModeClass, idpureAspectRatio);
    var idCnsP = charIDToTypeID('CnsP');
    desc1711.putBoolean(idCnsP, false);
    executeAction(idCrop, desc1711, DialogModes.NO);
}

function newDocFromLayer() {
    var docName = 'document';
    var layerName = 'layer';
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID('Dcmn'));
    desc.putReference(charIDToTypeID('null'), ref);
    desc.putString(charIDToTypeID('Nm  '), docName);
    var ref1 = new ActionReference();
    ref1.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
    desc.putReference(charIDToTypeID('Usng'), ref1);
    desc.putString(charIDToTypeID('LyrN'), layerName);
    executeAction(charIDToTypeID('Mk  '), desc, DialogModes.NO);
}

function exportPng24AM(file) {

    var WHITE = new RGBColor();
    WHITE.red = 255;
    WHITE.green = 255;
    WHITE.blue = 255;

    var desc = new ActionDescriptor(),
        desc2 = new ActionDescriptor();
    desc2.putEnumerated(app.charIDToTypeID('Op  '), app.charIDToTypeID('SWOp'), app.charIDToTypeID('OpSa'));
    desc2.putEnumerated(app.charIDToTypeID('Fmt '), app.charIDToTypeID('IRFm'), app.charIDToTypeID('PN24'));
    desc2.putBoolean(app.charIDToTypeID('Intr'), false);
    desc2.putBoolean(app.charIDToTypeID('Trns'), true);
    desc2.putBoolean(app.charIDToTypeID('Mtt '), true);
    desc2.putInteger(app.charIDToTypeID('MttR'), WHITE.red);
    desc2.putInteger(app.charIDToTypeID('MttG'), WHITE.green);
    desc2.putInteger(app.charIDToTypeID('MttB'), WHITE.blue);
    desc2.putBoolean(app.charIDToTypeID('SHTM'), false);
    desc2.putBoolean(app.charIDToTypeID('SImg'), true);
    desc2.putBoolean(app.charIDToTypeID('SSSO'), false);
    desc2.putList(app.charIDToTypeID('SSLt'), new ActionList());
    desc2.putBoolean(app.charIDToTypeID('DIDr'), false);
    desc2.putPath(app.charIDToTypeID('In  '), file);
    desc.putObject(app.charIDToTypeID('Usng'), app.stringIDToTypeID('SaveForWeb'), desc2);
    app.executeAction(app.charIDToTypeID('Expr'), desc, DialogModes.NO);
}

function countTime(name, fn, count) {
    var t = new Date();
    count = count || 1;
    for (var i = 0; i < count; i += 1) {
        fn();
    }
    console.log(name + ': ', new Date() - t + 'ms');
}

function quickExportAsPng() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putName(id('action'), 'quick');
    ref.putName(id('actionSet'), 'rank');
    desc.putReference(id('null'), ref);
    executeAction(id('play'), desc, DialogModes.NO);
}

function flattenCurrentDocument() {
    app.activeDocument.flatten()
    // executeAction(charIDToTypeID('FltI'), undefined, DialogModes.NO);
}