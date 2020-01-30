"use strict";
// Copyright (c) 2015 Vadim Macagon
// MIT License, see LICENSE file for full terms.
Object.defineProperty(exports, "__esModule", { value: true });
var TargetStopReason;
(function (TargetStopReason) {
    /** A breakpoint was hit. */
    TargetStopReason[TargetStopReason["BreakpointHit"] = 0] = "BreakpointHit";
    /** A step instruction finished. */
    TargetStopReason[TargetStopReason["EndSteppingRange"] = 1] = "EndSteppingRange";
    /** A step-out instruction finished. */
    TargetStopReason[TargetStopReason["FunctionFinished"] = 2] = "FunctionFinished";
    /** The target finished executing and terminated normally. */
    TargetStopReason[TargetStopReason["ExitedNormally"] = 3] = "ExitedNormally";
    /** The target was signalled. */
    TargetStopReason[TargetStopReason["SignalReceived"] = 4] = "SignalReceived";
    /** The target encountered an exception (this is LLDB specific). */
    TargetStopReason[TargetStopReason["ExceptionReceived"] = 5] = "ExceptionReceived";
    /** Catch-all for any of the other numerous reasons. */
    TargetStopReason[TargetStopReason["Unrecognized"] = 6] = "Unrecognized";
    /** An inferior terminated because it received a signal. */
    TargetStopReason[TargetStopReason["ExitedSignalled"] = 7] = "ExitedSignalled";
    /** An inferior terminated (for some reason, check exitCode for clues). */
    TargetStopReason[TargetStopReason["Exited"] = 8] = "Exited";
})(TargetStopReason = exports.TargetStopReason || (exports.TargetStopReason = {}));
/** Indicates how much information should be retrieved when calling
  *  [[DebugSession.getLocalVariables]].
  */
var VariableDetailLevel;
(function (VariableDetailLevel) {
    /** Only variable names will be retrieved, not their types or values. */
    VariableDetailLevel[VariableDetailLevel["None"] = 0] = "None";
    /** Only variable names and values will be retrieved, not their types. */
    VariableDetailLevel[VariableDetailLevel["All"] = 1] = "All";
    /**
      * The name and type will be retrieved for all variables, however values will only be retrieved
      * for simple variable types (not arrays, structures or unions).
      */
    VariableDetailLevel[VariableDetailLevel["Simple"] = 2] = "Simple";
})(VariableDetailLevel = exports.VariableDetailLevel || (exports.VariableDetailLevel = {}));
/** Output format specifiers for watch values. */
var WatchFormatSpec;
(function (WatchFormatSpec) {
    WatchFormatSpec[WatchFormatSpec["Binary"] = 0] = "Binary";
    WatchFormatSpec[WatchFormatSpec["Decimal"] = 1] = "Decimal";
    WatchFormatSpec[WatchFormatSpec["Hexadecimal"] = 2] = "Hexadecimal";
    WatchFormatSpec[WatchFormatSpec["Octal"] = 3] = "Octal";
    /**
      * This specifier is used to indicate that one of the other ones should be automatically chosen
      * based on the expression type, for example `Decimal` for integers, `Hexadecimal` for pointers.
      */
    WatchFormatSpec[WatchFormatSpec["Default"] = 4] = "Default";
})(WatchFormatSpec = exports.WatchFormatSpec || (exports.WatchFormatSpec = {}));
/** A watch may have one or more of these attributes associated with it. */
var WatchAttribute;
(function (WatchAttribute) {
    /** Indicates the watch value can be modified. */
    WatchAttribute[WatchAttribute["Editable"] = 0] = "Editable";
    /**
      * Indicates the watch value can't be modified. This will be the case for any watch with
      * children (at least when implemented correctly by the debugger, *cough* not LLDB-MI *cough*).
      */
    WatchAttribute[WatchAttribute["NonEditable"] = 1] = "NonEditable";
})(WatchAttribute = exports.WatchAttribute || (exports.WatchAttribute = {}));
/** Output format specifiers for register values. */
var RegisterValueFormatSpec;
(function (RegisterValueFormatSpec) {
    RegisterValueFormatSpec[RegisterValueFormatSpec["Binary"] = 0] = "Binary";
    RegisterValueFormatSpec[RegisterValueFormatSpec["Decimal"] = 1] = "Decimal";
    RegisterValueFormatSpec[RegisterValueFormatSpec["Hexadecimal"] = 2] = "Hexadecimal";
    RegisterValueFormatSpec[RegisterValueFormatSpec["Octal"] = 3] = "Octal";
    RegisterValueFormatSpec[RegisterValueFormatSpec["Raw"] = 4] = "Raw";
    /**
      * This specifier is used to indicate that one of the other ones should be automatically chosen.
      */
    RegisterValueFormatSpec[RegisterValueFormatSpec["Default"] = 5] = "Default";
})(RegisterValueFormatSpec = exports.RegisterValueFormatSpec || (exports.RegisterValueFormatSpec = {}));
//# sourceMappingURL=types.js.map