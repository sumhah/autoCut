
const fs = require('fs');

class EasyFile {
    static deleteDir(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file) => {
                const currentPath = path + '/' + file;
                if (fs.statSync(currentPath).isDirectory()) {
                    this.deleteDir(currentPath);
                } else {
                    fs.unlinkSync(currentPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    static createDir(path) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }

    static readFile(path) {
        return new Promise((resolve) => {
            fs.readFile(path, 'utf-8', (err, cssText) => {
                if (err) {
                    return console.error(err);
                }

                resolve(cssText);
            });
        });
    }

    static writeFile(src, fileString) {
        fs.writeFile(src, fileString, (err) => {
            if (err) {
                return console.error(err);
            }
        });
    }

    static copy(src, dist) {
        fs.writeFileSync(dist, fs.readFileSync(src));
    }

    static copySrcImagesToDist(src, dist) {
        fs.readdirSync(src).filter(item => /\.(png)|(jpg)$/.test(item))
            .forEach(images => this.copy(src + images, dist + images));
    }
}

module.exports = EasyFile;