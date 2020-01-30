'use strict';
var vscode = require('vscode');
function activate(context) {
    vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file' }, {
        provideDocumentFormattingEdits: function (document) {
            vscode.commands.executeCommand('editor.action.reindentlines');
            return [];
        }
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map