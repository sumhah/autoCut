
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

function test() {
    console.log(2);

    try {

    }
    catch (e) {
        console.log(e.message);
    }



    console.log(1);
}



