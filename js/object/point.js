/**
 * Created by sumhah on 18/2/8.
 */

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // 在矩形边界线也算在矩形里
    isInRect(rect) {
        return rect.x2 >= this.x && rect.x1 <= this.x && rect.y2 >= this.y && rect.y1 <= this.y;
    }
}