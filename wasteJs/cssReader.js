/**
 * Created by zj-db0758 on 17/12/9.
 */
const css2json = require('css2json');

class CssReader {
    constructor(cssText) {
        this.json = css2json(cssText);
        this.cssArr = Object.keys(this.json).map((cssSelector) => {
            const cssProp = this.json[cssSelector];
            const info = {
                name: cssSelector.replace('.', ''),
            };
            // 可再进一步简化
            Object.keys(cssProp).forEach(prop => info[prop] = cssProp[prop]);
            return info;
        });

        console.log(this);
    }

    getCssInfo() {
        return this.cssArr;
    }
}

module.exports = CssReader;