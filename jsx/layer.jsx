var Layer = {
    ref: null,
    desc: null,
    layerCount: 0,
    selectionIndex: 0,
    currentGroup: null,
    selected: 0,
    visibleInGroup: [true],
    
    
    layers: [],
    visibleLayers: [],
    selectedLayers: [],
    groups: [],
    allLayers: [],
    taggedLayers: [],
    untaggedLayers: [],
    uniqueTaggedLayers: [],
    str: '',

    init: function () {
        this.reset();
        // this.collectLayers()
        // this.allLayers = this.layers.concat(this.groups);


        var matches;
        time('collectNamesAM', function () {
            matches = collectNamesAM(/[\w-_]+@[\w-_]*/);
        })
        var doc = app.activeDocument;
        console.log(matches);
        this.taggedLayers = matches.map(function (item, i, array) {
            processWindow.update(i + 1, array.length, 'filter out labeled layers')

            time('makeActiveByIndex' + '  ' + i, function () {
                makeActiveByIndex(item, false);
            })
            return {
                layer: doc.activeLayer,
            };
        })

        // this.taggedLayers = this.allLayers.filter(function (item, i, array) {
        //     processWindow.update(i, array.length - 1, 'filter out labeled layers')
        //     return /[\w-_]+@[\w-_]*/.test(item.layer.name)
        // })

        this.uniqueTaggedLayers = this.getUniqueLayer().sort(function (item1, item2) {
            return item1.area - item2.area;
        })
        console.log('layers count: ', this.uniqueTaggedLayers.length);
    },

    reset: function () {
        this.layers = [];
        this.groups = [];
        this.visibleLayers = [];
        this.selectedLayers = [];
        this.groups = [];
        this.allLayers = [];
        this.taggedLayers = [];
        this.untaggedLayers = [];
        this.uniqueTaggedLayers = [];
    },

    collectLayers: function () {
        this.ref = new ActionReference();
        this.ref.putEnumerated(id('document'), id('ordinal'), id('targetEnum'));
        this.desc = app.executeActionGet(this.ref);
        this.layerCount = this.desc.getInteger(id('numberOfLayers'));

        if (this.layerCount === 0) {
            // This is a flattened image that contains only the background (which is always visible).
            this.collectWhenLayerCountIsZero();
        } else {
            // There are more layers that may or may not contain a background. The background is always at 0;
            // other layers are indexed from 1.
            this.collectWhenLayerCountIsNotZero();
        }
    },

    isAdjustmentLayer: function (layer) {
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
    },

    collectWhenLayerCountIsZero: function () {
        var layer = {
            layer: app.activeDocument.backgroundLayer,
            parent: null
        };
        this.layers.push(layer);
        this.visibleLayers.push(layer);
    },

    collectWhenLayerCountIsNotZero: function () {
        // Query current selection.
        this.ref = new ActionReference();
        this.ref.putEnumerated(id('layer'), id('ordinal'), id('targetEnum'));
        this.selectionIndex = app.executeActionGet(this.ref).getInteger(id('itemIndex'));
        this.collectNormalLayers();
        this.collectBackgroundLayer();
    },

    collectNormalLayers: function () {
        for (var i = this.layerCount; i >= 1; --i) {
            // check if it's an art layer (not a group) that can be this.selected
            if (processWindow.userCancelled) {
                return;
            }


            // this.ref = new ActionReference();
            // this.ref.putIndex(id('layer'), i);
            // this.desc = app.executeActionGet(this.ref);



            // this.collectOneLayer(i);
            processWindow.update(this.layerCount - i + 1, this.layerCount, 'traverse layer');
        }
    },

    collectOneLayer: function (i) {
        // equal layers[i].visible    .section
        this.ref = new ActionReference();
        this.ref.putIndex(id('layer'), i);
        this.desc = app.executeActionGet(this.ref);
        var layerVisible = this.desc.getBoolean(id('visible'));
        var layerSection = app.typeIDToStringID(this.desc.getEnumerationValue(id('layerSection')));
        if (layerSection === 'layerSectionContent' || layerSection === 'layerSectionStart') {
            // select the layer and then retrieve it via Document.activeLayer
            this.desc.clear();
            this.desc.putReference(id('null'), this.ref);
            this.desc.putBoolean(id('makeVisible'), false);
            app.executeAction(id('select'), this.desc, DialogModes.NO);

            var activeLayer = app.activeDocument.activeLayer;

            if (layerSection == 'layerSectionContent') {
                if (!this.isAdjustmentLayer(activeLayer)) {
                    var layer = {
                        layer: activeLayer,
                        parent: this.currentGroup
                    };
                    this.layers.push(layer);
                    if (layerVisible && this.visibleInGroup[this.visibleInGroup.length - 1]) {
                        this.visibleLayers.push(layer);
                    }
                    if (this.selected > 0) {
                        this.selectedLayers.push(layer);
                    }
                    if (this.currentGroup) {
                        this.currentGroup.children.push(layer);
                    }
                }
            } else {
                var group = {
                    layer: activeLayer,
                    parent: this.currentGroup,
                    children: []
                };
                group.visible = layerVisible && this.visibleInGroup[this.visibleInGroup.length - 1];
                this.groups.push(group);
                if (group.parent) {
                    group.parent.children.push(group);
                }
                this.currentGroup = group;
                this.visibleInGroup.push(group.visible);
                // Only check for this.selected groups. In CS2, 1 and only 1 layer/group is always this.selected (active).
                // It is useless to export just 1 art layer, so only layer groups (sets) are supported.
                if (this.selectionIndex === i || this.selected > 0) {
                    this.selected;
                    group.selected = true;
                }
            }
        } else if (layerSection == 'layerSectionEnd') {
            this.currentGroup = this.currentGroup.parent;
            this.visibleInGroup.pop();
            if (this.selected > 0) {
                this.selected -= 1;
            }
        }
    },

    collectBackgroundLayer: function () {
        this.ref = new ActionReference();
        this.ref.putIndex(id('layer'), 0);
        try {
            this.desc = app.executeActionGet(this.ref);
            var bg = app.activeDocument.backgroundLayer;
            var layer = {layer: bg, parent: null};
            this.layers.push(layer);
            if (bg.visible) {
                this.visibleLayers.push(layer);
            }
        } catch (e) {
            // no background, move on
        }
    },

    getLayerCss: function (layer) {
        return cssToClip.gatherLayerCSS(layer);
    },

    hideAllLayer: function () {
        this.layers.forEach(function (item) {
            item.layer.visible = false;
        });
    },

    getUniqueLayer: function () {
        var uniqueLayers = [];
        var self = this;
        time('uniqueLayers', function () {
            self.taggedLayers.forEach(function (item) {
                if (uniqueLayers.every(function (uniqueItem) {
                    return uniqueItem.layer.name !== item.layer.name;
                })) {
                    var bounds = item.layer.bounds;
                    var width = bounds[2].value - bounds[0].value;
                    var height = bounds[3].value - bounds[1].value;
                    item.area = width * height;
                    uniqueLayers.push(item);
                }
            });
        })
        return uniqueLayers;
    },

};