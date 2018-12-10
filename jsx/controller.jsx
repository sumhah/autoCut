var Controller = {
    doc: app.activeDocument,
    Layer: Layer,
    cssInfoArr: [],
    cssText: '',

    start: function () {
        var self = this;
        processWindow.show();
        this.reset();
        var doc = this.doc;
        this.cssInfoArr.push({
            name: 'root',
            left: 0,
            top: 0,
            width: parseFloat(doc.width),
            height: parseFloat(doc.height),
        })

        time('createFolder', function () {
            self.createFolder();
        })
        time('eachTaggerLayersToExport', function () {
            self.eachTaggerLayersToExport();
        })
        time('bg', function () {
            self.exportRootDocument();
        })
        time('exportCssFile', function () {
            self.exportCssFile();
        })
        processWindow.hide();
    },

    reset: function () {
        this.doc = app.activeDocument;
        this.cssText = '';

        var self = this;
        time('layer init', function () {
            self.Layer.init();
        })
    },

    createFolder: function () {
        var folder = new Folder(sourcePath);
        if (!folder.exists) {
            folder.create();
        }

        if (IS_EXPORT_LAYER) {
            each(folder.getFiles(), function (file) {
                file.remove();
            });
        }
        this.folder = folder;
    },

    eachTaggerLayersToExport: function () {
        try {
            var self = this;
            var Layer = this.Layer;
            this.Layer.uniqueTaggedLayers.forEach(function (item, i, array) {
                if (processWindow.userCancelled) {
                    return;
                }
                processWindow.update(i + 1, array.length, 'export layer ' + item.layer.name)
                console.log('导出第' + (i + 1) + '个', item.layer.name);
                self.doc.activeLayer = item.layer;
                try {
                    var css = new CSS(item.layer);
                    self.cssInfoArr.push(css);
                } catch (e) {
                    console.error(e);
                }
            });
        }
        catch (e) {
            console.error(e.message);
        }
    },

    exportCssFile: function () {
        var cssFilePath = this.folder + '/css.json';
        var write_file = File(cssFilePath);

        if (!write_file.exists) {
            write_file = new File(cssFilePath);
        }

        if (write_file !== '') {
            //Open the file for writing.
            var out = write_file.open('w', undefined, undefined);
            write_file.encoding = 'UTF-8';
            write_file.lineFeed = 'Macintosh';

            if (out) {
                write_file.write(JSON.stringify(this.cssInfoArr));
                write_file.close();
            }
        }
    },

    exportRootDocument: function () {
        if (!IS_EXPORT_BG) {
            return;
        }
        processWindow.update(1, 1, 'export background')
        this.exportImage('bg');
    },

    exportImage: function (fileName) {
        this.doc.exportDocument(new File(sourcePath + fileName + '.png'), ExportType.SAVEFORWEB, AUTO_CUT_EXPORT_OPTION);
    },
};