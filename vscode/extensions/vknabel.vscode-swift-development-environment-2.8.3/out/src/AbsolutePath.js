"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const path = require("path");
function absolutePath(userDefinedPath) {
    return path.normalize(userDefinedPath.replace(/^~/, os.homedir() + "/"));
}
exports.absolutePath = absolutePath;
//# sourceMappingURL=AbsolutePath.js.map