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
  console.log(`[API] Triggering Regime Agent for ${ticker}`);

  const pythonProcess = spawn('python', [
    path.join(__dirname, 'models', 'regime_agent', 'regime_agent.py'),
    ticker
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
