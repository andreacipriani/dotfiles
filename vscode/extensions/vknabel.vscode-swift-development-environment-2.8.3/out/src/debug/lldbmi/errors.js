"use strict";
// Copyright (c) 2015 Vadim Macagon
// MIT License, see LICENSE file for full terms.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Used to indicate failure of a MI command sent to the debugger.
 */
class CommandFailedError {
    constructor(message, command, code, token) {
        this.name = "CommandFailedError";
        this.message = message;
        this.code = code;
        this.command = command;
        this.token = token;
    }
}
exports.CommandFailedError = CommandFailedError;
/**
 * Used to indicate the response to an MI command didn't match the expected format.
 */
class MalformedResponseError {
    /**
     * @param message The description of the error.
     * @param response The malformed response text (usually just the relevant part).
     * @param command The command text that was sent to the debugger (minus token and dash prefix).
     * @param token Token of the command (if the command had one).
     */
    constructor(message, response, command, token) {
        this.message = message;
        this.response = response;
        this.command = command;
        this.token = token;
        this.name = "MalformedResponseError";
    }
}
exports.MalformedResponseError = MalformedResponseError;
//# sourceMappingURL=errors.js.map