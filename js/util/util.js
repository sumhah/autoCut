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
    return rect.x2 >= p.x && rect.x1 <= p.x && rect.y2 >= p.y && rect.y1 <= p.y;
};

global.isIntersect = (o1, o2) => {
    const points = o1.points;
    return isInRect(points[0], o2) || isInRect(points[1], o2) || isInRect(points[2], o2) || isInRect(points[3], o2);
};

global.getIntersectArea = (box1, box2) => {
    if (!isIntersect(box1, box2)) {
        return 0;
    }

    let leftDownX = Math.max(box1.x, box2.x);
    let leftDownY = Math.min(box1.y2, box2.y2);
    let rightUpX = Math.min(box1.x2, box2.x2);
    let rightUpY = Math.max(box1.y, box2.y);

    console.log(box1.name, box2.name, (rightUpX - leftDownX) * (leftDownY - rightUpY));
    return (rightUpX - leftDownX) * (leftDownY - rightUpY);
};

global.pointIsInScope = (y, top, bottom) => {
    return y > top && y < bottom;
};

global.echoSpace = (n) => {
    return ' '.repeat(n);
};



