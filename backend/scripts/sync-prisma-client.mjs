import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryDir = path.resolve(backendDir, "..");
const databaseDir = path.join(repositoryDir, "database");

const copy = (source, destination) => {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

for (const nodeModulesDir of [
  path.join(backendDir, "node_modules"),
  path.join(repositoryDir, "node_modules")
]) {
  copy(
    path.join(databaseDir, "node_modules", "@prisma", "client"),
    path.join(nodeModulesDir, "@prisma", "client")
  );
  copy(
    path.join(databaseDir, "node_modules", ".prisma", "client"),
    path.join(nodeModulesDir, ".prisma", "client")
  );
}

console.log("Synced generated Prisma client into backend and repository-root node_modules.");
