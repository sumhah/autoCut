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
        console.log(2);
        this.eachTaggerLayersToExport();
        console.log(3);
        this.exportRootDocument();
        console.log(4);
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
        // each(folder.getFiles(), function (file) {
        //     file.remove();
        // });
        this.folder = folder;
    },

    eachTaggerLayersToExport: function () {
        try {
            var self = this;
            var Layer = this.Layer;
            this.Layer.uniqueTaggedLayers.forEach(function (item) {
                console.log(item.layer.name);
            });
            this.Layer.uniqueTaggedLayers.forEach(function (item) {
                makeLayerVisible(item);
                var groupLayer, curLayer = item.layer;

                console.log(item.layer.name);

                if (curLayer.typename === 'LayerSet') {
                    groupLayer = curLayer.merge();
                }

                if (groupLayer) {
                    self.cssText += Layer.getLayerCss(groupLayer) + '\n';
                    groupLayer.remove();
                    // makeLayerHide(item);
                } else {
                    self.cssText += Layer.getLayerCss(curLayer) + '\n';
                    // makeLayerHide(item);
                    curLayer.remove();
                }

            });
        }
        catch (e) {
            console.log(e.message);
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
        var doc = app.activeDocument;
        var exportOptions = new ExportOptionsSaveForWeb();
        exportOptions.PNG8 = false;
        exportOptions.format = SaveDocumentType.PNG;
        exportOptions.transparency = true;
        exportOptions.interlaced = false;
        exportOptions.quality = 100;
        var fileOut = new File(sourcePath + fileName + '.png');
        doc.exportDocument(fileOut, ExportType.SAVEFORWEB, exportOptions);
    },
};

console.log('controller run');