const cs = new CSInterface();

function loadJSX(fileName) {
    const extensionRoot = cs.getSystemPath(SystemPath.EXTENSION) + '/jsx/';
    cs.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
}

window.localStorage.debug = '*';
// only add listeners when not already added (livereload)
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

loadJSX('es5-shim.jsx');
loadJSX('util.jsx');
loadJSX('console.jsx');

loadJSX('css/const.jsx');
loadJSX('css/ActionDescriptor.jsx');
loadJSX('css/ProgressBar.jsx');
loadJSX('css/PSLayer.jsx');
loadJSX('css/CSSToClipboard.jsx');

loadJSX('layer.jsx');
loadJSX('controller.jsx');
loadJSX('main.jsx');
loadJSX('json2.jsx'); //为 ExtendScript 载入 JSON 库
// loadJSX('exportFast.jsx');

const pop = () => {
    const cs = new CSInterface();
    cs.evalScript('start()', (result) => {
        window.cep.fs.writeFile(__filename + '/css.css', result);
    });
};
