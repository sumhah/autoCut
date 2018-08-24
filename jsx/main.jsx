function start() {
    var doc = app.activeDocument;
    countTime('start', function () {
        try {
            Controller.start();
        } catch (e) {
            console.log(e);
        }
    })
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

var toggle = true;
var t = 0;
var i = 0

function trimCurrentDocument() {
    var idtrim = stringIDToTypeID( "trim" );
    var desc1318 = new ActionDescriptor();
    var idtrimBasedOn = stringIDToTypeID( "trimBasedOn" );
    var idTrns = charIDToTypeID( "Trns" );
    desc1318.putEnumerated( idtrimBasedOn, idtrimBasedOn, idTrns );
    var idTop = charIDToTypeID( "Top " );
    desc1318.putBoolean( idTop, true );
    var idBtom = charIDToTypeID( "Btom" );
    desc1318.putBoolean( idBtom, true );
    var idLeft = charIDToTypeID( "Left" );
    desc1318.putBoolean( idLeft, true );
    var idRght = charIDToTypeID( "Rght" );
    desc1318.putBoolean( idRght, true );
    executeAction( idtrim, desc1318, DialogModes.NO );
}

function onlyShowCurrentLayer() {
    var idShw = charIDToTypeID( "Shw " );
    var desc1378 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var list340 = new ActionList();
    var ref365 = new ActionReference();
    var idLyr = charIDToTypeID( "Lyr " );
    var idOrdn = charIDToTypeID( "Ordn" );
    var idTrgt = charIDToTypeID( "Trgt" );
    ref365.putEnumerated( idLyr, idOrdn, idTrgt );
    list340.putReference( ref365 );
    desc1378.putList( idnull, list340 );
    var idTglO = charIDToTypeID( "TglO" );
    desc1378.putBoolean( idTglO, true );
    executeAction( idShw, desc1378, DialogModes.NO );
}

function reverseOnlyShowCurretnLayer() {
    var idShw = charIDToTypeID( "Shw " );
    var desc1379 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var list341 = new ActionList();
    var ref366 = new ActionReference();
    var idLyr = charIDToTypeID( "Lyr " );
    var idOrdn = charIDToTypeID( "Ordn" );
    var idTrgt = charIDToTypeID( "Trgt" );
    ref366.putEnumerated( idLyr, idOrdn, idTrgt );
    list341.putReference( ref366 );
    desc1379.putList( idnull, list341 );
    var idTglO = charIDToTypeID( "TglO" );
    desc1379.putBoolean( idTglO, true );
    executeAction( idShw, desc1379, DialogModes.NO );
}

function mergeLayer() {
    i += 1
    // toggle = !toggle
    var fileOut = new File(sourcePath + 'just' + ++i + '.png');
    if (toggle) {
        countTime('exportDocument', function () {
            // exportPng24AM(fileOut)
            // quickExportAsPng()
            newDocFromLayer()
            trimCurrentDocument()
            var doc = app.activeDocument;
            doc.exportDocument(fileOut, ExportType.SAVEFORWEB, AUTO_CUT_EXPORT_OPTION);
            doc.close(SaveOptions.DONOTSAVECHANGES)
        }, 1)
        // temp.close(SaveOptions.DONOTSAVECHANGES);
    }
}


var descCache = {}
