/**
 * Created by zj-db0758 on 17/3/20.
 */
const addCssToStyleSheet = function (className, cssObj) {

    const styleEles = document.getElementsByTagName("style");
    if (styleEles.length == 0) {
        const tempStyle = document.createElement("style");
        tempStyle.setAttribute("type", "name/css");
        document.getElementsByTagName("head")[0].appendChild(tempStyle);
    }

    //如果页面中没有STYLE标签，则在HEAD中插入STYLE标签
    const styleEle = styleEles[0];

    let cssPropText = ``;
    for (let cssProp of Object.keys(cssObj)) {
        cssPropText += `\n    ${cssProp}: ${cssObj[cssProp]};`
    }
    const css = `.${className} {${cssPropText}\n}`;
    if (styleEle.css) {//IE
        styleEle.css.cssText += css;
    } else {
        styleEle.appendChild(document.createTextNode(css));
    }
};