/**
 * Created by sumhah on 18/2/8.
 */

class Rect {
    constructor(cssInfo) {
        this.name = cssInfo.name;
        this.x = cssInfo.left;
        this.y = cssInfo.top;
        this.width = cssInfo.width
        this.height = cssInfo.height
        this.area = this.width * this.height;
        this.x1 = this.x;
        this.y1 = this.y;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;
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

    isIntersect(rect) {
        // o1中间  o2外围
        // o2在左边  右边   上  下
        return !(this.x > rect.x2 || this.x2 < rect.x || this.y > rect.y2 || this.y2 < rect.y);
    };

    getIntersectArea(rect) {
        if (!this.isIntersect(rect)) {
            return 0;
        }
        let leftDownX = Math.max(this.x, rect.x);
        let leftDownY = Math.min(this.y2, rect.y2);
        let rightUpX = Math.min(this.x2, rect.x2);
        let rightUpY = Math.max(this.y, rect.y);
        return (rightUpX - leftDownX) * (leftDownY - rightUpY);
    };
}

module.exports = Rect;