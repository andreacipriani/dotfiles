"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const package_helpers_1 = require("./package-helpers");
const uniqueTarget = {
    name: "Unique",
    path: "Sources/Unique",
    sources: new Set(["Hello.swift", "main.swift"]),
    compilerArguments: []
};
const unrelatedTarget = {
    name: "UnrelatedTarget",
    path: "Sources/UnrelatedTarget",
    sources: new Set(["Unrelated.swift"]),
    compilerArguments: []
};
describe("package helpers", () => {
    describe("removingDuplicateSources", () => {
        it("does not emit unique targets", () => {
            const emittedTargets = package_helpers_1.removingDuplicateSources([], [uniqueTarget]);
            expect(emittedTargets).toHaveLength(0);
        });
        it("unrelated source sets will be kept", () => {
            const emittedTargets = package_helpers_1.removingDuplicateSources([unrelatedTarget], [uniqueTarget]);
            expect(emittedTargets).toEqual([unrelatedTarget]);
        });
        it("unrelated source sets with differing paths will be kept for same file names", () => {
            const unrelatedTargetWithSameFileNames = Object.assign(Object.assign({}, unrelatedTarget), { sources: uniqueTarget.sources });
            const emittedTargets = package_helpers_1.removingDuplicateSources([unrelatedTargetWithSameFileNames], [uniqueTarget]);
            expect(emittedTargets).toEqual([unrelatedTargetWithSameFileNames]);
        });
        it("source sets with same paths but different file names are kept", () => {
            const samePathTargetWithDifferentSources = Object.assign(Object.assign({}, unrelatedTarget), { path: uniqueTarget.path });
            const emittedTargets = package_helpers_1.removingDuplicateSources([samePathTargetWithDifferentSources], [uniqueTarget]);
            expect(emittedTargets).toEqual([samePathTargetWithDifferentSources]);
        });
        it("source sets with different paths but same files will be deuplicated", () => {
            const differentPathTargetWithSameSources = Object.assign(Object.assign({}, unrelatedTarget), { path: "./", sources: new Set(Array(uniqueTarget.sources.values()).map(sourceFile => `${uniqueTarget.path}/${sourceFile}`)) });
            const emittedTargets = package_helpers_1.removingDuplicateSources([differentPathTargetWithSameSources], [uniqueTarget]);
            expect(emittedTargets).toEqual([differentPathTargetWithSameSources]);
        });
    });
    describe("flatteningTargetsWithUniqueSources", () => {
        it("bug: configs did not override global paths", () => {
            // see https://github.com/vknabel/vscode-swift-development-environment/issues/55
            const emittedTargets = package_helpers_1.flatteningTargetsWithUniqueSources([
                {
                    name: "HiModuleFromConfigs",
                    path: "/Users/vknabel/Desktop/AutocompleteIos/Sources/Hi",
                    sources: new Set(["Hi.swift"]),
                    compilerArguments: []
                }
            ], [
                {
                    name: "HiModuleFromDebugYaml",
                    path: "/Users/vknabel/Desktop/AutocompleteIos",
                    sources: new Set([
                        "/Users/vknabel/Desktop/AutocompleteIos/Sources/Hi/Hi.swift"
                    ]),
                    compilerArguments: []
                }
            ], [
                {
                    name: "AutocompleteIos",
                    path: "/Users/vknabel/Desktop/AutocompleteIos",
                    sources: new Set([
                        "/Users/vknabel/Desktop/AutocompleteIos/Package.swift"
                    ]),
                    compilerArguments: []
                }
            ]);
            expect(emittedTargets).toEqual([
                {
                    name: "HiModuleFromConfigs",
                    path: "/Users/vknabel/Desktop/AutocompleteIos/Sources/Hi",
                    sources: new Set(["Hi.swift"]),
                    compilerArguments: []
                },
                {
                    name: "HiModuleFromDebugYaml",
                    path: "/Users/vknabel/Desktop/AutocompleteIos",
                    sources: new Set([]),
                    compilerArguments: []
                },
                {
                    name: "AutocompleteIos",
                    path: "/Users/vknabel/Desktop/AutocompleteIos",
                    sources: new Set([
                        "/Users/vknabel/Desktop/AutocompleteIos/Package.swift"
                    ]),
                    compilerArguments: []
                }
            ]);
        });
    });
});
//# sourceMappingURL=package-helpers.spec.js.map