import layerInfoToCSSText from './lib/layerInfoToCSSText'

export default class AutoCut {
    static csInterface = new CSInterface();

    static loadList = [
        'lib/es5-shim.jsx',
        'lib/json2.jsx',
        'lib/util.jsx',
        'lib/console.jsx',
        'lib/class.jsx',
        'setting.jsx',
        'css/const.jsx',
        'css/ActionDescriptor.jsx',
        'processWindow.jsx',
        'css.jsx',
        'layer.jsx',
        'controller.jsx',
        'main.jsx',
    ];
    static cssDom = document.getElementById('css');

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
        window.start = () => cs.evalScript('start()', (result) => {
        });
        window.test = () => cs.evalScript('test()', (result) => {
        });
        window.tryMethod = () => cs.evalScript('tryBtnHandler()', (result) => {
        });
    }

    static addConsoleSupport() {
        const cs = this.csInterface;
        if (!window.didSetupHandlers) {
            cs.addEventListener('CONSOLE_LOG', (e) => {
                console.log.apply(console, e.data);
            });
            cs.addEventListener('CONSOLE_WARN', (e) => {
                console.warn.apply(console, e.data);
            });
            cs.addEventListener('CONSOLE_ERROR', (e) => {
                console.error.apply(console, e.data);
            });
        }
        window.didSetupHandlers = true;
    }

    static bindLayerSelectEvent() {
        try {
            const cs = this.csInterface;
            const event = new CSEvent('com.adobe.PhotoshopRegisterEvent', 'APPLICATION');  //创建一个“注册事件”
            event.extensionId = cs.getExtensionID(); //设置“注册事件” extensionId 为你扩展的扩展ID
            event.data = '1936483188'; // 想要监听的 ExtendScript 事件 eventID , 这里是创建图层对象事件: "Mk  "=1298866208
            cs.dispatchEvent(event); //发送“注册事件”，完成注册

            cs.addEventListener('com.adobe.PhotoshopJSONCallback' + cs.getExtensionID(), this.layerSelectHandler.bind(this))
        } catch (e) {
            console.log(e);
        }
    }

    static layerSelectHandler() {
        this.csInterface.evalScript('selectLayerHandler()', (result) => {
            console.log(JSON.parse(result));
            this.cssDom.innerHTML = layerInfoToCSSText(JSON.parse(result));
        });
    }

    static loadJsx(fileName) {
        const extensionRoot = this.csInterface.getSystemPath(SystemPath.EXTENSION) + '/jsx/';
        this.csInterface.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
        console.log(`${fileName} run`);
    }
}