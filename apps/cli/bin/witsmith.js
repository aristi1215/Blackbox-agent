#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const witsmithRoot = path.resolve(__dirname, "..", "..", "..", "witsmith");
const r = spawnSync("uv", ["run", "witsmith", ...process.argv.slice(2)], {
  cwd: witsmithRoot,
  stdio: "inherit",
});
process.exit(r.status === null ? 1 : r.status);
