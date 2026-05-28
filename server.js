const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY || 'poc-secret-key-123';

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/run-test', (req, res) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { testCode, testName } = req.body;
  if (!testCode) {
    return res.status(400).json({ error: 'testCode is required' });
  }

  const fileName = `test_${Date.now()}.spec.js`;
  const testFile = path.join('/tmp', fileName);

  try {
    fs.writeFileSync(testFile, testCode);

    const output = execSync(
      `npx playwright test ${testFile} --reporter=json`,
      { timeout: 60000, encoding: 'utf-8' }
    );

    const result = JSON.parse(output);
    const passed = result.stats?.expected ?? 0;
    const failed = result.stats?.unexpected ?? 0;

    return res.json({
      status: failed === 0 ? 'passed' : 'failed',
      passed,
      failed,
      summary: `${passed} passed, ${failed} failed`,
    });

  } catch (err) {
    const rawOutput = err.stdout || err.message || 'Unknown error';
    let parsedResult = null;
    try { parsedResult = JSON.parse(rawOutput); } catch { }

    const passed = parsedResult?.stats?.expected ?? 0;
    const failed = parsedResult?.stats?.unexpected ?? 0;

    return res.json({
      status: 'failed',
      passed,
      failed,
      summary: parsedResult ? `${passed} passed, ${failed} failed` : 'Execution error',
      error: parsedResult ? undefined : rawOutput.slice(0, 500),
    });

  } finally {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Playwright test runner on port ${PORT}`);
});