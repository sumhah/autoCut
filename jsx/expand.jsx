
Array.prototype.forEach = function (callback) {
    for (var i = 0, len = this.length; i < len; i += 1) {
        callback(this[i], i, len);
    }
    return this;
};

Array.prototype.filter = function (callback) {
    var subArr = [];
    this.forEach(function (item, i, len) {
        if (callback(item, i, len)) {
            subArr.push(item);
        }
    });
    return subArr;
};

Array.prototype.some = function (callback) {
    var isHave = false;
    this.forEach(function (item, i, len) {
        if (callback(item, i, len)) {
            isHave = true;
        }
    });
    return isHave;
};

Array.prototype.every = function (callback) {
    var isHave = true;
    this.forEach(function (item, i, len) {
        if (!callback(item, i, len)) {
            isHave = false;
        }
    });
    return isHave;
};

Array.prototype.map = function (callback) {
    var subArr = [];
    this.forEach(function (item, i, len) {
        subArr.push(callback(item, i, len));
    });
    return subArr;
};

Array.prototype.sort = function (fun) {
    for (var i = 0; i < this.length - 1; i++) {
        var flag = true;
        for (var j = 0; j < this.length - i - 1; j++) {
            if (typeof fun == 'function') {
                if (fun(this[j], this[j + 1]) > 0) {
                    //交换
                    flag = false;
                    var temp;
                    temp = this[j];
                    this[j] = this[j + 1];
                    this[j + 1] = temp;
                }
            } else {
                if (this[j] > this[j + 1]) {
                    //交换
                    flag = false;
                    var temp;
                    temp = this[j];
                    this[j] = this[j + 1];
                    this[j + 1] = temp;
                }
            }
        }
        if (flag) {
            break;
        }
    }
    return this;
};

Array.prototype.logName = function () {
    var names = '';
    this.forEach(function (item) {
        names += '\n' + item.layer.name;
    });
    alert(names);
};