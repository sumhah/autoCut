function log(str) {
    $.writeln(str);
}

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