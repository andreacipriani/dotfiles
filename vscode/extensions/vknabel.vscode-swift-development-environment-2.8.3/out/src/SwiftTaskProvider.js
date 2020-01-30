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
const vscode = require("vscode");
class SwiftTaskProvider {
    provideTasks(token) {
        return [
            {
                source: "swift",
                name: "build",
                definition: {
                    type: "swift"
                },
                execution: new vscode.ShellExecution("swift build"),
                isBackground: false,
                presentationOptions: {},
                problemMatchers: [],
                runOptions: {},
                group: vscode.TaskGroup.Build
            },
            {
                source: "swift",
                name: "build --build-tests",
                definition: {
                    type: "swift"
                },
                execution: new vscode.ShellExecution("swift build --build-tests"),
                isBackground: false,
                presentationOptions: {},
                problemMatchers: [],
                runOptions: {},
                group: vscode.TaskGroup.Build
            },
            {
                source: "swift",
                name: "package clean",
                definition: {
                    type: "swift"
                },
                execution: new vscode.ShellExecution("swift package clean"),
                isBackground: false,
                presentationOptions: {},
                problemMatchers: [],
                runOptions: {},
                group: vscode.TaskGroup.Clean
            },
            {
                source: "swift",
                name: "package generate-xcodeproj",
                definition: {
                    type: "swift"
                },
                execution: new vscode.ShellExecution("swift package generate-xcodeproj"),
                isBackground: false,
                presentationOptions: {},
                problemMatchers: [],
                runOptions: {},
                group: vscode.TaskGroup.Build
            }
        ];
    }
    resolveTask(task, token) {
        return __awaiter(this, void 0, void 0, function* () {
            task.definition;
            return new vscode.Task(task.definition, task.definition.task, "swift");
        });
    }
}
exports.SwiftTaskProvider = SwiftTaskProvider;
//# sourceMappingURL=SwiftTaskProvider.js.map