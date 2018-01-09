function log(str) {
    $.writeln(str);
}

function makeLayerVisible(item) {
    item.layer.visible = true;

    var current = item.parent;
    while (current) {
        if (!current.layer.visible) {
            current.layer.visible = true;
        }
        current = current.parent;
    }
}

function undo(doc) {
    doc.activeHistoryState = doc.historyStates[doc.historyStates.length - 2];
}