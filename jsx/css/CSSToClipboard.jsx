/**
 * Created by sumhah on 18/1/15.
 */

//////////////////////////////////// CSSToClipboard //////////////////////////////////////

// Base object to scope the rest of the functions in.
function CSSToClipboard() {
    // Constructor moved to reset(), so it can be called via a script.
}

cssToClip = new CSSToClipboard();

cssToClip.reset = function () {
    this.pluginName = 'CSSToClipboard';
    this.cssText = '';
    this.indentSpaces = '';
    this.browserTags = [''];
    this.currentLayer = null;
    this.currentPSLayerInfo = null;

    this.groupLevel = 0;
    this.currentLeft = 0;
    this.currentTop = 0;

    this.groupProgress = new ProgressBar();

    this.aborted = false;

    // Work-around for screwy layer indexing.
    this.documentIndexOffset = 0;
    try {
        // This throws an error if there's no background
        if (app.activeDocument.backgroundLayer)
            this.documentIndexOffset = 1;
    }
    catch (err) {
    }
};

cssToClip.reset();

// Call Photoshop to copy text to the system clipboard
cssToClip.copyTextToClipboard = function (txt) {
    var testStrDesc = new ActionDescriptor();

    testStrDesc.putString(keyTextData, txt);
    executeAction(ktextToClipboardStr, testStrDesc, DialogModes.NO);
};

cssToClip.copyCSSToClipboard = function () {
    this.logToHeadlights('Copy to CSS invoked');
    // alert(this.cssText);
    this.copyTextToClipboard(this.cssText);
};

cssToClip.isCSSLayerKind = function (layerKind) {
    if (typeof layerKind == 'undefined')
        layerKind = this.currentPSLayerInfo.layerKind;

    switch (layerKind) {
        case kVectorSheet:
            return true;
        case kTextSheet:
            return true;
        case kPixelSheet:
            return true;
        case kLayerGroupSheet:
            return true;
    }
    return false;
};

// Listen carefully:  When the Photoshop DOM *reports an index to you*, it uses one based
// indexing.  When *you request* layer info with ref.putIndex( classLayer, index ),
// it uses *zero* based indexing.  The DOM should probably stick to the zero-based
// index, so the adjustment is made here.
// Oh god, it gets worse...the indexing is zero based if there's no background layer.
cssToClip.setCurrentLayer = function (layer) {
    this.currentPSLayerInfo = new PSLayerInfo(layer.itemIndex - this.documentIndexOffset, false);
    return layer;
};

cssToClip.getCurrentLayer = function (layer) {
    this.currentLayer = layer;
    this.setCurrentLayer(layer);
    return layer;
};

// These shims connect the original cssToClip with the new PSLayerInfo object.
cssToClip.getLayerAttr = function (keyString, layerDesc) {
    return this.currentPSLayerInfo.getLayerAttr(keyString, layerDesc);
};

cssToClip.getLayerBounds = function (ignoreEffects) {
    return this.currentPSLayerInfo.getBounds(ignoreEffects);
};

cssToClip.descToCSSColor = function (colorDesc, colorPath) {
    return this.currentPSLayerInfo.descToCSSColor(colorDesc, colorPath);
};

// Like getLayerAttr, but returns an app attribute.  No caching.
cssToClip.getPSAttr = function (keyStr, objectClass) {
    var keyList = keyStr.split('.');
    var ref = new ActionReference();
    ref.putProperty(classProperty, makeID(keyList[0]));
    ref.putEnumerated(objectClass, typeOrdinal, enumTarget);

    var resultDesc = executeActionGet(ref);

    return resultDesc.getVal(keyList);
};

cssToClip.getAppAttr = function (keyStr) {
    return this.getPSAttr(keyStr, classApplication);
};

cssToClip.getDocAttr = function (keyStr) {
    return this.getPSAttr(keyStr, classDocument);
};

cssToClip.pushIndent = function () {
    this.indentSpaces += '  ';
};

cssToClip.popIndent = function () {
    if (this.indentSpaces.length < 2)
        alert('Error - indent underflow');
    this.indentSpaces = this.indentSpaces.slice(0, -2);
};

cssToClip.addText = function (text, browserTagList) {
    var i;
    if (typeof browserTagList == 'undefined')
        browserTagList = null;

    if (browserTagList)
        for (i in browserTagList) {
            if (browserTagList.hasOwnProperty(i)) {
                this.cssText += (this.indentSpaces + browserTagList[i] + text + '\n');
            }
        }
    else
        this.cssText += (this.indentSpaces + text + '\n');
//	$.writeln(text);	// debug
};

cssToClip.addStyleLine = function (cssText, baseDesc, browserTagList) {
    var result = this.currentPSLayerInfo.replaceDescKey(cssText, baseDesc);
    var replacementFailed = result[0];
    cssText = result[1];
    if (!replacementFailed)
        this.addText(cssText, browserTagList);

    return !replacementFailed;
};

// Text items need to try both the base and the default descriptors
cssToClip.addStyleLine2 = function (cssText, baseDesc, backupDesc) {
    if (!this.addStyleLine(cssText, baseDesc) && backupDesc)
        this.addStyleLine(cssText, backupDesc);
};

// Text is handled as a special case, to take care of rounding issues.
// In particular, we're avoiding 30.011 and 29.942, which round1k would miss
// Seriously fractional text sizes (as specified by "roundMargin") are left as-is
cssToClip.addTextSize = function (baseDesc, backupDesc, myScale) {
    var roundMargin = 0.2;  // Values outside of this are left un-rounded
    myScale = myScale || 1;
    var sizeText = this.getLayerAttr('size', baseDesc);
    if (!sizeText)
        sizeText = this.getLayerAttr('size', backupDesc);
    if (!sizeText)
        return;
    var unitRxp = /[\d.-]+\s*(\w+)/g;
    var units = unitRxp.exec(sizeText);
    if (!units) return;
    units = units[1];
    var textNum = stripUnits(sizeText) * myScale;
    var roundOff = textNum - (textNum | 0);
    if ((roundOff < roundMargin) || (roundOff > (1.0 - roundMargin))) {
        this.addText('font-size: ' + Math.round(textNum) + units + ';');
    }
    else {
        this.addStyleLine2('font-size: $size$;', baseDesc, backupDesc);
    }

};

// Checks the geometry, and returns "ellipse", "roundrect"
// or "null" (if the points don't match round rect/ellipse pattern).
// NOTE: All of this should go away when the DAG metadata is available
// to just tell you what the radius is.
// NOTE2: The path for a shape is ONLY visible when that shape is the active
// layer.  So you must set the shape in question to be the active layer before
// calling this function.  This really slows down the script, unfortunately.
cssToClip.extractShapeGeometry = function () {
    // We accept a shape as conforming if the coords are within "magnitude"
    // of the overall size.
    function near(a, b, magnitude) {
        a = Math.abs(a);
        b = Math.abs(b);
        return Math.abs(a - b) < (Math.max(a, b) / magnitude);
    }

    function sameCoord(pathPt, xy) {
        return (pathPt.rightDirection[xy] == pathPt.anchor[xy])
            && (pathPt.leftDirection[xy] == pathPt.anchor[xy]);
    }

    function dumpPts(pts)	// For debug viewing in Matlab
    {
        function pt2str(pt) {
            return '[' + Math.floor(pt[0]) + ', ' + Math.floor(pt[1]) + ']';
        }

        var i;
        for (i = 0; i < pts.length; ++i)
            $.writeln('[' + [pt2str(pts[i].rightDirection), pt2str(pts[i].anchor), pt2str(pts[i].leftDirection)].join('; ') + '];');
    }

    // Control point location for Bezier arcs.
    // See problem 1, http://www.graphics.stanford.edu/courses/cs248-98-fall/Final/q1.html
    const kEllipseDist = 4 * (Math.sqrt(2) - 1) / 3;

    if (app.activeDocument.pathItems.length == 0)
        return null;	// No path

    // Grab the path name from the layer name (it's auto-generated)
    var i, pathName = localize('$$$/ShapeLayerPathName=^0 Shape Path');
    var path = app.activeDocument.pathItems[pathName.replace(/[^]0/, app.activeDocument.activeLayer.name)];

    // If we have a plausible path, walk the geometry and see if it matches a shape we know about.
    if ((path.kind == PathKind.VECTORMASK) && (path.subPathItems.length == 1)) {
        var subPath = path.subPathItems[0];
        if (subPath.closed && (subPath.pathPoints.length == 4))	// Ellipse?
        {
            function next(index) {
                return (index + 1) % 4;
            }

            function prev(index) {
                return (index > 0) ? (index - 1) : 3;
            }

            var pts = subPath.pathPoints;

            // dumpPts( pts );
            for (i = 0; i < 4; ++i) {
                var xy = i % 2;	// 0 = x, 1 = y, alternates as we traverse the oval sides
                if (!sameCoord(pts[i], 1 - xy)) return null;
                if (!near(pts[i].leftDirection[xy] - pts[i].anchor[xy],
                        (pts[next(i)].anchor[xy] - pts[i].anchor[xy]) * kEllipseDist, 100)) return null;
                if (!near(pts[i].anchor[xy] - pts[i].rightDirection[xy],
                        (pts[prev(i)].anchor[xy] - pts[i].anchor[xy]) * kEllipseDist, 100)) return null;
            }
            // Return the X,Y radius
            return [pts[1].anchor[0] - pts[0].anchor[0], pts[1].anchor[1] - pts[0].anchor[1], 'ellipse'];
        }
        else if (subPath.closed && (subPath.pathPoints.length == 8))	// RoundRect?
        {
            var pts = subPath.pathPoints;
            //dumpPts( pts );
            function sameCoord2(pt, xy, io) {
                return (sameCoord(pt, xy)
                && ( ((io == 0) && (pt.rightDirection[1 - xy] == pt.anchor[1 - xy]))
                || ((io == 1) && (pt.leftDirection[1 - xy] == pt.anchor[1 - xy])) ) );
            }

            function next(index) {
                return (index + 1) % 8;
            }

            function prev(index) {
                return (index > 0) ? (index - 1) : 7;
            }

            function arm(pt, xy, io) {
                return (io == 0) ? pt.rightDirection[xy] : pt.leftDirection[xy];
            }

            for (i = 0; i < 8; ++i) {
                var io = i % 2;			// Incoming / Outgoing vector on the anchor point
                var hv = (i >> 1) % 2;	// Horizontal / Vertical side of the round rect
                if (!sameCoord2(pts[i], 1 - hv, 1 - io)) return null;
                if (io == 0) {
                    if (!near(arm(pts[i], hv, io) - pts[i].anchor[hv],
                            (pts[prev(i)].anchor[hv] - pts[i].anchor[hv]) * kEllipseDist, 10))
                        return null;
                }
                else {
                    if (!near(arm(pts[i], hv, io) - pts[i].anchor[hv],
                            (pts[next(i)].anchor[hv] - pts[i].anchor[hv]) * kEllipseDist, 10))
                        return null;
                }
            }
            return [pts[2].anchor[0] - pts[1].anchor[0], pts[2].anchor[1] - pts[1].anchor[1], 'round rect'];
        }
    }
};

// Gradient format: linear-gradient( <angle>, rgb( rr, gg, bb ) xx%, rgb( rr, gg, bb ), yy%, ... );
cssToClip.gradientToCSS = function () {
    var colorStops = this.currentPSLayerInfo.gradientColorStops();
    var gradInfo = this.currentPSLayerInfo.gradientInfo();

    if (colorStops && gradInfo) {
        if (gradInfo.reverse)
            colorStops = GradientStop.reverseStoplist(colorStops);

        if (gradInfo.type == 'linear')
            return gradInfo.type + '-gradient( ' + gradInfo.angle + ', ' + colorStops.join(', ') + ');';
        // Radial - right now gradient is always centered (50% 50%)
        if (gradInfo.type == 'radial')
            return gradInfo.type + '-gradient( 50% 50%, circle closest-side, ' + colorStops.join(', ') + ');';
    }
    else
        return null;
};

// Translate Photoshop drop shadow.  May need work with layerEffects.scale,
// and need to figure out what's up with the global angle.
cssToClip.addDropShadow = function (shadowType, boundsInfo) {
    var dsInfo = this.currentPSLayerInfo.getDropShadowInfo(shadowType, boundsInfo, 'dropShadow');
    var isInfo = this.currentPSLayerInfo.getDropShadowInfo(shadowType, boundsInfo, 'innerShadow');
    if (!(dsInfo || isInfo))
        return;

    function map(lst, fn) {
        var i, result = [];
        for (i = 0; i < lst.length; ++i)
            result.push(fn(lst[i]));
        return result;
    }

    function getShadowCSS(info, skipSpread) {
        // Translate PS parameters to CSS style
        var opacity = info.dsDesc.getVal('opacity');
        // LFX reports "opacity" as a percentage, so convert it to decimal
        opacity = opacity ? stripUnits(opacity) / 100.0 : 1;
        var colorSpec = cssToClip.currentPSLayerInfo.descToRGBAColor('color', opacity, info.dsDesc);
        var size = stripUnits(info.dsDesc.getVal('blur'));
        var chokeMatte = stripUnits(info.dsDesc.getVal('chokeMatte'));
        var spread = size * chokeMatte / 100;
        var blurRad = size - spread;
        // Hack - spread is not used for text shadows.
        var spreadStr = skipSpread ? '' : spread + 'px ';

        return info.xoff + ' ' + info.yoff + ' '
            + blurRad + 'px ' + spreadStr + colorSpec;
    }

    function insetShadowCSS(info) {
        return 'inset ' + getShadowCSS(info);
    }

    function textShadowCSS(info) {
        return getShadowCSS(info, true);
    }

    // You say CSS was designed by committee?  Really?
    if (shadowType == 'box-shadow') {
        var i, shadows = [];
        if (dsInfo)
            shadows = map(dsInfo, getShadowCSS);
        if (isInfo) // push.apply == extend
            shadows.push.apply(shadows, map(isInfo, insetShadowCSS));

        this.addText(shadowType + ': ' + shadows.join(',') + ';');

        boundsInfo.hasLayerEffect = true;
    }

    // CSS doesn't support inner shadow, just drop shadow
    if (dsInfo && (shadowType == 'text-shadow')) {
        var shadows = map(dsInfo, textShadowCSS);
        this.addText(shadowType + ': ' + shadows.join(',') + ';');
    }
};

cssToClip.addOpacity = function (opacity) {
    opacity = (typeof opacity == 'number') ? opacity : this.getLayerAttr('opacity');
    if ((typeof opacity == 'number') && (opacity < 255))
        this.addText('opacity: ' + round1k(opacity / 255) + ';');
};

cssToClip.addRGBAColor = function (param, opacity, colorDesc) {
    this.addText(param + ': ' + this.currentPSLayerInfo.descToRGBAColor('color', opacity, colorDesc) + ';');
};

function BoundsParameters() {
    this.borderWidth = 0;
    this.textOffset = null;
    this.hasLayerEffect = false;
    this.textLine = false;
    this.rawTextBounds = null;
    this.textHasDecenders = false;
    this.textFontSize = 0;
    this.textLineHeight = 1.2;
}

cssToClip.addObjectBounds = function (boundsInfo) {

    var bounds = this.getLayerBounds(boundsInfo.hasLayerEffect);

    if (boundsInfo.rawTextBounds) {
        // If the text has been transformed, rawTextBounds is set.  We need
        // to set the CSS bounds to reflect the *un*transformed text, placed about
        // the center of the transformed text's bounding box.
        // var cenx = bounds[0] + (bounds[2] - bounds[0])/2;
        // var ceny = bounds[1] + (bounds[3] - bounds[1])/2;
        // var txtWidth = boundsInfo.rawTextBounds[2] - boundsInfo.rawTextBounds[0];
        // var txtHeight= boundsInfo.rawTextBounds[3] - boundsInfo.rawTextBounds[1];
        // bounds[0] = cenx - (txtWidth/2);
        // bounds[1] = ceny - (txtHeight/2);
        // bounds[2] = bounds[0] + txtWidth;
        // bounds[3] = bounds[1] + txtHeight;
    }
    $.writeln(bounds[0], bounds[1], bounds[2], bounds[3]);

    if (boundsInfo.textLine
        && !boundsInfo.hasLayerEffect
        && (boundsInfo.textFontSize !== 0)) {
        var actualTextPixelHeight = (bounds[3] - bounds[1]).as('px');
        var textBoxHeight = boundsInfo.textFontSize * boundsInfo.textLineHeight;
        var correction = (actualTextPixelHeight - textBoxHeight) / 2;
        // If the text doesn't have decenders, then the correction by the PS baseline will
        // be off (the text is instead centered vertically in the CSS text box).  This applies
        // a different correciton for this case.
        if (boundsInfo.textOffset) {
            if (boundsInfo.textHasDecenders) {
                var lineHeightCorrection = (boundsInfo.textFontSize - (boundsInfo.textFontSize * boundsInfo.textLineHeight)) / 2;
                boundsInfo.textOffset[1] += lineHeightCorrection;
            }
            else
                boundsInfo.textOffset[1] = UnitValue(correction, 'px');
        }
    }

    if ((this.groupLevel == 0) && boundsInfo.textOffset) {
        // this.addText('position: absolute;');
        this.addText('left: ' + (bounds[0]).asCSS() + ';');
        this.addText('top: ' + (bounds[1]).asCSS() + ';');
    }
    else {
        // Go through the DOM to ensure we're working in Pixels
        var left = bounds[0];
        var top = bounds[1];

        if (boundsInfo.textOffset == null)
            boundsInfo.textOffset = [0, 0];

        // Intuitively you'd think this would be "relative", but you'd be wrong.
        // "Absolute" coordinates are relative to the container.
        // this.addText('position: absolute;');
        this.addText('left: ' + (left
            - this.currentLeft
            + boundsInfo.textOffset[0]).asCSS() + ';');
        this.addText('top: ' + (top
            - this.currentTop
            + boundsInfo.textOffset[1]).asCSS() + ';');
    }

    // Go through the DOM to ensure we're working in Pixels
    var width = bounds[2] - bounds[0];
    var height = bounds[3] - bounds[1];

    // In CSS, the border width is added to the -outside- of the bounds.  In order to match
    // the default behavior in PS, we adjust it here.
    if (boundsInfo.borderWidth > 0) {
        width -= 2 * boundsInfo.borderWidth;
        height -= 2 * boundsInfo.borderWidth;
    }
    // Don't generate a width for "line" (paint) style text.
    // if (! boundsInfo.textLine)
    // {
    this.addText('width: ' + ((width < 0) ? 0 : width.asCSS()) + ';');
    this.addText('height: ' + ((height < 0) ? 0 : height.asCSS()) + ';');
    // }
};

// Only called for shape (vector) layers.
cssToClip.getShapeLayerCSS = function (boundsInfo) {
    // If we have AGM stroke style info, generate that.
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

    // Check for layerFX style borders
    var fxDesc = this.getLayerAttr('layerEffects.frameFX');
    if (fxDesc && fxDesc.getVal('enabled')
        && (fxDesc.getVal('paintType') == 'solidColor')) {
        opacity = (stripUnits(fxDesc.getVal('opacity')) / 100) * opacity;

        boundsInfo.borderWidth = makeUnitVal(fxDesc.getVal('size')); // Assumes pixels!
        this.addStyleLine('border-style: solid;');
        this.addStyleLine('border-width: $size$;', fxDesc);
        this.addStyleLine('border-color: $color$;', fxDesc);
    }

    // The Path for a shape *only* becomes visible when that shape is the active layer,
    // so we need to make the current layer active before we extract geometry information.
    // Yes, I know this is painfully slow, modifying the DOM or PS to behave otherwise is hard.
    var saveLayer = app.activeDocument.activeLayer;
    app.activeDocument.activeLayer = this.currentLayer;
    var shapeGeom = this.extractShapeGeometry();
    app.activeDocument.activeLayer = saveLayer;

    // We assume path coordinates are in pixels, they're not stored as UnitValues in the DOM.
    if (shapeGeom) {
        // In CSS, the borderRadius needs to be added to the borderWidth, otherwise ovals
        // turn into rounded rects.
        if (shapeGeom[2] == 'ellipse')
            this.addText('border-radius: 50%;');
        else {
            var radius = Math.round((shapeGeom[0] + shapeGeom[1]) / 2);
            // Note: path geometry is -always- in points ... unless the ruler type is Pixels.
            radius = (app.preferences.rulerUnits == Units.PIXELS)
                ? radius = pixelsToAppUnits(radius)
                : radius = UnitValue(radius, 'pt');

            cssToClip.addText('border-radius: ' + radius.asCSS() + ';');
        }
    }

    var i, gradientCSS = this.gradientToCSS();
    if (!agmDesc 	// If AGM object, only fill if explictly turned on
        || (agmDesc && agmDesc.getVal('fillEnabled'))) {
        if (gradientCSS) {
            for (i in this.browserTags) {
                if (this.browserTags.hasOwnProperty(i)) {
                    this.addText('background-image: ' + this.browserTags[i] + gradientCSS);
                }
            }
        }
        else {
            var fillOpacity = this.getLayerAttr('fillOpacity') / 255.0;
            if (fillOpacity < 1.0)
                this.addRGBAColor('background-color', fillOpacity, this.getLayerAttr('adjustment'));
            else
                this.addStyleLine('background-color: $adjustment.color$;');
        }
    }
    this.addOpacity(opacity);

    this.addDropShadow('box-shadow', boundsInfo);
};

// Only called for text layers.
cssToClip.getTextLayerCSS = function (boundsInfo) {

    function isStyleOn(textDesc, defTextDesc, styleKey, onText) {
        var styleText = textDesc.getVal(styleKey);
        if (!styleText && defTextDesc)
            styleText = defTextDesc.getVal(styleKey);
        return (styleText && (styleText.search(onText) >= 0));
    }

    // If the text string is empty, then trying to access the attributes fails, so exit now.
    var textString = this.getLayerAttr('textKey.textKey');
    if (textString.length === 0)
        return;

    var cssUnits = DOMunitToCSS[app.preferences.rulerUnits];
    boundsInfo.textOffset = [UnitValue(0, cssUnits), UnitValue(0, cssUnits)];
    var leadingOffset = 0;

    var opacity = (this.getLayerAttr('opacity') / 255.0) * (this.getLayerAttr('fillOpacity') / 255.0);

    var textDesc = this.getLayerAttr('textKey.textStyleRange.textStyle');
    var defaultDesc = this.getLayerAttr('textKey.paragraphStyleRange.paragraphStyle.defaultStyle');
    if (!defaultDesc)
        defaultDesc = this.getLayerAttr('textKey.textStyleRange.textStyle.baseParentStyle');

    if (textDesc) {
//		this.addStyleLine2( "font-size: $size$;", textDesc, defaultDesc );
//         this.addStyleLine2('font-family: "$fontName$";', textDesc, defaultDesc);
        if (opacity == 1.0) {
            this.addStyleLine2('color: $color$;', textDesc, defaultDesc);// Color can just default to black
        }
        else {
            if (textDesc.getVal('color'))
                this.addRGBAColor('color', opacity, textDesc);
            else
                this.addRGBAColor('color', opacity, defaultDesc);
        }

        // This table is: [PS Style event key ; PS event value keyword to search for ; corresponding CSS]
        var styleTable = [['fontStyleName', 'Bold', 'font-weight: bold;'],
            ['fontStyleName', 'Italic', 'font-style: italic;'],
            ['strikethrough', 'StrikethroughOn', 'text-decoration: line-through;'],
            ['underline', 'underlineOn', 'text-decoration: underline;'],
            // Need RE, otherwise conflicts w/"smallCaps"
            ['fontCaps', /^allCaps/, 'text-transform: uppercase;'],
            ['fontCaps', 'smallCaps', 'font-variant: small-caps;'],
            // These should probably also modify the font size?
            ['baseline', 'superScript', 'vertical-align: super;'],
            ['baseline', 'subScript', 'vertical-align: sub;']];

        var i;
        for (i in styleTable) {
            if (styleTable.hasOwnProperty(i)) {
                if (isStyleOn(textDesc, defaultDesc, styleTable[i][0], styleTable[i][1])) {
                    this.addText(styleTable[i][2]);
                }
            }
        }

        // Synthesize the line-height from the "leading" (line spacing) / font-size
        var fontSize = textDesc.getVal('size');
        if (!fontSize && defaultDesc) fontSize = defaultDesc.getVal('size');
        var fontLeading = textDesc.getVal('leading');
        if (fontSize)
            fontSize = stripUnits(fontSize);
        if (fontSize && fontLeading) {
            leadingOffset = fontLeading;
            boundsInfo.textLineHeight = round1k(stripUnits(fontLeading) / fontSize);
        }
        this.addText('line-height: ' + boundsInfo.textLineHeight + ';');

        if (fontSize)
            boundsInfo.textFontSize = fontSize;

        var pgraphStyle = this.getLayerAttr('textKey.paragraphStyleRange.paragraphStyle');
        if (pgraphStyle) {
            this.addStyleLine('text-align: $align$;', pgraphStyle);
            var lineIndent = pgraphStyle.getVal('firstLineIndent');
            if (lineIndent && (stripUnits(lineIndent) != 0))
                this.addStyleLine('text-indent: $firstLineIndent$;', pgraphStyle);
            // PS startIndent for whole 'graph, CSS is?
        }

        // Update boundsInfo
        this.addDropShadow('text-shadow', boundsInfo);
        // text-indent text-align letter-spacing line-height

        var baseDesc = this.getLayerAttr('textKey');

        function txtBnd(id) {
            return makeUnitVal(baseDesc.getVal(id));
        }

        boundsInfo.textOffset = [txtBnd('bounds.left') - txtBnd('boundingBox.left'),
            txtBnd('bounds.top') - txtBnd('boundingBox.top') + makeUnitVal(leadingOffset)];
        if (this.getLayerAttr('textKey.textShape.char') == 'paint')
            boundsInfo.textLine = true;

        // This seems to be the one reliable indicator that the text has decenders
        // below the baseline, indicating the positioning in CSS must be handled
        // differently.
        if (txtBnd('boundingBox.bottom').as('px') / fontSize > 0.03)
            boundsInfo.textHasDecenders = true;

        // Matrix: [xx xy 0; yx yy 0; tx ty 1], if not identiy, then add it.
        var textXform = this.getLayerAttr('textKey.transform');
        var vScale = textDesc.getVal('verticalScale');
        var hScale = textDesc.getVal('horizontalScale');
        var myScale = 1;
        vScale = (typeof vScale == 'number') ? round1k(vScale / 100.0) : 1;
        hScale = (typeof hScale == 'number') ? round1k(hScale / 100.0) : 1;
        if (textXform) {
            function xfm(key) {
                return textXform.getVal(key);
            }

            var xformData = this.currentPSLayerInfo.replaceDescKey('[$xx$, $xy$, $yx$, $yy$, $tx$, $ty$]', textXform);
            var m = eval(xformData[1]);
            m[0] *= hScale;
            m[3] *= vScale;
            if (!((m[0] == 1) && (m[1] == 0)
                && (m[2] == 0) && (m[3] == 1)
                && (m[4] == 0) && (m[5] == 0))) {
                myScale = m[0];
                boundsInfo.rawTextBounds = baseDesc.getVal('boundingBox').extractBounds();
                // this.addText("transform: matrix( " + m.join(",") + ");", this.browserTags );
            }
        }
        else {
            // Case for text not otherwise transformed.
            if ((vScale != 1.0) || (hScale != 1.0)) {
                boundsInfo.rawTextBounds = baseDesc.getVal('boundingBox').extractBounds();
                this.addText('transform: scale(' + hScale + ', ' + vScale + ');', this.browserTags);
            }
        }
        this.addTextSize(textDesc, defaultDesc, myScale);
    }
};

cssToClip.getPixelLayerCSS = function () {
    var name = this.getLayerAttr('name');
    // If suffix isn't present, add one.  Assume file is in same folder as parent.

    if (name.search(/[.]((\w){3,4})$/) < 0) {
        this.addStyleLine('background-image: url("$name$.png");');
    }
    else {
        // If the layer has a suffix, assume Generator-style naming conventions
        var docSuffix = app.activeDocument.name.search(/([.]psd)$/i);
        var docFolder = (docSuffix < 0) ? app.activeDocument.name
            : app.activeDocument.name.slice(0, docSuffix);
        docFolder += '-assets/';	// The "-assets" is not localized.

        // Weed out any Generator parameters, if present.
        var m = name.match(/(?:[\dx%? ])*([^.+,\n\r]+)([.]\w+)+$/);
        if (m) {
            name = m[1] + m[2];
        }

        this.addText('background-image: url("' + docFolder + name.substr(0, name.length - 1) + '");');
    }

    var fillOpacity = this.getLayerAttr('fillOpacity') / 255.0;
    this.addOpacity(this.getLayerAttr('opacity') * fillOpacity);

    exportLayer(this.currentLayer);
};

// This walks the group and outputs all visible items in that group.  If the current
// layer is not a group, then it walks to the end of the document (i.e., for dumping
// the whole document).
cssToClip.getGroupLayers = function (currentLayer, memberTest, processAllLayers) {

    processAllLayers = (typeof processAllLayers === 'undefined') ? false : processAllLayers;
    // If processing all of the layers, don't stop at the end of the first group
    var layerLevel = processAllLayers ? 2 : 1;
    var visibleLevel = layerLevel;
    var curIndex = currentLayer.index;
    var saveGroup = [];

    if (currentLayer.layerKind === kLayerGroupSheet) {
        if (!currentLayer.visible) {
            return;
        }
        curIndex--; // Step to next layer in group so layerLevel is correct
    }

    var groupLayers = [];
    while ((curIndex > 0) && (layerLevel > 0)) {
        var nextLayer = new PSLayerInfo(curIndex, false);
        if (memberTest(nextLayer.layerKind)) {
            if (nextLayer.layerKind === kLayerGroupSheet) {
                if (nextLayer.visible && (visibleLevel === layerLevel)) {
                    visibleLevel++;
                    // The layers and section bounds must be swapped
                    // in order to process the group's layerFX
                    saveGroup.push(nextLayer);
                    groupLayers.push(kHiddenSectionBounder);
                }
                layerLevel++;
            }
            else {
                if (nextLayer.visible && (visibleLevel === layerLevel)) {
                    groupLayers.push(nextLayer);
                }
            }
        }
        else if (nextLayer.layerKind === kHiddenSectionBounder) {
            layerLevel--;
            if (layerLevel < visibleLevel) {
                visibleLevel = layerLevel;
                if (saveGroup.length > 0) {
                    groupLayers.push(saveGroup.pop());
                }
            }
        }
        curIndex--;
    }
    return groupLayers;
};

// Recursively count the number of layers in the group, for progress bar
cssToClip.countGroupLayers = function (layerGroup, memberTest) {
    if (!memberTest)
        memberTest = cssToClip.isCSSLayerKind;
    var currentLayer = new PSLayerInfo(layerGroup.itemIndex - cssToClip.documentIndexOffset);
    var groupLayers = this.getGroupLayers(currentLayer, memberTest);
    var i, visLayers = 0;
    for (i = 0; i < groupLayers.length; ++i)
        if (typeof groupLayers[i] === 'object')
            visLayers++;
    return visLayers;
};

// The CSS for nested DIVs (essentially; what's going on with groups)
// are NOT specified hierarchically.  So we need to finish this group's
// output, then create the CSS for everything in it.
cssToClip.pushGroupLevel = function () {
    if (this.groupLevel == 0) {
        var numSteps = this.countGroupLayers(this.getCurrentLayer()) + 1;
        this.groupProgress.totalProgressSteps = numSteps;
    }
    this.groupLevel++;
};

cssToClip.popGroupLevel = function () {
    var i, saveGroupLayer = this.getCurrentLayer();
    var saveLeft = this.currentLeft, saveTop = this.currentTop;
    var bounds = this.getLayerBounds();

    this.currentLeft = bounds[0];
    this.currentTop = bounds[1];
    var notAborted = true;

    for (i = 0; ((i < saveGroupLayer.layers.length) && notAborted); ++i) {
        this.setCurrentLayer(saveGroupLayer.layers[i]);
        if (this.isCSSLayerKind())
            notAborted = this.gatherLayerCSS();
    }
    this.setCurrentLayer(saveGroupLayer);
    this.groupLevel--;
    this.currentLeft = saveLeft;
    this.currentTop = saveTop;
    return notAborted;
};

cssToClip.layerNameToCSS = function (layerName) {
    const kMaxLayerNameLength = 50;

    // Remove any user-supplied class/ID delimiter
    if ((layerName[0] == '.') || (layerName[0] == '#'))
        layerName = layerName.slice(1);

    // Remove any other creepy punctuation.
    var badStuff = /[“”";!.?,'`@’#'$%^&*)(+=|}{><\x2F\s]/g;
    var layerName = layerName.replace(badStuff, '_');

    // Text layer names may be arbitrarily long; keep it real
    if (layerName.length > kMaxLayerNameLength)
        layerName = layerName.slice(0, kMaxLayerNameLength - 3);

    // Layers can't start with digits, force an _ in front in that case.
    if (layerName.match(/^[\d].*/))
        layerName = '_' + layerName;

    return layerName;
};

// Gather the CSS info for the current layer, and add it to this.cssText
// Returns FALSE if the process was aborted.
cssToClip.gatherLayerCSS = function (layer) {
    // Script can't be called from PS context menu unless there is an active layer
    if (!layer) {
        layer = app.activeDocument.layers[0];
    }
    app.activeDocument.activeLayer = layer;

    var curLayer = this.getCurrentLayer(layer);

    // Skip invisible or non-css-able layers.
    var layerKind = this.currentPSLayerInfo.layerKind;
    if (layerKind === kBackgroundSheet)     // Background == pixels. Never in groups.
        layerKind = kPixelSheet;
    if (!this.isCSSLayerKind(layerKind)) {
        var idrasterizeLayer = stringIDToTypeID('rasterizeLayer');
        var desc547 = new ActionDescriptor();
        var idnull = charIDToTypeID('null');
        var ref213 = new ActionReference();
        var idLyr = charIDToTypeID('Lyr ');
        var idOrdn = charIDToTypeID('Ordn');
        var idTrgt = charIDToTypeID('Trgt');
        ref213.putEnumerated(idLyr, idOrdn, idTrgt);
        desc547.putReference(idnull, ref213);
        executeAction(idrasterizeLayer, desc547, DialogModes.NO);

        curLayer = app.activeDocument.activeLayer;
        return this.gatherLayerCSS(curLayer);
    }

    var isCSSid = (curLayer.name[0] == '#'); // Flag if generating ID not class

    var layerName = this.layerNameToCSS(curLayer.name).substr(0, curLayer.name.length - 1);

    this.addText((isCSSid ? '#' : '.') + layerName + ' {');

    this.pushIndent();

    var boundsInfo = new BoundsParameters();

    switch (layerKind) {
        case kLayerGroupSheet:
            this.pushGroupLevel();
            break;
        case kVectorSheet:
            this.getShapeLayerCSS(boundsInfo);
            break;
        case kTextSheet:
            this.getTextLayerCSS(boundsInfo);
            break;
        case kPixelSheet:
            this.getPixelLayerCSS();
            break;
    }

    // var aborted = false;
    // if (this.groupLevel > 0)
    //     aborted = this.groupProgress.nextProgress();
    // if (aborted)
    //     return false;

    // Use the Opacity tag for groups, so it applies to all descendants.

    if (layerKind == kLayerGroupSheet)
        this.addOpacity();
    this.addObjectBounds(boundsInfo);
    this.addStyleLine('z-index: $itemIndex$;');

    this.popIndent();
    this.addText('}');

    var notAborted = true;

    var returnText = this.cssText;
    this.cssText = '';
    return returnText;
    // // If we're processing a group, now is the time to process the member layers.
    // if ((layer.typename == 'LayerSet')
    //     && (this.groupLevel > 0))
    //     notAborted = this.popGroupLevel();

    return notAborted;
};

// Main entry point
cssToClip.copyLayerCSSToClipboard = function () {
    var resultObj = new Object();

    app.doProgress(localize('$$$/Photoshop/Progress/CopyCSSProgress=Copying CSS...'), 'this.copyLayerCSSToClipboardWithProgress(resultObj)');

    return resultObj.msg;
};

cssToClip.copyLayerCSSToClipboardWithProgress = function (outResult) {
    this.reset();
    var saveUnits = app.preferences.rulerUnits;

    app.preferences.rulerUnits = Units.PIXELS;	// Web dudes want pixels.

    try {
        var elapsedTime, then = new Date();
        if (!this.gatherLayerCSS())
            return;						// aborted
        elapsedTime = new Date() - then;
    }
    catch (err) {
        // Copy CSS fails if a new doc pops open before it's finished, possible if Cmd-N is selected
        // before the progress bar is up.  This message isn't optimal, but it was too late to get a
        // proper error message translated, so this was close enough.
        // MUST USE THIS FOR RELEASE PRIOR TO CS7/PS14
//		alert( localize( "$$$/MaskPanel/MaskSelection/NoLayerSelected=No layer selected" ) );
        alert(localize('$$$/Scripts/CopyCSSToClipboard/Error=Internal error creating CSS: ') + err.message +
            localize('$$$/Scripts/CopyCSSToClipboard/ErrorLine= at script line ') + err.line);
    }

    cssToClip.copyCSSToClipboard();
    if (saveUnits)
        app.preferences.rulerUnits = saveUnits;

    // We can watch this in ESTK without screwing up the app
    outResult.msg = ('time: ' + (elapsedTime / 1000.0) + ' sec');
};

// ----- End of CopyCSSToClipboard script proper.  What follows is test & debugging code -----

// Dump out a layer attribute as text.  This is how you learn what attributes are available.
// Note this only works for ActionDescriptor or ActionList layer attributes; for simple
// types just call cssToClip.getLayerAttr().
cssToClip.dumpLayerAttr = function (keyName) {
    this.setCurrentLayer(app.activeDocument.activeLayer);
    var ref = new ActionReference();
    ref.putIdentifier(classLayer, app.activeDocument.activeLayer.id);
    layerDesc = executeActionGet(ref);

    var desc = layerDesc.getVal(keyName, false);
    if (!desc)
        return;
    if ((desc.typename == 'ActionDescriptor') || (desc.typename == 'ActionList'))
        desc.dumpDesc(keyName);
    else if ((typeof desc != 'string') && (desc.length >= 1)) {
        s = [];
        for (var i in desc) {
            if (desc.hasOwnProperty(i)) {
                if ((typeof desc[i] == 'object') && (desc[i].typename in {'ActionDescriptor': 1, 'ActionList': 1})) {
                    desc[i].dumpDesc(keyName + '[' + i + ']');
                }
                else {
                    s.push(desc[i].dumpDesc(keyName));
                }
            }
        }
        if (s.length > 0)
            $.writeln(keyName + ': [' + s.join(', ') + ']');
    }
    else
        $.writeln(keyName + ': ' + ActionDescriptor.dumpValue(desc));
};

// Taken from inspection of ULayerElement.cpp
cssToClip.allLayerAttrs = ['AGMStrokeStyleInfo', 'adjustment', 'background', 'bounds',
    'boundsNoEffects', 'channelRestrictions', 'color', 'count', 'fillOpacity', 'filterMaskDensity',
    'filterMaskFeather', 'generatorSettings', 'globalAngle', 'group', 'hasFilterMask',
    'hasUserMask', 'hasVectorMask', 'itemIndex', 'layer3D', 'layerEffects', 'layerFXVisible',
    'layerSection', 'layerID', 'layerKind', 'layerLocking', 'layerSVGdata', 'layerSection',
    'linkedLayerIDs', 'metadata', 'mode', 'name', 'opacity', 'preserveTransparency',
    'smartObject', 'targetChannels', 'textKey', 'useAlignedRendering', 'useAlignedRendering',
    'userMaskDensity', 'userMaskEnabled', 'userMaskFeather', 'userMaskLinked',
    'vectorMaskDensity', 'vectorMaskFeather', 'videoLayer', 'visible', 'visibleChannels',
    'XMPMetadataAsUTF8'];

// Dump all the available attributes on the layer.
cssToClip.dumpAllLayerAttrs = function () {
    this.setCurrentLayer(app.activeDocument.activeLayer);

    var ref = new ActionReference();
    ref.putIndex(classLayer, app.activeDocument.activeLayer.itemIndex);
    var desc = executeActionGet(ref);

    var i;
    for (i = 0; i < this.allLayerAttrs.length; ++i) {
        var attr = this.allLayerAttrs[i];
        var attrDesc = null;
        try {
            attrDesc = this.getLayerAttr(attr);
            if (attrDesc)
                this.dumpLayerAttr(attr);
            else
                $.writeln(attr + ': null');
        }
        catch (err) {
            $.writeln(attr + ': ' + err.message);
        }
    }
};

// Walk the document's layers and describe them.
cssToClip.dumpLayers = function (layerSet) {
    var i, layerID;
    if (typeof layerSet == 'undefined')
        layerSet = app.activeDocument;

    for (i = 0; i < layerSet.layers.length; ++i) {
        if (layerSet.layers[i].typename == 'LayerSet')
            this.dumpLayers(layerSet.layers[i]);
        this.setCurrentLayer(layerSet.layers[i]);
        layerID = (layerSet.layers[i].isBackground) ? 'BG' : cssToClip.getLayerAttr('layerID');
        $.writeln('Layer[' + cssToClip.getLayerAttr('itemIndex') + '] ID=' + layerID + ' name: ' + cssToClip.getLayerAttr('name'));
    }
};

cssToClip.logToHeadlights = function (eventRecord) {
    var headlightsActionID = stringIDToTypeID('headlightsLog');
    var desc = new ActionDescriptor();
    desc.putString(stringIDToTypeID('subcategory'), 'Export');
    desc.putString(stringIDToTypeID('eventRecord'), eventRecord);
    executeAction(headlightsActionID, desc, DialogModes.NO);
};

