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
const childProcess = require("child_process");
function spawn(cmd) {
    return __awaiter(this, void 0, void 0, function* () {
        let buffer = "";
        return new Promise((resolve, reject) => {
            const sp = childProcess.spawn(exports.Current.config.shellPath, ["-c", cmd]);
            sp.stdout.on("data", data => {
                buffer += data;
            });
            sp.on("exit", code => {
                if (code === 0) {
                    resolve(buffer);
                }
                else {
                    reject(code);
                }
            });
        });
    });
}
function swift(inPath, cmd) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.spawn(`cd ${inPath} && ${exports.Current.config.swiftPath} ${cmd}`);
    });
}
function log(label, ...details) {
    if (exports.Current.config.isTracingOn) {
        console.log(`[${label}]`, ...details);
    }
}
function report(label, ...details) {
    if (exports.Current.config.isTracingOn) {
        console.log(`[ERROR][${label}]`, ...details);
    }
}
function defaultCompilerArguments() {
    return [
        "-sdk",
        "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk",
        "-sdk",
        "/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk",
        "-sdk",
        "/Applications/Xcode.app/Contents/Developer/Platforms/WatchOS.platform/Developer/SDKs/WatchOS.sdk",
        "-sdk",
        "/Applications/Xcode.app/Contents/Developer/Platforms/AppleTVOS.platform/Developer/SDKs/AppleTVOS.sdk",
        "-I",
        "/System/Library/Frameworks/",
        "-I",
        "/usr/lib/swift/pm/",
        ...exports.Current.config.sourceKitCompilerOptions
    ];
}
exports.Current = {
    log,
    report,
    spawn,
    swift,
    defaultCompilerArguments,
    config: {
        workspacePaths: [],
        isTracingOn: false,
        swiftPath: "$(which swift)",
        sourcekitePath: "$(which sourcekite)",
        shellPath: "/bin/bash",
        sourceKitCompilerOptions: [],
        targets: [],
        toolchainPath: null
    }
};
//# sourceMappingURL=current.js.map