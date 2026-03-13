import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

export const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const distDir = path.join(siteRoot, 'dist');
export const reportDir = path.join(siteRoot, 'qa-reports');

export const baseUrl = 'http://127.0.0.1:4321';

export async function ensureReportDir(...parts) {
  const dirPath = path.join(reportDir, ...parts);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

export async function listHtmlFiles(dir = distDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listHtmlFiles(fullPath);
      }
      return entry.name.endsWith('.html') ? [fullPath] : [];
    }),
  );
  return files.flat().sort();
}

export function routeFromHtmlFile(htmlFile) {
  const relative = path.relative(distDir, htmlFile);
  if (relative === 'index.html') {
    return '/';
  }
  if (relative.endsWith(path.join('index.html'))) {
    return `/${relative.slice(0, -'index.html'.length).replaceAll(path.sep, '/')}`;
  }
  return `/${relative.replaceAll(path.sep, '/')}`;
}

export function sanitizeRouteForFile(route) {
  const normalized = route === '/' ? 'home' : route.replaceAll(/[^a-z0-9]+/gi, '-');
  return normalized.replace(/^-+|-+$/g, '') || 'page';
}

export async function waitForHttp(url, { timeoutMs = 30000, intervalMs = 250 } = {}) {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: 'follow' });
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status} from ${url}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

export function spawnProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: siteRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });

  const output = [];
  child.stdout.on('data', (chunk) => output.push(chunk.toString()));
  child.stderr.on('data', (chunk) => output.push(chunk.toString()));

  return {
    child,
    getOutput() {
      return output.join('');
    },
  };
}

export async function stopProcess(child) {
  if (child.exitCode !== null) {
    return;
  }

  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);

  if (child.exitCode === null) {
    child.kill('SIGKILL');
    await new Promise((resolve) => child.once('exit', resolve));
  }
}

export async function withStaticServer(run) {
  const { child, getOutput } = spawnProcess('python3', ['-m', 'http.server', '4321', '--bind', '127.0.0.1', '--directory', distDir]);
  try {
    await waitForHttp(baseUrl);
    return await run({ serverOutput: getOutput });
  } finally {
    await stopProcess(child);
  }
}

export function createErrorReport(title, items) {
  const lines = [title];
  for (const item of items) {
    lines.push(`- ${item}`);
  }
  return lines.join('\n');
}
