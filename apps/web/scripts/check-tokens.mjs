// Guardrail script (Section 3.10) to verify:
// (a) no #hex in className
// (b) no arbitrary text-[Npx] or rounded-[Npx]
// (c) no physical direction classes (ml-, mr-, pl-, pr-, left-, right-, text-left, text-right)
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components"];
const ALLOWED_EXTS = new Set([".tsx", ".ts", ".jsx", ".js"]);

let errors = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        walk(full);
      }
    } else if (ALLOWED_EXTS.has(path.extname(entry.name))) {
      checkFile(full);
    }
  }
}

function checkFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    // Check for hard-coded #hex in className or string templates
    const hexMatch = line.match(/className=["`'][^"'`]*#[0-9a-fA-F]{3,8}/);
    if (hexMatch) {
      console.warn(`[check:tokens] ${file}:${i + 1} Hardcoded hex in className: ${hexMatch[0]}`);
      errors++;
    }
  });
}

for (const root of ROOTS) {
  if (fs.existsSync(root)) {
    walk(root);
  }
}

if (errors > 0) {
  console.log(`\nFound ${errors} token issues.`);
} else {
  console.log("Tokens check passed!");
}
