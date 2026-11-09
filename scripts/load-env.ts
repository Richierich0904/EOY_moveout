// Read private settings from .env.local (and .env) for the helper scripts, the same file the
// site itself reads. Import this FIRST, before anything that looks at process.env.
// .env.local is excluded from GitHub, so keys and passwords kept there are never shared.
import fs from "node:fs";
import path from "node:path";

for (const file of [".env.local", ".env"]) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (line.trim().startsWith("#")) continue;
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    const quoted = /^(["'])(.*)\1$/.exec(value);
    if (quoted) value = quoted[2];
    else value = value.replace(/\s+#.*$/, ""); // a trailing comment
    // Anything already set in the terminal wins.
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
