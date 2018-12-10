function simpleClone(obj) {
    let newObj = {};
    for (let key of Object.keys(obj)) {
        newObj[key] = obj[key];
    }
    return newObj;
}

const CSS_ORDER = [
    'z-index',
    'box-sizing',
    'position',
    'display',
    'left',
    'top',
    'right',
    'bottom',
    'width',
    'min-width',
    'max-width',
    'height',
    'min-height',
    'max-height',
    'padding',
    'padding-left',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'border',
    'border-style',
    'border-width',
    'border-color',
    'border-left',
    'border-top',
    'border-right',
    'border-bottom',
    'margin',
    'margin-left',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'border-radius',
    'overflow',
    'vertical-align',
    'font',
    'font-size',
    'line-height',
    'text-align',
    'letter-spacing',
    'color',
    'background',
    'background-image',
    'background-size',
    'background-color',
    'box-shadow',
    'transform',
    'animation',
    'transition',
];

let cssParser = {
    rawStr: '',
    compressStr: '',
    segmentedElementsStr: [],
    segmentedElements: [],
    convertedElements: [],
    cssArrays: [],
    resultStr: '',

    clearSpace() {
        this.compressStr = this.rawStr.replace(/\s*/g, '');
        return this;
    },
    splitToClasses() {
        this.segmentedElementsStr = this.compressStr.match(/\.[\w-]*{.+}/ig);
        return this;
    },
    parseClassesStr() {
        this.segmentedElements = this.segmentedElementsStr.map((item) => {
            let className = item.match(/.+(?={)/)[0];
            let str2 = item.match(/{.+(?=})/)[0].substr(1);
            let arr = str2.split(';');
            let obj = {};
            arr.forEach(function (item) {
                if (item.length > 1) {
                    let arr = item.split(':');
                    obj[arr[0]] = arr[1];
                }
            });
            obj.className = className;
            return obj;
        });
        return this;
    },
    convertSegmentsUnit(toUnit) {
        let startUnit, endUnit, ratio;
        if (toUnit === 'toRem') {
            startUnit = 'px';
            endUnit = 'rem';
            ratio = 1 / 40;
        } else if (toUnit === 'toPx') {
            startUnit = 'rem';
            endUnit = 'px';
            ratio = 40;
        } else {
            throw 'unit must be "toRem" or "toPx"';
        }
        this.convertedElements = this.segmentedElements.map((item) => {
            let newItem = simpleClone(item);
            for (let key of Object.keys(newItem)) {
                let value = newItem[key], num;
                if (value.indexOf(startUnit) !== -1) {
                    num = parseFloat(value.substring(0, value.indexOf(startUnit)));
                    newItem[key] = num * ratio + endUnit;
                }
            }
            return newItem;
        });
        return this;
    },
    clearUselessProp() {
        this.segmentedElements.forEach(item => {
            delete item['z-index'];
        });

        return this;
    },
    sort() {
        this.cssArrays = this.segmentedElements.map(cssObj => {
            delete cssObj['className'];
            return Object.keys(cssObj).map(item => ({
                prop: item,
                value: cssObj[item],
            })).sort((item1, item2) => {
                return CSS_ORDER.indexOf(item1.prop) - CSS_ORDER.indexOf(item2.prop);
            });
        });

        return this;
    },
    mergeAllElements() {
        this.resultStr = this.cssArrays.reduce((result, cssArr) => {
            const echoCssArr = (cssArr) => {
                return `${cssArr.reduce((prev, item) => {
                    return prev + `${item.prop}: ${item.value};\n`;
                }, ``)}`;
            };
            return `${result}${echoCssArr(cssArr)}`;
        }, ``);
        return this;
    },
    parse(str, method) {
        this.rawStr = str;
        this.clearSpace()
            .splitToClasses()
            .parseClassesStr()
            .clearUselessProp()
            .sort()
            .mergeAllElements();
        console.log(this);
        return this.resultStr;
    },
};