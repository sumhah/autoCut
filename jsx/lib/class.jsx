/*
 * 类式继承
 * 规则：
 * 子类继承父类的方法   然后调用父类方法来修改数据
 * 如果子类构造函数里没有初始化变量，就会修改父类里的静态变量
 * 如果子类定义了静态变量，而构造函数里没有，则会修改子类上的静态变量
 */
var run_flag = true;

function constructor(init) {
    return function () {
        if (run_flag) {
            init.apply(this, arguments);
        }
    };
}

function toString(str) {
    return function () {
        return str;
    };
}

var Class = function (base, member) {
    if (!member) {
        member = base;
        base = null;
    }

    var staticMembers = member.Static;
    var proto = member;
    var constructorFunction, key;

    if (base) {
        run_flag = false;
        proto = new base;
        run_flag = true;

        for (key in member) {
            if (member.hasOwnProperty(key)) {
                proto[key] = member[key];
            }
        }
    }

    for (key in member) {
        if (typeof member[key] === 'function') {
            break;
        }
    }

    constructorFunction = constructor(member[key]);

    proto.constructor = constructorFunction;
    constructorFunction.prototype = proto;
    constructorFunction.toString = toString('[class ' + key + ']');

    if (staticMembers) {
        for (key in staticMembers) {
            if (staticMembers.hasOwnProperty(key)) {
                constructorFunction[key] = staticMembers[key];
            }
        }
    }

    return constructorFunction;
};