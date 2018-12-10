function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function colorObjToRgb(obj, opacity) {
    if (opacity === 100 || opacity === undefined) {
        return rgbToHex(obj.red, obj.green, obj.blue)
    }
    return `rgba(${obj.red}, ${obj.green}, ${obj.blue}, ${Math.round(opacity) / 100})`
}

function suffix() {
    return ';<br>'
}

export default function layerInfoToCSSText(info) {
    let cssInfo = {}

    if (info.width) {
        const width = info.borderWidth ? info.width - info.borderWidth * 2 : info.width
        cssInfo.width = `${width}px`
    }
    if (info.height) {
        const height = info.borderWidth ? info.height - info.borderWidth * 2 : info.height
        cssInfo.height = `${height}px`
    }
    if (info.borderColor) {
        cssInfo.border = `${info.borderWidth}px solid ${colorObjToRgb(info.borderColor, info.opacity)}`
    }
    if (info.fontSize) {
        cssInfo['font-size'] = `${info.fontSize}px`
    }

    const fontWeight = info.fontWeight
    if (fontWeight && fontWeight === 'Bold') {
        cssInfo['font-weight'] = `bold`
    }
    if (info.color) {
        cssInfo.color = `${colorObjToRgb(info.color, info.opacity)}`
    }
    if (info.borderRadius) {
        const borderRadius = info.borderRadius
        const br = borderRadius.topLeft
        if (br === borderRadius.topRight && br === borderRadius.bottomLeft && br === borderRadius.bottomRight) {
            cssInfo['border-radius'] = `${borderRadius.topLeft}`
        } else {
            cssInfo['border-radius'] = `${borderRadius.topLeft} ${borderRadius.topRight} ${borderRadius.bottomRight} ${borderRadius.bottomLeft}`
        }
    }
    if (info.backgroundColor) {
        cssInfo['background-color'] = `${colorObjToRgb(info.backgroundColor, info.opacity)}`
    }

    return Object.keys(cssInfo).reduce((text, key) => {
        return text + `${key}: ${cssInfo[key]}` + suffix()
    }, '')
}