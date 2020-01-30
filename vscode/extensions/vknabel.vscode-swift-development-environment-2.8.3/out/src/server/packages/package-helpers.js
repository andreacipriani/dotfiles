"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
function flatteningTargetsWithUniqueSources(...targets) {
    return targets.reduce((current, next) => [
        ...current,
        ...removingDuplicateSources(next, current.map(normalizedTarget))
    ], []);
}
exports.flatteningTargetsWithUniqueSources = flatteningTargetsWithUniqueSources;
function removingDuplicateSources(fromTargets, uniqueTargets) {
    return fromTargets.map(target => {
        const swiftFilesWithoutTargets = Array.from(target.sources).filter(source => uniqueTargets.findIndex(desc => desc.sources.has(path.resolve(target.path, source))) === -1);
        return Object.assign(Object.assign({}, target), { sources: new Set(swiftFilesWithoutTargets) });
    });
}
exports.removingDuplicateSources = removingDuplicateSources;
function normalizedTarget(target) {
    return Object.assign(Object.assign({}, target), { sources: mapSet(target.sources, source => path.resolve(target.path, source)) });
}
function mapSet(set, transform) {
    return new Set(Array.from(set.values()).map(element => transform(element)));
}
//# sourceMappingURL=package-helpers.js.map