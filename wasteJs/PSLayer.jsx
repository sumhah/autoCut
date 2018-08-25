/**
 * Created by sumhah on 18/1/15.
 */


//////////////////////////////////// PSLayer //////////////////////////////////////

// The overhead for using Photoshop DOM layers is high, and can be
// really high if you need to switch the active layer.  This class provides
// a cache and accessor functions for layers bypassing the DOM.

function PSLayerInfo(layerIndex, isBG) {
    this.index = layerIndex;
    this.boundsCache = null;
    this.descCache = {};

    if (isBG) {
        this.layerID = 'BG';
        this.layerKind = kBackgroundSheet;
    }
    else {
        // See TLayerElement::Make() to learn how layers are located by PS events.
        var ref = new ActionReference();
        ref.putProperty(classProperty, keyLayerID);
        ref.putIndex(classLayer, layerIndex);
        this.layerID = executeActionGet(ref).getVal('layerID');
        this.layerKind = this.getLayerAttr('layerKind');
        this.visible = this.getLayerAttr('visible');
    }
}

PSLayerInfo.layerIDToIndex = function (layerID) {
    var ref = new ActionReference();
    ref.putProperty(classProperty, keyItemIndex);
    ref.putIdentifier(classLayer, layerID);
    return executeActionGet(ref).getVal('itemIndex');
};

PSLayerInfo.prototype.makeLayerActive = function () {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putIdentifier(classLayer, this.layerID);
    desc.putReference(typeNULL, ref);
    executeAction(eventSelect, desc, DialogModes.NO);
};

PSLayerInfo.prototype.getLayerAttr = function (keyString, layerDesc) {
    var layerDesc;
    var keyList = keyString.split('.');

    if (typeof(layerDesc) == 'undefined' || layerDesc == null) {
        // Cache the IDs, because some (e.g., Text) take a while to get.
        if (typeof this.descCache[keyList[0]] == 'undefined') {
            var ref = new ActionReference();
            ref.putProperty(classProperty, makeID(keyList[0]));
            ref.putIndex(classLayer, this.index);
            layerDesc = executeActionGet(ref);
            this.descCache[keyList[0]] = layerDesc;
        } else
            layerDesc = this.descCache[keyList[0]];
    }

    return layerDesc.getVal(keyList);
};

PSLayerInfo.prototype.getBounds = function (ignoreEffects) {
    var boundsDesc;
    if (typeof ignoreEffects == 'undefined')
        ignoreEffects = false;
    if (ignoreEffects)
        boundsDesc = this.getLayerAttr('boundsNoEffects');
    else {
        if (this.boundsCache)
            return this.boundsCache;
        boundsDesc = this.getLayerAttr('bounds');
    }

    if (this.getLayerAttr('artboardEnabled'))
        boundsDesc = this.getLayerAttr('artboard.artboardRect');

    var bounds = boundsDesc.extractBounds();

    if (!ignoreEffects)
        this.boundsCache = bounds;

    return bounds;
};

// Get a list of descriptors.  Returns NULL if one of them is unavailable.
PSLayerInfo.prototype.getLayerAttrList = function (keyString) {
    var i, keyList = keyString.split('.');
    var descList = [];
    // First item from the layer
    var desc = this.getLayerAttr(keyList[0]);
    if (!desc)
        return null;
    descList.push(desc);
    if (keyList.length == 1)
        return descList;

    for (i = 1; i < keyList.length; ++i) {
        desc = descList[i - 1].getVal(keyList[i]);
        if (desc == null) return null;
        descList.push(desc);
    }
    return descList;
};

PSLayerInfo.prototype.descToColorList = function (colorDesc, colorPath) {
    function roundColor(x) {
        x = Math.round(x);
        return (x > 255) ? 255 : x;
    }

    var i, rgb = ["'Rd  '", "'Grn '","'Bl  '"];	// Note double quotes around single quotes
    var rgbTxt = [];
    // See if the color is really there
    colorDesc = this.getLayerAttr(colorPath, colorDesc);
    if (!colorDesc)
        return null;

    for (i in rgb) {
        if (rgb.hasOwnProperty(i)) {
            rgbTxt.push(roundColor(colorDesc.getVal(rgb[i])));
        }
    }
    return rgbTxt;
};

// If the desc has a 'Clr ' object, create CSS "rgb( rrr, ggg, bbb )" output from it.
PSLayerInfo.prototype.descToCSSColor = function (colorDesc, colorPath) {
    var rgbTxt = this.descToColorList(colorDesc, colorPath);
    if (!rgbTxt)
        return null;
    return rgbToHex(rgbTxt[0], rgbTxt[1], rgbTxt[2]);
};

PSLayerInfo.prototype.descToRGBAColor = function (colorPath, opacity, colorDesc) {
    var rgbTxt = this.descToColorList(colorDesc, colorPath);
    rgbTxt = rgbTxt ? rgbTxt : ['0', '0', '0'];

    if (!((opacity > 0.0) && (opacity < 1.0)))
        opacity = opacity / 255.0;

    if (opacity == 1.0)
        return 'rgb(' + rgbToHex(rgbTxt[0], rgbTxt[1], rgbTxt[2]) + ')';
    else
        return 'rgba(' + rgbTxt.join(', ') + ', ' + round1k(opacity) + ')';
};

function DropShadowInfo(xoff, yoff, dsDesc) {
    this.xoff = xoff;
    this.yoff = yoff;
    this.dsDesc = dsDesc;
}

PSLayerInfo.getEffectOffset = function (fxDesc) {
    var xoff, yoff, angle;

    // Assumes degrees, PS users aren't into radians.
    if (fxDesc.getVal('useGlobalAngle'))
        angle = stripUnits(cssToClip.getAppAttr('globalAngle.globalLightingAngle')) * (Math.PI / 180.0);
    else
        angle = stripUnits(fxDesc.getVal('localLightingAngle')) * (Math.PI / 180.0);
    // Photoshop describes the drop shadow in polar coordinates, while CSS uses cartesian coords.
    var distance = fxDesc.getVal('distance');
    var distUnits = distance.replace(/[\d.]+/g, '');
    distance = stripUnits(distance);
    return [round1k(-Math.cos(angle) * distance) + distUnits,
        round1k(Math.sin(angle) * distance) + distUnits];
};

// New lfx: dropShadowMulti, frameFXMulti, gradientFillMulti, innerShadowMulti, solidFillMulti,
PSLayerInfo.prototype.getDropShadowInfo = function (shadowType, boundsInfo, psEffect) {
    psEffect = (typeof psEffect == 'undefined') ? 'dropShadow' : psEffect;
    var lfxDesc = this.getLayerAttr('layerEffects');
    var dsDesc = lfxDesc ? lfxDesc.getVal(psEffect) : null;
    var lfxOn = this.getLayerAttr('layerFXVisible');

    // Gather the effect and effectMulti descriptors into a single list.
    // It will be one or the other
    var dsDescList = null;
    if (lfxDesc)
        dsDescList = dsDesc ? [dsDesc] : lfxDesc.getVal(psEffect + 'Multi', false);

    // If any of the other (non-drop-shadow) layer effects are on, then
    // flag this so we use the proper bounds calculation.
    if ((typeof shadowType != 'undefined') && (typeof boundsInfo != 'undefined')
        && (shadowType == 'box-shadow') && lfxDesc && lfxOn && !dsDescList) {
        var i, fxList = ['dropShadow', 'innerShadow', 'outerGlow', 'innerGlow',
            'bevelEmboss', 'chromeFX', 'solidFill', 'gradientFill'];
        for (i in fxList) {
            if (fxList.hasOwnProperty(i)) {
                if (lfxDesc.getVal(fxList[i] + '.enabled')) {
                    boundsInfo.hasLayerEffect = true;
                    break;
                }
            }
        }

        // Search multis as well
        if (!boundsInfo.hasLayerEffect) {
            var fxMultiList = ['dropShadowMulti', 'frameFXMulti', 'gradientFillMulti',
                'innerShadowMulti', 'solidFillMulti'];
            for (i in fxMultiList) {
                if (fxMultiList.hasOwnProperty(i)) {
                    var j, fxs = lfxDesc.getVal(fxMultiList[i]);
                    for (j = 0; j < fxs.length; ++j)
                        if (fxs[j].getVal('enabled')) {
                            boundsInfo.hasLayerEffect = true;
                            break;
                        }
                    if (boundsInfo.hasLayerEffect) break;
                }
            }
        }
    }

    // Bail out if effect turned off (no eyeball)
    if (!dsDescList || !lfxOn)
        return null;

    var i, dropShadows = [];
    for (i = 0; i < dsDescList.length; ++i)
        if (dsDescList[i].getVal('enabled')) {
            var offset = PSLayerInfo.getEffectOffset(dsDescList[i]);
            dropShadows.push(new DropShadowInfo(offset[0], offset[1], dsDescList[i]));
        }
    return (dropShadows.length > 0) ? dropShadows : null;
};

//
// Return text with substituted descriptors.  Note items delimited
// in $'s are substituted with values looked up from the layer data
// e.g.:
//     border-width: $AGMStrokeStyleInfo.strokeStyleLineWidth$;"
// puts the stroke width into the output.  If the descriptor isn't
// found, no output is generated.
//
PSLayerInfo.prototype.replaceDescKey = function (cssText, baseDesc) {
    // Locate any $parameters$ to be substituted.
    var i, subs = cssText.match(/[$]([^$]+)[$]/g);
    var replacementFailed = false;

    function testAndReplace(item) {
        if (item != null)
            cssText = cssText.replace(/[$]([^$]+)[$]/, item);
        else
            replacementFailed = true;
    }

    if (subs) {
        // Stupid JS regex leaves whole match in capture group!
        for (i = 0; i < subs.length; ++i)
            subs[i] = subs[i].split('$')[1];

        if (typeof(baseDesc) == 'undefined')
            baseDesc = null;
        if (!subs)
            alert('Missing substitution text in CSS/SVG spec');

        for (i = 0; i < subs.length; ++i) {
            // Handle color as a special case
            if (subs[i].match(/'Clr '/)) {
                testAndReplace(this.descToCSSColor(baseDesc, subs[i]));
            }
            else if (subs[i].match(/(^|[.])color$/)) {
                testAndReplace(this.descToCSSColor(baseDesc, subs[i]));
            }
            else {
                testAndReplace(this.getLayerAttr(subs[i], baseDesc));
            }

        }
    }
    return [replacementFailed, cssText];
};

// If useLayerFX is false, then don't check it.  By default it's checked.
PSLayerInfo.prototype.gradientDesc = function (useLayerFX) {
    if (typeof useLayerFX == 'undefined')
        useLayerFX = true;
    var descList = this.getLayerAttr('adjustment');
    if (descList && descList.getVal('gradient')) {
        return descList;
    }
    else		// If there's no adjustment layer, see if we have one from layerFX...
    {
        if (useLayerFX)
            descList = this.getLayerAttr('layerEffects.gradientFill');
    }
    return descList;
};

function GradientInfo(gradDesc) {
    this.angle = gradDesc.getVal('angle');
    this.opacity = gradDesc.getVal('opacity');
    this.opacity = this.opacity ? stripUnits(this.opacity) / 100.0 : 1;
    if (this.angle == null)
        this.angle = '0deg';
    this.type = gradDesc.getVal('type');
    // Get rid of the new "gradientType:" prefix
    this.type = this.type.replace(/^gradientType:/, '');
    if ((this.type != 'linear') && (this.type != 'radial'))
        this.type = 'linear';		// punt
    this.reverse = gradDesc.getVal('reverse') ? true : false;
}

// Extendscript operator overloading
GradientInfo.prototype['=='] = function (src) {
    return (this.angle === src.angle)
        && (this.type === src.type)
        && (this.reverse === src.reverse);
};

PSLayerInfo.prototype.gradientInfo = function (useLayerFX) {
    var gradDesc = this.gradientDesc(useLayerFX);
    // Make sure null is returned if we aren't using layerFX and there's no adj layer
    if (!useLayerFX && gradDesc && !gradDesc.getVal('gradient'))
        return null;
    return (gradDesc && (!useLayerFX || gradDesc.getVal('enabled'))) ? new GradientInfo(gradDesc) : null;
};

// Gradient stop object, made from PS gradient.colors/gradient.transparency descriptor
function GradientStop(desc, maxVal) {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.m = 100;
    this.location = 0;
    this.midPoint = 50;
    if (typeof desc != 'undefined') {
        var colorDesc = desc.getVal('color');
        if (colorDesc) {
            this.r = Math.round(colorDesc.getVal('red'));
            this.g = Math.round(colorDesc.getVal('green'));
            this.b = Math.round(colorDesc.getVal('blue'));
        }
        var opacity = desc.getVal('opacity');
        this.m = opacity ? stripUnits(opacity) : 100;
        this.location = (desc.getVal('location') / maxVal) * 100;
        this.midPoint = desc.getVal('midpoint');
    }
}

GradientStop.prototype.copy = function (matte, location) {
    var result = new GradientStop();
    result.r = this.r;
    result.g = this.g;
    result.b = this.b;
    result.m = (typeof matte == 'undefined') ? this.m : matte;
    result.location = (typeof location == 'undefined') ? this.location : location;
    result.midPoint = this.midPoint;
    return result;
};

GradientStop.prototype['=='] = function (src) {
    return (this.r === src.r) && (this.g === src.g)
        && (this.b === src.b) && (this.m === src.m)
        && (this.location === src.location)
        && (this.midPoint === src.midPoint);
};

// Lerp ("linear interpolate")
GradientStop.lerp = function (t, a, b) {
    return Math.round(t * (b - a) + a);
};  // Same as (1-t)*a + t*b

GradientStop.prototype.interpolate = function (dest, t1) {
    var result = new GradientStop();
    result.r = GradientStop.lerp(t1, this.r, dest.r);
    result.g = GradientStop.lerp(t1, this.g, dest.g);
    result.b = GradientStop.lerp(t1, this.b, dest.b);
    result.m = GradientStop.lerp(t1, this.m, dest.m);
    return result;
};

GradientStop.prototype.colorString = function (noTransparency) {
    if (typeof noTransparency == 'undefined')
        noTransparency = false;
    var compList = (noTransparency || (this.m == 100))
        ? [this.r, this.g, this.b]
        : [this.r, this.g, this.b, this.m / 100];
    var tag = (compList.length == 3) ? 'rgb(' : 'rgba(';
    return tag + compList.join(',') + ')';
};

GradientStop.prototype.toString = function () {
    return this.colorString() + ' ' + Math.round(this.location) + '%';
};

GradientStop.reverseStoplist = function (stopList) {
    stopList.reverse();
    // Fix locations to ascending order
    for (var s in stopList) {
        if (stopList.hasOwnProperty(s)) {
            stopList[s].location = 100 - stopList[s].location;
        }
    }
    return stopList;
};

GradientStop.dumpStops = function (stopList) {
    for (var i in stopList) {
        if (stopList.hasOwnProperty(i)) {
            $.writeln(stopList[i]);
        }
    }
};

// Gradient format: linear-gradient( <angle>, rgb( rr, gg, bb ) xx%, rgb( rr, gg, bb ), yy%, ... );
PSLayerInfo.prototype.gradientColorStops = function () {
    // Create local representation of PS stops
    function makeStopList(descList, maxVal) {
        var s, stopList = [];
        for (s in descList) {
            if (descList.hasOwnProperty(s)) {
                stopList.push(new GradientStop(descList[s], maxVal));
            }
        }
        // Replace Photoshop "midpoints" with complete new stops
        for (s = 1; s < stopList.length; ++s) {
            if (stopList[s].midPoint != 50) {
                var newStop = stopList[s - 1].interpolate(stopList[s], 0.5);
                newStop.location = GradientStop.lerp(stopList[s].midPoint / 100.0,
                    stopList[s - 1].location,
                    stopList[s].location);
                stopList.splice(s, 0, newStop);
                s += 1;	// Skip new stop
            }
        }
        return stopList;
    }

    var gdesc = this.gradientDesc();
    var psGrad = gdesc ? gdesc.getVal('gradient') : null;
    if (psGrad) {
//		var maxVal = psGrad.getVal( "interpolation" );	// I swear it used to find this.
        var maxVal = 4096;

        var c, colorStops = makeStopList(psGrad.getVal('colors', false), maxVal);
        var m, matteStops = makeStopList(psGrad.getVal('transparency', false), maxVal);

        // Check to see if any matte stops are active
        var matteActive = false;
        for (m in matteStops)
            if (matteStops.hasOwnProperty(m) && !matteActive)
                matteActive = (matteStops[m].m != 100);

        if (matteActive) {
            // First, copy matte values from matching matte stops to the color stops
            c = 0;
            for (m in matteStops) {
                if (matteStops.hasOwnProperty(m)) {
                    while ((c < colorStops.length) && (colorStops[c].location < matteStops[m].location))
                        c++;
                    if ((c < colorStops.length) && (colorStops[c].location == matteStops[m].location))
                        colorStops[c].m = matteStops[m].m;
                }
            }

            // Make sure the end locations match up
            if (colorStops[colorStops.length - 1].location < matteStops[matteStops.length - 1].location)
                colorStops.push(colorStops[colorStops.length - 1].copy(colorStops[colorStops.length - 1].m, matteStops[matteStops.length - 1].location));

            // Now weave the lists together
            m = 0;
            c = 0;
            while (c < colorStops.length) {
                // Must adjust color stop's matte to interpolate matteStops
                if (colorStops[c].location < matteStops[m].location) {
                    var t = (colorStops[c].location - matteStops[m - 1].location)
                        / (matteStops[m].location - matteStops[m - 1].location);
                    colorStops[c].m = GradientStop.lerp(t, matteStops[m - 1].m, matteStops[m].m);
                    c++;
                }
                // Must add matte stop to color stop list
                if (matteStops[m].location < colorStops[c].location) {
                    var t, newStop;
                    // If matte stops exist in front of the 1st color stop
                    if (c < 1) {
                        newStop = colorStops[0].copy(matteStops[m].m, matteStops[m].location);
                    }
                    else {
                        t = (matteStops[m].location - colorStops[c - 1].location)
                            / (colorStops[c].location - colorStops[c - 1].location);
                        newStop = colorStops[c - 1].interpolate(colorStops[c], t);
                        newStop.m = matteStops[m].m;
                        newStop.location = matteStops[m].location;
                    }
                    colorStops.splice(c, 0, newStop);
                    m++;
                    c++;	// Step past newly added color stop
                }
                // Same, was fixed above
                if (matteStops[m].location == colorStops[c].location) {
                    m++;
                    c++;
                }
            }
            // If any matte stops remain, add those too.
            while (m < matteStops.length) {
                var newStop = colorStops[c - 1].copy(matteStops[m].m, matteStops[m].location);
                colorStops.push(newStop);
                m++;
            }
        }

        return colorStops;
    }
    else
        return null;
};

