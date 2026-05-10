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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./env");
const fs = __importStar(require("fs"));
const express_1 = __importDefault(require("express"));
const serverExports_1 = require("../../core/dist/serverExports");
const env_1 = require("./env");
const importPaths_1 = require("./importPaths");
const PORT = Number(process.env.PORT) || 8787;
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "2mb" }));
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});
app.get("/api/memories", async (_req, res) => {
    try {
        const rows = await serverExports_1.prisma.memoryCard.findMany({
            orderBy: { createdAt: "desc" },
            include: { session: { select: { id: true, task: true } } },
        });
        res.json(rows);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: String(e) });
    }
});
app.get("/api/sessions", async (_req, res) => {
    try {
        const rows = await serverExports_1.prisma.session.findMany({
            orderBy: { finishedAt: "desc" },
            select: {
                id: true,
                task: true,
                branch: true,
                baseCommit: true,
                endCommit: true,
                startedAt: true,
                finishedAt: true,
                status: true,
                repoPath: true,
                changedFiles: true,
                _count: { select: { memoryCards: true } },
            },
        });
        res.json(rows);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: String(e) });
    }
});
app.get("/api/sessions/:id", async (req, res) => {
    try {
        const session = await serverExports_1.prisma.session.findUnique({
            where: { id: req.params.id },
            include: { memoryCards: true },
        });
        if (!session) {
            res.status(404).json({ error: "session not found" });
            return;
        }
        let evidenceBundle = null;
        let report = {};
        try {
            const parsed = JSON.parse(session.rawBundle);
            evidenceBundle = parsed.evidenceBundle ?? parsed;
            report = parsed.report ?? {};
        }
        catch {
            evidenceBundle = null;
        }
        const { rawBundle: _rb, ...sessionRest } = session;
        res.json({
            ...sessionRest,
            evidenceBundle,
            report,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: String(e) });
    }
});
app.post("/api/import", async (req, res) => {
    try {
        const bodyPath = req.body?.path;
        if (!bodyPath) {
            res.status(400).json({ error: 'JSON body must include "path" to session .json file' });
            return;
        }
        const resolved = (0, importPaths_1.safeResolveImportJson)(env_1.repoRoot, bodyPath);
        const cards = await (0, serverExports_1.persistSessionFromCliJson)(resolved);
        let sessionId = null;
        try {
            const j = JSON.parse(fs.readFileSync(resolved, "utf-8"));
            sessionId = j.evidenceBundle?.id ?? j.evidenceBundle?.sessionId ?? null;
        }
        catch {
            /* ignore */
        }
        res.json({
            ok: true,
            importedFrom: resolved,
            memoryCardsStored: cards.length,
            sessionId,
        });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        res.status(400).json({ error: msg });
    }
});
app.listen(PORT, () => {
    console.log(`backend listening on http://localhost:${PORT}`);
});
