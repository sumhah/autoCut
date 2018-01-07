function log(str) {
    $.writeln(str);
}

function isAdjustmentLayer(layer)
{
    switch (layer.kind) {

        case LayerKind.BRIGHTNESSCONTRAST:
        case LayerKind.CHANNELMIXER:
        case LayerKind.COLORBALANCE:
        case LayerKind.CURVES:
        case LayerKind.GRADIENTMAP:
        case LayerKind.HUESATURATION:
        case LayerKind.INVERSION:
        case LayerKind.LEVELS:
        case LayerKind.POSTERIZE:
        case LayerKind.SELECTIVECOLOR:
        case LayerKind.THRESHOLD:
            return true;

        default:
            return false;
    }

}

function collectLayersAM(progressBarWindow)
{
    var layers = [],
        visibleLayers = [],
        selectedLayers = [],
        groups = [];
    var layerCount = 0;

    var ref = null;
    var desc = null;

    var idOrdn = app.charIDToTypeID("Ordn");

    // Get layer count reported by the active Document object - it never includes the background.
    ref = new ActionReference();
    ref.putEnumerated(app.charIDToTypeID("Dcmn"), app.charIDToTypeID("Ordn"), app.charIDToTypeID("Trgt"));
    desc = app.executeActionGet(ref);
    layerCount = desc.getInteger(app.charIDToTypeID("NmbL"));

    if (layerCount == 0) {
        // This is a flattened image that contains only the background (which is always visible).
        var bg = app.activeDocument.backgroundLayer;
        var layer = {layer: bg, parent: null};
        layers.push(layer);
        visibleLayers.push(layer);
    }
    else {
        // There are more layers that may or may not contain a background. The background is always at 0;
        // other layers are indexed from 1.

        var idLyr = app.charIDToTypeID("Lyr ");
        var idLayerSection = app.stringIDToTypeID("layerSection");
        var idVsbl = app.charIDToTypeID("Vsbl");
        var idNull = app.charIDToTypeID("null");
        var idSlct = app.charIDToTypeID("slct");
        var idMkVs = app.charIDToTypeID("MkVs");

        var FEW_LAYERS = 10;

        // newer PS's freeze or crash on Mac OS X Yosemite
        //if (layerCount <= FEW_LAYERS) {
        // don't show the progress bar UI for only a few layers
        //progressBarWindow = null;
        //}

        if (progressBarWindow) {
            // The layer count is actually + 1 if there's a background present, but it should be no biggie.
            showProgressBar(progressBarWindow, "Collecting layers... Might take up to several seconds.", (layerCount + FEW_LAYERS) / FEW_LAYERS);
        }

        // Query current selection.
        ref = new ActionReference();
        ref.putEnumerated(idLyr, idOrdn, app.charIDToTypeID("Trgt"));
        var selectionDesc = app.executeActionGet(ref);
        var selectionIdx = selectionDesc.getInteger(app.charIDToTypeID("ItmI"));

        try {
            // Collect normal layers.
            var visibleInGroup = [true];
            var layerVisible;
            var currentGroup = null;
            var layerSection;
            var selected = 0;
            for (var i = layerCount; i >= 1; --i) {
                // check if it's an art layer (not a group) that can be selected
                ref = new ActionReference();
                ref.putIndex(idLyr, i);
                desc = app.executeActionGet(ref);
                layerVisible = desc.getBoolean(idVsbl);
                layerSection = app.typeIDToStringID(desc.getEnumerationValue(idLayerSection));
                if ((layerSection == "layerSectionContent")
                    || (layerSection == "layerSectionStart")) {
                    // select the layer and then retrieve it via Document.activeLayer
                    desc.clear();
                    desc.putReference(idNull, ref);
                    desc.putBoolean(idMkVs, false);
                    app.executeAction(idSlct, desc, DialogModes.NO);

                    var activeLayer = app.activeDocument.activeLayer;

                    if (layerSection == "layerSectionContent") {
                        if (! isAdjustmentLayer(activeLayer)) {
                            var layer = {layer: activeLayer, parent: currentGroup};
                            layers.push(layer);
                            if (layerVisible && visibleInGroup[visibleInGroup.length - 1]) {
                                visibleLayers.push(layer);
                            }
                            if (selected > 0) {
                                selectedLayers.push(layer);
                            }
                            if (currentGroup) {
                                currentGroup.children.push(layer);
                            }
                        }
                    }
                    else {
                        var group = {layer: activeLayer, parent: currentGroup, children: []};
                        group.visible = (layerVisible && visibleInGroup[visibleInGroup.length - 1]);
                        if (group.parent == null) {
                            groups.push(group);
                        }
                        else {
                            group.parent.children.push(group);
                        }
                        currentGroup = group;
                        visibleInGroup.push(group.visible);
                        // Only check for selected groups. In CS2, 1 and only 1 layer/group is always selected (active).
                        // It is useless to export just 1 art layer, so only layer groups (sets) are supported.
                        if ((selectionIdx == i) || (selected > 0)) {
                            selected++;
                            group.selected = true;
                        }
                    }
                }
                else if (layerSection == "layerSectionEnd") {
                    currentGroup = currentGroup.parent;
                    visibleInGroup.pop();
                    if (selected > 0) {
                        selected--;
                    }
                }

                if (progressBarWindow && ((i % FEW_LAYERS == 0) || (i == layerCount))) {
                    updateProgressBar(progressBarWindow);
                    repaintProgressBar(progressBarWindow);
                    if (userCancelled) {
                        throw new Error("cancel");
                    }
                }
            }

            // Collect the background.
            ref = new ActionReference();
            ref.putIndex(idLyr, 0);
            try {
                desc = app.executeActionGet(ref);
                var bg = app.activeDocument.backgroundLayer;
                var layer = {layer: bg, parent: null};
                layers.push(layer);
                if (bg.visible) {
                    visibleLayers.push(layer);
                }

                if (progressBarWindow) {
                    updateProgressBar(progressBarWindow);
                    repaintProgressBar(progressBarWindow);
                }
            }
            catch (e) {
                // no background, move on
            }
        }
        catch (e) {
            if (e.message != "cancel") throw e;
        }

        // restore selection (unfortunately CS2 doesn't support multiselection, so only the topmost layer is re-selected)
        /*desc.clear();
         ref = new ActionReference();
         var totalLayerCount = selectionDesc.getInteger(app.charIDToTypeID("Cnt "));
         ref.putIndex(idLyr, selectionDesc.getInteger(app.charIDToTypeID("ItmI")) - (totalLayerCount - layerCount));
         desc.putReference(idNull, ref);
         desc.putBoolean(idMkVs, false);
         app.executeAction(idSlct, desc, DialogModes.NO);*/

        if (progressBarWindow) {
            progressBarWindow.hide();
        }
    }

    return {layers: layers, visibleLayers: visibleLayers, selectedLayers: selectedLayers, groups: groups};
}

function getLayerCss(layer) {
    return cssToClip.gatherLayerCSS(layer);
}

function parseLayerSet(totalArr, layerSet) {
    var artLayers = layerSet.artLayers;
    var layerSets = layerSet.layerSets;

    totalArr.push(layerSet);
    pushArr(totalArr, artLayers);
    pushArr(totalArr, layerSets);
    each(layerSets, function (item) {
        parseLayerSet(totalArr, item);
    });
}

function getAllLayer() {
    var doc = app.activeDocument;
    var arr = [];

    pushArr(arr, doc.artLayers);

    // 根组
    each(doc.layerSets, function (item) {
        parseLayerSet(arr, item);
    });

    return arr;
}

function exportRootDocument() {
    var doc = app.activeDocument;

    var exportOptions = new ExportOptionsSaveForWeb();
    exportOptions.PNG8 = false;
    exportOptions.format = SaveDocumentType.PNG;
    exportOptions.transparency = true;
    exportOptions.interlaced = false;
    exportOptions.quality = 100;
    var filePath = doc.path + '/source/' + 'bg' + '.png';
    var fileOut = new File(filePath);
    var temp;

    temp = app.activeDocument;
    temp.exportDocument(fileOut, ExportType.SAVEFORWEB, exportOptions);
}

function main() {
    // item.layer  item.parent
    var collectLayersAMInfo = collectLayersAM();
    var allLayers = [];
    each(collectLayersAMInfo.layers, function (item) {
        allLayers.push(item.layer);
    });
    each(collectLayersAMInfo.groups, function (item) {
        allLayers.push(item.layer);
    });
    var doc = app.activeDocument;
    var folder = new Folder(doc.path + '/source');
    if (!folder.exists) {
        folder.create();
    }

    var selectedLayers = filter(allLayers, function (item, i) {
        return /[\w\W]+\$$/.test(item.name);
    }).sort(function (item1, item2) {
        var b1 = item1.bounds;
        var b2 = item2.bounds;
        var w1 = b1[2] - b1[0];
        var w2 = b2[2] - b2[0];
        var h1 = b1[3] - b1[1];
        var h2 = b2[3] - b2[1];
        return w1 * h1 - w2 * h2;
    });

    var uniqueLayers = [];
    each(selectedLayers, function (item) {
        var have = false;
        each(uniqueLayers, function (unique) {
            if (!have && unique.name === item.name) {
                have = true;
            }
        });
        if (!have) {
            uniqueLayers.push(item);
        }
    });

    var cssText = '.root {\n    left: 0px;\n    top: 0px;\n    width: ' + parseFloat(app.activeDocument.width) + 'px;\n    height: ' + parseFloat(app.activeDocument.height) + 'px;\n}\n\n';

    try {
        each(uniqueLayers, function (item) {
            if (item.typename === 'LayerSet') {
                item = item.merge();
            }
            cssText += getLayerCss(item) + '\n';
            item.visible = false;
        });
    }
    catch (e) {
        alert(e.message);
    }

    // 尝试修复图层有时候未隐藏的bug
    var myLayerSets = filter(doc.artLayers, function (item) {
        return /[\w\W]+\$$/.test(item.name);
    });
    each(myLayerSets, function (item) {
        item.visible = false;
    });

    exportRootDocument();

    var cssFilePath = folder + '/css.css';
    var write_file = File(cssFilePath);

    if (!write_file.exists) {
        write_file = new File(cssFilePath);
    }

    var out;
    if (write_file !== '') {
        //Open the file for writing.
        out = write_file.open('w', undefined, undefined);
        write_file.encoding = 'UTF-8';
        write_file.lineFeed = 'Macintosh';
    }
    if (out) {
        write_file.write(cssText);
        write_file.close();
    }
}

function start() {
    var doc = app.activeDocument;
    doc.suspendHistory('please wait...', 'main()');

    // 回到之前状态
    // doc.activeHistoryState = doc.historyStates[doc.historyStates.length - 1];
    alert('Done!');
    return '';
}




