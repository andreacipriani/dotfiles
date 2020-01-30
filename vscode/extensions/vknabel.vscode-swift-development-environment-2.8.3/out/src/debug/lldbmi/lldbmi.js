"use strict";
// Copyright (c) 2015 Vadim Macagon
// MIT License, see LICENSE file for full terms.
Object.defineProperty(exports, "__esModule", { value: true });
const debug_session_1 = require("./debug_session");
const child_process_1 = require("child_process");
const os = require("os");
const path = require("path");
function setProcessEnvironment() {
    // HACK for LLDB on Windows (where users have to build their own Python)
    if (os.platform() === 'win32') {
        if (process.env['LLDB_PYTHON_SRC'] === undefined) {
            throw new Error('LLDB_PYTHON_SRC environment variable is not set. It must be set to the source directory ' +
                'of the Python version used in the LLDB build.');
        }
        if (process.env['LLVM_SRC_BUILD'] === undefined) {
            throw new Error('LLVM_SRC_BUILD environment variable is not set. It must be set to the LLVM build output ' +
                'directory.');
        }
        process.env['PATH'] =
            process.env['PATH'] + ';' + path.join(process.env['LLDB_PYTHON_SRC'], 'PCbuild');
        var pythonPath = path.join(process.env['LLDB_PYTHON_SRC'], 'Lib') + ';' +
            path.join(process.env['LLVM_SRC_BUILD'], 'lib\\site-packages');
        if (process.env['PYTHONPATH']) {
            process.env['PYTHONPATH'] = process.env['PYTHONPATH'] + ';' + pythonPath;
        }
        else {
            process.env['PYTHONPATH'] = pythonPath;
        }
    }
}
var DebuggerType;
(function (DebuggerType) {
    DebuggerType[DebuggerType["GDB"] = 0] = "GDB";
    DebuggerType[DebuggerType["LLDB"] = 1] = "LLDB";
})(DebuggerType = exports.DebuggerType || (exports.DebuggerType = {}));
/**
 * Starts a new debugging session and spawns the debbuger process.
 *
 * Once the debug session has outlived its usefulness call [[DebugSession.end]] to ensure proper
 * cleanup.
 *
 * @param debuggerFilename Full path to debugger executable, defaults to either `lldb-mi` or `gdb`
 *                         (based on [[debuggerType]]).
 * @returns A new debug session, or null if a new session couldn't be started.
 */
function startDebugSession(debuggerType, debuggerFilename) {
    let debuggerArgs;
    switch (debuggerType) {
        case DebuggerType.LLDB:
            setProcessEnvironment();
            if (!debuggerFilename) {
                // lldb-mi.exe should be on the PATH
                debuggerFilename = 'lldb-mi';
            }
            debuggerArgs = ['--interpreter'];
            // debuggerArgs = ['--interpreter','--log','--log-dir=/tmp']//JIN
            break;
        case DebuggerType.GDB:
            if (!debuggerFilename) {
                debuggerFilename = 'gdb';
            }
            debuggerArgs = ['--interpreter', 'mi'];
            break;
        default:
            throw new Error('Unknown debugger type!');
    }
    const debuggerProcess = child_process_1.spawn(debuggerFilename, debuggerArgs);
    let debugSession = null;
    debugSession = new debug_session_1.default(debuggerProcess.stdout, debuggerProcess.stdin);
    debuggerProcess.on('error', (error) => {
        throw error;
    });
    debuggerProcess.once('exit', (code, signal) => debugSession.end(false));
    return debugSession;
}
exports.startDebugSession = startDebugSession;
;
//# sourceMappingURL=lldbmi.js.map