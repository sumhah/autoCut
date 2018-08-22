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

        this.collectLayers()
        this.layers.forEach(function (layer) {
            console.log(layer.layer.name);
        })
        this.groups.forEach(function (g) {
            console.log(g.layer.name);
            g.children.forEach(function (i) {
                console.log(i.layer.name);
            })
        })
    },

    reset: function () {
        this.layers = [];
        this.groups = [];
        this.taggedLayers = [];
        this.untaggedLayers = [];
        this.uniqueTaggedLayers = [];
    },

    exportCurrentPage: function () {
        this.reset();

        var collect = this.collectLayers();
        this.layers = collect.layers.concat(collect.groups);
        this.groups = collect.groups;

        var doc = app.activeDocument;

        doc.crop([
                UnitValue(0, 'px'),
                UnitValue(88, 'px'),
                UnitValue(doc.width, 'px'),
                UnitValue(doc.height, 'px'),
            ],
        );

        var arr = [];
        var name = doc.name.replace('.psd', '');
        var str = name + ': (\n';
        this.layers.forEach(function (item, i) {
            var curLayer = item.layer;
            var groupLayer;

            try {
                if (curLayer.typename === 'LayerSet') {
                    if (curLayer.name === '查看范例') {
                        makeLayerVisible(item);

                        if (curLayer.layers.length > 0) {
                            groupLayer = curLayer.merge();
                            arr.push(parseInt(groupLayer.bounds[1].asCSS()));
                            groupLayer.remove();
                        }
                    } else if (curLayer.name === '封面突出食物 主题明确 拷贝 2' || curLayer.name === '组 82' || curLayer.name === '热门攻略' || curLayer.name === '底标') {
                        groupLayer = curLayer.merge();
                        groupLayer.remove();
                    }
                }
            } catch (e) {
                console.log(e);
            }
        });
        arr.sort(function (num1, num2) {
            return num1 - num2;
        }).forEach(function (item, i) {
            str += (i + 1) + ': ' + item + ',\n';
        });
        str += '),\n';
        this.str += str;
        Controller.exportImage(name);
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
            this.collectOneLayer(i);
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
        this.taggedLayers.forEach(function (item) {
            if (uniqueLayers.every(function (uniqueItem) {
                return uniqueItem.layer.name !== item.layer.name;
            })) {
                uniqueLayers.push(item);
            }
        });
        return uniqueLayers;
    },

};