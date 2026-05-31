import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const DEFAULT_SOURCE_LANG = 'en';
const DEFAULT_TARGET_LANGS = ['ar', 'de', 'es', 'fr', 'it'];
const DEFAULT_REVIEW_DIR = path.join(ROOT_DIR, 'docs', 'localization', 'generated', 'review');
const DEFAULT_REPORT_PATH = path.join(ROOT_DIR, 'docs', 'localization', 'generated', 'localization-quality-report.json');

const ENGLISH_STOP_WORDS = new Set([
  'the',
  'and',
  'or',
  'for',
  'of',
  'with',
  'without',
  'request',
  'failed',
  'cannot',
  'could',
  'please',
  'not',
  'load',
  'loaded',
  'loading',
  'update',
  'create',
  'delete',
  'select',
  'search',
  'record',
  'records',
  'success',
  'error',
  'warning',
  'information',
  'unavailable',
  'cannot',
]);

const LANGUAGE_HINT_WORDS = {
  de: new Set([
    'der',
    'die',
    'das',
    'und',
    'ein',
    'eine',
    'ist',
    'sind',
    'werden',
    'sich',
    'kann',
    'nicht',
    'für',
  ]),
  es: new Set([
    'el',
    'la',
    'los',
    'las',
    'y',
    'de',
    'en',
    'para',
    'un',
    'una',
    'con',
    'no',
    'no',
    'si',
    'esta',
  ]),
  fr: new Set(['le', 'la', 'les', 'de', 'et', 'est', 'un', 'une', 'avec', 'pour', 'à', 'vous', 'pas']),
  it: new Set(['il', 'la', 'i', 'i', 'gli', 'una', 'per', 'di', 'e', 'con', 'non', 'si', 'come', 'come']),
};

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

function flattenLeaves(value, prefix = '', out = new Map()) {
  if (value === null || value === undefined) return out;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    out.set(prefix, String(value));
    return out;
  }
  if (Array.isArray(value)) return out;
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${k}` : k;
      flattenLeaves(v, nextPrefix, out);
    }
  }
  return out;
}

function getValueFromFlatPath(map, keyPath) {
  return map.get(keyPath);
}

function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.').filter(Boolean);
  let cur = obj;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    if (isLast) {
      cur[part] = value;
      return;
    }
    if (
      typeof cur[part] !== 'object' ||
      cur[part] === null ||
      Array.isArray(cur[part])
    ) {
      cur[part] = {};
    }
    cur = cur[part];
  }
}

function normalizeTextForDetection(value) {
  return String(value).toLowerCase().replace(/[^a-zçğıöşüâêîôûäöüßáéíóúàèìòùÁÉÍÓÚÀÈ]/gi, ' ').trim();
}

function tokenize(value) {
  return normalizeTextForDetection(value).split(/\s+/).filter(Boolean);
}

function hasArabicText(value) {
  return /[\u0600-\u06ff]/.test(value);
}

function likelyNeedsManualReview(rawValue, language) {
  const value = String(rawValue || '').trim();
  if (!value) return false;

  if (language === 'ar') {
    const words = tokenize(value);
    return words.length > 0 && !hasArabicText(value);
  }

  const words = tokenize(value);
  if (words.length === 0) return false;

  const englishSignal = words.filter((w) => ENGLISH_STOP_WORDS.has(w)).length;
  const hasLangHint = (LANGUAGE_HINT_WORDS[language] ?? new Set()).size
    ? words.some((w) => LANGUAGE_HINT_WORDS[language].has(w))
    : false;
  const hasDiacritic = /[àèìòùáéíóúâêîôûäöüçğş]/i.test(value);

  if (englishSignal >= 2) return true;
  if (!hasLangHint && !hasDiacritic && englishSignal >= 1) return true;
  if (!hasLangHint && !hasDiacritic) return true;
  return false;
}

function collectNamespaces() {
  const coreRoot = path.join(ROOT_DIR, 'src', 'locales', 'en');
  const coreFiles = fs
    .readdirSync(coreRoot)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));

  const featureRoot = path.join(ROOT_DIR, 'src', 'features');
  const featureNamespaces = fs
    .readdirSync(featureRoot)
    .filter((item) => fs.statSync(path.join(featureRoot, item)).isDirectory())
    .filter((featureName) => fs.existsSync(path.join(featureRoot, featureName, 'localization', 'en.json')))
    .map((featureName) => featureName);

  return {
    core: coreFiles,
    feature: featureNamespaces,
  };
}

function getLocalePath(language, namespace, type) {
  if (type === 'core') {
    return path.join(ROOT_DIR, 'src', 'locales', language, `${namespace}.json`);
  }
  return path.join(ROOT_DIR, 'src', 'features', namespace, 'localization', `${language}.json`);
}

async function maybeMachineTranslate(value, targetLanguage, sourceLanguage, machineConfig) {
  if (!machineConfig.enabled || !value) return null;

  const encodedText = encodeURIComponent(value);
  const url = `${machineConfig.url}?q=${encodedText}&langpair=${sourceLanguage}|${targetLanguage}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const json = await res.json();
    const translated = json?.responseData?.translatedText;
    if (typeof translated === 'string' && translated.trim()) {
      return translated.trim();
    }
  } catch {
    return null;
  }
  return null;
}

async function generateReviewForLanguage({
  sourceLanguage,
  targetLanguage,
  namespaces,
  reviewRoot,
  machineConfig,
  crmRoot,
}) {
  const lang = targetLanguage;
  const findings = [];
  const summary = { totalStrings: 0, reviewCount: 0, missingKeyCount: 0, copyFromSource: 0, likelyEnglish: 0 };
  const crmLocaleRoot = crmRoot ? path.join(crmRoot, 'src', 'locales', lang) : null;

  const processNamespace = async (type, namespace) => {
    const sourcePath = getLocalePath(sourceLanguage, namespace, type);
    const targetPath = getLocalePath(lang, namespace, type);
    const targetReviewPath = path.join(reviewRoot, lang, `${namespace}.review.json`);

    if (!fs.existsSync(sourcePath)) return;

    const sourceFile = readJson(sourcePath);
    const sourceLeaves = flattenLeaves(sourceFile);

    const targetFile = fs.existsSync(targetPath) ? readJson(targetPath) : {};
    const targetLeaves = flattenLeaves(targetFile);

    let crmFlatLeaves = null;
    if (type === 'core' && crmLocaleRoot && fs.existsSync(path.join(crmLocaleRoot, `${namespace}.json`))) {
      crmFlatLeaves = flattenLeaves(readJson(path.join(crmLocaleRoot, `${namespace}.json`)));
    }

    const namespaceFindings = [];
    for (const [key, sourceValue] of sourceLeaves.entries()) {
      const targetValue = targetLeaves.get(key);
      summary.totalStrings += 1;

      if (targetValue === undefined) {
        namespaceFindings.push({
          key,
          source: sourceValue,
          current: null,
          issue: 'MISSING_KEY',
          reason: 'target locale key is missing',
        });
        summary.missingKeyCount += 1;
        summary.reviewCount += 1;
        continue;
      }

      if (typeof targetValue !== 'string') continue;
      const targetText = String(targetValue).trim();
      if (!targetText) {
        namespaceFindings.push({
          key,
          source: sourceValue,
          current: targetText,
          issue: 'EMPTY_VALUE',
          reason: 'target locale value is empty',
        });
        summary.reviewCount += 1;
        continue;
      }

      const sourceText = String(sourceValue ?? '');
      if (targetText === sourceText) {
        let suggested = null;
        if (crmFlatLeaves && crmFlatLeaves.has(key)) {
          const crmValue = crmFlatLeaves.get(key);
          if (typeof crmValue === 'string' && crmValue.trim() && crmValue !== targetText) {
            suggested = crmValue;
          }
        }
        namespaceFindings.push({
          key,
          source: sourceText,
          current: targetText,
          issue: 'SOURCE_COPY',
          reason: 'target text equals source language',
          suggested,
        });
        summary.reviewCount += 1;
        summary.copyFromSource += 1;
        continue;
      }

      if (likelyNeedsManualReview(targetText, lang)) {
        const suggestion = crmFlatLeaves && crmFlatLeaves.has(key)
          ? crmFlatLeaves.get(key)
          : await maybeMachineTranslate(targetText, lang, sourceLanguage, machineConfig);
        namespaceFindings.push({
          key,
          source: sourceText,
          current: targetText,
          issue: 'LIKELY_LANGUAGE_MISMATCH',
          reason: 'likely untranslated or mixed-language text',
          suggested: typeof suggestion === 'string' ? suggestion : null,
        });
        summary.reviewCount += 1;
        summary.likelyEnglish += 1;
      }
    }

    if (namespaceFindings.length > 0) {
      const reviewPayload = {
        generatedAt: new Date().toISOString(),
        language: lang,
        sourceLanguage,
        namespace,
        namespaceType: type,
        totalStrings: namespaceFindings.length,
        issues: namespaceFindings,
      };
      writeJson(targetReviewPath, reviewPayload);
      findings.push(reviewPayload);
    } else {
      if (fs.existsSync(targetReviewPath)) fs.unlinkSync(targetReviewPath);
    }
  };

  for (const ns of namespaces.core) {
    await processNamespace('core', ns);
  }
  for (const ns of namespaces.feature) {
    await processNamespace('feature', ns);
  }

  return { language: lang, findings, summary };
}

async function main() {
  const args = parseArgs(process.argv);
  const sourceLanguage = args.get('sourceLang') || DEFAULT_SOURCE_LANG;
  const targetLanguages = (args.get('targetLangs') || DEFAULT_TARGET_LANGS.join(',')).split(',').filter(Boolean);
  const reviewRoot = path.resolve(args.get('reviewDir') || DEFAULT_REVIEW_DIR);
  const reportPath = path.resolve(args.get('report') || DEFAULT_REPORT_PATH);
  const machineEnabled = args.get('machine') === 'true';
  const includeDetails = args.get('details') === 'true';
  const crmRoot = args.get('crmRoot') || path.join(ROOT_DIR, '..', 'verii_crm_web');

  const machineConfig = {
    enabled: machineEnabled,
    url: args.get('machineUrl') || 'https://api.mymemory.translated.net/get',
  };

  const namespaces = collectNamespaces();
  const outputs = [];
  const aggregate = [];

  for (const language of targetLanguages) {
    const result = await generateReviewForLanguage({
      sourceLanguage,
      targetLanguage: language,
      namespaces,
      reviewRoot,
      machineConfig,
      crmRoot,
    });
    outputs.push(result);
    aggregate.push({
      language: result.language,
      totalStrings: result.summary.totalStrings,
      reviewCount: result.summary.reviewCount,
      missingKeyCount: result.summary.missingKeyCount,
      copyFromSource: result.summary.copyFromSource,
      likelyEnglish: result.summary.likelyEnglish,
    });
  }

  const markdownLines = [
    '# Localization Quality Review',
    `Generated: ${new Date().toISOString()}`,
    `Source language: ${sourceLanguage}`,
    '',
    '| Dil | Toplam | Review | Eksik | Kaynaktan kopya | Şüpheli EN |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ];

  for (const row of aggregate) {
    markdownLines.push(
      `| ${row.language} | ${row.totalStrings} | ${row.reviewCount} | ${row.missingKeyCount} | ${row.copyFromSource} | ${row.likelyEnglish} |`,
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceLanguage,
    machineEnabled,
    targetLanguages,
    output: {
      reviewDir: path.relative(ROOT_DIR, reviewRoot),
      byLanguage: aggregate,
      includeDetails,
    },
    details: includeDetails ? outputs : undefined,
    summary: outputs.map((item) => ({
      language: item.language,
      namespaceCount: item.findings.length,
      totalIssues: item.findings.reduce((sum, ns) => sum + ns.totalStrings, 0),
    })),
  };

  writeJson(reportPath, report);
  fs.mkdirSync(path.dirname(path.join(reviewRoot, 'readme.md')), { recursive: true });
  fs.writeFileSync(path.join(reviewRoot, 'readme.md'), `${markdownLines.join('\n')}\n`, 'utf8');
  console.log(`Localization quality review completed: ${path.relative(ROOT_DIR, reportPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
