/**
 * Created by zj-db0758 on 17/11/28.
 */
require('../setting');
require('../util/util');
require('../util/expand');

class Box {
    constructor(cssInfo) {
        this.name = cssInfo.name;

        // hack: 补正因border导致的坐标偏差
        let borderWidth = 0;
        if (cssInfo['border-width']) {
            borderWidth = parseFloat(cssInfo['border-width']);
            console.log(borderWidth);
        }
        this.x = parseFloat(cssInfo.left) + borderWidth / 2;
        this.y = parseFloat(cssInfo.top) + borderWidth;
        this.width = parseFloat(cssInfo.width);
        this.height = parseFloat(cssInfo.height);
        this.area = this.width * this.height;
        this.x1 = this.x;
        this.y1 = this.y;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;
        this.points = [
            {
                x: this.x,
                y: this.y,
            },
            {
                x: this.x2,
                y: this.y,
            },
            {
                x: this.x,
                y: this.y2,
            },
            {
                x: this.x2,
                y: this.y2,
            },
        ];
        this.parents = [];
        this.lateParent = null;
        this.sons = [];
        this.lateSons = [];
        // siblings 依赖于sons的数据 通过lateParent.sons来得到siblings
        this.siblings = [];
        this.YCloseSiblings = [];
        this.isConflict = false;
    }

    _getCorePoint() {
        return {
            x: this.x + this.width * 0.5,
            y: this.y + this.height * 0.5,
        };
    }

    isInMeInner(x, y) {
        const innerW = this.width * 0.8, innerH = this.height * 0.8;
        const corePoint = this._getCorePoint();
        const innerX = corePoint.x - innerW * 0.5;
        const innerY = corePoint.y - innerH * 0.5;
        const isXIn = x - innerX > 0 && x < innerX + innerW;
        const isYIn = y - innerY > 0 && y < innerY + innerH;
        return isXIn && isYIn;
    }

    isInMe(x, y) {
        const isXIn = x - this.x > 0 && x < this.x + this.width;
        const isYIn = y - this.y > 0 && y < this.y + this.height;
        return isXIn && isYIn;
    }

    isYieldToMe(item) {
        // 完全包含则通过
        // 不完全包含，暂时有相交且面积差距大即为true
        /**
         * todo 卫星类图层
         * 根据重叠面积 与 2个图层面积的比例
         * root无视面积，永远包含所有
         */
        if (this.name === 'root' && item.name !== 'root') {
            return true;
        }

        return this.isSon(item) || (isIntersect(item, this) && (this.area / item.area) > 1);
    }

    // todo 已被isYieldToMe代替
    isSon(obj) {
        const x1 = obj.x, x2 = obj.x + obj.width,
            y1 = obj.y, y2 = obj.y + obj.height;
        return this.isInMe(x1, y1) && this.isInMe(x1, y2) && this.isInMe(x2, y1) && this.isInMe(x2, y2);
    }

    addSon(son) {
        if (!this.sons.contain(son)) {
            this.sons.push(son);
        }
    }

    addParent(parent) {
        if (!this.parents.contain(parent)) {
            this.parents.push(parent);
        }
    }

    calcSonAndParent(arr) {
        arr.forEach((item) => {
            if (item !== this && item.isSon(this)) {
                item.addSon(this);
                this.addParent(item);
            }
        });
    }

    sortParents() {
        this.parents.sort((item1, item2) => {
            return item1.area - item2.area;
        });
    }

    calcLateParent() {
        const lateParent = this.parents[0];
        if (lateParent) {
            this.lateParent = lateParent;
            lateParent.addSon(this);
        }
    }

    calcLateSon() {
        this.sons.forEach((son) => {
            if (son.lateParent === this) {
                this.lateSons.push(son);
            }
        });
    }

    setLateParent(element) {
        this.lateParent = element;
    }

    _calcSiblings() {
        if (this.name === 'root') {
            this.siblings = [];
        } else {
            console.log(this.name);
            this.siblings = this.lateParent.lateSons;
        }
    }

    calcSibship() {
        // sons的数据已经通过Manager的calcSibship方法添加
        // 绑定所有元素的父子关系 ＝> 计算最近的儿子
        this._calcSiblings();
        this.lateSons.sort((item1, item2) => {
            if (distance(item1.y, item2.y) < 6) {
                return item1.x - item2.x;
            } else {
                return item1.y - item2.y;
            }
        });
        this.siblings.sort((item1, item2) => {
            if (distance(item1.y, item2.y) < 6) {
                return item1.x - item2.x;
            } else {
                return item1.y - item2.y;
            }
        });

        // 按DOM渲染顺序重排元素数组
        this.YCloseSiblings.sort((item1, item2) => {
            return item1.x - item2.x;
        });

        this._calcConflictSiblings();
    }

    _isConflict(item) {
        // 排除高度相同，坐标相同的情况
        if (this.y === item.y && this.y2 === item.y2) {
            return false;
        }

        // item顶部或底部在this里
        return pointIsInScope(item.y2, this.y, this.y2) || pointIsInScope(item.y1, this.y, this.y2);
    }

    _calcConflictSiblings() {
        // 冲突兄弟图层 => 都使用绝对定位，相对于其他元素像完全不存在一样
        this.siblings.filter(item => this._isConflict(item)).forEach((item) => {
            this.isConflict = true;
            item.isConflict = true;
        });
    }
}

module.exports = Box;