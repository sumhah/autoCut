/**
 * Created by zj-db0758 on 17/3/20.
 */

global.square = (n) => {
    return Math.pow(n, 2);
};

global.abs = (n) => {
    return Math.abs(n);
};

global.distance = (num1, num2) => {
    return abs(num1 - num2);
};

global.spend = (fn, name) => {
    const start = Date.now();
    fn();
    console.log(name, ': ', `${Date.now() - start}ms`);
};

// 在矩形边界线也算在矩形里
global.isInRect = (p, rect) => {
    console.log(rect.x2 >= p.x && rect.x1 <= p.x && rect.y2 >= p.y && rect.y1 <= p.y);
    return rect.x2 >= p.x && rect.x1 <= p.x && rect.y2 >= p.y && rect.y1 <= p.y;
};

global.isIntersect = (o1, o2) => {
    const points = o1.points;
    return isInRect(points[0], o2) || isInRect(points[1], o2) || isInRect(points[2], o2) || isInRect(points[3], o2);
};

global.pointIsInScope = (y, top, bottom) => {
    return y > top && y < bottom;
};

global.echoSpace = (n) => {
    return ' '.repeat(n);
};



