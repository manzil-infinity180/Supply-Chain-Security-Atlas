import path from 'node:path';

import { chromium, devices } from 'playwright';

import {
  baseUrl,
  createErrorReport,
  ensureReportDir,
  listHtmlFiles,
  routeFromHtmlFile,
  sanitizeRouteForFile,
  withStaticServer,
} from './shared.mjs';

const screenshotRoutes = new Set(['/', '/aflock/', '/reference/', '/kubernetes-sscs/', '/local-labs/']);

async function runViewportChecks(browser, { label, contextOptions, routes, screenshotsDir, failures }) {
  const context = await browser.newContext(contextOptions);
  await context.addInitScript(() => {
    localStorage.setItem('starlight-theme', 'dark');
    document.documentElement.dataset.theme = 'dark';
  });

  try {
    for (const [index, route] of routes.entries()) {
      const page = await context.newPage();
      const pageErrors = [];

      page.on('console', (message) => {
        if (message.type() === 'error') {
          pageErrors.push(`console: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => {
        pageErrors.push(`pageerror: ${error.message}`);
      });

      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForSelector('main', { timeout: 10000 });
        await page.waitForTimeout(150);
        const result = await page.evaluate(() => {
          const html = document.documentElement;
          return {
            theme: html.dataset.theme,
            hasOverflow: html.scrollWidth > window.innerWidth + 1,
            mainExists: Boolean(document.querySelector('main')),
          };
        });

        if (result.theme !== 'dark') {
          failures.push(`${label} ${route}: expected dark mode but saw theme="${result.theme ?? 'unset'}".`);
        }
        if (result.hasOverflow) {
          failures.push(`${label} ${route}: horizontal overflow detected at this viewport.`);
        }
        if (!result.mainExists) {
          failures.push(`${label} ${route}: missing <main> element.`);
        }
        if (pageErrors.length > 0) {
          failures.push(`${label} ${route}: ${pageErrors.join(' | ')}`);
        }

        if (screenshotRoutes.has(route)) {
          await page.screenshot({
            path: path.join(screenshotsDir, `${label}-${sanitizeRouteForFile(route)}.png`),
            fullPage: true,
          });
        }

        if ((index + 1) % 25 === 0 || index === routes.length - 1) {
          console.log(`${label}: checked ${index + 1}/${routes.length} routes.`);
        }
      } catch (error) {
        failures.push(`${label} ${route}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await context.close();
  }
}

async function main() {
  const htmlFiles = await listHtmlFiles();
  const routes = htmlFiles.map((file) => routeFromHtmlFile(file));
  const failures = [];

  await withStaticServer(async () => {
    const browser = await chromium.launch({ headless: true });
    const screenshotsDir = await ensureReportDir('screenshots');

    try {
      await runViewportChecks(browser, {
        label: 'desktop',
        contextOptions: {
          viewport: { width: 1440, height: 960 },
          colorScheme: 'dark',
        },
        routes,
        screenshotsDir,
        failures,
      });

      await runViewportChecks(browser, {
        label: 'mobile',
        contextOptions: {
          ...devices['Pixel 7'],
          colorScheme: 'dark',
        },
        routes,
        screenshotsDir,
        failures,
      });
    } finally {
      await browser.close();
    }
  });

  if (failures.length > 0) {
    throw new Error(createErrorReport('UI verification failed.', failures));
  }

  console.log(`UI verification passed for ${routes.length} routes in dark mode on desktop and mobile viewports.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
