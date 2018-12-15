
require('../setting');

Object.prototype.extend = function (obj) {
    for (let key of Object.keys(obj)) {
        this.prototype[key] = obj[key];
    }
};

Number.extend({
    toUnit() {
        return `${Math.round(Number(this))}px`;
    }
});

Array.extend({
    remove(val) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] === val) {
                this.splice(i, 1);
                return this;
            }
        }
    },

    isEmpty() {
        return this.length <= 0;
    },

    first() {
        return this[0];
    },

    last() {
        return this[this.length - 1];
    },

    isOnlyOne() {
        return this.length === 1;
    },

    contain(obj) {
        let i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    },

    prev(item) {
        return this[this.indexOf(item) - 1];
    },

    prevAll(item) {
        return this.slice(0, this.indexOf(item));
    },

    min(prop) {
        if (this.isEmpty()) {
            return false;
        }
        let minItem = this[0];
        for (let item of this) {
            if (item[prop] < minItem[prop]) {
                minItem = item;
            }
        }
        return minItem;
    },

    max(prop) {
        if (this.isEmpty()) {
            return false;
        }
        let maxItem = this[0];
        for (let item of this) {
            if (item[prop] > maxItem[prop]) {
                maxItem = item;
            }
        }
        return maxItem;
    },
});


