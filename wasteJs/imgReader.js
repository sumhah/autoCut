/**
 * Created by zj-db0758 on 17/11/28.
 */
const ColorProcessor = require('./colorProcessor');
require('../util/util');

class ImgReader {
    constructor(data) {
        this.name = data.name;
        this.x = -1;
        this.y = -1;
        this.width = data.width;
        this.height = data.height;
        this.imgSrc = data.imgSrc;
        this.data = data.data;
        this.pixels = data.pixels;
        this.root = null;
        this.imageInfo = new ColorProcessor(this.data, this.width, this.height, this.name);
        this.shouldBeAvoidPixels = [];
        this.shouldBeAvoidCoordinates = [];
    }

    getRgbaObj(x, y) {
        const pixels = this.pixels;
        return {
            r: pixels.get(x, y, 0),
            g: pixels.get(x, y, 1),
            b: pixels.get(x, y, 2),
            a: pixels.get(x, y, 3),
        };
    }

    setRoot(root) {
        this.root = root;
    }

    setShouldBeAvoidPixels(arr) {
        this.shouldBeAvoidPixels = arr;
    }

    addShouldBeAvoidCoordinates(coordinate) {
        this.shouldBeAvoidCoordinates.push(coordinate);
    }

    isShouldBeAvoidPixels(color) {
        return this.shouldBeAvoidPixels.some(pixel => {
            return isRgbaEqual(pixel, color);
        });
    };

    isShouldBeAvoidCoordinates(x, y) {
        return this.shouldBeAvoidCoordinates.some(pixel => {
            return isInRect({x, y}, pixel);
        });
    }

    isDeepMatch(imgOriginX, imgOriginY, diffRange) {
        let matchLength = 0,
            total = 0;

        const root = this.root;
        for (let imgRelativeX = 0; imgRelativeX < this.width; imgRelativeX += 1) {
            for (let imgRelativeY = 0; imgRelativeY < this.height; imgRelativeY += 1) {
                // x,y为图片的相对坐标, 换算到root 要加上originXY
                const inRootX = imgRelativeX + imgOriginX;
                const inRootY = imgRelativeY + imgOriginY;
                const rootRgba = root.getRgbaObj(inRootX, inRootY);
                const currentRgba = this.getRgbaObj(imgRelativeX, imgRelativeY);
                if (rootRgba.a === 255 && currentRgba.a === 255 && !this.isShouldBeAvoidCoordinates(inRootX, inRootY)) {
                    total += 1;
                    if (isRgbSimilar(rootRgba, currentRgba, diffRange)) {
                        matchLength += 1;
                    }

                    if (total > 10 && matchLength / total < 0.8) {
                        return false;
                    }
                }
            }
        }

        console.log('diff:', total - matchLength, matchLength / total);

        return matchLength / total > 0.95;
    }

    searchEqual(basePoint, diffRange) {
        const root = this.root;
        const basePointRgba = basePoint.rgba;
        const basePointOffsetX = basePoint.offsetX;
        const basePointOffsetY = basePoint.offsetY;
        let searchNum = 0;
        for (let rootX = 0; rootX < root.width; rootX += 1) {
            for (let rootY = 0; rootY < root.height; rootY += 1) {
                // 匹配与基准像素点相同的像素 -> 进行深度匹配
                // 注意: 这里之前版本的基准像素点没有忽略a通道不为255的情况，可能导致匹配错误
                const rootPointRgba = root.getRgbaObj(rootX, rootY);
                if (isRgbSimilar(rootPointRgba, basePointRgba, diffRange)) {
                    searchNum += 1;
                    const imgX = rootX - basePointOffsetX;
                    const imgY = rootY - basePointOffsetY;
                    // 像素相等之后，根据图片的基准像素点的偏移进行修正，从图片左上角开始匹配
                    if (this.isDeepMatch(imgX, imgY, diffRange)) {
                        this.x = imgX;
                        this.y = imgY;
                        console.log(this.x, this.y);
                        return true;
                        // 匹配成功
                    }
                }
            }
        }
        console.log('match failed! deep match num:', searchNum, `diffRange:${diffRange}`);
        return false;
    }

    getBasePoint() {
        // 找到基准像素点
        // 避免高频像素纯粹为了提高解析速度，没有其他优点
        // 只要是不透明且在元素内的像素点，都应该能与root图匹配
        let basePoint;
        const highPoints = [];
        for (let x = 0; x < this.width; x += 1) {
            for (let y = 0; y < this.height; y += 1) {
                const rgba = this.getRgbaObj(x, y);
                const point = {
                    rgba,
                    offsetX: x,
                    offsetY: y,
                };

                if (this.isShouldBeAvoidPixels(rgba)) {
                    highPoints.push(point);
                } else if (rgba.a === 255) {
                    basePoint = point;
                }
            }
        }

        if (!basePoint) {
            const highPoint = highPoints[0];
            if (highPoint) {
                basePoint = highPoint;
                console.warn(`${this.name}使用了root图里的高频像素。`);
            } else {
                console.error(`${this.name}无基准点可使用！`);
            }
        }

        return basePoint;
    }

    parse() {
        const basePoint = this.getBasePoint();
        for (let range = 0; range <= 60; range += 20) {
            if (this.searchEqual(basePoint, range)) {
                return true;
            }
        }
        return false;
    }
}

module.exports = ImgReader;