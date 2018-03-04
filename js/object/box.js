/**
 * Created by zj-db0758 on 17/11/28.
 */
require('../setting');
require('../util/util');
require('../util/expand');
const Rect = require('./rect');

class Box extends Rect {
    constructor(cssInfo) {
        super(cssInfo);
        this.parents = [];
        this.lateParent = null;
        this.sons = [];
        this.lateSons = [];
        // siblings 依赖于sons的数据 通过lateParent.sons来得到siblings
        this.siblings = [];
        this.standardSiblings = [];
        this.YCloseSiblings = [];
        this.isConflict = false;
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

        return this.area > item.area && this.getIntersectArea(item) / item.area > INTERSECTION_AREA_RATIO;
    }

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
            if (item !== this && item.isYieldToMe(this)) {
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
            // console.log(this.name, this, this.lateParent);
            this.siblings = this.lateParent.lateSons;
        }
    }

    calcSibship() {
        // sons的数据已经通过Manager的calcSibship方法添加
        // 绑定所有元素的父子关系 ＝> 计算最近的儿子
        this._calcSiblings();
        this.lateSons.sort((item1, item2) => {
            if (distance(item1.y, item2.y) < HORIZONTAL_CRITICAL_VALUE) {
                return item1.x - item2.x;
            } else {
                return item1.y - item2.y;
            }
        });
        this.siblings.sort((item1, item2) => {
            if (distance(item1.y, item2.y) < HORIZONTAL_CRITICAL_VALUE) {
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
        return valueIsInScope(item.y2, this.y, this.y2) || valueIsInScope(item.y1, this.y, this.y2);
    }

    _calcConflictSiblings() {
        // 冲突兄弟图层 => 都使用绝对定位，相对于其他元素像完全不存在一样
        this.siblings.filter(item => this._isConflict(item)).forEach((item) => {
            this.isConflict = true;
            item.isConflict = true;
        });
    }

    calcStandardSiblings() {
        this.standardSiblings = this.siblings.filter(item => !item.isConflict);
    }

    calcYCloseSiblings() {
        // 改动YCloseSiblings
        // YClose现在依赖于standardSiblings的有序
        // todo 此处的条件待改善
        this.YCloseSiblings = this.standardSiblings.filter(item => distance(item.y, this.y) <= 16);
    }
}

module.exports = Box;