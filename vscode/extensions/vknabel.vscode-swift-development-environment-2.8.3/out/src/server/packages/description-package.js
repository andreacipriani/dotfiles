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
const path = require("path");
const current_1 = require("../current");
const joinPath = path.join;
exports.descriptionPackage = (fromPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield current_1.Current.swift(fromPath, `package describe --type json`);
        const packageDescription = JSON.parse(data);
        const targetDescription = packageDescription.modules || packageDescription.targets;
        return targetDescription.map(targetFromDescriptionFromPath(fromPath));
    }
    catch (error) {
        current_1.Current.report(error);
        return [];
    }
});
function targetFromDescriptionFromPath(fromPath) {
    return ({ name, path, sources }) => {
        return {
            name,
            path,
            sources: new Set(sources),
            compilerArguments: [
                "-I",
                joinPath(fromPath, ".build", "debug"),
                ...current_1.Current.defaultCompilerArguments()
            ]
        };
    };
}
//# sourceMappingURL=description-package.js.map