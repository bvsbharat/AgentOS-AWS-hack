import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || '7iqhy48yzd7427rn7w1bf';
const BASE_URL = 'https://backend.composio.dev/api/v2';

app.get('/connections', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/connections`, {
      headers: { 'x-api-key': COMPOSIO_API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/connections/:appName/initiate', async (req, res) => {
  try {
    const { appName } = req.params;
    const response = await axios.post(`${BASE_URL}/connections/${appName}/initiate`, {}, {
      headers: { 'x-api-key': COMPOSIO_API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/connections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/connections/${id}`, {
      headers: { 'x-api-key': COMPOSIO_API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/actions/github_create_repo/execute', async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/actions/github_create_repo/execute`, req.body, {
      headers: { 'x-api-key': COMPOSIO_API_KEY, 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message, data: error.response?.data });
  }
});

app.post('/actions/github_create_or_update_file/execute', async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/actions/github_create_or_update_file/execute`, req.body, {
      headers: { 'x-api-key': COMPOSIO_API_KEY, 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/actions/twitter_create_tweet/execute', async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/actions/twitter_create_tweet/execute`, req.body, {
      headers: { 'x-api-key': COMPOSIO_API_KEY, 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/actions/exa_search/execute', async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/actions/exa_search/execute`, req.body, {
      headers: { 'x-api-key': COMPOSIO_API_KEY, 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
