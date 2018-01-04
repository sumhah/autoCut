/**
 * Created by zj-db0758 on 17/12/16.
 */

global.echoUnit = value => `${value}px`;

global.rand255 = () => {
    return Math.floor(Math.random() * 255);
};

global.rgbToHex = (r, g, b) => {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

global.rgbObjToHex = (rgbObj) => {
    return rgbToHex(rgbObj.r, rgbObj.g, rgbObj.b);
};

global.pixelsToRgbaObj = (pixels, x, y) => {
    const r = pixels.get(x, y, 0);
    const g = pixels.get(x, y, 1);
    const b = pixels.get(x, y, 2);
    const a = pixels.get(x, y, 3);

    return {
        r,
        g,
        b,
        a,
    };
};

global.isRgbaEqual = (o1, o2) => {
    return o1.r === o2.r && o1.g === o2.g && o1.b === o2.b && o1.a === o2.a;
};

global.isRgbEqual = (o1, o2) => {
    return o1.r === o2.r && o1.g === o2.g && o1.b === o2.b;
};

global.isRgbSimilar = (o1, o2, diffRange) => {
    return distance(o1.r, o2.r) <= diffRange && distance(o1.g, o2.g) <= diffRange && distance(o1.b, o2.b) <= diffRange;
};

global.isPixelsSomePointRgbaEqual = (p1, x1, y1, p2, x2, y2) => {
    return p1.get(x1, y1, 0) === p2.get(x2, y2, 0) && p1.get(x1, y1, 1) === p2.get(x2, y2, 1) && p1.get(x1, y1, 2) === p2.get(x2, y2, 2) && p1.get(x1, y1, 3) === p2.get(x2, y2, 3);
};

global.loadUploadImage = (e) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = () => {
            const img = new Image();
            img.src = reader.result;
            resolve(img);
        };
    });
};

global.wait = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

