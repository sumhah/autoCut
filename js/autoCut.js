/**
 * Created by zj-db0758 on 17/12/16.
 */
require('./setting');
const File = require('./object/easyFile');
const CssReader = require('./object/cssReader');
const TagController = require('./object/tagController');

class AutoCut {
    static reset() {
        File.deleteDir('./dist');
        File.createDir('./dist');
        File.createDir('./dist/css');
        File.createDir('./dist/scss');
        File.createDir('./dist/images');
        File.copySrcImagesToDist('./source/', './dist/images/');
    }

    static start() {
        this.reset();
        console.log('Start Parsing:');
        File.readFile('./source/css.css')
            .then((cssText) => {
                spend(() => {
                    const cssInfo = new CssReader(cssText).getCssInfo();
                    const tagController = new TagController(cssInfo);
                    File.writeFile(`./dist/${PAGE_NAME}.html`, tagController.html);
                    File.writeFile(`./dist/${PAGE_NAME}.vue`, tagController.vue);
                    File.writeFile(`./dist/css/${PAGE_NAME}.css`, tagController.css);
                    File.writeFile(`./dist/scss/${PAGE_NAME}.scss`, tagController.scss);
                }, 'total');
            })
            .catch(e => console.error(e));
    }
}

module.exports = AutoCut;