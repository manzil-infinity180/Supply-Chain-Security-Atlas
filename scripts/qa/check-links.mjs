import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  createErrorReport,
  distDir,
  listHtmlFiles,
  routeFromHtmlFile,
  siteRoot,
} from './shared.mjs';

const SITE_ORIGIN = 'https://sscs-docs.local';
const ATTR_PATTERN = /\s(?:href|src)=["']([^"']+)["']/g;
const ID_PATTERN = /\sid=["']([^"']+)["']/g;

const configuredSiteOrigin = await readConfiguredSiteOrigin();

const htmlFiles = await listHtmlFiles();
const idsByFile = new Map();
const internalErrors = [];
const externalTargets = new Set();
let preTagCount = 0;
let highlightedPreTagCount = 0;

for (const htmlFile of htmlFiles) {
  const html = await fs.readFile(htmlFile, 'utf8');
  idsByFile.set(htmlFile, new Set([...html.matchAll(ID_PATTERN)].map((match) => decodeURIComponentSafe(match[1]))));

  const pageUrl = new URL(routeFromHtmlFile(htmlFile), SITE_ORIGIN);
  const preMatches = html.match(/<pre\b/gi) ?? [];
  const highlightedMatches = html.match(/<pre\b[^>]*data-language=/gi) ?? [];
  preTagCount += preMatches.length;
  highlightedPreTagCount += highlightedMatches.length;

  for (const match of html.matchAll(ATTR_PATTERN)) {
    const rawTarget = match[1];
    if (shouldSkip(rawTarget)) {
      continue;
    }

    const resolved = new URL(rawTarget, pageUrl);
    if (resolved.origin === SITE_ORIGIN) {
      const error = await validateInternalTarget(resolved, htmlFile, idsByFile);
      if (error) {
        internalErrors.push(error);
      }
    } else if (configuredSiteOrigin && resolved.origin === configuredSiteOrigin) {
      const remapped = new URL(resolved.pathname + resolved.hash, SITE_ORIGIN);
      const error = await validateInternalTarget(remapped, htmlFile, idsByFile);
      if (error) {
        internalErrors.push(error);
      }
    } else {
      externalTargets.add(resolved.toString());
    }
  }
}

if (preTagCount !== highlightedPreTagCount) {
  internalErrors.push(
    `Syntax highlighting mismatch: found ${preTagCount} <pre> blocks but ${highlightedPreTagCount} highlighted blocks with data-language.`,
  );
}

const { errors: externalErrors, warnings: externalWarnings } = await checkExternalTargets([...externalTargets].sort());
const allErrors = [...internalErrors, ...externalErrors];

if (externalWarnings.length > 0) {
  console.warn(
    createErrorReport(
      `External link warnings (${externalWarnings.length} URLs unreachable due to network issues — these are not treated as failures):`,
      externalWarnings,
    ),
  );
}

if (allErrors.length > 0) {
  throw new Error(createErrorReport('Link validation failed.', allErrors));
}

console.log(
  `Link validation passed for ${htmlFiles.length} pages, ${externalTargets.size} external URLs, and ${preTagCount} syntax-highlighted code blocks.`,
);

function shouldSkip(target) {
  return (
    target.startsWith('mailto:') ||
    target.startsWith('tel:') ||
    target.startsWith('javascript:') ||
    target.startsWith('data:')
  );
}

async function validateInternalTarget(url, sourceFile, knownIds) {
  const pathname = decodeURIComponentSafe(url.pathname);
  const candidates = resolveDistTarget(pathname);
  const candidateList = Array.isArray(candidates) ? candidates : [candidates];

  let targetFile = null;
  for (const candidate of candidateList) {
    try {
      await fs.access(candidate);
      targetFile = candidate;
      break;
    } catch {
      // try next candidate
    }
  }

  if (!targetFile) {
    return `${path.relative(distDir, sourceFile)} -> ${url.pathname}${url.hash}: target does not exist in dist/.`;
  }

  if (url.hash && targetFile.endsWith('.html')) {
    const targetIds = knownIds.get(targetFile) ?? new Set();
    const hash = decodeURIComponentSafe(url.hash.slice(1));
    if (!targetIds.has(hash)) {
      return `${path.relative(distDir, sourceFile)} -> ${url.pathname}${url.hash}: missing anchor target.`;
    }
  }

  return null;
}

function resolveDistTarget(pathname) {
  if (pathname === '/') {
    return path.join(distDir, 'index.html');
  }

  const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const directFile = path.join(distDir, cleanPath);
  if (path.extname(directFile)) {
    return directFile;
  }
  const dirIndex = path.join(distDir, cleanPath, 'index.html');
  const stripped = cleanPath.replace(/\/$/, '');
  const flatFile = path.join(distDir, `${stripped}.html`);
  return [dirIndex, flatFile];
}

async function checkExternalTargets(targets) {
  const errors = [];
  const warnings = [];
  const concurrency = 8;
  let index = 0;

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (index < targets.length) {
        const current = targets[index++];
        const result = await probeExternal(current);
        if (!result.ok) {
          if (result.networkError) {
            warnings.push(`${current}: ${result.reason}`);
          } else {
            errors.push(`${current}: ${result.reason}`);
          }
        }
      }
    }),
  );

  return { errors, warnings };
}

async function probeExternal(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'sscs-docs-site-link-checker/1.0',
        },
      });
      clearTimeout(timeout);

      if (response.status >= 200 && response.status < 400) {
        return { ok: true };
      }
      if (response.status === 405 && method === 'HEAD') {
        continue;
      }
      return { ok: false, reason: `HTTP ${response.status}`, networkError: false };
    } catch (error) {
      if (method === 'HEAD') {
        continue;
      }
      const reason = error.name === 'AbortError' ? 'request timed out' : error.message;
      return { ok: false, reason, networkError: true };
    }
  }

  return { ok: false, reason: 'request failed', networkError: true };
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function readConfiguredSiteOrigin() {
  try {
    const configPath = path.join(siteRoot, 'astro.config.mjs');
    const content = await fs.readFile(configPath, 'utf8');
    const match = content.match(/site:\s*['"]([^'"]+)['"]/);
    if (match) {
      return new URL(match[1]).origin;
    }
  } catch {
    // Config not readable; ignore.
  }
  return null;
}
