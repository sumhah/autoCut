var cs = new CSInterface();

function loadJSX(fileName) {
    var extensionRoot = cs.getSystemPath(SystemPath.EXTENSION) + '/jsx/';
    cs.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
}

loadJSX('util.jsx');
loadJSX('expand.jsx');

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


var pop = function () {
    var cs = new CSInterface();
    cs.evalScript('start()', function (result) {
        window.cep.fs.writeFile(__filename + '/css.css', result);
    });
};

function clearFolder() {
    var result = window.cep.fs.readdir(__dirname );
}
