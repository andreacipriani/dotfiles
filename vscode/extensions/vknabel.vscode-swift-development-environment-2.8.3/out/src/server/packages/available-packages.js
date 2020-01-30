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
const description_package_1 = require("./description-package");
const swift_file_package_1 = require("./swift-file-package");
const debug_yaml_package_1 = require("./debug-yaml-package");
const config_package_1 = require("./config-package");
const package_helpers_1 = require("./package-helpers");
exports.availablePackages = (fromPath) => __awaiter(void 0, void 0, void 0, function* () {
    const [configTargets, debugYamlTargets, descriptionTargets, swiftFileTargets] = yield Promise.all([
        config_package_1.configPackage(fromPath),
        debug_yaml_package_1.debugYamlPackage(fromPath),
        description_package_1.descriptionPackage(fromPath),
        swift_file_package_1.swiftFilePackage(fromPath)
    ]);
    return package_helpers_1.flatteningTargetsWithUniqueSources(configTargets, debugYamlTargets, descriptionTargets, swiftFileTargets);
});
//# sourceMappingURL=available-packages.js.map