/*
 * 类式继承
 * 规则：
 * 子类继承父类的方法   然后调用父类方法来修改数据
 * 如果子类构造函数里没有初始化变量，就会修改父类里的静态变量
 * 如果子类定义了静态变量，而构造函数里没有，则会修改子类上的静态变量
 */
var Class;
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


Class = function (base, member) {
    if (!member) {
        member = base;
        base = null;
    }


    var S = member.Static;
    var proto = member;
    var F, k;


    if (base) {
        run_flag = false;
        proto = new base;
        run_flag = true;

        for (k in member) {
            if (member.hasOwnProperty(k)) {
                proto[k] = member[k];
            }
        }
    }

    //
    // 约定第一个function作为构造函数
    //
    for (k in member) {
        if (typeof member[k] === 'function') {
            break;
        }
    }

    F = constructor(member[k]);

    proto.constructor = F;
    F.prototype = proto;
    F.toString = toString('[class ' + k + ']');

    for (k in S) {
        if (S.hasOwnProperty(k)) {
            F[k] = S[k];
        }
    }

    return F;
};