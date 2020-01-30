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
const current_1 = require("../current");
const path_helpers_1 = require("../path-helpers");
exports.configPackage = (fromPath) => __awaiter(void 0, void 0, void 0, function* () {
    const targets = current_1.Current.config.targets
        .filter(({ path: targetPath }) => path.isAbsolute(targetPath) ||
        fs.existsSync(path.resolve(fromPath, targetPath)))
        .map((configTarget) => __awaiter(void 0, void 0, void 0, function* () {
        const targetPath = path.normalize(path.resolve(fromPath, configTarget.path));
        const expandedSources = (configTarget.sources || ["**/*.swift"]).map(path_helpers_1.expandingSourceGlob(fromPath, targetPath));
        const sources = yield Promise.all(expandedSources);
        return Object.assign(Object.assign({}, configTarget), { path: targetPath, sources: new Set([].concat(...sources)), compilerArguments: configTarget.compilerArguments || [] });
    }));
    return yield Promise.all(targets);
});
//# sourceMappingURL=config-package.js.map