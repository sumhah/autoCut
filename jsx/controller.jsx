var Controller = {
    doc: app.activeDocument,
    Layer: Layer,
    cssText: '',

    start: function () {
        this.reset();
        var doc = this.doc;
        this.cssText += '.root {\n    left: 0px;\n    top: 0px;\n    width: ' + parseFloat(doc.width) + 'px;\n    height: ' + parseFloat(doc.height) + 'px;\n}\n\n';

        // todo 清空文件夹
        this.createFolder();
        this.eachTaggerLayersToExport();
        this.exportRootDocument();
        this.exportCssFile();

        alert('Done!');
    },

    reset: function () {
        this.doc = app.activeDocument;
        this.cssText = '';
        this.Layer.init();
    },

    createFolder: function () {
        var folder = new Folder(this.doc.path + '/source');
        if (!folder.exists) {
            folder.create();
        }
        this.folder = folder;
    },

    eachTaggerLayersToExport: function () {
        try {
            var self = this;
            var Layer = this.Layer;
            this.Layer.uniqueTaggedLayers.each(function (item) {
                makeLayerVisible(item);
                var groupLayer;
                if (item.layer.typename === 'LayerSet') {
                    groupLayer = item.layer.merge();
                }

                if (groupLayer) {
                    self.cssText += Layer.getLayerCss(groupLayer) + '\n';
                } else {
                    self.cssText += Layer.getLayerCss(item.layer) + '\n';
                    item.layer.visible = false;
                }
            });
        }
        catch (e) {
            alert(e.message);
        }
    },

    exportCssFile: function () {
        var cssFilePath = this.folder + '/css.css';
        var write_file = File(cssFilePath);

        if (!write_file.exists) {
            write_file = new File(cssFilePath);
        }

        var out;
        if (write_file !== '') {
            //Open the file for writing.
            out = write_file.open('w', undefined, undefined);
            write_file.encoding = 'UTF-8';
            write_file.lineFeed = 'Macintosh';
        }
        if (out) {
            write_file.write(this.cssText);
            write_file.close();
        }
    },

    exportRootDocument: function () {
        this.exportImage('bg');
    },

    exportImage: function (fileName) {
        var doc = this.doc;

        var exportOptions = new ExportOptionsSaveForWeb();
        exportOptions.PNG8 = false;
        exportOptions.format = SaveDocumentType.PNG;
        exportOptions.transparency = true;
        exportOptions.interlaced = false;
        exportOptions.quality = 100;
        var filePath = doc.path + '/source/' + fileName + '.png';
        var fileOut = new File(filePath);
        doc.exportDocument(fileOut, ExportType.SAVEFORWEB, exportOptions);
    },
};