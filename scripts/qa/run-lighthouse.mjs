import { promises as fs } from 'node:fs';
import path from 'node:path';

import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

import {
  baseUrl,
  createErrorReport,
  ensureReportDir,
  withStaticServer,
} from './shared.mjs';

const routes = ['/', '/aflock/', '/reference/'];
const threshold = 0.9;
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const failures = [];

  await withStaticServer(async () => {
    const browser = await chromium.launch({
      headless: true,
      args: ['--remote-debugging-port=9222'],
    });

    try {
      const lighthouseDir = await ensureReportDir('lighthouse');

      for (const route of routes) {
        const result = await lighthouse(`${baseUrl}${route}`, {
          port: 9222,
          output: 'json',
          logLevel: 'error',
          onlyCategories: ['performance'],
          settings: {
            preset: 'desktop',
            chromeFlags: '--headless',
          },
        });

        const score = result.lhr.categories.performance.score ?? 0;
        const fileName = route === '/' ? 'home' : route.replaceAll(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
        await fs.writeFile(
          path.join(lighthouseDir, `${fileName || 'page'}.json`),
          JSON.stringify(result.lhr, null, 2),
          'utf8',
        );

        if (score < threshold) {
          failures.push(`${route}: performance score ${(score * 100).toFixed(0)} is below ${threshold * 100}.`);
        }
      }
    } finally {
      await browser.close();
    }
  });

  if (failures.length > 0) {
    throw new Error(createErrorReport('Lighthouse verification failed.', failures));
  }

  console.log(`Lighthouse performance checks passed for ${routes.length} routes with a threshold of ${threshold * 100}.`);
}
