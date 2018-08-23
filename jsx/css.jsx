try {
    const KIND_AnySheet = 0;
    const KIND_PixelSheet = 1;
    const KIND_AdjustmentSheet = 2;
    const KIND_TextSheet = 3;
    const KIND_VectorSheet = 4;
    const KIND_SmartObjectSheet = 5;
    const KIND_VideoSheet = 6;
    const KIND_LayerGroupSheet = 7;
    const KIND_3DSheet = 8;
    const KIND_GradientSheet = 9;
    const KIND_PatternSheet = 10;
    const KIND_SolidColorSheet = 11;
    const KIND_BackgroundSheet = 12;
    const KIND_HiddenSectionBounder = 13;
    var DOCUMENT_INDEX_OFFSET = 0;
    try {
        // This throws an error if there's no background
        if (app.activeDocument.backgroundLayer) {
            DOCUMENT_INDEX_OFFSET = 1;
        }
    }
    catch (err) {}

    var CSS = Class({
        name: 'unknown',
        id: 0,
        index: 0,
        kind: 1,

        left: 0,
        top: 0,
        width: 0,
        height: 0,

        opacity: 0,
        fillOpacity: 0,

        borderRadius: null,

        borderColor: null,
        borderStyle: 'solid',
        borderWidth: null,

        backgroundColor: null,

        color: null,
        fontSize: null,
        lineHeight: null,
        letterSpacing: null,
        textAlign: null,
        contents: null,
        fontWeight: null,
        fontName: null,
        fontPostScriptName: null,
        textIndent: null,

        CSS: function (layer) {
            this.name = layer.name;
            this.index = layer.itemIndex - DOCUMENT_INDEX_OFFSET;
            console.log('item.index: ', layer.itemIndex);
            this.kind = this.getLayerAttr('layerKind');
            this.id = layer.id;
            this.showLayer()
            this.getStyle(layer);
            this.hideLayer()
            console.log(this);
        },

        getStyle: function (layer) {
            try {
                switch (this.kind) {
                    case KIND_PixelSheet:
                        this.exportLayer(layer);
                        break;
                    case KIND_TextSheet:
                        this.getText(layer);
                        break;
                    case KIND_VectorSheet:
                        this.getBorder(layer);
                        this.getBackgroundColor();
                        this.getBorderRadius();
                        break;
                    case KIND_LayerGroupSheet:
                        // children > 0  &&  visible = true
                        try {
                            layer = layer.merge();
                            this.index = layer.itemIndex;
                            this.id = layer.id;
                            this.exportLayer(layer);
                        } catch (e) {
                            console.error(e.message, e);
                        }
                        break;
                    case KIND_SmartObjectSheet:
                    default:
                        this.rasterizeLayer();
                        layer = app.activeDocument.activeLayer
                        this.exportLayer(layer)
                        break;
                }
                this.getBounds(layer);
                this.getOpacity(layer);
            } catch (e) {
                console.error(e.message, e);
            }
        },

        getBounds: function (layer) {
            // maybe error with use boundsNoEffects
            const bounds = layer.boundsNoEffects;
            this.left = bounds[0].value;
            this.top = bounds[1].value;
            this.width = bounds[2].value - this.left;
            this.height = bounds[3].value - this.top;
        },

        rasterizeLayer: function () {
            var desc = new ActionDescriptor();
            var ref = new ActionReference();
            ref.putEnumerated(id('layer'), id('ordinal'), id('targetEnum'));
            desc.putReference(id('null'), ref);
            executeAction(id('rasterizeLayer'), desc, DialogModes.NO);
        },

        hideLayer: function () {
            this.exec('hide')
        },

        showLayer: function () {
            this.exec('show')
        },

        exec: function (action) {
            var desc = new ActionDescriptor();
            var list = new ActionList();
            var ref = new ActionReference();
            ref.putEnumerated(id('layer'), id('ordinal'), id('targetEnum'));
            list.putReference(ref);
            desc.putList(id('null'), list);
            executeAction(id(action), desc, DialogModes.NO);
        },

        exportLayer: function (layer) {
            try {
                var fileOut = new File(sourcePath + this.name + '.png');
                var bounds = layer.bounds;
                var w = bounds[2] - bounds[0];
                var h = bounds[3] - bounds[1];
                layer.copy();
                app.documents.add(w, h, 72, 'temp', NewDocumentMode.RGB, DocumentFill.TRANSPARENT, 1);
                var temp = app.activeDocument;
                temp.paste();
                temp.exportDocument(fileOut, ExportType.SAVEFORWEB, AUTO_CUT_EXPORT_OPTION);
                temp.close(SaveOptions.DONOTSAVECHANGES);
            } catch (e) {
                console.error(e.message, e);
            }
        },

        getOpacity: function (layer) {
            // var opacity = this.getLayerAttr('opacity');
            this.opacity = layer.opacity;
            this.fillOpacity = layer.fillOpacity;
        },

        getBorder: function () {
            var agmDesc = this.getLayerAttr('AGMStrokeStyleInfo');
            if (!agmDesc) {
                return;
            }
            this.borderWidth = parseFloat(agmDesc.getVal('strokeStyleLineWidth'));
            this.borderColor = this.descColorToObj(agmDesc.getVal('strokeStyleContent.color'));
        },

        getBackgroundColor: function () {
            this.backgroundColor = this.descColorToObj(this.getLayerAttr('adjustment.color'));
        },

        descColorToObj: function (desc) {
            return {
                red: desc.getVal('red'),
                green: desc.getVal('green'),
                blue: desc.getVal('blue'),
            };
        },

        getBorderRadius: function () {
            const radius = this.getLayerAttr('keyOriginType.keyOriginRRectRadii');
            if (!radius) {
                return;
            }
            this.borderRadius = {
                topRight: radius.getVal('topRight'),
                topLeft: radius.getVal('topLeft'),
                bottomRight: radius.getVal('bottomRight'),
                bottomLeft: radius.getVal('bottomLeft'),
            };
        },

        getText: function (layer) {
            try {
                console.log(1);
                var textKey = this.getLayerAttr('textKey');
                console.log(2);
                var textStyle = this.getLayerAttr('textKey.textStyleRange.textStyle');
                console.log(3);
                var paragraphStyle = this.getLayerAttr('textKey.paragraphStyleRange.paragraphStyle');
                console.log(4);
                this.color = this.descColorToObj(textStyle.getVal('color'));
                console.log(5);
                this.fontSize = parseFloat(textStyle.getVal('impliedFontSize'));
                console.log(6);
                this.lineHeight = parseFloat(textStyle.getVal('impliedLeading'));
                console.log(7);
                this.letterSpacing = parseFloat(textStyle.getVal('tracking'));
                console.log(8);
                this.textAlign = paragraphStyle.getVal('align');
                console.log(9);
                this.contents = textKey.getVal('textKey');
                console.log(10);
                this.fontWeight = textStyle.getVal('fontStyleName');
                console.log(11);
                this.fontName = textStyle.getVal('fontName');
                console.log(12);
                this.fontPostScriptName = textStyle.getVal('fontPostScriptName');
                console.log(13);
                this.textIndent = paragraphStyle.getVal('firstLineIndent');
                console.log(14);
            } catch (e) {
                console.log(e.message, e);
            }
        },

        getLayerAttr: function (keyString, layerDesc) {
            var keyList = keyString.split('.');
            var firstKey = keyList[0];

            if (!layerDesc) {
                var ref = new ActionReference();
                ref.putProperty(id('property'), id(firstKey));
                ref.putIndex(id('layer'), this.index);
                layerDesc = executeActionGet(ref);
            }

            return layerDesc.getVal(keyList);
        },
    });
} catch (e) {
    console.log(e);
}