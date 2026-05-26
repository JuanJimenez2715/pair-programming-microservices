const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ms-evaluation' }));

// Evaluate code submitted by a student
app.post('/api/evaluation/run', (req, res) => {
  const { code, language, expectedOutput, sessionId } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }

  // Sandbox simulation — in Phase 2 this becomes a real Docker sandbox
  let output = '';
  let passed = false;
  let error = null;

  try {
    if (language === 'javascript') {
      const logs = [];
      const fakeConsole = {
        log: (...args) => logs.push(args.map(a =>
          typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args) => logs.push('[error] ' + args.join(' ')),
      };
      const fn = new Function('console', code);
      fn(fakeConsole);
      output = logs.join('\n');
    } else {
      // Python/Java/other: simulated response for now
      output = `[Simulated ${language} execution]\nCode received and processed.`;
    }

    // If teacher provided an expected output, compare it
    if (expectedOutput) {
      passed = output.trim() === expectedOutput.trim();
    } else {
      passed = true; // no expected output = just runs without crashing
    }
  } catch (err) {
    error = err.message;
    passed = false;
    output = `Runtime error: ${err.message}`;
  }

  res.json({
    sessionId,
    language,
    output,
    passed,
    error,
    score: passed ? 100 : 0,
    evaluatedAt: new Date().toISOString()
  });
});

// Get evaluation result for a session
app.get('/api/evaluation/:sessionId', (req, res) => {
  // In Phase 2 this reads from DB — for now returns a placeholder
  res.json({
    sessionId: req.params.sessionId,
    message: 'No evaluation stored yet for this session.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ms-evaluation running on port ${PORT}`));
