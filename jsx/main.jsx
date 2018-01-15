
function main() {
    try {
        Controller.start();
    }
    catch (e) {
        alert(e.message);
    }
}
function start() {
    var doc = app.activeDocument;
    doc.suspendHistory('please wait...', 'main()');
    undo(doc);
    return '';
}




