import { spawnProcess, stopProcess, waitForHttp } from './shared.mjs';

const { child, getOutput } = spawnProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4322']);

try {
  const response = await waitForHttp('http://127.0.0.1:4322/');
  const html = await response.text();
  if (!html.includes('SSCS Docs')) {
    throw new Error('Dev server responded, but the homepage did not include the expected site title.');
  }
  console.log('Dev server check passed on http://127.0.0.1:4322/.');
} catch (error) {
  const details = getOutput().trim();
  throw new Error(`${error.message}\n\nDev server output:\n${details}`);
} finally {
  await stopProcess(child);
}
