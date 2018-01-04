/**
 * Created by zj-db0758 on 17/3/22.
 */

class ColorProcessor {
    constructor(imageDataArr, width, height, className) {
        this.dataArr = imageDataArr;
        this.width = width;
        this.height = height;
        this.className = className;
        this.rgbCountObj = {};
        this.orderedColors = [];
        this.orderedColorObjArr = [];
        this.elementType = 'normal';
        this.cssInfo = {};
        this.count();
        this.sort();
        this.recognize();
    }

    count() {
        const rgbCountObj = this.rgbCountObj;
        const dataArr = this.dataArr;

        for (let i = 0, len = dataArr.length / 4; i < len; i += 1) {
            const j = i * 4;
            const r = dataArr[j],
                g = dataArr[j + 1],
                b = dataArr[j + 2],
                a = dataArr[j + 3];
            const rgba = `${r},${g},${b},${a}`;
            if (rgbCountObj[rgba]) {
                rgbCountObj[rgba] += 1;
            } else {
                rgbCountObj[rgba] = 1;
            }
        }
    }

    sort() {
        const rgbCount = this.rgbCountObj;
        this.orderedColors = Object.keys(this.rgbCountObj).sort((key1, key2) => {
            return rgbCount[key2] - rgbCount[key1];
        }).slice(0, 100);

        // 忽略a通道
        this.orderedColorObjArr = this.orderedColors.map((item) => {
            const arr = item.split(',').map(item => parseInt(item, 10));
            return {
                r: arr[0],
                g: arr[1],
                b: arr[2],
                a: arr[3],
            };
        }).filter(item => item.a === 255);
    }

    recognize() {
        if (this.orderedColorObjArr.length === 1 && this.orderedColors.length > 3 && this.className.indexOf('icon') === -1 && false) {
            this.elementType = 'name';
            this.extractText();
        }
    }

    extractText() {
        const lineInfo = this.getImageLinesInfo();
        this.cssInfo.color = this.orderedColorObjArr[0];
        this.cssInfo.fontSize = Math.max(...lineInfo['true']);
        this.cssInfo.lineHeight = this.cssInfo.fontSize + Math.max(...lineInfo['false']);
    }

    getPointRgb(x, y) {
        const dataArr = this.dataArr;
        const start = (y * this.width + x) * 4;
        return {
            r: dataArr[start],
            g: dataArr[start + 1],
            b: dataArr[start + 2],
        };
    }

    isSomeLineHasRgb(y, rgb) {
        for (let i = 0, w = this.width; i < w; i += 1) {
            if (isRgbEqual(this.getPointRgb(i, y), rgb)) {
                return true;
            }
        }
        return false;
    }

    getImageLinesInfo() {
        const lineInfo = {
                'true': [0],
                'false': [0],
            },
            typeIndex = {
                'true': 0,
                'false': 0,
            };
        let last = 'none';
        for (let i = 0, len = this.height, rgb = this.orderedColorObjArr[0]; i < len; i += 1) {
            const type = this.isSomeLineHasRgb(i, rgb);
            if (last !== type && i > 0) {
                typeIndex[last] += 1;
                lineInfo[last][typeIndex[last]] = 0;
            }
            lineInfo[type][typeIndex[type]] += 1;
            last = type;
        }
        return lineInfo;
    }

    getMaxColor() {
        return this.orderedColors[0];
    }

    getNthColor(n) {
        return this.orderedColors[n - 1];
    }

    echoInfo() {
        const rgbCount = this.rgbCountObj;
        this.orderedColors.forEach((item) => {
            console.log(`"${item}": ${rgbCount[item]}`);
        });
    }
}

module.exports = ColorProcessor;