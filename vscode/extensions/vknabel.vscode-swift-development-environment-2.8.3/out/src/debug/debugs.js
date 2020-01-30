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
const vscode_debugadapter_1 = require("vscode-debugadapter");
const lldbmi = require("./lldbmi/index");
class SDEDebugSessionAdapter extends vscode_debugadapter_1.DebugSession {
    /**
     * Creates a new debug adapter that is used for one debug session.
     * We configure the default implementation of a debug adapter here.
     */
    constructor() {
        super();
        this.lastBreakPoints = new Map();
        this.variableHandles = new vscode_debugadapter_1.Handles();
        this.debuggerLaunched = false;
        this.debugger = null;
        this.enableTracing = false;
        //override
        this.doSetBreakPoints = undefined;
    }
    //override
    initializeRequest(response, args) {
        this.initializeBackendDebugger();
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
        response.body.supportsConfigurationDoneRequest = true;
        // response.body.supportsEvaluateForHovers = true;
        // response.body.supportsStepBack = true;
        this.sendResponse(response);
        this.trace("initializeRequest done.");
    }
    initializeBackendDebugger() {
        this.debugger = lldbmi.startDebugSession(lldbmi.DebuggerType.LLDB);
        this.debugger.on(lldbmi.EVENT_BREAKPOINT_HIT, (breakNotify) => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("breakpoint", breakNotify.threadId));
            this.trace(`EVENT_BREAKPOINT_HIT:[thread id: ${breakNotify.threadId}]`);
        });
        this.debugger.on(lldbmi.EVENT_STEP_FINISHED, (stepNotify) => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("step", stepNotify.threadId));
            this.trace(`EVENT_STEP_FINISHED:[thread id: ${stepNotify.threadId}]`);
        });
        this.debugger.on(lldbmi.EVENT_FUNCTION_FINISHED, (stepNotify) => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("pause", stepNotify.threadId)); //FIXME pause?step?
            this.trace(`EVENT_FUNCTION_FINISHED:[thread id: ${stepNotify.threadId}]`);
        });
        this.debugger.on(lldbmi.EVENT_EXCEPTION_RECEIVED, (notification) => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("exception", notification.threadId, notification.exception));
            this.trace(`EVENT_EXCEPTION_RECEIVED:[thread id: ${notification.threadId}]`);
        });
        this.debugger.on(lldbmi.EVENT_TARGET_STOPPED, (notification) => {
            switch (notification.reason) {
                case lldbmi.TargetStopReason.Exited:
                case lldbmi.TargetStopReason.ExitedSignalled:
                case lldbmi.TargetStopReason.ExitedNormally:
                    this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
                    this.trace(`EVENT_TARGET_STOPPED:[thread id: ${notification.threadId}]`);
                    break;
                default:
            }
        });
        // this.debugger.on(lldbmi.EVENT_THREAD_CREATED, (notification: lldbmi.IThreadCreatedEvent) => {
        // 	this.sendEvent(new ThreadEvent("started", notification.id))//FIXME started？ where the official docs?
        // 	this.trace(`EVENT_THREAD_CREATED:[thread id: ${notification.id}]`)
        // })
        this.debugger.on(lldbmi.EVENT_THREAD_EXITED, (notification) => {
            this.sendEvent(new vscode_debugadapter_1.ThreadEvent("exited", notification.id));
            this.trace(`EVENT_THREAD_EXITED:[thread id: ${notification.id}]`);
        });
    }
    //override
    launchRequest(response, args) {
        try {
            if (args.enableTracing) {
                this.enableTracing = args.enableTracing;
            }
            this.debugger
                .setExecutableFile(args.program)
                .then(() => {
                this.debuggerLaunched = true;
                if (this.doSetBreakPoints) {
                    this.doSetBreakPoints();
                }
                else {
                    this.debugger.startInferior();
                }
                this.trace("debugger Launched");
            });
        }
        catch (e) {
            this.trace(e);
        }
    }
    setBreakPointsRequest(response, args) {
        if (this.debuggerLaunched) {
            this.invokeDefensively(() => this.setBreakPointsRequestAsync(response, args, false));
        }
        else {
            this.doSetBreakPoints = () => this.setBreakPointsRequestAsync(response, args, true); //only happen once?
        }
    }
    setBreakPointsRequestAsync(response, args, notLaunched) {
        return __awaiter(this, void 0, void 0, function* () {
            var bbps = [];
            for (const line of args.lines) {
                const bbp = yield this.debugger.addBreakpoint(`${args.source.name}:${line}`);
                bbps.push(bbp);
            }
            const oldbbps = this.lastBreakPoints.get(args.source.path);
            if (oldbbps) {
                let bids = [];
                for (const bbp of oldbbps) {
                    bids.push(bbp.id);
                }
                yield this.debugger.removeBreakpoints(bids);
            }
            this.lastBreakPoints.set(args.source.path, bbps);
            response.body = {
                breakpoints: this.toFrontendBreakpoints(bbps)
            };
            this.sendResponse(response);
            if (notLaunched) {
                this.debugger.startInferior(); //as the callback of launchRequest
            }
            this.trace("setBreakPointsRequestAsync done.");
        });
    }
    toFrontendBreakpoints(bbps) {
        const rt = [];
        for (const bbp of bbps) {
            if (bbp.locations) {
                rt.push(new vscode_debugadapter_1.Breakpoint(true, bbp.locations[0].line));
            } //FIXME handle pending
        }
        return rt;
    }
    //override
    //FIXME duplicated messages for threadsRequest. works but lower performance
    threadsRequest(response) {
        this.threadsRequestAsync(response);
    }
    threadsRequestAsync(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const allThreads = yield this.debugger.getThreads();
            response.body = {
                threads: allThreads.all.map(thread => {
                    return new vscode_debugadapter_1.Thread(thread.id, thread.name);
                })
            };
            this.sendResponse(response);
            this.trace("threadsRequestAsync done.");
        });
    }
    //override
    stackTraceRequest(response, args) {
        this.stackTraceRequestAsync(response, args);
    }
    stackTraceRequestAsync(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            args.startFrame;
            const frames = yield this.debugger.
                getStackFrames({ threadId: args.threadId });
            response.body = {
                stackFrames: frames.map(frame => {
                    return new vscode_debugadapter_1.StackFrame(frame.level, `${frame.filename}@(${frame.address})`, new vscode_debugadapter_1.Source(frame.filename, this.convertDebuggerPathToClient(frame.fullname)), frame.line, 0);
                }),
                totalFrames: frames.length
            };
            this.sendResponse(response);
            this.trace("stackTraceRequestAsync done.");
        });
    }
    //override
    scopesRequest(response, args) {
        //FIXME all vars goto locals?
        response.body = {
            scopes: [
                new vscode_debugadapter_1.Scope("Local", this.variableHandles.create(args.frameId), false),
            ]
        };
        this.sendResponse(response);
        this.trace("scopesRequest done.");
    }
    //override
    variablesRequest(response, args) {
        this.variablesRequestAsync(response, args);
    }
    variablesRequestAsync(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const v = this.variableHandles.get(args.variablesReference, 0);
            let vars = [];
            if (typeof v === 'number') { //Global scope
                if (v == -1) {
                    //FIXME swift's global scope may be per app?but vscode's global scope is per stack frame...
                    vars = yield this.debugger.getGlobalVariables();
                }
                else {
                    vars = yield this.debugger.getStackFrameVariables();
                }
                this.asFrontendVariables(vars, null);
            }
            else { //typeof v === 'string'
                vars = yield this.debugger.getVariableContent(v);
                this.asFrontendVariables(vars, v);
            }
            response.body = {
                variables: vars
            };
            this.sendResponse(response);
            this.trace("variablesRequestAsync done.");
        });
    }
    asFrontendVariables(vars, parentVarName) {
        vars.forEach(v => {
            if (typeof v.variablesReference === 'string') {
                let vf = v.variablesReference;
                // this.trace(`parentVarName:${parentVarName}|vf: ${vf}`)
                if (parentVarName) {
                    const lastDotIndex = vf.lastIndexOf(".");
                    const varName = vf.substr(lastDotIndex == -1 ? 0 : lastDotIndex + 1, vf.length);
                    if (varName.startsWith("[")) {
                        vf = parentVarName + varName;
                    }
                    else {
                        vf = `${parentVarName}.${varName}`;
                    }
                }
                v.variablesReference = this.variableHandles.create(vf);
            }
        });
    }
    continueRequest(response, args) {
        this.debugger.resumeInferior(); //FIXME specify thread?
        this.sendResponse(response); //await?
    }
    // protected reverseContinueRequest(response: DebugProtocol.ReverseContinueResponse, args: DebugProtocol.ReverseContinueArguments): void {
    // 	for (var ln = this._currentLine - 1; ln >= 0; ln--) {
    // 		if (this.fireEventsForLine(response, ln)) {
    // 			return;
    // 		}
    // 	}
    // 	this.sendResponse(response);
    // 	// no more lines: stop at first line
    // 	this._currentLine = 0;
    // 	this.sendEvent(new StoppedEvent("entry", SDEDebugSessionAdapter.THREAD_ID));
    // }
    nextRequest(response, args) {
        this.debugger.stepOverLine({ threadId: args.threadId }).then(() => {
            this.sendResponse(response);
        });
        this.trace("nextRequest done.");
    }
    // protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments): void {
    // 	for (let ln = this._currentLine - 1; ln >= 0; ln--) {
    // 		if (this.fireStepEvent(response, ln)) {
    // 			return;
    // 		}
    // 	}
    // 	this.sendResponse(response);
    // 	// no more lines: stop at first line
    // 	this._currentLine = 0;
    // 	this.sendEvent(new StoppedEvent("entry", SDEDebugSessionAdapter.THREAD_ID));
    // }
    // protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): void {
    // 	response.body = {
    // 		result: `evaluate(context: '${args.context}', '${args.expression}')`,
    // 		variablesReference: 0
    // 	};
    // 	this.sendResponse(response);
    // }
    //===
    invokeDefensively(fn) {
        try {
            fn();
        }
        catch (e) {
            this.trace(e);
        }
    }
    trace(msg) {
        if (this.enableTracing) {
            const e = new vscode_debugadapter_1.OutputEvent(`---[trace] ${msg}\n`);
            this.sendEvent(e);
        }
    }
}
vscode_debugadapter_1.DebugSession.run(SDEDebugSessionAdapter);
//# sourceMappingURL=debugs.js.map