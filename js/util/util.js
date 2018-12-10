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

global.valueIsInScope = (y, top, bottom) => {
    return y > top && y < bottom;
};

global.echoSpace = (n) => {
    return ' '.repeat(n);
};

global.rgbObjToCSS = ({red, green, blue}, opacity) => {
    if (opacity !== 100) {
        return `rgba(${red}, ${green}, ${blue}, ${(opacity / 100).toFixed(4)})`
    }

    return `rgb(${red}, ${green}, ${blue})`
}



