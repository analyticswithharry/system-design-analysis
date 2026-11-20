// Runs on every Netlify/Vercel build (npm run build). A bad JSON file or a wrong image path fails the deploy.
const fs = require("fs");
const path = require("path");

const PUBLIC = path.join(__dirname, "..", "public");
const DATA = path.join(PUBLIC, "assets", "data", "cn7039");
const errors = [];
const err = (m) => errors.push(m);

// Case-sensitive existence check. Netlify/Vercel run on Linux, where Diagram.PNG and diagram.png are different files,
// but Windows/macOS hide that. Walking the folders by name catches it before you deploy.
function existsExact(rel) {
  let dir = PUBLIC;
  for (const part of rel.split("/").filter(Boolean)) {
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
}
const isRemote = (p) => /^(https?:)?\/\//.test(p);
const checkImage = (where, p) => {
  if (!p || isRemote(p)) return;
  if (!existsExact(p.replace(/^\//, ""))) err(`${where}: image not found "${p}" (path is from the public/ folder, case-sensitive)`);
};

// No emoji in question data. Use Font Awesome icons in the page instead.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F]/u;

const read = (file) => {
  try {
    const text = fs.readFileSync(file, "utf8");
    if (EMOJI.test(text)) err(`${path.relative(PUBLIC, file)}: contains an emoji, please remove it`);
    return JSON.parse(text);
  }
  catch (e) { err(`${path.relative(PUBLIC, file)}: invalid JSON (${e.message})`); return null; }
};

const weeks = read(path.join(DATA, "weeks.json")) || [];
let total = 0;
weeks.forEach((w) => {
  if (!w.name || !w.file) return err(`weeks.json: each entry needs "name" and "file"`);
  const f = path.join(DATA, w.file);
  if (!fs.existsSync(f)) return err(`weeks.json: file "${w.file}" does not exist`);
  const qs = read(f);
  if (!qs) return;
  if (!Array.isArray(qs)) return err(`${w.file}: must be a JSON array of questions`);
  const ids = new Set();
  qs.forEach((q, i) => {
    const at = `${w.file} question #${i + 1}`;
    ["id", "question", "options", "correctAnswer"].forEach((k) => { if (q[k] === undefined || q[k] === "") err(`${at}: missing "${k}"`); });
    if (ids.has(q.id)) err(`${at}: duplicate id ${q.id}`);
    ids.add(q.id);
    if (Array.isArray(q.options)) {
      if (!q.options.includes(q.correctAnswer)) err(`${at}: correctAnswer does not match any option exactly`);
      if (q.optionImages && q.optionImages.length !== q.options.length) err(`${at}: optionImages must have one entry per option`);
    }
    checkImage(at + " (image)", q.image);
    (q.optionImages || []).forEach((p, n) => checkImage(`${at} (optionImages[${n}])`, p));
    if (q.image && !q.imageAlt) console.warn(`warning: ${at} has an image but no imageAlt`);
  });
  total += qs.length;
});

if (errors.length) {
  console.error(`\nValidation failed with ${errors.length} problem(s):\n`);
  errors.forEach((e) => console.error(" - " + e));
  process.exit(1);
}
console.log(`OK: ${weeks.length} weeks, ${total} questions, all image paths found.`);
