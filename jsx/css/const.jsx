/**
 * Created by sumhah on 18/1/15.
 */

$.localize = true;

var pluginPath = $.fileName.substring(0, $.fileName.lastIndexOf('/jsx/css'));

var sourcePath = pluginPath + '/source/';
// Constants for accessing PS event functionality.  In the interests of speed
// we're defining just the ones used here, rather than sucking in a general defs file.
const classApplication = app.charIDToTypeID('capp');
const classDocument = charIDToTypeID('Dcmn');
const classLayer = app.charIDToTypeID('Lyr ');
const classLayerEffects = app.charIDToTypeID('Lefx');
const classProperty = app.charIDToTypeID('Prpr');
const enumTarget = app.charIDToTypeID('Trgt');
const eventGet = app.charIDToTypeID('getd');
const eventHide = app.charIDToTypeID('Hd  ');
const eventSelect = app.charIDToTypeID('slct');
const eventShow = app.charIDToTypeID('Shw ');
const keyItemIndex = app.charIDToTypeID('ItmI');
const keyLayerID = app.charIDToTypeID('LyrI');
const keyTarget = app.charIDToTypeID('null');
const keyTextData = app.charIDToTypeID('TxtD');
const typeNULL = app.charIDToTypeID('null');
const typeOrdinal = app.charIDToTypeID('Ordn');

const ktextToClipboardStr = app.stringIDToTypeID('textToClipboard');

const unitAngle = app.charIDToTypeID('#Ang');
const unitDensity = app.charIDToTypeID('#Rsl');
const unitDistance = app.charIDToTypeID('#Rlt');
const unitNone = app.charIDToTypeID('#Nne');
const unitPercent = app.charIDToTypeID('#Prc');
const unitPixels = app.charIDToTypeID('#Pxl');
const unitMillimeters = app.charIDToTypeID('#Mlm');
const unitPoints = app.charIDToTypeID('#Pnt');

const enumRulerCm = app.charIDToTypeID('RrCm');
const enumRulerInches = app.charIDToTypeID('RrIn');
const enumRulerPercent = app.charIDToTypeID('RrPr');
const enumRulerPicas = app.charIDToTypeID('RrPi');
const enumRulerPixels = app.charIDToTypeID('RrPx');
const enumRulerPoints = app.charIDToTypeID('RrPt');

// SheetKind definitions from USheet.h
const kAnySheet = 0;
const kPixelSheet = 1;
const kAdjustmentSheet = 2;
const kTextSheet = 3;
const kVectorSheet = 4;
const kSmartObjectSheet = 5;
const kVideoSheet = 6;
const kLayerGroupSheet = 7;
const k3DSheet = 8;
const kGradientSheet = 9;
const kPatternSheet = 10;
const kSolidColorSheet = 11;
const kBackgroundSheet = 12;
const kHiddenSectionBounder = 13;

// Tables to convert Photoshop UnitTypes into CSS types
var unitIDToCSS = {};
unitIDToCSS[unitAngle] = 'deg';
unitIDToCSS[unitDensity] = 'DEN	';	// Not supported in CSS
unitIDToCSS[unitDistance] = 'DIST';	// Not supported in CSS
unitIDToCSS[unitNone] = '';		// Not supported in CSS
unitIDToCSS[unitPercent] = '%';
unitIDToCSS[unitPixels] = 'px';
unitIDToCSS[unitMillimeters] = 'mm';
unitIDToCSS[unitPoints] = 'pt';

unitIDToCSS[enumRulerCm] = 'cm';
unitIDToCSS[enumRulerInches] = 'in';
unitIDToCSS[enumRulerPercent] = '%';
unitIDToCSS[enumRulerPicas] = 'pc';
unitIDToCSS[enumRulerPixels] = 'px';
unitIDToCSS[enumRulerPoints] = 'pt';

// Pixel units in Photoshop are hardwired to 72 DPI (points),
// regardless of the doc resolution.
var unitIDToPt = {};
unitIDToPt[unitPixels] = 1;
unitIDToPt[enumRulerPixels] = 1;
unitIDToPt[Units.PIXELS] = 1;
unitIDToPt[unitPoints] = 1;
unitIDToPt[enumRulerPoints] = 1;
unitIDToPt[Units.POINTS] = 1;

unitIDToPt[unitMillimeters] = UnitValue(1, 'mm').as('pt');
unitIDToPt[Units.MM] = UnitValue(1, 'mm').as('pt');
unitIDToPt[enumRulerCm] = UnitValue(1, 'cm').as('pt');
unitIDToPt[Units.CM] = UnitValue(1, 'cm').as('pt');
unitIDToPt[enumRulerInches] = UnitValue(1, 'in').as('pt');
unitIDToPt[Units.INCHES] = UnitValue(1, 'in').as('pt');
unitIDToPt[stringIDToTypeID('inchesUnit')] = UnitValue(1, 'in').as('pt');
unitIDToPt[enumRulerPicas] = UnitValue(1, 'pc').as('pt');
unitIDToPt[Units.PICAS] = UnitValue(1, 'pc').as('pt');

unitIDToPt[unitDistance] = 1;
unitIDToPt[unitDensity] = 1;

// Fortunately, both CSS and the DOM unit values use the same
// unit abbreviations.
var DOMunitToCSS = {};
DOMunitToCSS[Units.CM] = 'cm';
DOMunitToCSS[Units.INCHES] = 'in';
DOMunitToCSS[Units.MM] = 'mm';
DOMunitToCSS[Units.PERCENT] = '%';
DOMunitToCSS[Units.PICAS] = 'pc';
DOMunitToCSS[Units.PIXELS] = 'px';
DOMunitToCSS[Units.POINTS] = 'pt';
DOMunitToCSS[TypeUnits.MM] = 'mm';
DOMunitToCSS[TypeUnits.PIXELS] = 'px';
DOMunitToCSS[TypeUnits.POINTS] = 'pt';

// Clean up some pretty noisy FP numbers...
function round1k(x) {
    return Math.round(x * 1000) / 1000;
}

// Strip off the unit string and return UnitValue as an actual number
function stripUnits(x) {
    return Number(x.replace(/[^0-9.-]+/g, ''));
}

// Convert a "3.0pt" style string or number to a DOM UnitValue
function makeUnitVal(v) {
    if (typeof v == 'string')
        return UnitValue(stripUnits(v), v.replace(/[0-9.-]+/g, ''));
    if (typeof v == 'number')
        return UnitValue(v, DOMunitToCSS[app.preferences.rulerUnits]);
}

// Convert a pixel measurement into a UnitValue in rulerUnits
function pixelsToAppUnits(v) {
    if (app.preferences.rulerUnits == Units.PIXELS)
        return UnitValue(v, 'px');
    else {
        // Divide by doc's DPI, convert to inch, then convert to ruler units.
        var appUnits = DOMunitToCSS[app.preferences.rulerUnits];
        return UnitValue((UnitValue(v / app.activeDocument.resolution, 'in')).as(appUnits), appUnits);
    }
}

// Format a DOM UnitValue as a CSS string, using the rulerUnits units.
UnitValue.prototype.asCSS = function () {
    var cssUnits = DOMunitToCSS[app.preferences.rulerUnits];
    return round1k(this.as(cssUnits)) + cssUnits;
};

// Return the absolute value of a UnitValue as a UnitValue
UnitValue.prototype.abs = function () {
    return UnitValue(Math.abs(this.value), this.type);
};

// It turns out no matter what your PS units pref is set to, the DOM/PSEvent
// system happily hands you values in whatever whacky units it feels like.
// This normalizes the unit output to the ruler setting, for consistency in CSS.
// Note: This isn't a method because "desc" can either be an ActionDescriptor
// or an ActionList (in which case the "ID" is the index).
function getPSUnitValue(desc, ID) {
    var srcUnitsID = desc.getUnitDoubleType(ID);

    if (srcUnitsID == unitNone)	// Um, unitless unitvalues are just...numbers.
        return round1k(desc.getUnitDoubleValue(ID));

    // Angles and percentages are typically things like gradient parameters,
    // and should be left as-is.
    if ((srcUnitsID == unitAngle) || (srcUnitsID == unitPercent))
        return round1k(desc.getUnitDoubleValue(ID)) + unitIDToCSS[srcUnitsID];

    // Skip conversion if coming and going in pixels
    if (((srcUnitsID == unitPixels) || (srcUnitsID == enumRulerPixels))
        && (app.preferences.rulerUnits == Units.PIXELS))
        return round1k(desc.getUnitDoubleValue(ID)) + 'px';

    // Other units to pixels must first convert to points,
    // then expanded by the actual doc resolution (measured in DPI)
    if (app.preferences.rulerUnits == Units.PIXELS)
        return round1k(desc.getUnitDoubleValue(ID) * unitIDToPt[srcUnitsID]
                * app.activeDocument.resolution / 72) + 'px';

    var DOMunitStr = DOMunitToCSS[app.preferences.rulerUnits];

    // Pixels must be explictly converted to other units
    if ((srcUnitsID == unitPixels) || (srcUnitsID == enumRulerPixels))
        return pixelsToAppUnits(desc.getUnitDoubleValue(ID)).as(DOMunitStr) + DOMunitStr;

    // Otherwise, let Photoshop do generic conversion.
    return round1k(UnitValue(desc.getUnitDoubleValue(ID), unitIDToCSS[srcUnitsID]).as(DOMunitStr)) + DOMunitStr;
}

// Attempt decoding of reference types.  This generates an object with two keys,
// "refclass" and "value".  So a channel reference looks like:
//    { refclass:'channel', value: 1 }
// Note the dump method compresses this to the text "{ channel: 1 }", but internally
// the form above is used.  This is because ExtendScript doesn't have a good method
// for enumerating keys.
function getReference(ref) {
    var v;
    switch (ref.getForm()) {
        case ReferenceFormType.CLASSTYPE:
            v = typeIDToStringID(ref.getDesiredClass());
            break;
        case ReferenceFormType.ENUMERATED:
            v = ref.getEnumeratedValue();
            break;
        case ReferenceFormType.IDENTIFIER:
            v = ref.getIdentifier();
            break;
        case ReferenceFormType.INDEX:
            v = ref.getIndex();
            break;
        case ReferenceFormType.NAME:
            v = ref.getName();
            break;
        case ReferenceFormType.OFFSET:
            v = ref.getOffset();
            break;
        case ReferenceFormType.PROPERTY:
            v = ref.getProperty();
            break;
        default:
            v = null;
    }

    return {refclass: typeIDToStringID(ref.getDesiredClass()), value: v};
}

// For non-recursive types, return the value.  Note unit types are
// returned as strings with the unit suffix, if you want just the number
// you'll need to strip off the type and convert it to Number()
// Note: This isn't a method because "desc" can either be an ActionDescriptor
// or an ActionList (in which case the "ID" is the index).
function getFlatType(desc, ID) {
    switch (desc.getType(ID)) {
        case DescValueType.BOOLEANTYPE:
            return desc.getBoolean(ID);
        case DescValueType.STRINGTYPE:
            return desc.getString(ID);
        case DescValueType.INTEGERTYPE:
            return desc.getInteger(ID);
        case DescValueType.DOUBLETYPE:
            return desc.getDouble(ID);
        case DescValueType.UNITDOUBLE:
            return getPSUnitValue(desc, ID);
        case DescValueType.ENUMERATEDTYPE:
            return typeIDToStringID(desc.getEnumerationValue(ID));
        case DescValueType.REFERENCETYPE:
            return getReference(desc.getReference(ID));
        case DescValueType.RAWTYPE:
            return desc.getData(ID);
        case DescValueType.ALIASTYPE:
            return desc.getPath(ID);
        case DescValueType.CLASSTYPE:
            return typeIDToStringID(desc.getClass(ID));
        default:
            return desc.getType(ID).toString();
    }
}

const ALL_LAYER_ATTRS = [
    'AGMStrokeStyleInfo',
    'adjustment',
    'background',
    'bounds',
    'boundsNoEffects',
    'channelRestrictions',
    'color',
    'count',
    'fillOpacity',
    'filterMaskDensity',
    'filterMaskFeather',
    'generatorSettings',
    'globalAngle',
    'group',
    'hasFilterMask',
    'hasUserMask',
    'hasVectorMask',
    'itemIndex',
    'layer3D',
    'layerEffects',
    'layerFXVisible',
    'layerSection',
    'layerID',
    'layerKind',
    'layerLocking',
    'layerSVGdata',
    'layerSection',
    'linkedLayerIDs',
    'metadata',
    'mode',
    'name',
    'opacity',
    'preserveTransparency',
    'smartObject',
    'targetChannels',
    'textKey',
    'useAlignedRendering',
    'useAlignedRendering',
    'userMaskDensity',
    'userMaskEnabled',
    'userMaskFeather',
    'userMaskLinked',
    'vectorMaskDensity',
    'vectorMaskFeather',
    'videoLayer',
    'visible',
    'visibleChannels',
    'XMPMetadataAsUTF8',
];

var keyErrorNumber = 0;