"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.manifestPackage = (fromPath) => __awaiter(this, void 0, void 0, function* () {
    const importPath = "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/pm/4/";
    return [
        {
            name: "PackageDescription",
            sources: new Set([path.join(fromPath, "Package.swift")]),
            path: fromPath,
            compilerArguments: [
                "-swift-version",
                "4",
                "-target",
                "x86_64-apple-macosx10.10",
                "-Onone",
                "-DSWIFT_PACKAGE",
                "-fmodule-map-file=/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/pm/4/PackageDescription.swiftmodule",
                "-module-name",
                "PackageDescription",
                "-Xcc",
                "-I",
                "-Xcc",
                importPath,
                "-I",
                importPath,
                "-Xcc",
                "-F",
                "-Xcc",
                importPath,
                "-F",
                importPath
            ]
        }
    ];
});
//# sourceMappingURL=manifest-package.js.map