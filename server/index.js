const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const supabase = require('./supabase');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running correctly' });
});

// Example endpoint showing how to use the Supabase client
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('your_table').select('*').limit(5);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching data from Supabase:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const { spawn } = require('child_process');
const path = require('path');

// Execute the Python Sentiment Analysis Pipeline
app.get('/api/sentiment/:ticker/:name', (req, res) => {
  const { ticker, name } = req.params;
  console.log(`[API] Triggering Sentiment Pipeline for ${ticker} (${name})`);

  const pythonProcess = spawn('python', [
    path.join(__dirname, 'models', 'sentiment_agent', 'main_pipeline.py'),
    ticker,
    name
  ], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
    // Also log to the server console so we can see what the python script is printing
    console.log(data.toString());
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Python script exited with code ${code}. Stderr: ${errorData}`);
      return res.status(500).json({ success: false, error: 'Failed to run python agent.' });
    }

    // Try to parse out the targeted JSON from the massive output string
    const jsonRegex = /---JSON_OUTPUT---(.*?)---JSON_OUTPUT---/s;
    const match = outputData.match(jsonRegex);

    if (match && match[1]) {
      try {
        const sentimentData = JSON.parse(match[1].trim());
        res.json({ success: true, data: sentimentData });
      } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to parse JSON out from Python.' });
      }
    } else {
      res.status(500).json({ success: false, error: 'Python script completed but returned no parsable JSON.' });
    }
  });
});

// Execute the Python Market Regime Detection Agent
app.get('/api/regime/:ticker', (req, res) => {
  const { ticker } = req.params;
  const exchange = req.query.exchange || 'NSE';
  console.log(`[API] Triggering Regime Agent for ${ticker} (${exchange})`);

  const pythonProcess = spawn('python', [
    path.join(__dirname, 'models', 'regime_agent', 'regime_agent.py'),
    ticker,
    exchange
  ], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    cwd: path.join(__dirname, '..')  // run from project root so dotenv finds .env
  });

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
    console.log(data.toString());
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    const jsonRegex = /---JSON_OUTPUT---(.*?)---JSON_OUTPUT---/s;
    const match = outputData.match(jsonRegex);

    if (match && match[1]) {
      try {
        const regimeData = JSON.parse(match[1].trim());
        if (regimeData.error) {
          return res.status(422).json({ success: false, error: regimeData.error });
        }
        res.json({ success: true, data: regimeData });
      } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to parse Regime JSON.' });
      }
    } else {
      console.error(`Regime agent stderr: ${errorData}`);
      res.status(500).json({ success: false, error: 'Regime agent returned no output.' });
    }
  });
});

// Execute the Python Technical Analysis Agent
app.get('/api/technical/:ticker', (req, res) => {
  const { ticker } = req.params;
  const exchange = req.query.exchange || 'NSE';
  console.log(`[API] Triggering Technical Agent for ${ticker} (${exchange})`);

  const pythonProcess = spawn('python', [
    path.join(__dirname, 'models', 'technical_agent', 'technical_agent.py'),
    ticker,
    exchange
  ], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    cwd: path.join(__dirname, '..')  // run from project root so dotenv finds .env
  });

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
    console.log(data.toString());
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    const jsonRegex = /---JSON_OUTPUT---(.*?)---JSON_OUTPUT---/s;
    const match = outputData.match(jsonRegex);

    if (match && match[1]) {
      try {
        const technicalData = JSON.parse(match[1].trim());
        if (technicalData.error) {
          return res.status(422).json({ success: false, error: technicalData.error });
        }
        res.json({ success: true, data: technicalData });
      } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to parse Technical JSON.' });
      }
    } else {
      console.error(`Technical agent stderr: ${errorData}`);
      res.status(500).json({ success: false, error: 'Technical agent returned no output.' });
    }
  });
});

// Execute the Decision Fusion Agent
app.get('/api/fusion/:ticker', (req, res) => {
  const { ticker } = req.params;
  const exchange = req.query.exchange || 'NSE';
  console.log(`[API] Triggering Decision Fusion Agent for ${ticker} (${exchange})`);

  const pythonProcess = spawn('python', [
    path.join(__dirname, 'models', 'decision_fusion_agent.py'),
    ticker,
    exchange
  ], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    cwd: path.join(__dirname, '..')  // run from project root so dotenv finds .env
  });

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
    console.log(data.toString());
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    const jsonRegex = /---JSON_OUTPUT---(.*?)---JSON_OUTPUT---/s;
    const match = outputData.match(jsonRegex);

    if (match && match[1]) {
      try {
        const fusionData = JSON.parse(match[1].trim());
        if (fusionData.error) {
          return res.status(422).json({ success: false, error: fusionData.error });
        }
        res.json({ success: true, data: fusionData });
      } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to parse Fusion JSON.' });
      }
    } else {
      console.error(`Fusion agent stderr: ${errorData}`);
      res.status(500).json({ success: false, error: 'Fusion agent returned no output.' });
    }
  });
});

// Execute the Python Price History script
app.get('/api/price-history', (req, res) => {
  const ticker = req.query.ticker || '^NSEI';
  const exchange = req.query.exchange || 'NSE';
  const period = req.query.period || '1mo';
  
  console.log(`[API] Fetching Price History for ${ticker} (${exchange}, ${period})`);

  const pythonProcess = spawn('python', [
    path.join(__dirname, 'models', 'price_history.py'),
    ticker,
    exchange,
    period
  ], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    cwd: path.join(__dirname, '..')
  });

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    const jsonRegex = /---JSON_OUTPUT---(.*?)---JSON_OUTPUT---/s;
    const match = outputData.match(jsonRegex);

    if (match && match[1]) {
      try {
        const data = JSON.parse(match[1].trim());
        if (data.error) {
          return res.status(422).json({ success: false, error: data.error });
        }
        res.json({ success: true, data });
      } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to parse Price JSON.' });
      }
    } else {
      console.error(`Price History stderr: ${errorData}`);
      res.status(500).json({ success: false, error: 'Price history script returned no output.' });
    }
  });
});

// ── NEWS HEADLINES ENDPOINT ────────────────────────────────────────────────────
// Serves the news CSV that the regime agent writes to server/news.csv
// Falls back to any *NewsAPI* or *News* CSV if news.csv is absent
app.get('/api/news-headlines/:ticker', (req, res) => {
  const { ticker } = req.params;
  const fs = require('fs');
  const pathModule = require('path');

  // Candidate paths: prefer Combined_News.csv, fall back to any *News*.csv in server/
  const serverDir = __dirname;
  let csvPath = pathModule.join(serverDir, `${ticker}_Combined_News.csv`);

  if (!fs.existsSync(csvPath)) {
    // Try to find any *News*.csv the regime agent may have written that matches the ticker
    const files = fs.readdirSync(serverDir);
    const fallback = files.find(f => f.includes(ticker) && /news/i.test(f) && f.endsWith('.csv'));
    if (fallback) {
      csvPath = pathModule.join(serverDir, fallback);
    } else {
      return res.json({ headlines: [], error: `No news CSV found for ${ticker}`, count: 0 });
    }
  }

  try {
    const raw = fs.readFileSync(csvPath, 'utf-8');

    // Minimal CSV parser — handles quoted fields
    const lines = raw.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return res.json({ headlines: [], error: 'CSV is empty', count: 0 });
    }

    // Parse header — normalise to lowercase_underscored
    const parseRow = (line) => {
      const cols = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { inQ = !inQ; continue; }
        if (c === ',' && !inQ) { cols.push(cur); cur = ''; continue; }
        cur += c;
      }
      cols.push(cur);
      return cols;
    };

    const headers = parseRow(lines[0]).map(h =>
      h.trim().toLowerCase().replace(/\s+/g, '_')
    );

    let records = lines.slice(1)
      .filter(l => l.trim())
      .map(line => {
        const vals = parseRow(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
        return obj;
      });

    // Sort by |sentiment_score| descending if column exists
    const scoreKey = headers.find(h => h.includes('sentiment') && h.includes('score'))
                  || headers.find(h => h.includes('score'))
                  || null;

    if (scoreKey) {
      records.sort((a, b) =>
        Math.abs(parseFloat(b[scoreKey]) || 0) - Math.abs(parseFloat(a[scoreKey]) || 0)
      );
    }

    const top10 = records.slice(0, 10);
    console.log(`[API] /api/news-headlines → served ${top10.length} rows from ${pathModule.basename(csvPath)}`);
    res.json({ headlines: top10, count: top10.length, source: pathModule.basename(csvPath) });

  } catch (err) {
    console.error('[API] news-headlines error:', err.message);
    res.status(500).json({ headlines: [], error: err.message, count: 0 });
  }
});
// ── END NEWS HEADLINES ENDPOINT ────────────────────────────────────────────────

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`ERROR: Port ${port} is already in use by another process.`);
    console.error('Please kill the hanging process and try again.');
  } else {
    console.error('Server failed to start:', err);
  }
  process.exit(1);
});
