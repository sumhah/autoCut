/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
class AutoCut {

    static init() {
        window.localStorage.debug = '*';
        this.addConsoleSupport();
        this.load();
        this.addClickMethods();
        this.bindEvent();
    }

    static load() {
        this.loadList.forEach(file => this.loadJsx(file));
    }

    static bindEvent() {
        this.bindLayerSelectEvent();
    }

    static addClickMethods() {
        const cs = this.csInterface;
        window.start = () => cs.evalScript('start()', result => {});
        window.test = () => cs.evalScript('test()', result => {});
        window.tryMethod = () => cs.evalScript('tryBtnHandler()', result => {});
    }

    static addConsoleSupport() {
        const cs = this.csInterface;
        if (!window.didSetupHandlers) {
            cs.addEventListener('CONSOLE_LOG', e => {
                console.log.apply(console, e.data);
            });
            cs.addEventListener('CONSOLE_WARN', e => {
                console.warn.apply(console, e.data);
            });
            cs.addEventListener('CONSOLE_ERROR', e => {
                console.error.apply(console, e.data);
            });
        }
        window.didSetupHandlers = true;
    }

    static bindLayerSelectEvent() {
        try {
            const cs = this.csInterface;
            const event = new CSEvent('com.adobe.PhotoshopRegisterEvent', 'APPLICATION');
            event.extensionId = cs.getExtensionID();
            event.data = '1936483188';
            cs.dispatchEvent(event);

            cs.addEventListener('com.adobe.PhotoshopJSONCallback' + cs.getExtensionID(), this.layerSelectHandler.bind(this));
        } catch (e) {
            console.log(e);
        }
    }

    static layerSelectHandler() {
        return;
        this.csInterface.evalScript('selectLayerHandler()', result => {});
    }

    static loadJsx(fileName) {
        const extensionRoot = this.csInterface.getSystemPath(SystemPath.EXTENSION) + '/jsx/';
        this.csInterface.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
        console.log(`${fileName} run`);
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = AutoCut;

AutoCut.csInterface = new CSInterface();
AutoCut.loadList = ['lib/es5-shim.jsx', 'lib/json2.jsx', 'lib/util.jsx', 'lib/console.jsx', 'lib/class.jsx', 'setting.jsx', 'css/const.jsx', 'css/ActionDescriptor.jsx', 'processWindow.jsx', 'css.jsx', 'layer.jsx', 'controller.jsx', 'main.jsx'];
AutoCut.cssDom = document.getElementById('css');

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__autoCut__ = __webpack_require__(0);


__WEBPACK_IMPORTED_MODULE_0__autoCut__["a" /* default */].init();

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map