import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseDir = path.resolve(backendDir, "..", "database");

const copy = (source, destination) => {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

copy(
  path.join(databaseDir, "node_modules", "@prisma", "client"),
  path.join(backendDir, "node_modules", "@prisma", "client")
);
copy(
  path.join(databaseDir, "node_modules", ".prisma", "client"),
  path.join(backendDir, "node_modules", ".prisma", "client")
);

console.log("Synced generated Prisma client into backend/node_modules.");
