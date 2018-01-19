var Controller = {
    doc: app.activeDocument,
    Layer: Layer,
    cssText: '',

    start: function () {
        this.reset();
        var doc = this.doc;
        this.cssText += '.root {\n    left: 0px;\n    top: 0px;\n    width: ' + parseFloat(doc.width) + 'px;\n    height: ' + parseFloat(doc.height) + 'px;\n}\n\n';

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
            this.Layer.uniqueTaggedLayers.forEach(function (item) {
                makeLayerVisible(item);
                var groupLayer, curLayer = item.layer;
                if (curLayer.typename === 'LayerSet') {
                    groupLayer = curLayer.merge();
                }

                if (groupLayer) {
                    self.cssText += Layer.getLayerCss(groupLayer) + '\n';
                    groupLayer.visible = false;
                } else {
                    self.cssText += Layer.getLayerCss(curLayer) + '\n';
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
        var filePath = sourcePath + fileName + '.png';
        var fileOut = new File(filePath);
        doc.exportDocument(fileOut, ExportType.SAVEFORWEB, exportOptions);
    },
};