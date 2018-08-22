console.log(10);

try {
    var CSS = Class({
        id: 0,
        index: 0,

        left: 0,
        top: 0,
        width: 0,
        height: 0,

        opacity: 0,
        fillOpacity: 0,

        borderRadius: 0,
        borderColor: '#fff',
        borderStyle: 'solid',
        borderWidth: 0,
        backgroundColor: '#fff',

        color: '',
        fontSize: 10,
        contents: '',

        CSS: function (layer) {
            this.index = layer.itemIndex
            this.id = layer.id

            try {
                this.getText(layer)
                // this.getBounds(layer)
                // this.getOpacity(layer)
                // this.getBorder(layer)
                // this.getBackgroundColor()
                // this.getBorderRadius()
            } catch (e) {
                console.log(e);
            }
            console.log(this);
            // this.getShapeLayerCSS()
        },

        get: function (layer) {

        },

        getLayerIndex: function (layer) {
            var ref = new ActionReference();
            ref.putProperty(classProperty, keyItemIndex);
            ref.putIdentifier(classLayer, layer.id);
            return executeActionGet(ref).getVal('itemIndex');
        },

        getBounds: function (layer) {
            // maybe error with use boundsNoEffects
            const bounds = layer.boundsNoEffects
            this.left = bounds[0].value
            this.top = bounds[1].value
            this.width = bounds[2].value - this.left
            this.height = bounds[3].value - this.top
        },

        getShapeLayerCSS: function (layer) {
            var agmDesc = this.getLayerAttr('AGMStrokeStyleInfo');
            boundsInfo.borderWidth = 0;
            var opacity = this.getLayerAttr('opacity');

            if (agmDesc && agmDesc.getVal('strokeEnabled')) {
                // Assumes pixels!
                boundsInfo.borderWidth = makeUnitVal(agmDesc.getVal('strokeStyleLineWidth'));
                this.addStyleLine('border-width: $strokeStyleLineWidth$;', agmDesc);
                this.addStyleLine('border-color: $strokeStyleContent.color$;', agmDesc);
                var cap = agmDesc.getVal('strokeStyleLineCapType');
                var dashes = agmDesc.getVal('strokeStyleLineDashSet', false);

                if (dashes && dashes.length > 0) {
                    if ((cap == 'strokeStyleRoundCap') && (dashes[0] == 0))
                        this.addStyleLine('border-style: dotted;');
                    if ((cap == 'strokeStyleButtCap') && (dashes[0] > 0))
                        this.addStyleLine('border-style: dashed;');
                }
                else
                    this.addStyleLine('border-style: solid;');
            }
        },

        getOpacity: function (layer) {
            // var opacity = this.getLayerAttr('opacity');
            this.opacity = layer.opacity
            this.fillOpacity = layer.fillOpacity
        },

        getBorder: function () {
            var agmDesc = this.getLayerAttr('AGMStrokeStyleInfo');
            this.borderWidth = parseFloat(agmDesc.getVal('strokeStyleLineWidth'))
            this.borderColor = this.descColorToObj(agmDesc.getVal('strokeStyleContent.color'))
            var cap = agmDesc.getVal('strokeStyleLineCapType');
            var dashes = agmDesc.getVal('strokeStyleLineDashSet', false);
            console.log(cap, dashes);
        },

        getBackgroundColor: function () {
            this.backgroundColor = this.descColorToObj(this.getLayerAttr('adjustment.color'))
        },

        descColorToObj: function (desc) {
            return {
                red: desc.getVal('red'),
                green: desc.getVal('green'),
                blue: desc.getVal('blue'),
            }
        },

        getBorderRadius: function () {
            const radius = this.getLayerAttr('keyOriginType.keyOriginRRectRadii')
            this.borderRadius = {
                topRight: radius.getVal('topRight'),
                topLeft: radius.getVal('topLeft'),
                bottomRight: radius.getVal('bottomRight'),
                bottomLeft: radius.getVal('bottomLeft'),
            }
        },

        getText: function (layer) {
            const textItem = layer.textItem
            this.color = textItem.color
            this.fontSize = textItem.size.value
            this.contents = textItem.contents
        },

        getLayerAttr: function (keyString, layerDesc) {
            var keyList = keyString.split('.');

            if (typeof layerDesc === 'undefined' || layerDesc === null) {
                // Cache the IDs, because some (e.g., Text) take a while to get.
                var ref = new ActionReference();
                ref.putProperty(id('property'), id(keyList[0]));
                ref.putIndex(id('layer'), this.index);
                layerDesc = executeActionGet(ref);
            }

            return layerDesc.getVal(keyList);
        },
    })
} catch (e) {
    console.log(e);
}

console.log(12);