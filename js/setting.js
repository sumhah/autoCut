/**
 * Created by ASUS on 2017/3/26.
 */

global.CSS_ORDER = [
    'z-index',
    'box-sizing',
    'position',
    'display',
    'left',
    'top',
    'right',
    'bottom',
    'width',
    'min-width',
    'max-width',
    'height',
    'min-height',
    'max-height',
    'padding',
    'padding-left',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'border',
    'border-style',
    'border-width',
    'border-color',
    'border-left',
    'border-top',
    'border-right',
    'border-bottom',
    'margin',
    'margin-left',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'border-radius',
    'overflow',
    'vertical-align',
    'font',
    'font-size',
    'line-height',
    'text-align',
    'letter-spacing',
    'color',
    'background',
    'background-image',
    'background-size',
    'background-color',
    'box-shadow',
    'transform',
    'animation',
    'transition',
];

// 存在2组重复会导致少的那组属性被删除，暂时不做
global.INHERITABLE_PROP = [
    // 'color',
    // 'line-height',
    // 'text-align',
    // 'font-size'
];

global.HTML_INDENT = 4;
global.CSS_INDENT = 4;

global.MODE = 'absol';

global.PAGE_NAME = 'index';