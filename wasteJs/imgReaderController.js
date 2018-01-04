/**
 * Created by zj-db0758 on 17/11/29.
 */
const ImgReader = require('./imgReader');
const Manager = require('../manager');
require('../util/arrayExpand');

class ImgReaderController {
    constructor(images) {
        this.imgReaderArr = images.map(item => new ImgReader(item));
        this.root = this.pop('root');
        this.bg = this.pop('bg');
        this.shouldBeAvoidPixels = [];
        this.shouldBeAvoidCoordinates = [];
    }

    start() {
        spend(() => {
            this.setShouldBeAvoidPixels();
            this.setImgReaderRoot();

            // 从小到大排序 配合避开的坐标
            try {
                this.imgReaderArr.sort((item1, item2, array) => {
                    return item1.width * item1.height - item2.width * item2.height;
                }).forEach((imgReader, i, array) => {
                    console.log(`${i + 1}/${array.length}, currentImage: ${imgReader.name}`);

                    spend(() => {
                        if (!imgReader.parse()) {
                            throw `${imgReader.name}: 匹配失败，程序退出！`;
                        }
                    }, imgReader.name);
                    array.forEach((item) => {
                        item.addShouldBeAvoidCoordinates({
                            x1: imgReader.x,
                            y1: imgReader.y,
                            x2: imgReader.x + imgReader.width,
                            y2: imgReader.y + imgReader.height,
                        });
                    });
                });
            }
            catch (e) {
                console.error(e);
            }


        }, 'match');
        return this;
    }

    setShouldBeAvoidPixels() {
        this.shouldBeAvoidPixels = this.root.imageInfo.orderedColorObjArr;
        this.imgReaderArr.forEach((imgReader) => {
            imgReader.setShouldBeAvoidPixels(this.shouldBeAvoidPixels);
        });
    }

    setImgReaderRoot() {
        this.imgReaderArr.forEach((imgReader) => {
            imgReader.setRoot(this.root);
        });
    }

    pop(name) {
        const imgReaderArr = this.imgReaderArr;
        const index = imgReaderArr.findIndex(imgReader => imgReader.name === name);
        return imgReaderArr.splice(index, 1)[0];
    }

    output() {
        return {
            root: this.root,
            imgReaderArr: this.imgReaderArr,
            bg: this.bg,
        };
    }
}

module.exports = ImgReaderController;