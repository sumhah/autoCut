var cs = new CSInterface();

function loadJSX(fileName) {
    var extensionRoot = cs.getSystemPath(SystemPath.EXTENSION) + '/jsx/';
    cs.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
}

loadJSX('json2.jsx'); //为 ExtendScript 载入 JSON 库
// loadJSX('exportFast.jsx');
loadJSX('css.jsx');

var pop = function () {
    var cs = new CSInterface();
    cs.evalScript('start()', function (result) {
        window.cep.fs.writeFile(__filename + '/css.css', result);
    });
};
