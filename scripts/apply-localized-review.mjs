import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DEFAULT_REVIEW_DIR = path.join(ROOT_DIR, 'docs', 'localization', 'generated', 'review');
const DEFAULT_REPORT_PATH = path.join(ROOT_DIR, 'docs', 'localization', 'generated', 'localization-quality-report.json');

function parseArgs(argv) {
  const out = new Map();
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out.set(token.slice(2), next);
      i += 1;
    } else {
      out.set(token.slice(2), 'true');
    }
  }
  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function setNestedValue(obj, keyPath, value) {
  const parts = String(keyPath).split('.').filter(Boolean);
  let cur = obj;

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const isLast = i === parts.length - 1;

    if (isLast) {
      cur[part] = value;
      return;
    }

    if (typeof cur[part] !== 'object' || cur[part] === null || Array.isArray(cur[part])) {
      cur[part] = {};
    }

    cur = cur[part];
  }
}

function getLocalePath(language, namespace, namespaceType) {
  if (namespaceType === 'feature') {
    return path.join(ROOT_DIR, 'src', 'features', namespace, 'localization', `${language}.json`);
  }
  return path.join(ROOT_DIR, 'src', 'locales', language, `${namespace}.json`);
}

function normalizeLanguage(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase();
}

function canBeApplied(issue, includeAuto) {
  if (issue?.approved === true) {
    return true;
  }

  if (includeAuto && typeof issue?.suggested === 'string' && issue.suggested.trim().length > 0) {
    return true;
  }

  return false;
}

function resolveAppliedValue(issue, includeAuto) {
  if (issue?.approved === true) {
    if (typeof issue?.approvedValue === 'string' && issue.approvedValue.trim()) {
      return issue.approvedValue.trim();
    }

    return issue.current;
  }

  if (includeAuto && typeof issue?.suggested === 'string' && issue.suggested.trim()) {
    return issue.suggested.trim();
  }

  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  const reportPath = path.resolve(args.get('report') || DEFAULT_REPORT_PATH);
  const reviewDir = path.resolve(args.get('reviewDir') || DEFAULT_REVIEW_DIR);
  const includeAuto = args.get('auto') === 'true';
  const dryRun = args.get('dryRun') === 'true';

  const requestedLanguages = (args.get('languages') || args.get('langs') || args.get('targetLangs') || '').split(',').filter(Boolean);

  let targetLanguages = requestedLanguages;
  if (targetLanguages.length === 0 && fs.existsSync(reportPath)) {
    const report = readJson(reportPath);
    targetLanguages = Array.isArray(report?.targetLanguages) ? report.targetLanguages : [];
  }

  if (targetLanguages.length === 0) {
    targetLanguages = ['ar', 'de', 'es', 'fr', 'it'];
  }

  const report = fs.existsSync(reportPath) ? readJson(reportPath) : null;
  const output = [];

  for (const languageRaw of targetLanguages) {
    const language = normalizeLanguage(languageRaw);
    const languageDir = path.join(reviewDir, language);
    if (!fs.existsSync(languageDir)) {
      continue;
    }

    const files = fs.readdirSync(languageDir).filter((f) => f.endsWith('.review.json'));
    if (files.length === 0) continue;

    const fileUpdates = new Map();
    for (const fileName of files) {
      const namespace = fileName.replace(/\.review\.json$/, '');
      const review = readJson(path.join(languageDir, fileName));
      const issues = Array.isArray(review?.issues) ? review.issues : [];

      for (const issue of issues) {
        if (!canBeApplied(issue, includeAuto)) continue;

        const appliedValue = resolveAppliedValue(issue, includeAuto);
        if (typeof appliedValue !== 'string' || appliedValue.length === 0) continue;

        const key = issue.key;
        const nsType = issue.namespaceType || review.namespaceType || 'core';
        if (!key || !namespace || typeof key !== 'string') continue;

        const cacheKey = `${nsType}/${namespace}`;
        const payload = fileUpdates.get(cacheKey) || {
          filePath: getLocalePath(language, namespace, nsType),
          namespaceType: nsType,
          namespace,
          language,
          updates: [],
        };

        payload.updates.push({
          key,
          value: appliedValue,
          issue: issue.issue || 'unknown',
          reason: issue.reason || '',
        });

        fileUpdates.set(cacheKey, payload);
      }
    }

    const languageSummaries = [];
    const reportEntries = [];

    for (const payload of fileUpdates.values()) {
      if (payload.updates.length === 0) continue;

      if (!fs.existsSync(payload.filePath)) {
        reportEntries.push({
          language,
          namespace: payload.namespace,
          namespaceType: payload.namespaceType,
          file: path.relative(ROOT_DIR, payload.filePath),
          updated: 0,
          skipped: payload.updates.length,
          reason: 'locale file not found',
        });
        continue;
      }

      const localeFile = readJson(payload.filePath);
      for (const item of payload.updates) {
        setNestedValue(localeFile, item.key, item.value);
      }

      if (!dryRun) {
        writeJson(payload.filePath, localeFile);
      }

      languageSummaries.push({
        namespace: payload.namespace,
        namespaceType: payload.namespaceType,
        updated: payload.updates.length,
        skipped: 0,
      });
    }

    output.push({
      language,
      updated: languageSummaries.reduce((sum, item) => sum + item.updated, 0),
      skipped: languageSummaries.reduce((sum, item) => sum + item.skipped, 0),
      files: [...languageSummaries, ...reportEntries],
    });
  }

  const result = {
    generatedAt: new Date().toISOString(),
    applyMode: includeAuto ? 'auto+approved' : 'approved-only',
    dryRun,
    reviewPath: fs.existsSync(reportPath) ? path.relative(ROOT_DIR, reportPath) : path.relative(ROOT_DIR, reportPath),
    reviewDir: fs.existsSync(reviewDir) ? path.relative(ROOT_DIR, reviewDir) : null,
    targetLanguages: output.map((item) => item.language),
    output,
    summary: {
      totalFiles: output.reduce((sum, item) => sum + item.files.length, 0),
      totalKeys: output.reduce((sum, item) => sum + item.updated + item.skipped, 0),
      appliedKeys: output.reduce((sum, item) => sum + item.updated, 0),
      skippedKeys: output.reduce((sum, item) => sum + item.skipped, 0),
    },
  };

  if (report?.sourceLanguage) {
    result.sourceLanguage = report.sourceLanguage;
  }

  console.log(JSON.stringify(result, null, 2));
  if (!dryRun) {
    console.log(`Localization review apply complete. Processed: ${output.length} language(s).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
