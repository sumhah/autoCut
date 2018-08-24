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
            var DOCUMENT_INDEX_OFFSET = 0;
            try {
                // This throws an error if there's no background
                if (app.activeDocument.backgroundLayer) {
                    DOCUMENT_INDEX_OFFSET = 1;
                }
            } catch (err) {
            }
            this.index = layer.itemIndex - DOCUMENT_INDEX_OFFSET;
            this.kind = this.getLayerAttr('layerKind');
            this.id = layer.id;
            this.showLayer();
            this.getStyle(layer);
            this.hideLayer();
            console.log(this);
        },

        getStyle: function (layer) {
            try {
                switch (this.kind) {
                    case KIND_PixelSheet:
                        console.log('PixelSheet 将其导出');
                        this.exportLayer(layer);
                        break;
                    case KIND_TextSheet:
                        console.log('KIND_TextSheet 获取文字属性');
                        this.getText(layer);
                        break;
                    case KIND_VectorSheet:
                        console.log('KIND_VectorSheet 获取形状属性');
                        this.getBorder(layer);
                        this.getBackgroundColor();
                        this.getBorderRadius();
                        break;
                    case KIND_LayerGroupSheet:
                        // children > 0  &&  visible = true
                        console.log('KIND_LayerGroupSheet 合并， 导出');
                        try {
                            executeAction(charIDToTypeID('Mrg2'), undefined, DialogModes.NO);
                            layer = app.activeDocument.activeLayer;
                            this.index = layer.itemIndex;
                            this.id = layer.id;
                            this.exportLayer(layer);
                        } catch (e) {
                            console.error(e.message, e);
                        }
                        break;
                    case KIND_SmartObjectSheet:
                    default:
                        console.log('KIND_SmartObjectSheet，栅格化 导出');
                        this.rasterizeLayer();
                        layer = app.activeDocument.activeLayer;
                        this.exportLayer(layer);
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
            this.exec('hide');
        },

        showLayer: function () {
            this.exec('show');
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
                var self = this;
                countTime('export image: ', function () {
                    var fileOut = new File(sourcePath + self.name + '.png');
                    var bounds = layer.bounds;
                    var w = bounds[2] - bounds[0];
                    var h = bounds[3] - bounds[1];

                    countTime('newDocFromLayer', function () {
                        newDocFromLayer();
                    })
                    countTime('trimCurrentDocument', function () {
                        trimCurrentDocument();
                    });
                    countTime('exportDocument', function () {
                        var doc = app.activeDocument;
                        doc.exportDocument(fileOut, ExportType.SAVEFORWEB, AUTO_CUT_EXPORT_OPTION);
                        doc.close(SaveOptions.DONOTSAVECHANGES);
                    });
                });
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
                var textKey = this.getLayerAttr('textKey');
                var textStyle = this.getLayerAttr('textKey.textStyleRange.textStyle');
                var paragraphStyle = this.getLayerAttr('textKey.paragraphStyleRange.paragraphStyle');
                this.color = this.descColorToObj(textStyle.getVal('color'));
                this.fontSize = parseFloat(textStyle.getVal('impliedFontSize'));
                this.lineHeight = parseFloat(textStyle.getVal('impliedLeading'));
                this.letterSpacing = parseFloat(textStyle.getVal('tracking'));
                this.textAlign = paragraphStyle.getVal('align');
                this.contents = textKey.getVal('textKey');
                this.fontWeight = textStyle.getVal('fontStyleName');
                this.fontName = textStyle.getVal('fontName');
                this.fontPostScriptName = textStyle.getVal('fontPostScriptName');
                this.textIndent = paragraphStyle.getVal('firstLineIndent');
            } catch (e) {
                console.error(e.message, e);
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
    console.error(e);
}