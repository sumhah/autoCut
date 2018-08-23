var Controller = {
    doc: app.activeDocument,
    Layer: Layer,
    cssText: '',

    start: function () {
        processWindow.show();
        this.reset();
        var doc = this.doc;
        this.cssText += '.root {\n    left: 0px;\n    top: 0px;\n    width: ' + parseFloat(doc.width) + 'px;\n    height: ' + parseFloat(doc.height) + 'px;\n}\n\n';
        this.createFolder();
        this.eachTaggerLayersToExport();
        this.exportRootDocument();
        this.exportCssFile();
        processWindow.hide();
        alert('Done!');
    },

    reset: function () {
        this.doc = app.activeDocument;
        this.cssText = '';
        this.Layer.init();
    },

    createFolder: function () {
        var folder = new Folder(sourcePath);
        if (!folder.exists) {
            folder.create();
        }
        each(folder.getFiles(), function (file) {
            file.remove();
        });
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
                console.log('导出第' + i + '个', item.layer.name);
                self.doc.activeLayer = item.layer;
                try {
                    var css = new CSS(item.layer);
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
        var cssFilePath = this.folder + '/css.css';
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
                write_file.write(this.cssText);
                write_file.close();
            }
        }
    },

    exportRootDocument: function () {
        this.exportImage('bg');
    },

    exportImage: function (fileName) {
        this.doc.exportDocument(new File(sourcePath + fileName + '.png'), ExportType.SAVEFORWEB, AUTO_CUT_EXPORT_OPTION);
    },
};