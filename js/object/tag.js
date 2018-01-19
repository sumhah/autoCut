/**
 * Created by zj-db0758 on 17/3/17.
 */
require('../setting');
require('../util/util');
require('../util/expand');
const Box = require('./box');

// todo 绝对定位的元素内容递增的情况极少，可先使用:绝对定位继承关系

class Tag extends Box {
    constructor(cssInfo) {
        super(cssInfo);
        this.cssInfo = cssInfo;
        this.className = this.name;
        this.textContent = '';
        this.standardSiblings = [];
        this.zIndex = cssInfo['z-index'] ? parseInt(cssInfo['z-index']) : 0;
        this.type = this.getTagType(cssInfo);
        this.cssObj = {};
        this.cssArr = [];
        this.isRoot = this.name === 'root';
        this.inheritCssObj = {};
        this.borderWidth = 0;
        this.paddingTop = 0;
    }

    calcStardardSiblings() {
        this.standardSiblings = this.siblings.filter(item => !item.isConflict);
    }

    calcYCloseSiblings() {
        // 改动YCloseSiblings
        // YClose现在依赖于standardSiblings的有序
        // todo 此处的条件待改善
        this.YCloseSiblings = this.standardSiblings.filter(item => distance(item.y, this.y) <= 16);
    }

    getTagType(cssInfo) {
        if (cssInfo['font-size']) {
            return 'text';
        } else if (cssInfo['background-image'] && cssInfo['background-image'].indexOf('url(') !== -1) {
            return 'image';
        } else {
            return 'shape';
        }
    }

    calcCss() {
        // todo 有重构空间
        if (this.isRoot) {
            return;
        }

        this._setCssFromCssInfo();

        // 计算好所有关系之后，开始计算边距值
        if (!this.isAbsolute) {
            this._setPaddingTop();

            // 设置margin依赖于父元素的padding-top,因此itemArray必须由大到小遍历
            this._setMarginLeft();
            this._setMarginTop();
            this._setMarginRight();
            this._setMarginBottom();
        } else {
            this._setLeft();
            this._setTop();
            this._setRight();
            this._setBottom();
        }
    }

    _inheritPropFromParent(parent, prop) {
        if (parent.cssObj[prop] && !this.inheritCssObj[prop]) {
            this.inheritCssObj[prop] = parent.cssObj[prop];
        }
    };

    cleanCss() {
        if (this.isRoot) {
            return;
        }

        // 1.文本类型css继承, ------暂未使用
        // 如果已从父元素继承相同属性，不再声明某prop，----暂无使用
        this.parents.forEach(item => {
            INHERITABLE_PROP.forEach((prop) => {
                this._inheritPropFromParent(item, prop);
            });
        });

        // 2.搜索siblings里如果有两个相同的可继承属性，去掉子元素的属性，并且加到它的最近父元素上
        // 提取font-size会导致有空白节点，使计算产生偏差，暂时搁置
        // 存在2组重复会导致少的那组属性被删除，暂时搁置
        // todo sibligns里有2组重复的，取重复最高的组，其他组不上推
        const redundantProp = [];
        this.siblings.forEach(item => {
            INHERITABLE_PROP.forEach((prop) => {
                // 为不同元素，并且都存在某个属性的情况下才进行比较
                if (item !== this && this.cssObj[prop] && item.cssObj[prop]) {
                    if (item.cssObj[prop] === this.cssObj[prop]) {
                        delete item.cssObj[prop];
                        if (!redundantProp.contain(prop)) {
                            redundantProp.push(prop);
                        }
                    }
                }
            });
        });
        redundantProp.forEach(prop => {
            this.lateParent.cssObj[prop] = this.cssObj[prop];
            delete this.cssObj[prop];
        });


        // todo 搜索siblings里如果有相同的不可继承属性， 用相同类名声明
    }

    setPosition() {
        if (this.isRoot) {
            this.isAbsolute = false;
            console.log(this);
            return;
        }

        if (MODE === 'absolute') {
            this.isAbsolute = true;
            return;
        }

        if (this.lateParent.isAbsolute) {
            this.isAbsolute = true;
        } else {
            this.isAbsolute = this.isConflict;
        }
    }

    _setPaddingTop() {
        if (this.lateSons.some(son => !son.isAbsolute)) {
            // padding-top用来防止margin-top溢出
            this.paddingTop = 4;
        }
    }

    _setMarginLeft() {
        // 如果该元素是同一水平线上的第一个元素
        if (this === this.YCloseSiblings.first()) {
            this.marginLeft = this.x - this.lateParent.x;
        } else {
            this.marginLeft = this.x - this.YCloseSiblings.prev(this).x2;
        }
    }

    _setMarginRight() {
        // 如果是最右边的元素，也就是同一排的最后一个
        if (this === this.YCloseSiblings.last()) {
            // 右边距减去4，并且不小于0
            this.marginRight = Math.max(this.lateParent.x2 - this.x2 - 2, 0);
        }
    }

    _setMarginBottom() {
        // 只有唯一子元素才用到这个属性
        if (this.siblings.isOnlyOne()) {
            this.marginBottom = this.lateParent.y2 - this.y2;
        }
    }

    _setMarginBlockCenter() {
        if (distance(this.marginLeft, this.marginRight) < 3) {
            this.cssObj['display'] = 'block';
            this.cssObj['margin-left'] = 'auto';
            this.cssObj['margin-right'] = 'auto';
        }
    }

    _setMarginTop() {
        // 一直向上找第一个不是同一水平线的元素，如果找不到就返回父元素的y坐标，如果没有父元素就返回0
        // todo 只能支持一排平行的情况，无法应对上一排最后一个元素高度错落的情况
        const aboveSibling = this.standardSiblings.prevAll(this).reverse().find(item => !this.YCloseSiblings.contain(item));
        if (aboveSibling) {
            this.marginTop = (this.y + this.borderWidth) - (aboveSibling.y2);
        } else {
            this.marginTop = (this.y + this.borderWidth) - this.lateParent.y - this.lateParent.paddingTop;
        }
    }

    _setLeft() {
        this.left = this.x - this.lateParent.x + this.lateParent.borderWidth;
    }

    _setTop() {
        this.top = this.y - this.lateParent.y - this.lateParent.borderWidth;
    }

    _setRight() {
        this.right = (this.lateParent.x2 + this.lateParent.borderWidth) - this.x2;
    }

    _setBottom() {
        this.bottom = (this.lateParent.y2 + this.lateParent.borderWidth) - this.y2;
    }

    _getCssWidth() {
        return this.width - this.borderWidth * 2;
    }

    _getCssHeight() {
        return this.height - this.paddingTop - this.borderWidth * 2;
    }

    _absorbPropFromCssInfo(prop) {
        const cssInfo = this.cssInfo;
        if (cssInfo[prop]) {
            this.cssObj[prop] = cssInfo[prop];
        }
    }

    _setCssFromCssInfo() {
        const cssInfo = this.cssInfo;
        switch (this.type) {
            case 'text':
                [
                    'font-size',
                    // 'line-height',
                    'color'
                ].forEach(prop => this._absorbPropFromCssInfo(prop));

                //set text content
                const fontSize = parseFloat(cssInfo['font-size']);
                const fontNumberPerLine = Math.floor(this.width / fontSize);
                const lineNumber = Math.floor(this.height / (fontSize * parseFloat(cssInfo['line-height'])));

                if (this.cssInfo['text-content']) {
                    this.textContent = this.cssInfo['text-content'].replace(/\r/g, '<br>');
                } else {
                    this.textContent = '哈'.repeat(fontNumberPerLine * Math.max(1, lineNumber));
                }
                break;
            case 'image':
                this.cssObj['background-image'] = `url('../images/${this.name}.png')`;
                this.cssObj['background-size'] = '100%';
                break;
            case 'shape':
                [
                    'border',
                    'border-style',
                    'border-width',
                    'border-color',
                    'border-left',
                    'border-top',
                    'border-right',
                    'border-bottom',
                    'border-radius',
                    'background-image',
                    'background-color',
                    'box-shadow',
                ].forEach(prop => this._absorbPropFromCssInfo(prop));

                if (this.cssObj['border-style']) {
                    this.cssObj['border'] = `${this.cssObj['border-width']} ${this.cssObj['border-style']} ${this.cssObj['border-color']}`;
                    this.borderWidth = parseFloat(this.cssObj['border-width']);
                    delete this.cssObj['border-width'];
                    delete this.cssObj['border-style'];
                    delete this.cssObj['border-color'];
                }
                break;
        }
    }

    setCssObj() {
        // todo 存在高度重复的css属性 和 html，但不能在这个类处理，应交给tagCleaner
        /**
         * tagCleaner工作包含:
         * 1.复用css
         * 2.去除多余的css属性 √
         * 3.对每个类的属性进行排序 √
         */
        // todo tagCleaner => tagOutputTool

        // 文字图层暂不输出宽度，待精准判断后智能缩放宽度再开启
        if (this.type !== 'text') {
            this.cssObj['width'] = this._getCssWidth().toUnit();
        }
        this.cssObj['height'] = this._getCssHeight().toUnit();

        if (this.isRoot) {
            this.cssObj['position'] = 'relative';
            this.cssObj['overflow'] = 'hidden';
            this.cssObj['margin-left'] = 'auto';
            this.cssObj['margin-right'] = 'auto';
            this.cssObj['background-image'] = `url('../images/bg.png')`;
            this.cssObj['background-size'] = `100%`;
            return;
        }

        // 元素不是绝对定位的盒子
        if (!this.isAbsolute) {
            if (this.YCloseSiblings.length > 1) {
                this.cssObj['display'] = 'inline-block';
                this.cssObj['vertical-align'] = 'top';
            }

            // 仅在存在标准流的子元素才需padding-top
            if (this.paddingTop > 0) {
                this.cssObj['padding-top'] = this.paddingTop.toUnit();
            }
            this.cssObj['margin-top'] = this.marginTop.toUnit();
            this.cssObj['margin-left'] = this.marginLeft.toUnit();

            if (this.marginRight && this.cssObj['display'] === 'inline-block') {
                this.cssObj['margin-right'] = this.marginRight.toUnit();
            }

            // todo 方法位置不对，应在cssObj调用之前
            this._setMarginBlockCenter();

            // 子元素有绝对定位，附加relative
            if (this.lateSons.some(item => item.isAbsolute)) {
                this.cssObj['position'] = 'relative';
            }
        } else {
            // 元素是绝对定位的盒子
            this.cssObj['position'] = 'absolute';
            this.cssObj['left'] = distance(this.left, this.right) < 2 ? '50%' : this.left.toUnit();
            this.cssObj['top'] = distance(this.top, this.bottom) < 2 ? '50%' : this.top.toUnit();

            if (this.cssObj['left'] === '50%' && this.cssObj['top'] === '50%') {
                this.cssObj['transform'] = 'translate(-50%, -50%)';
            } else if (this.cssObj['left'] === '50%') {
                this.cssObj['transform'] = 'translate(-50%, 0)';
            } else if (this.cssObj['top'] === '50%') {
                this.cssObj['transform'] = 'translate(0, -50%)';
            }
        }
    }

    _setCssArr() {
        const cssObj = this.cssObj;
        this.cssArr = Object.keys(cssObj).map(item => ({
            prop: item,
            value: cssObj[item],
        })).sort((item1, item2) => {
            return CSS_ORDER.indexOf(item1.prop) - CSS_ORDER.indexOf(item2.prop);
        });
    }

    echoHTML(indent = 0) {
        const sonsHTML = this.lateSons.reduce((prev, son) => {
            return prev + son.echoHTML(indent + HTML_INDENT);
        }, ``);
        const closeTag = sonsHTML ? `\n${echoSpace(indent)}</div>` : `</div>`;
        return `\n${echoSpace(indent)}<div class="${this.className}">${this.textContent}${sonsHTML}${closeTag}`;
    }

    echoCSS(indent = 0) {
        this._setCssArr();
        const start = `${echoSpace(indent)}.${this.className} {`;
        const echoCssArr = (cssArr) => {
            return `${cssArr.reduce((prev, item) => {
                return prev + `\n${echoSpace(indent + CSS_INDENT)}${item.prop}: ${item.value};`;
            }, ``)}`;
        };
        const end = `${echoSpace(indent)}}\n`;

        const sonsCSS = this.lateSons.reduce((prev, son) => {
            return prev + son.echoCSS(indent + CSS_INDENT).css;
        }, ``);
        const sonsSCSS = this.lateSons.reduce((prev, son) => {
            return prev + son.echoCSS(indent + CSS_INDENT).scss;
        }, ``);
        const css = start + echoCssArr(this.cssArr) + '\n' + end + `\n${sonsCSS}`;
        const scss = '\n' + start + echoCssArr(this.cssArr) + `\n${sonsSCSS}` + end;

        return {
            css,
            scss,
        };
    }

}

module.exports = Tag;