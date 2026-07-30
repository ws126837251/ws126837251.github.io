import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(scriptDir);
const hubDir = path.join(rootDir, "hub");

const requiredFiles = [
  "index.html",
  "404.html",
  "assets/style.css",
  "og.png",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
];

for (const relativePath of requiredFiles) {
  const filePath = path.join(hubDir, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: hub/${relativePath}`);
  }
}

const indexHtml = fs.readFileSync(path.join(hubDir, "index.html"), "utf8");
for (const requiredValue of [
  "/giffgaff/",
  "/lebara/",
  "/assets/style.css",
  "/og.png",
  "https://tutorials.wufeng.de/",
]) {
  if (!indexHtml.includes(requiredValue)) {
    throw new Error(`Homepage is missing: ${requiredValue}`);
  }
}

JSON.parse(
  fs.readFileSync(path.join(hubDir, "site.webmanifest"), "utf8"),
);

const css = fs.readFileSync(path.join(hubDir, "assets/style.css"), "utf8");
const openingBraces = (css.match(/{/g) ?? []).length;
const closingBraces = (css.match(/}/g) ?? []).length;
if (openingBraces !== closingBraces) {
  throw new Error("CSS opening and closing braces do not match.");
}

const sitemap = fs.readFileSync(path.join(hubDir, "sitemap.xml"), "utf8");
if (!sitemap.includes("<urlset") || !sitemap.includes("</urlset>")) {
  throw new Error("Sitemap does not contain a complete urlset.");
}

const socialImage = fs.statSync(path.join(hubDir, "og.png"));
if (socialImage.size < 100_000) {
  throw new Error("Social preview image appears to be incomplete.");
}

console.log("Tutorials hub validation passed.");
