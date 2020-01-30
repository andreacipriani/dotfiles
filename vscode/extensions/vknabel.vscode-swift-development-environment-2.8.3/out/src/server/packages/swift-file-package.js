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
const path = require("path");
exports.swiftFilePackage = (fromPath) => __awaiter(void 0, void 0, void 0, function* () {
    return [
        {
            name: path.basename(fromPath),
            path: fromPath,
            sources: new Set(allSwiftFilesInPath(fromPath).map(file => path.normalize(path.resolve(fromPath, file)))),
            compilerArguments: []
        }
    ];
});
function allSwiftFilesInPath(root) {
    const result = new Array();
    try {
        const dir = fs
            .readdirSync(root)
            .filter(sub => !sub.startsWith(".") && sub !== "Carthage");
        for (const sub of dir) {
            if (path.extname(sub) === ".swift") {
                result.push(path.join(root, sub));
            }
            else {
                result.push(...allSwiftFilesInPath(path.join(root, sub)));
            }
        }
        return result;
    }
    catch (error) {
        return result;
    }
}
//# sourceMappingURL=swift-file-package.js.map