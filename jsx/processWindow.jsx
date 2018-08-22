var processWindow = {
    userCancelled: false,
    win: new Window('palette{\n' +
        '  text: "正在运行...",\n' +
        '  preferredSize: [\n' +
        '    350,\n' +
        '    60\n' +
        '  ],\n' +
        '  orientation: "column",\n' +
        '  alignChildren: "fill",\n' +
        '  barRow: Group{\n' +
        '  orientation: "row",\n' +
        '  bar: Progressbar{\n' +
        '  preferredSize: [\n' +
        '    300,\n' +
        '    16\n' +
        '  ]\n' +
        '},cancelBtn: Button{text: "Cancel"}},warning: Panel{orientation: "column", alignChildren: "fill", message: StaticText{text: "正在运行中", properties: {multiline: true}\n' +
        '}\n' +
        '}\n' +
        '}'),

    init: function () {
        var win = this.win;
        var self = this;
        win.barRow.cancelBtn.onClick = function () {
            self.userCancelled = true;
            win.hide();
        };

        win.onClose = function () {
            self.userCancelled = true;
            return false;
        };
        win.barRow.bar.maxvalue = 10;
        win.barRow.bar.value = 0;
    },

    update: function (currentValue, total, processName) {
        var win = this.win;
        win.barRow.bar.maxvalue = total;
        win.barRow.bar.value = currentValue;
        win.warning.message.text = processName + ': ' + currentValue + '/' + total;
        win.update()
    },

    show: function () {
        this.win.show()
    },

    hide: function () {
        this.win.hide()
    }
};

processWindow.init();