/**
 * Created by ASUS on 2017/3/26.
 */

// CSS属性的排列顺序
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
// 允许元素从父元素继承对应的css属性
global.INHERITABLE_PROP = [
    // 'color',
    // 'line-height',
    // 'text-align',
    // 'font-size'
];

// HTML\CSS 缩进多少空格
global.HTML_INDENT = 4;
global.CSS_INDENT = 4;

// 子盒子与父盒子的相交面积大于子盒子自身的比例，则子盒子属于父盒子
global.INTERSECTION_AREA_RATIO = 0.5;

// 判断2个盒子是否在同一行，允许2个相邻盒子的Y坐标相差多少像素
global.HORIZONTAL_CRITICAL_VALUE = 6;

/**
 * 页面基本宽度
 * @type {number}
 */
global.BASE_PAGE_WIDTH = 320;

/**
 * 1rem代表多少px，默认20px
 * @type {number}
 */
global.ROOT_FONT_SIZE = 20;

/**
 * rem缩放参照的宽度
 * 页面宽度=320px对应html.fontSize=20px
 * @type {number}
 */
global.PAGE_WIDTH_TO_REM_RATIO = BASE_PAGE_WIDTH / ROOT_FONT_SIZE;

/**
 * 输出模式:
 * absolute: 所有元素强制使用绝对定位来布局，不使用标准流
 * default: 默认模式，智能判断什么时候该使用绝对定位或标准布局
 * @type {string}
 */
global.MODE = 'absolute';

// 输出的页面文件名
global.PAGE_NAME = 'index';