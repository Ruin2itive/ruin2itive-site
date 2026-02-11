#!/usr/bin/env node

/**
 * ruin2itive build pipeline (v0.1)
 * Static-first generation engine
 */

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "home.json");

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error("Missing home.json");
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const data = JSON.parse(raw);

  console.log("ruin2itive build started");
  console.log("Sections:", Object.keys(data.sections));
  console.log("Build complete");
}

main();
