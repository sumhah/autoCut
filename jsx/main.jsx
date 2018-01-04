function log(str) {
    $.writeln(str);
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

function start() {
    var allLayers = getAllLayer();
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

    var cssText = '.root {\n    left: 0px;\n    top: 0px;\n    width: '  + parseFloat(app.activeDocument.width)  + 'px;\n    height: '  +  parseFloat(app.activeDocument.height)  + 'px;\n}\n\n';

    var myLayerSets = [];
    try {
        each(uniqueLayers, function (item) {
            if (item.typename === 'LayerSet') {
                item = item.merge();
                myLayerSets.push(item);
            }
            cssText += getLayerCss(item) + '\n';
            item.visible = false;
        });
    }
    catch (e) {
        alert(e.message);
    }

    // 尝试修复图层有时候未隐藏的bug
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

    // todo 回到之前状态

    alert('Done!');

    return cssText;
}




