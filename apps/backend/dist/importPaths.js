"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedImportRoots = allowedImportRoots;
exports.safeResolveImportJson = safeResolveImportJson;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Paths under which POST /api/import is allowed (session JSON only).
 */
function allowedImportRoots(repoRoot) {
    return [
        path.resolve(repoRoot, "apps/cli/witsmith/demo-repo"),
        path.resolve(repoRoot, "apps/cli/witsmith"),
        path.resolve(repoRoot, "apps/core/mock"),
    ];
}
function safeResolveImportJson(repoRoot, inputPath) {
    const trimmed = inputPath.trim();
    if (!trimmed) {
        throw new Error("path is required");
    }
    const absolute = path.isAbsolute(trimmed) ? path.normalize(trimmed) : path.resolve(repoRoot, trimmed);
    if (!absolute.endsWith(".json")) {
        throw new Error("only .json session files are allowed");
    }
    let realTarget;
    try {
        realTarget = fs.realpathSync(absolute);
    }
    catch {
        throw new Error("path does not exist");
    }
    const roots = allowedImportRoots(repoRoot);
    let underAllowed = false;
    for (const root of roots) {
        let realRoot;
        try {
            realRoot = fs.realpathSync(root);
        }
        catch {
            continue;
        }
        const rel = path.relative(realRoot, realTarget);
        if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
            underAllowed = true;
            break;
        }
    }
    if (!underAllowed) {
        throw new Error("path must be under demo-repo or witsmith package directories");
    }
    return realTarget;
}
