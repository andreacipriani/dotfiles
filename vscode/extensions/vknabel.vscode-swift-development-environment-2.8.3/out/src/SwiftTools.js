"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const cp = require("child_process");
const clientMain_1 = require("./clientMain");
let stdout;
///managed build now only support to invoke on save
function buildPackage(swiftBinPath, pkgPath, params) {
    stdout = "";
    const sb = cp.spawn(swiftBinPath, params, { cwd: pkgPath, shell: true });
    sb.stdout.on("data", data => {
        stdout += data;
        clientMain_1.dumpInConsole("" + data);
    });
    sb.stderr.on("data", data => {
        clientMain_1.dumpInConsole("" + data);
    });
    sb.on("error", function (err) {
        clientMain_1.trace("***swift build command error*** " + err.message);
        if (err.message.indexOf("ENOENT") > 0) {
            const msg = "The '" +
                swiftBinPath +
                "' command is not available." +
                " Please check your swift executable user setting and ensure it is installed.";
            vscode_1.window.showErrorMessage(msg);
        }
    });
    sb.on("exit", function (code, signal) {
        clientMain_1.trace(`***swift build command exited*** code: ${code}, signal: ${signal}`);
        clientMain_1.dumpInConsole("\n");
        clientMain_1.diagnosticCollection.clear();
        dumpDiagnostics();
        if (code != 0) {
            clientMain_1.makeBuildStatusFailed();
        }
        else {
            clientMain_1.makeBuildStatusSuccessful();
        }
    });
}
exports.buildPackage = buildPackage;
function dumpDiagnostics() {
    const diagnosticMap = new Map();
    let diags = [];
    const lines = stdout.split("\n");
    function isDiagStartLine(line) {
        //FIXME
        const sa = line.split(":");
        if (sa.length > 4) {
            const sev = sa[3].trim();
            return sev == "error" || sev == "warning" || sev == "note";
        }
        return false;
    }
    //FIXME always the pattern?
    function makeDiagnostic(oneDiag) {
        const line0 = oneDiag[0];
        const line1 = oneDiag[1];
        const line2 = oneDiag[2];
        const sa = line0.split(":");
        const file = vscode_1.Uri.file(sa[0]).toString(); //FIXME not always file, Swift._cos:1:13:
        //line and column in vscode is 0-based
        const line = Number(sa[1]) - 1;
        const startColumn = Number(sa[2]) - 1;
        const sev = toVSCodeSeverity(sa[3].trim());
        const msg = sa[4];
        const endColumn = startColumn + line2.trim().length;
        // let canonicalFile = vscode.Uri.file(error.file).toString();
        // if (document && document.uri.toString() === canonicalFile) {
        //     let range = new vscode.Range(error.line - 1, 0, error.line - 1, document.lineAt(error.line - 1).range.end.character + 1);
        //     let text = document.getText(range);
        //     let [_, leading, trailing] = /^(\s*).*(\s*)$/.exec(text);
        //     startColumn = leading.length;
        //     endColumn = text.length - trailing.length;
        // }
        let range = new vscode_1.Range(line, startColumn, line, endColumn);
        let diagnostic = new vscode_1.Diagnostic(range, msg, sev);
        let diagnostics = diagnosticMap.get(file);
        if (!diagnostics) {
            diagnostics = [];
        }
        diagnostics.push(diagnostic);
        diagnosticMap.set(file, diagnostics);
    }
    let index = Number.MAX_VALUE;
    let line, oneDiag, hasDiagStart;
    for (let i = 0; i < lines.length; i++) {
        line = lines[i];
        if (isDiagStartLine(line)) {
            if (!hasDiagStart)
                hasDiagStart = true;
            if (oneDiag)
                diags.push(oneDiag);
            oneDiag = [];
        }
        if (hasDiagStart) {
            oneDiag.push(line);
        }
    }
    diags.push(oneDiag); //push last oneDiag
    diags.forEach(d => {
        if (d) {
            makeDiagnostic(d);
        }
    });
    diagnosticMap.forEach((diags, file) => {
        clientMain_1.diagnosticCollection.set(vscode_1.Uri.parse(file), diags);
    });
}
function toVSCodeSeverity(sev) {
    switch (sev) {
        case "error":
            return vscode_1.DiagnosticSeverity.Error;
        case "warning":
            return vscode_1.DiagnosticSeverity.Warning;
        case "note":
            return vscode_1.DiagnosticSeverity.Information;
        default:
            return vscode_1.DiagnosticSeverity.Error; //FIXME
    }
}
//# sourceMappingURL=SwiftTools.js.map