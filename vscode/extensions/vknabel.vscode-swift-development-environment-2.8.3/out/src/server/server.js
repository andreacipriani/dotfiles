"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const fs = require("fs");
const sourcekitProtocol = require("./sourcekites");
const childProcess = require("child_process");
const sourcekit_xml_1 = require("./sourcekit-xml");
const available_packages_1 = require("./packages/available-packages");
const current_1 = require("./current");
exports.spawn = childProcess.spawn;
// Create a connection for the server. The connection uses Node's IPC as a transport
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// Create a simple text document manager. The text document manager
// supports full document sync only
let documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
let targets;
function initializeModuleMeta() {
    return __awaiter(this, void 0, void 0, function* () {
        const loadingTargets = current_1.Current.config.workspacePaths.map(available_packages_1.availablePackages);
        const loadedTargets = yield Promise.all(loadingTargets);
        targets = [].concat(...loadedTargets);
    });
}
exports.initializeModuleMeta = initializeModuleMeta;
function targetForSource(srcPath) {
    return ((targets &&
        targets.find(target => target.sources.has(path.normalize(srcPath)))) || {
        name: path.basename(srcPath),
        path: srcPath,
        sources: new Set([srcPath]),
        compilerArguments: []
    });
}
exports.targetForSource = targetForSource;
// After the server has started the client sends an initilize request. The server receives
// in the passed params the root paths of the workspaces plus the client capabilites.
connection.onInitialize((params, cancellationToken) => {
    current_1.Current.config.isTracingOn =
        params.initializationOptions.isLSPServerTracingOn;
    current_1.Current.config.workspacePaths = params.workspaceFolders.map(({ uri }) => uri.replace("file://", ""));
    exports.skProtocolPath = params.initializationOptions.skProtocolProcess;
    current_1.Current.config.toolchainPath = params.initializationOptions.toolchainPath;
    exports.skProtocolProcessAsShellCmd =
        params.initializationOptions.skProtocolProcessAsShellCmd;
    exports.skCompilerOptions = params.initializationOptions.skCompilerOptions;
    current_1.Current.log("-->onInitialize ", `isTracingOn=[${current_1.Current.config.isTracingOn}],
	skProtocolProcess=[${exports.skProtocolPath}],skProtocolProcessAsShellCmd=[${exports.skProtocolProcessAsShellCmd}]`);
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind,
            definitionProvider: true,
            hoverProvider: true,
            // referencesProvider: false,
            // documentSymbolProvider: false,
            // signatureHelpProvider: {
            // 	triggerCharacters: ['[', ',']
            // },
            // We're providing completions.
            completionProvider: {
                resolveProvider: false,
                triggerCharacters: [
                    ".",
                    ":",
                    "(",
                    "#" //' ', '<', //TODO
                ]
            }
        }
    };
});
//external
exports.maxBytesAllowedForCodeCompletionResponse = 0;
exports.editorSettings = {};
//internal
exports.skProtocolPath = null;
exports.skProtocolProcessAsShellCmd = false;
exports.skCompilerOptions = [];
let maxNumProblems = null;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration(change => {
    current_1.Current.log("-->onDidChangeConfiguration");
    const settings = change.settings;
    const sdeSettings = settings.swift;
    exports.editorSettings = Object.assign(Object.assign({}, settings.editor), settings["[swift]"]);
    //FIXME does LS client support on-the-fly change?
    maxNumProblems = sdeSettings.diagnosis.max_num_problems;
    current_1.Current.config.sourcekitePath = sdeSettings.path.sourcekite;
    current_1.Current.config.swiftPath = sdeSettings.path.swift_driver_bin;
    current_1.Current.config.shellPath = sdeSettings.path.shell || "/bin/bash";
    current_1.Current.config.targets = sdeSettings.targets || [];
    current_1.Current.log(`-->onDidChangeConfiguration tracing:
	    swiftDiverBinPath=[${current_1.Current.config.swiftPath}],
		shellPath=[${current_1.Current.config.shellPath}]`);
    //FIXME reconfigure when configs haved
    sourcekitProtocol.initializeSourcekite();
    if (!targets) {
        //FIXME oneshot?
        initializeModuleMeta();
    }
    // Revalidate any open text documents
    documents.all().forEach(validateTextDocument);
});
function validateTextDocument(textDocument) {
    // let diagnostics: Diagnostic[] = [];
    // let lines = textDocument.getText().split(/\r?\n/g);
    // let problems = 0;
    // for (var i = 0; i < lines.length && problems < maxNumProblems; i++) {
    // 	let line = lines[i];
    // 	let index = line.indexOf('typescript');
    // 	if (index >= 0) {
    // 		problems++;
    // 		diagnostics.push({
    // 			severity: DiagnosticSeverity.Warning,
    // 			range: {
    // 				start: { line: i, character: index },
    // 				end: { line: i, character: index + 10 }
    // 			},
    // 			message: `${line.substr(index, 10)} should be spelled TypeScript`,
    // 			source: 'ex'
    // 		});
    // 	}
    // }
    // Send the computed diagnostics to VSCode.
    // connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
    current_1.Current.log("---onDidChangeContent");
});
connection.onDidChangeWatchedFiles(watched => {
    // trace('---','onDidChangeWatchedFiles');
    watched.changes.forEach(e => {
        let file;
        switch (e.type) {
            case vscode_languageserver_1.FileChangeType.Created:
                file = fromUriString(e.uri);
                targetForSource(file).sources.add(file);
                break;
            case vscode_languageserver_1.FileChangeType.Deleted:
                file = fromUriString(e.uri);
                targetForSource(file).sources.delete(file);
                break;
            default:
            //do nothing
        }
    });
});
// This handler provides the initial list of the completion items.
connection.onCompletion(({ textDocument, position }) => {
    function removeSubstringFix(sub, replacement = "") {
        const prefixOffset = offset - Math.max(3, sub.length * 2 - 1);
        const prefix = srcText.slice(prefixOffset, offset);
        const lastOccurence = prefix.lastIndexOf(sub);
        if (lastOccurence === -1)
            return [];
        const duplicateKeywordRange = vscode_languageserver_1.Range.create(document.positionAt(prefixOffset + lastOccurence), document.positionAt(prefixOffset + lastOccurence + sub.length));
        return [vscode_languageserver_1.TextEdit.replace(duplicateKeywordRange, replacement)];
    }
    function completionOfDuplicateFuncKeywordFix(kind) {
        return ((kind.includes("source.lang.swift.decl.function.") &&
            removeSubstringFix("func ")) ||
            []);
    }
    function completionOfDuplicateDotFix(kind) {
        return ((kind.includes("source.lang.swift.decl.function.") &&
            removeSubstringFix("..", ".")) ||
            []);
    }
    function combineFixes(kind, ...fixes) {
        return fixes
            .map(fix => fix(kind))
            .reduce((all, next) => [...all, ...next], []);
    }
    const document = documents.get(textDocument.uri);
    const srcPath = document.uri.substring(7, document.uri.length);
    const srcText = document.getText(); //NOTE needs on-the-fly buffer
    const offset = document.offsetAt(position); //FIXME
    return sourcekitProtocol.codeComplete(srcText, srcPath, offset).then(function (completions) {
        return (completions || []).map(c => {
            let item = vscode_languageserver_1.CompletionItem.create(c["key.description"]);
            item.kind = toCompletionItemKind(c["key.kind"]);
            item.detail = `${c["key.modulename"]}.${c["key.name"]}`;
            item.insertText = createSuggest(c["key.sourcetext"]);
            item.insertTextFormat = vscode_languageserver_1.InsertTextFormat.Snippet;
            item.documentation = c["key.doc.brief"];
            item.additionalTextEdits = combineFixes(c["key.kind"], completionOfDuplicateFuncKeywordFix, completionOfDuplicateDotFix);
            return item;
        });
    }, function (err) {
        //FIXME
        return err;
    });
});
/**
 * ref: https://github.com/facebook/nuclide/blob/master/pkg/nuclide-swift/lib/sourcekitten/Complete.js#L57
 */
function createSuggest(sourcetext) {
    let index = 1;
    let snp = sourcetext.replace(/<#T##(.+?)#>/g, (m, g) => {
        return "${" + index++ + ":" + g.split("##")[0] + "}";
    });
    const normalized = snp.replace("<#code#>", `\${${index++}}`);
    return normalized.startsWith(".") ? normalized.slice(1) : normalized;
}
//TODO more meanful CompletionItemKinds...
function toCompletionItemKind(keyKind) {
    switch (keyKind) {
        case "source.lang.swift.decl.function.free":
        case "source.lang.swift.ref.function.free":
            return vscode_languageserver_1.CompletionItemKind.Function;
        case "source.lang.swift.decl.function.method.instance":
        case "source.lang.swift.ref.function.method.instance":
        case "source.lang.swift.decl.function.method.static":
        case "source.lang.swift.ref.function.method.static":
            return vscode_languageserver_1.CompletionItemKind.Method;
        case "source.lang.swift.decl.function.operator":
        case "source.lang.swift.ref.function.operator":
        case "source.lang.swift.decl.function.subscript":
        case "source.lang.swift.ref.function.subscript":
            return vscode_languageserver_1.CompletionItemKind.Keyword;
        case "source.lang.swift.decl.function.constructor":
        case "source.lang.swift.ref.function.constructor":
        case "source.lang.swift.decl.function.destructor":
        case "source.lang.swift.ref.function.destructor":
            return vscode_languageserver_1.CompletionItemKind.Constructor;
        case "source.lang.swift.decl.function.accessor.getter":
        case "source.lang.swift.ref.function.accessor.getter":
        case "source.lang.swift.decl.function.accessor.setter":
        case "source.lang.swift.ref.function.accessor.setter":
            return vscode_languageserver_1.CompletionItemKind.Property;
        case "source.lang.swift.decl.class":
        case "source.lang.swift.ref.class":
        case "source.lang.swift.decl.struct":
        case "source.lang.swift.ref.struct":
            return vscode_languageserver_1.CompletionItemKind.Class;
        case "source.lang.swift.decl.enum":
        case "source.lang.swift.ref.enum":
            return vscode_languageserver_1.CompletionItemKind.Enum;
        case "source.lang.swift.decl.enumelement":
        case "source.lang.swift.ref.enumelement":
            return vscode_languageserver_1.CompletionItemKind.Value;
        case "source.lang.swift.decl.protocol":
        case "source.lang.swift.ref.protocol":
            return vscode_languageserver_1.CompletionItemKind.Interface;
        case "source.lang.swift.decl.typealias":
        case "source.lang.swift.ref.typealias":
            return vscode_languageserver_1.CompletionItemKind.Reference;
        case "source.lang.swift.decl.var.instance":
        case "source.lang.swift.ref.var.instance":
            return vscode_languageserver_1.CompletionItemKind.Field;
        case "source.lang.swift.decl.var.global":
        case "source.lang.swift.ref.var.global":
        case "source.lang.swift.decl.var.static":
        case "source.lang.swift.ref.var.static":
        case "source.lang.swift.decl.var.local":
        case "source.lang.swift.ref.var.local":
            return vscode_languageserver_1.CompletionItemKind.Variable;
        case "source.lang.swift.decl.extension.struct":
        case "source.lang.swift.decl.extension.class":
            return vscode_languageserver_1.CompletionItemKind.Class;
        case "source.lang.swift.decl.extension.enum":
            return vscode_languageserver_1.CompletionItemKind.Enum;
        default:
            return vscode_languageserver_1.CompletionItemKind.Text; //FIXME
    }
}
// This handler resolve additional information for the item selected in
// the completion list.
// connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
// 	if (item.data === 1) {
// 		item.detail = 'TypeScript details',
// 			item.documentation = 'TypeScript documentation'
// 	} else if (item.data === 2) {
// 		item.detail = 'JavaScript details',
// 			item.documentation = 'JavaScript documentation'
// 	}
// 	return item;
// });
connection.onHover(({ textDocument, position }) => {
    const document = documents.get(textDocument.uri);
    const srcPath = document.uri.substring(7, document.uri.length);
    const srcText = document.getText(); //NOTE needs on-the-fly buffer
    const offset = document.offsetAt(position); //FIXME
    return sourcekitProtocol.cursorInfo(srcText, srcPath, offset).then(function (cursorInfo) {
        return extractHoverHelp(cursorInfo).then(mks => {
            return { contents: mks || [] };
        });
    }, function (err) {
        //FIXME
        return err;
    });
});
/**
 * sadasd
 * @param cursorInfo s
 */
function extractHoverHelp(cursorInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        //local helper
        function extractText(elementName, full_as_xml) {
            let s = full_as_xml.indexOf(`<${elementName}>`);
            let e = full_as_xml.indexOf(`</${elementName}>`);
            let rt = full_as_xml.substring(s + elementName.length + 2, e);
            return rt;
        }
        //TODO wait vscode to support full html rendering...
        //stripe all sub elements
        function stripeOutTags(str) {
            return str.replace(/(<.[^(><.)]+>)/g, (m, c) => "");
        }
        const keyKind = cursorInfo["key.kind"];
        const keyName = cursorInfo["key.name"];
        if (!keyName) {
            return null;
        }
        const full_as_xml = cursorInfo["key.doc.full_as_xml"];
        const annotated_decl = cursorInfo["key.annotated_decl"];
        const snippet = annotated_decl
            ? "```swift\n" +
                decode(stripeOutTags(extractText("Declaration", full_as_xml || annotated_decl))) +
                "\n```\n"
            : keyName;
        return [snippet, ...sourcekit_xml_1.parseDocumentation(full_as_xml)]; //FIXME clickable keyTypename
    });
}
connection.onDefinition(({ textDocument, position }) => {
    const document = documents.get(textDocument.uri);
    const srcPath = document.uri.substring(7, document.uri.length);
    const srcText = document.getText(); //NOTE needs on-the-fly buffer
    const offset = document.offsetAt(position); //FIXME
    return sourcekitProtocol.cursorInfo(srcText, srcPath, offset).then(function (cursorInfo) {
        const filepath = cursorInfo["key.filepath"];
        if (filepath) {
            const offset = cursorInfo["key.offset"];
            const len = cursorInfo["key.length"];
            const fileUri = `file://${filepath}`;
            let document = documents.get(fileUri); //FIXME
            //FIXME more here: https://github.com/Microsoft/language-server-protocol/issues/96
            if (!document) {
                //FIXME just make a temp doc to let vscode help us
                const content = fs.readFileSync(filepath, "utf8");
                document = vscode_languageserver_1.TextDocument.create(fileUri, "swift", 0, content);
            }
            return {
                uri: fileUri,
                range: {
                    start: document.positionAt(offset),
                    end: document.positionAt(offset + len)
                }
            };
        }
        else {
            return null;
        }
    }, function (err) {
        //FIXME
        return err;
    });
});
function fromDocumentUri(document) {
    // return Files.uriToFilePath(document.uri);
    return fromUriString(document.uri);
}
function fromUriString(uri) {
    return uri.substring(7, uri.length);
}
/*
connection.onDidOpenTextDocument((params) => {
    // A text document got opened in VSCode.
    // params.uri uniquely identifies the document. For documents store on disk this is a file URI.
    // params.text the initial full content of the document.
    connection.console.log(`${params.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
    // The content of a text document did change in VSCode.
    // params.uri uniquely identifies the document.
    // params.contentChanges describe the content changes to the document.
    connection.console.log(`${params.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
    // A text document got closed in VSCode.
    // params.uri uniquely identifies the document.
    connection.console.log(`${params.uri} closed.`);
});
*/
// Listen on the connection
connection.listen();
//=== helper
const xmlEntities = {
    "&amp;": "&",
    "&quot;": '"',
    "&lt;": "<",
    "&gt;": ">"
};
function decode(str) {
    return str.replace(/(&quot;|&lt;|&gt;|&amp;)/g, (m, c) => xmlEntities[c]);
}
//FIX issue#15
function getShellExecPath() {
    return fs.existsSync(current_1.Current.config.shellPath)
        ? current_1.Current.config.shellPath
        : "/usr/bin/sh";
}
exports.getShellExecPath = getShellExecPath;
//# sourceMappingURL=server.js.map