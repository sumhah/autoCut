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

function id(keyStr) {
    if (keyStr[0] == '\'')	// Keys with single quotes 'ABCD' are charIDs.
        return app.charIDToTypeID(eval(keyStr));
    else {
        return app.stringIDToTypeID(keyStr);
    }
}

const AUTO_CUT_EXPORT_OPTION = new ExportOptionsSaveForWeb();
AUTO_CUT_EXPORT_OPTION.PNG8 = false;
AUTO_CUT_EXPORT_OPTION.format = SaveDocumentType.PNG;
AUTO_CUT_EXPORT_OPTION.transparency = true;
AUTO_CUT_EXPORT_OPTION.interlaced = false;
AUTO_CUT_EXPORT_OPTION.quality = 100;

function newDocFromLayer() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID('Dcmn'));
    desc.putReference(charIDToTypeID('null'), ref);
    desc.putString(charIDToTypeID('Nm  '), 'document');
    var ref1 = new ActionReference();
    ref1.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
    desc.putReference(charIDToTypeID('Usng'), ref1);
    desc.putString(charIDToTypeID('LyrN'), 'layer');
    executeAction(charIDToTypeID('Mk  '), desc, DialogModes.NO);
}

function time(name, fn, count) {
    var t = new Date();
    count = count || 1;
    for (var i = 0; i < count; i += 1) {
        fn();
    }
    console.log(name + ': ', new Date() - t + 'ms');
}

function quickExportAsPng() {
    // is limited to file paths
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putName(id('action'), 'quick');
    ref.putName(id('actionSet'), 'rank');
    desc.putReference(id('null'), ref);
    executeAction(id('play'), desc, DialogModes.NO);
}

function mergeCurrentLayer() {
    time('merge', function () {
        executeAction(charIDToTypeID('Mrg2'), undefined, DialogModes.NO);
    });
}

function hasBackground() {
    var res = false;
    try {
        var ref = new ActionReference();
        ref.putProperty(1349677170, 1315774496);
        ref.putIndex(1283027488, 0);
        executeActionGet(ref).getString(1315774496);
        res = true;
    } catch (e) {
    }
    return res;
};

function collectNamesAM(re) {
    var allLayers = [];
    var startLoop = Number(!hasBackground());
    var endLoop = getNumberOfLayer();
    for (var l = startLoop; l < endLoop; l++) {
        while (!isValidActiveLayer(l)) {
            l++;
        }
        if (getLayerNameByIndex(l).match(re) != null) {
            allLayers.push(l);
        }
    }
    return allLayers;
};

function getActiveLayerIndex() {
    var ref = new ActionReference();
    ref.putProperty(1349677170, 1232366921);
    ref.putEnumerated(1283027488, 1332896878, 1416783732);
    var res = executeActionGet(ref).getInteger(1232366921) - (hasBackground() ? 1 : 0);
    res == 4 ? res++ : res;// why the skip in this doc?
    return res;
}

function isValidActiveLayer(index) {
    var propName = stringIDToTypeID('layerSection');// can't replace
    var ref = new ActionReference();
    ref.putProperty(1349677170, propName);// TypeID for "Prpr"
    // 'Lyr ", idx
    ref.putIndex(1283027488, index);
    var desc = executeActionGet(ref);
    var type = desc.getEnumerationValue(propName);
    var res = typeIDToStringID(type);
    return res == 'layerSectionEnd' ? false : true;
};

function makeActiveByIndex(index, forceVisible) {
    try {
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putIndex(charIDToTypeID('Lyr '), index);
        desc.putReference(charIDToTypeID('null'), ref);
        executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);
    } catch (e) {
        return -1;
    }
};

function getNumberOfLayer() {
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID('Dcmn'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
    var desc = executeActionGet(ref);
    var numberOfLayer = desc.getInteger(charIDToTypeID('NmbL'));
    return numberOfLayer;
}

function getLayerNameByIndex(index) {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID('Prpr'), charIDToTypeID('Nm  '));
    ref.putIndex(charIDToTypeID('Lyr '), index);
    return executeActionGet(ref).getString(charIDToTypeID('Nm  '));
}

function trimCurrentDocument() {
    var idtrim = stringIDToTypeID('trim');
    var desc1318 = new ActionDescriptor();
    var idtrimBasedOn = stringIDToTypeID('trimBasedOn');
    var idTrns = charIDToTypeID('Trns');
    desc1318.putEnumerated(idtrimBasedOn, idtrimBasedOn, idTrns);
    var idTop = charIDToTypeID('Top ');
    desc1318.putBoolean(idTop, true);
    var idBtom = charIDToTypeID('Btom');
    desc1318.putBoolean(idBtom, true);
    var idLeft = charIDToTypeID('Left');
    desc1318.putBoolean(idLeft, true);
    var idRght = charIDToTypeID('Rght');
    desc1318.putBoolean(idRght, true);
    executeAction(idtrim, desc1318, DialogModes.NO);
}

function toggleOnlyShowCurrentLayer() {
    var idShw = charIDToTypeID('Shw ');
    var desc1378 = new ActionDescriptor();
    var idnull = charIDToTypeID('null');
    var list340 = new ActionList();
    var ref365 = new ActionReference();
    var idLyr = charIDToTypeID('Lyr ');
    var idOrdn = charIDToTypeID('Ordn');
    var idTrgt = charIDToTypeID('Trgt');
    ref365.putEnumerated(idLyr, idOrdn, idTrgt);
    list340.putReference(ref365);
    desc1378.putList(idnull, list340);
    var idTglO = charIDToTypeID('TglO');
    desc1378.putBoolean(idTglO, true);
    executeAction(idShw, desc1378, DialogModes.NO);
}
