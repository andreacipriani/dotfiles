"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server = require("./server");
const yaml = require("js-yaml");
const current_1 = require("./current");
let skProtocolProcess = null;
let skeHandler = null;
function initializeSourcekite() {
    if (skProtocolProcess == null) {
        initializeSKProtocolProcess();
    }
}
exports.initializeSourcekite = initializeSourcekite;
function terminateSourcekite() {
    if (skProtocolProcess != null) {
        skProtocolProcess.kill();
    }
}
function restartSourcekite() {
    terminateSourcekite();
    initializeSourcekite();
}
function createSkProtocolProcess() {
    const env = Object.assign(Object.assign({}, process.env), { TOOLCHAIN_DIR: current_1.Current.config.toolchainPath || process.env["TOOLCHAIN_DIR"] });
    if (server.skProtocolProcessAsShellCmd) {
        const volumes = current_1.Current.config.workspacePaths.map(path => `-v '${path}:${path}'`);
        return server.spawn(server.getShellExecPath(), ["-c", `docker run --rm ${volumes} -i jinmingjian/docker-sourcekite`], { env });
    }
    else {
        return server.spawn(server.skProtocolPath, [], { env });
    }
}
function initializeSKProtocolProcess() {
    current_1.Current.log("sourcekite", `***sourcekite initializing with skProtocolProcess at [${server.skProtocolPath}]`);
    const pathSourcekite = current_1.Current.config.sourcekitePath;
    skProtocolProcess = createSkProtocolProcess();
    skProtocolProcess.stderr.on("data", data => {
        current_1.Current.log("sourcekite", "***stderr***" + data);
    });
    skProtocolProcess.on("exit", function (code, signal) {
        current_1.Current.log("sourcekite", "[exited]", `code: ${code}, signal: ${signal}`);
        //NOTE this is not guaranteed to reboot, but we just want it 'not guaranteed'
        skProtocolProcess = createSkProtocolProcess();
    });
    skProtocolProcess.on("error", function (err) {
        current_1.Current.log("sourcekite", "***sourcekitd_repl error***" + err.message);
        if (err.message.indexOf("ENOENT") > 0) {
            const msg = "The '" +
                pathSourcekite +
                "' command is not available." +
                " Please check your swift executable user setting and ensure it is installed.";
            current_1.Current.log("sourcekite", "***sourcekitd_repl not found***" + msg);
        }
        throw err;
    });
    skeHandler = new SourcekiteResponseHandler();
}
var ParsingState;
(function (ParsingState) {
    ParsingState[ParsingState["endResponse"] = 0] = "endResponse";
    ParsingState[ParsingState["startResponseContent"] = 1] = "startResponseContent";
})(ParsingState || (ParsingState = {}));
//assumption:single-thread
class SourcekiteResponseHandler {
    constructor() {
        // private static responseTimeoutMills = 15 * 1000 //FIXME
        this.rids = new Array(SourcekiteResponseHandler.nResponsesSlot); //for checking
        this.responses = new Array(SourcekiteResponseHandler.nResponsesSlot);
        this.responsesProcessed = Array.from(new Array(SourcekiteResponseHandler.nResponsesSlot)).map((_, i) => true);
        this.responseResolves = new Array(SourcekiteResponseHandler.nResponsesSlot);
        this.responseRejects = new Array(SourcekiteResponseHandler.nResponsesSlot);
        // private hasError = false
        this.output = "";
        skProtocolProcess.stdout.on("data", this.handleResponse.bind(this));
        current_1.Current.log("-->SourcekiteResponseHandler constructor done");
    }
    // private rid = -1
    handleResponse(data) {
        this.output += data;
        if (current_1.Current.config.isTracingOn) {
            current_1.Current.log("SourcekiteResponseHandler", `${data}`);
        }
        if (this.output.endsWith("}\n\n")) {
            const idx = this.output.indexOf("\n");
            const ridstr = this.output.substring(0, idx);
            const rid = parseInt(ridstr);
            if (isNaN(rid)) {
                throw new Error("wrong format for reqid");
            }
            const res = this.output.substring(idx + 1);
            const slot = this.getSlot(rid);
            const resolve = this.responseResolves[slot];
            const reject = this.responseRejects[slot];
            this.output = "";
            this.responsesProcessed[slot] = true;
            try {
                resolve(res);
            }
            catch (e) {
                current_1.Current.log(`---error: ${e}`);
                reject(e);
            }
        }
    }
    getResponse(rid) {
        // const start = new Date().getTime() //FIXME enable timeout?
        return new Promise((resolve, reject) => {
            const slot = this.getSlot(rid);
            //FIXME enable timeout?reject only when covered by next replacer
            if (!this.responsesProcessed[slot]) {
                const rjt = this.responseRejects[slot];
                rjt(`fail to process the request[reqid=${this.rids[slot]}]`);
            }
            this.rids[slot] = rid;
            this.responseResolves[slot] = resolve;
            this.responseRejects[slot] = reject;
            this.responsesProcessed[slot] = false;
        });
    }
    getSlot(rid) {
        return rid % SourcekiteResponseHandler.nResponsesSlot;
    }
}
SourcekiteResponseHandler.nResponsesSlot = 64; //FIXME config options?
let reqCount = 0; //FIXME
function pluck(prop) {
    return target => target[prop];
}
function typedResponse(request, requestType, extraState = null, retries = 0) {
    function parseSkResponse(resp) {
        return yaml.safeLoad(resp);
    }
    current_1.Current.log("request", request);
    const rid = reqCount++;
    skProtocolProcess.stdin.write(rid + "\n");
    skProtocolProcess.stdin.write(request);
    return skeHandler
        .getResponse(rid)
        .catch(e => {
        console.log("Request did fail", requestType, e);
        if (retries > 5) {
            console.log("Request failed too many times. Abort.");
            throw "Request failed too many times. Abort.";
        }
        else {
            restartSourcekite();
            return typedResponse(request, requestType, extraState, retries);
        }
    })
        .then(parseSkResponse);
}
function request(requestType, srcText, srcPath, offset) {
    function targetArgumentsForImport(lib, platform, target) {
        return loadedArgs.indexOf("-target") === -1 &&
            srcText.includes(`import ${lib}`)
            ? [
                "-target",
                target,
                "-sdk",
                `/Applications/Xcode.app/Contents/Developer/Platforms/${platform}.platform/Developer/SDKs/${platform}.sdk`
            ]
            : null;
    }
    function defaultTargetArguments() {
        if (loadedArgs.indexOf("-target") !== -1) {
            return [];
        }
        return process.platform === "linux"
            ? ["-target", "x86_64-unknown-linux"]
            : [
                "-target",
                "x86_64-apple-macosx10.10",
                "-sdk",
                `/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk`
            ];
    }
    const target = server.targetForSource(srcPath);
    const sourcePaths = Array.from(target.sources);
    const loadedArgs = target.compilerArguments;
    /*const inferredOSArgs = process.platform === 'darwin'
          ? ["-target", "x86_64-apple-macosx10.10"]*/
    const inferredTargetArgs = targetArgumentsForImport("UIKit", "iPhoneOS", "arm64-apple-ios11.0") ||
        targetArgumentsForImport("WatchKit", "WatchOS", "armv7k-apple-watchos4.0") ||
        targetArgumentsForImport("AppKit", "MacOSX", "x86_64-apple-macosx10.10") ||
        defaultTargetArguments();
    const compilerargs = JSON.stringify([
        ...target.compilerArguments,
        ...(sourcePaths || [srcPath]),
        ...inferredTargetArgs
    ]);
    srcText = JSON.stringify(srcText);
    let request = `{
  key.request: source.request.${requestType},
  key.sourcefile: "${srcPath}",
  key.offset: ${offset},
  key.compilerargs: ${compilerargs},
  key.sourcetext: ${srcText}
}

`;
    return typedResponse(request, requestType);
}
//== codeComplete
function codeComplete(srcText, srcPath, offset) {
    return request("codecomplete", srcText, srcPath, offset).then(pluck("key.results"));
}
exports.codeComplete = codeComplete;
//== cursorInfo
function cursorInfo(srcText, srcPath, offset) {
    return request("cursorinfo", srcText, srcPath, offset);
}
exports.cursorInfo = cursorInfo;
//== demangle
function demangle(...demangledNames) {
    const names = JSON.stringify(demangledNames.join(","));
    let request = `{
  key.request: source.request.demangle,
  key.names: [${names}]
}

`;
    return typedResponse(request, "demangle").then(pluck("key.results"));
}
exports.demangle = demangle;
//# sourceMappingURL=sourcekites.js.map