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
const current_1 = require("../current");
const path_helpers_1 = require("../path-helpers");
exports.xcodebuildPackage = (fromPath) => __awaiter(this, void 0, void 0, function* () {
    const { project } = JSON.parse(yield current_1.Current.spawn("xcodebuild -list -json"));
    const targets = project.targets.map((targetName) => __awaiter(this, void 0, void 0, function* () {
        console.log("0");
        const settingsOutput = yield current_1.Current.spawn(`xcodebuild -target '${targetName}' -configuration Debug -showBuildSettings`);
        console.log("1");
        const settings = settingsFromOutput(settingsOutput);
        console.log("2");
        const srcPath = path.resolve(settings.SRCROOT, settings.PRODUCT_MODULE_NAME);
        return {
            name: settings.PRODUCT_MODULE_NAME,
            path: srcPath,
            sources: new Set(
            // TODO: Where can we find the
            yield path_helpers_1.expandingSourceGlob(fromPath, srcPath)("**/*.swift")),
            compilerArguments: [
                "-module-name",
                settings.PRODUCT_MODULE_NAME,
                settings.SWIFT_OPTIMIZATION_LEVEL,
                "-sdk",
                settings.SDK_DIR,
                "-target",
                `${settings.PLATFORM_PREFERRED_ARCH}-apple-${settings.SWIFT_PLATFORM_TARGET_PREFIX}${settings.IPHONEOS_DEPLOYMENT_TARGET}`,
                "-swift-version",
                settings.SWIFT_VERSION,
                ...path_helpers_1.compilerArgumentsForImportPath(settings.CONFIGURATION_BUILD_DIR),
                ...Array().concat(...settings.FRAMEWORK_SEARCH_PATHS.map(framework => [
                    "-F",
                    framework
                ]))
            ]
        };
    }));
    try {
        return Promise.all(targets);
    }
    catch (error) {
        console.log(error);
    }
});
function settingsFromOutput(output) {
    const relevantSettings = [
        "PRODUCT_MODULE_NAME",
        "SWIFT_OPTIMIZATION_LEVEL",
        "SDK_DIR",
        "PLATFORM_PREFERRED_ARCH",
        "SWIFT_PLATFORM_TARGET_PREFIX",
        "IPHONEOS_DEPLOYMENT_TARGET",
        "SWIFT_VERSION",
        "CONFIGURATION_BUILD_DIR",
        "FRAMEWORK_SEARCH_PATHS",
        "SRCROOT"
    ];
    // regex interpolation safe because hard-coded
    const regex = new RegExp(`^ *(${relevantSettings.join("|")}) = +(.*)$`, "gm");
    console.log("1.1");
    const matches = allMatches(output, regex).map(([name, value]) => ({
        [name]: value
    }));
    console.log("1.2");
    const unparsedSettings = Object.assign({}, ...matches);
    console.log("1.3", unparsedSettings.FRAMEWORK_SEARCH_PATHS, allMatches(unparsedSettings.FRAMEWORK_SEARCH_PATHS, /("([^"]+)")+/g));
    return Object.assign({}, unparsedSettings, { FRAMEWORK_SEARCH_PATHS: allMatches(unparsedSettings.FRAMEWORK_SEARCH_PATHS, /("([^"]+)")+/g).map(matches => matches[1]) });
}
function allMatches(string, regex) {
    const matches = Array();
    let match = regex.exec(string);
    while (match != null) {
        matches.push(match.slice(1));
        match = regex.exec(string);
    }
    return matches;
}
//# sourceMappingURL=xcodebuild-package.js.map