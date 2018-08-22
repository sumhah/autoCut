const win = {
    text: 'Pleasewait...',
    preferredSize: [
        350,
        60,
    ],
    orientation: 'column',
    alignChildren: 'fill',
    barRow: {
        orientation: 'row',
        bar: {
            preferredSize: [
                300,
                16,
            ],
        },
        cancelBtn: {
            text: 'Cancel',
        },
    },
    lblMessage: {
        alignment: 'left', text: '',
    },
    warning: {
        orientation: 'column',
        alignChildren: 'fill',
        message: {
            text: 'Don\'tmakechangestothecurrentdocumentwhilethescriptisrunning!',
            properties: {
                multiline: true,
            },
        },
    },
}