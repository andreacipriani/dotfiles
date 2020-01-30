"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SwiftConfigurationProvider {
    provideDebugConfigurations(_folder, _token) {
        return [
            {
                type: "swift-debug",
                request: "launch",
                name: "Swift Program Debug",
                program: "${workspaceRoot}/.build/debug/path-to-program-debugged"
            }
        ];
    }
}
exports.SwiftConfigurationProvider = SwiftConfigurationProvider;
//# sourceMappingURL=SwiftConfigurationProvider.js.map