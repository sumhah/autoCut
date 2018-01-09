var Layer = {
    layers: [],
    groups: [],
    taggedLayers: [],
    untaggedLayers: [],
    uniqueTaggedLayers: [],

    init: function () {
        this.reset();

        var collect = this.collectLayers();
        this.layers = collect.layers.concat(collect.groups);
        this.groups = collect.groups;

        this.layers.each(function (item) {
            if (/[\w\W]+\$$/.test(item.layer.name)) {
                Layer.taggedLayers.push(item);
            } else {
                Layer.untaggedLayers.push(item);
            }
        });

        this.taggedLayers.sort(function (item1, item2) {
            var b1 = item1.layer.bounds;
            var b2 = item2.layer.bounds;
            var w1 = b1[2] - b1[0];
            var w2 = b2[2] - b2[0];
            var h1 = b1[3] - b1[1];
            var h2 = b2[3] - b2[1];
            return w1 * h1 - w2 * h2;
        });
        this.uniqueTaggedLayers = this.getUniqueLayer();

        this.hideAllLayer();
    },

    reset: function () {
        this.layers = [];
        this.groups = [];
        this.taggedLayers = [];
        this.untaggedLayers = [];
        this.uniqueTaggedLayers = [];
    },

    collectLayers: function (progressBarWindow) {

        function isAdjustmentLayer(layer) {
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

        var layers = [],
            visibleLayers = [],
            selectedLayers = [],
            groups = [];
        var layerCount = 0;

        var ref = null;
        var desc = null;

        var idOrdn = app.charIDToTypeID('Ordn');

        // Get layer count reported by the active Document object - it never includes the background.
        ref = new ActionReference();
        ref.putEnumerated(app.charIDToTypeID('Dcmn'), app.charIDToTypeID('Ordn'), app.charIDToTypeID('Trgt'));
        desc = app.executeActionGet(ref);
        layerCount = desc.getInteger(app.charIDToTypeID('NmbL'));

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

            var idLyr = app.charIDToTypeID('Lyr ');
            var idLayerSection = app.stringIDToTypeID('layerSection');
            var idVsbl = app.charIDToTypeID('Vsbl');
            var idNull = app.charIDToTypeID('null');
            var idSlct = app.charIDToTypeID('slct');
            var idMkVs = app.charIDToTypeID('MkVs');

            var FEW_LAYERS = 10;

            // newer PS's freeze or crash on Mac OS X Yosemite
            //if (layerCount <= FEW_LAYERS) {
            // don't show the progress bar UI for only a few layers
            //progressBarWindow = null;
            //}

            if (progressBarWindow) {
                // The layer count is actually + 1 if there's a background present, but it should be no biggie.
                showProgressBar(progressBarWindow, 'Collecting layers... Might take up to several seconds.', (layerCount + FEW_LAYERS) / FEW_LAYERS);
            }

            // Query current selection.
            ref = new ActionReference();
            ref.putEnumerated(idLyr, idOrdn, app.charIDToTypeID('Trgt'));
            var selectionDesc = app.executeActionGet(ref);
            var selectionIdx = selectionDesc.getInteger(app.charIDToTypeID('ItmI'));

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
                    if ((layerSection == 'layerSectionContent')
                        || (layerSection == 'layerSectionStart')) {
                        // select the layer and then retrieve it via Document.activeLayer
                        desc.clear();
                        desc.putReference(idNull, ref);
                        desc.putBoolean(idMkVs, false);
                        app.executeAction(idSlct, desc, DialogModes.NO);

                        var activeLayer = app.activeDocument.activeLayer;

                        if (layerSection == 'layerSectionContent') {
                            if (!isAdjustmentLayer(activeLayer)) {
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
                    else if (layerSection == 'layerSectionEnd') {
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
                            throw new Error('cancel');
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
                if (e.message != 'cancel') throw e;
            }

            if (progressBarWindow) {
                progressBarWindow.hide();
            }
        }

        return {layers: layers, visibleLayers: visibleLayers, selectedLayers: selectedLayers, groups: groups};
    },

    getLayerCss: function (layer) {
        return cssToClip.gatherLayerCSS(layer);
    },

    hideAllLayer: function () {
        this.layers.each(function (item) {
            item.layer.visible = false;
        });
    },

    getUniqueLayer: function () {
        var uniqueLayers = [];
        this.taggedLayers.each(function (item) {
            if (uniqueLayers.every(function (uniqueItem) {
                    return uniqueItem.layer.name !== item.layer.name;
                })) {
                uniqueLayers.push(item);
            }
        });
        return uniqueLayers;
    },

};