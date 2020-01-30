"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const tools = require("./SwiftTools");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const SwiftConfigurationProvider_1 = require("./SwiftConfigurationProvider");
const AbsolutePath_1 = require("./AbsolutePath");
let swiftBinPath = null;
let swiftBuildParams = ["build"];
let swiftPackageManifestPath = null;
let skProtocolProcess = null;
let skProtocolProcessAsShellCmd = null;
exports.isTracingOn = false;
exports.isLSPServerTracingOn = false;
let spmChannel = null;
function shouldBuildOnSave() {
    const should = vscode_1.workspace.getConfiguration().get("sde.buildOnSave");
    if (should === undefined) {
        return true;
    }
    else {
        return should;
    }
}
function currentServerOptions(context) {
    function sourcekiteServerOptions() {
        // The server is implemented in node
        const serverModule = context.asAbsolutePath(path.join("out/src/server", "server.js"));
        // The debug options for the server
        const debugOptions = Object.assign({ execArgv: ["--nolazy", "--inspect=6004"] }, process.env);
        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        const serverOptions = {
            run: {
                module: serverModule,
                transport: vscode_languageclient_1.TransportKind.ipc,
                options: debugOptions
            },
            debug: {
                module: serverModule,
                transport: vscode_languageclient_1.TransportKind.ipc,
                options: debugOptions
            }
        };
        return serverOptions;
    }
    function lspServerOptions() {
        // Load the path to the language server from settings
        const executableCommand = vscode_1.workspace
            .getConfiguration("swift")
            .get("languageServerPath", "/usr/local/bin/LanguageServer");
        const run = {
            command: executableCommand,
            options: process.env
        };
        const debug = run;
        const serverOptions = {
            run: run,
            debug: debug
        };
        return serverOptions;
    }
    function sourcekitLspServerOptions() {
        // Load the path to the language server from settings
        const executableCommand = vscode_1.workspace.getConfiguration("sourcekit-lsp").get("serverPath") ||
            vscode_1.workspace
                .getConfiguration("swift")
                .get("languageServerPath", "/usr/local/bin/sourcekit-lsp");
        const toolchain = vscode_1.workspace
            .getConfiguration("sourcekit-lsp")
            .get("toolchainPath");
        const env = toolchain
            ? { env: Object.assign(Object.assign({}, process.env), { SOURCEKIT_TOOLCHAIN_PATH: toolchain }) }
            : { env: process.env };
        const run = { command: executableCommand, options: { env } };
        const debug = run;
        const serverOptions = {
            run: run,
            debug: debug
        };
        return serverOptions;
    }
    const lspMode = vscode_1.workspace.getConfiguration("sde").get("languageServerMode");
    if (lspMode === "sourcekit-lsp") {
        return sourcekitLspServerOptions();
    }
    else if (lspMode === "langserver") {
        return lspServerOptions();
    }
    else {
        return sourcekiteServerOptions();
    }
}
function activate(context) {
    if (vscode_1.workspace.getConfiguration().get("sde.enable") === false) {
        return;
    }
    initConfig();
    //debug
    context.subscriptions.push(vscode_1.debug.registerDebugConfigurationProvider("swift", new SwiftConfigurationProvider_1.SwiftConfigurationProvider()));
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: [
            { language: "swift", scheme: "file" },
            { pattern: "*.swift", scheme: "file" }
        ],
        synchronize: {
            configurationSection: ["swift", "editor", "[swift]"],
            // Notify the server about file changes to '.clientrc files contain in the workspace
            fileEvents: [
                vscode_1.workspace.createFileSystemWatcher("**/*.swift"),
                vscode_1.workspace.createFileSystemWatcher(".build/*.yaml")
            ]
        },
        initializationOptions: {
            isLSPServerTracingOn: exports.isLSPServerTracingOn,
            skProtocolProcess: skProtocolProcess,
            skProtocolProcessAsShellCmd: skProtocolProcessAsShellCmd,
            skCompilerOptions: vscode_1.workspace
                .getConfiguration()
                .get("sde.sourcekit.compilerOptions"),
            toolchainPath: vscode_1.workspace
                .getConfiguration("sourcekit-lsp")
                .get("toolchainPath") || null
        }
    };
    // Create the language client and start the client.
    const langClient = new vscode_languageclient_1.LanguageClient("Swift", currentServerOptions(context), clientOptions);
    let disposable = langClient.start();
    context.subscriptions.push(disposable);
    exports.diagnosticCollection = vscode_1.languages.createDiagnosticCollection("swift");
    context.subscriptions.push(exports.diagnosticCollection);
    function buildSPMPackage() {
        if (isSPMProject()) {
            //setup
            if (!exports.buildStatusItem) {
                initBuildStatusItem();
            }
            makeBuildStatusStarted();
            tools.buildPackage(swiftBinPath, vscode_1.workspace.rootPath, swiftBuildParams);
        }
    }
    //commands
    context.subscriptions.push(vscode_1.commands.registerCommand("sde.commands.buildPackage", buildSPMPackage));
    if (shouldBuildOnSave()) {
        // build on save
        vscode_1.workspace.onDidSaveTextDocument(document => {
            if (document.languageId === "swift") {
                buildSPMPackage();
            }
        }, null, context.subscriptions);
    }
    // build on startup
    buildSPMPackage();
}
exports.activate = activate;
function initConfig() {
    checkToolsAvailability();
    exports.isTracingOn = (vscode_1.workspace.getConfiguration().get("sde.enableTracing.client"));
    exports.isLSPServerTracingOn = (vscode_1.workspace.getConfiguration().get("sde.enableTracing.LSPServer"));
    //FIXME rootPath may be undefined for adhoc file editing mode???
    swiftPackageManifestPath = path.join(vscode_1.workspace.rootPath, "Package.swift");
    spmChannel = vscode_1.window.createOutputChannel("SPM");
}
let originalBuildStatusItemColor = null;
function initBuildStatusItem() {
    exports.buildStatusItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
    originalBuildStatusItemColor = exports.buildStatusItem.color;
}
const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let building = null;
function makeBuildStatusStarted() {
    exports.buildStatusItem.color = originalBuildStatusItemColor;
    exports.buildStatusItem.show();
    let animation = frame();
    if (building) {
        clearInterval(building);
    }
    building = setInterval(() => {
        exports.buildStatusItem.text = `${animation()} building`;
    }, 100);
}
function frame() {
    var i = 0;
    return function () {
        return frames[(i = ++i % frames.length)];
    };
}
function makeBuildStatusFailed() {
    clearInterval(building);
    exports.buildStatusItem.text = "$(issue-opened) build failed";
    exports.buildStatusItem.color = "red";
}
exports.makeBuildStatusFailed = makeBuildStatusFailed;
function makeBuildStatusSuccessful() {
    clearInterval(building);
    exports.buildStatusItem.text = "$(check) build succeeded";
    exports.buildStatusItem.color = originalBuildStatusItemColor;
}
exports.makeBuildStatusSuccessful = makeBuildStatusSuccessful;
function isSPMProject() {
    return fs.existsSync(swiftPackageManifestPath);
}
function trace(...msg) {
    if (exports.isTracingOn) {
        console.log(...msg);
    }
}
exports.trace = trace;
function dumpInConsole(msg) {
    spmChannel.append(msg);
}
exports.dumpInConsole = dumpInConsole;
// function getSkProtocolProcessPath(extPath: string) {
// 	switch (os.platform()) {
// 		case 'darwin':
// 			return path.join(extPath, "bin", "macos", 'sourcekitd-repl')
// 		default://FIXME
// 			return path.join(extPath, "bin", "linux", 'sourcekitd-repl')
// 	}
// }
function checkToolsAvailability() {
    swiftBinPath = AbsolutePath_1.absolutePath(vscode_1.workspace.getConfiguration().get("swift.path.swift_driver_bin"));
    swiftBuildParams = (vscode_1.workspace.getConfiguration().get("sde.swiftBuildingParams")) || ["build"];
    const sourcekitePath = AbsolutePath_1.absolutePath(vscode_1.workspace.getConfiguration().get("swift.path.sourcekite"));
    const sourcekitePathEnableShCmd = vscode_1.workspace
        .getConfiguration()
        .get("swift.path.sourcekiteDockerMode");
    const shellPath = AbsolutePath_1.absolutePath(vscode_1.workspace.getConfiguration().get("swift.path.shell"));
    // const useBuiltInBin = <boolean>workspace.getConfiguration().get('swift.sourcekit.use_built_in_bin')
    // if (useBuiltInBin) {
    // 	skProtocolProcess = getSkProtocolProcessPath(
    // 		extensions.getExtension(PUBLISHER_NAME).extensionPath)
    // } else {
    skProtocolProcess = sourcekitePath;
    skProtocolProcessAsShellCmd = sourcekitePathEnableShCmd;
    // }
    if (!swiftBinPath || !fs.existsSync(swiftBinPath)) {
        vscode_1.window.showErrorMessage('missing dependent swift tool, please configure correct "swift.path.swift_driver_bin"');
    }
    if (!sourcekitePathEnableShCmd) {
        if (!skProtocolProcess || !fs.existsSync(skProtocolProcess)) {
            vscode_1.window.showErrorMessage('missing dependent sourcekite tool, please configure correct "swift.path.sourcekite"');
        }
    }
    if (!shellPath || !fs.existsSync(shellPath)) {
        vscode_1.window.showErrorMessage('missing dependent shell tool, please configure correct "swift.path.shell"');
    }
}
//# sourceMappingURL=clientMain.js.map