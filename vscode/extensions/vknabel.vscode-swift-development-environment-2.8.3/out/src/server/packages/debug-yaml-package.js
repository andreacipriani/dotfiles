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
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");
const path_helpers_1 = require("../path-helpers");
exports.debugYamlPackage = (fromPath) => __awaiter(void 0, void 0, void 0, function* () {
    let debugContents;
    try {
        debugContents = yield contentsOfDebugOrReleaseYaml(fromPath);
    }
    catch (error) {
        return [];
    }
    const debugYaml = yaml.safeLoad(debugContents);
    const targets = [];
    for (const name in debugYaml.commands) {
        const command = debugYaml.commands[name];
        if (command.sources == null || command.sources.length === 0) {
            continue;
        }
        targets.push({
            name: command["module-name"] || name,
            path: fromPath,
            sources: new Set(command.sources.map(toSource => path.normalize(path.resolve(fromPath, toSource)))),
            compilerArguments: compilerArgumentsForCommand(command)
        });
    }
    return targets;
});
function contentsOfFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, "utf8", (error, data) => {
            if (typeof data === "string") {
                resolve(data);
            }
            else {
                reject(error);
            }
        });
    });
}
function compilerArgumentsForCommand(command) {
    const importPaths = command["import-paths"] || [];
    const otherArgs = command["other-args"] || [];
    const moduleNameArgs = (command["module-name"] && [
        "-module-name",
        command["module-name"],
        "-Onone"
    ]) ||
        [];
    const importPathArgs = importPaths.map(path_helpers_1.compilerArgumentsForImportPath);
    return otherArgs.concat(moduleNameArgs, ...importPathArgs);
}
function contentsOfDebugOrReleaseYaml(fromPath) {
    return contentsOfFile(path.resolve(fromPath, ".build", "debug.yaml")).catch(() => contentsOfFile(path.resolve(fromPath, ".build", "release.yaml")));
}
//# sourceMappingURL=debug-yaml-package.js.map