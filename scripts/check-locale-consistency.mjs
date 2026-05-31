import fs from 'node:fs';
import path from 'node:path';

const localesDir = path.join(process.cwd(), 'src', 'locales');
const LANGS = ['ar', 'de', 'en', 'es', 'fr', 'it', 'tr'];

function getAllKeys(obj, prefix = '') {
  const keys = [];
  if (obj === null || typeof obj !== 'object') return keys;

  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    keys.push(full);
    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], full));
    }
  }

  return keys;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const langDirs = fs
  .readdirSync(localesDir)
  .filter((lang) => fs.statSync(path.join(localesDir, lang)).isDirectory() && LANGS.includes(lang));

const allNamespaces = new Set();
for (const lang of langDirs) {
  const dir = path.join(localesDir, lang);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const f of files) allNamespaces.add(f);
}

const namespaceList = [...allNamespaces].sort();

const report = {
  timestamp: new Date().toISOString(),
  missingFiles: {},
  keyDiff: {},
  summary: [],
};

for (const ns of namespaceList) {
  const byLang = {};

  for (const lang of LANGS) {
    const filePath = path.join(localesDir, lang, ns);
    if (!fs.existsSync(filePath)) {
      if (!report.missingFiles[ns]) report.missingFiles[ns] = [];
      report.missingFiles[ns].push(lang);
      continue;
    }

    try {
      byLang[lang] = readJson(filePath);
    } catch (err) {
      report.summary.push({ type: 'parseError', ns, lang, error: String(err) });
    }
  }

  const languagesWithFile = Object.keys(byLang);
  if (languagesWithFile.length < 2) {
    continue;
  }

  const keySets = {};
  for (const lang of languagesWithFile) {
    keySets[lang] = new Set(getAllKeys(byLang[lang]));
  }

  const refLang = languagesWithFile.includes('en') ? 'en' : languagesWithFile[0];
  const refKeys = keySets[refLang];
  const diffs = [];

  for (const lang of languagesWithFile) {
    if (lang === refLang) continue;
    const missing = [...refKeys].filter((key) => !keySets[lang].has(key));
    const extra = [...keySets[lang]].filter((key) => !refKeys.has(key));
    if (missing.length > 0 || extra.length > 0) {
      diffs.push({ lang, missing, extra });
    }
  }

  if (diffs.length > 0) {
    report.keyDiff[ns] = { ref: refLang, diffs };
  }
}

for (const [ns, langs] of Object.entries(report.missingFiles)) {
  report.summary.push({ type: 'missingFile', ns, missingIn: langs });
}

console.log(JSON.stringify(report, null, 2));
