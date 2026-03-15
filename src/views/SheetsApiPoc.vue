<script setup lang="ts">
/**
 * Google Sheets API POC
 * 
 * Tests direct access to Google Sheets without AppScript proxy.
 * Requires:
 * 1. Google Cloud API Key with Sheets API enabled
 * 2. Spreadsheet set to "Anyone with the link can view"
 */
import { ref, onMounted } from 'vue'

// Configuration - replace with your values
const SPREADSHEET_ID = '1smc9BKXZcnD0S1BehwnqRFNUDtGECx_4n3JaK6vmNok' // Your spreadsheet ID from the URL
const API_KEY = 'AIzaSyDGnwFbF-AShAYzZfhHcn7pRXhdxV7gcow' // Your Google Cloud API Key (leave empty for CSV fallback)
const SHEET_NAME = 'anarchy_games'

// Query configuration - filter for February 2026
// Column B is assumed to be game_date - adjust if different
const DEFAULT_QUERY = `SELECT * WHERE B >= date '2026-02-01' AND B < date '2026-03-01'`

const rawData = ref<any>(null)
const error = ref<string | null>(null)
const isLoading = ref(false)
const method = ref<'api' | 'csv' | 'query'>('query')
const customQuery = ref(DEFAULT_QUERY)
const useQuery = ref(true)

async function fetchWithSheetsApi() {
  if (!API_KEY) {
    throw new Error('API_KEY not configured - using CSV fallback')
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
  const response = await fetch(url)
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || `HTTP ${response.status}`)
  }
  
  return response.json()
}

async function fetchWithQuery(query: string) {
  // Uses Google Visualization API with SQL-like query language
  // This allows filtering at the source - perfect for large datasets!
  const encodedQuery = encodeURIComponent(query)
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}&tq=${encodedQuery}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const text = await response.text()
  // Google wraps the JSON in a callback, extract it
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/)
  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('Failed to parse Google Visualization response')
  }
  
  const data = JSON.parse(jsonMatch[1])
  
  // Check for query errors
  if (data.status === 'error') {
    const errorMsg = data.errors?.map((e: any) => e.detailed_message || e.message).join(', ')
    throw new Error(`Query error: ${errorMsg}`)
  }
  
  // Transform to a more readable format
  const cols: string[] = data.table.cols.map((c: any) => c.label || c.id)
  const rows = data.table.rows?.map((r: any) => {
    const row: Record<string, any> = {}
    r.c?.forEach((cell: any, i: number) => {
      const colName = cols[i] || `col_${i}`
      row[colName] = cell?.v ?? null
    })
    return row
  }) || []
  
  return { cols, rows, raw: data, query }
}

async function fetchWithCsvExport() {
  // This method works without API key for public sheets
  // Uses Google's visualization API (no query - fetches all data)
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const text = await response.text()
  // Google wraps the JSON in a callback, extract it
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/)
  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('Failed to parse Google Visualization response')
  }
  
  const data = JSON.parse(jsonMatch[1])
  
  // Transform to a more readable format
  const cols: string[] = data.table.cols.map((c: any) => c.label || c.id)
  const rows = data.table.rows?.map((r: any) => {
    const row: Record<string, any> = {}
    r.c?.forEach((cell: any, i: number) => {
      const colName = cols[i] || `col_${i}`
      row[colName] = cell?.v ?? null
    })
    return row
  }) || []
  
  return { cols, rows, raw: data }
}

async function loadData() {
  isLoading.value = true
  error.value = null
  rawData.value = null
  
  try {
    if (useQuery.value && customQuery.value.trim()) {
      // Use query-based fetch (recommended for large datasets)
      method.value = 'query'
      rawData.value = await fetchWithQuery(customQuery.value)
    } else if (API_KEY) {
      method.value = 'api'
      rawData.value = await fetchWithSheetsApi()
    } else {
      method.value = 'csv'
      rawData.value = await fetchWithCsvExport()
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
    console.error('Failed to fetch:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="poc-container">
    <header class="poc-header">
      <h1>Google Sheets Direct API POC</h1>
      <p class="poc-subtitle">Testing direct access without AppScript proxy</p>
    </header>

    <section class="poc-config">
      <h2>Configuration</h2>
      <div class="config-grid">
        <div class="config-item">
          <label>Spreadsheet ID:</label>
          <code>{{ SPREADSHEET_ID }}</code>
        </div>
        <div class="config-item">
          <label>Sheet Name:</label>
          <code>{{ SHEET_NAME }}</code>
        </div>
        <div class="config-item">
          <label>API Key:</label>
          <code>{{ API_KEY ? '***configured***' : '(not set)' }}</code>
        </div>
        <div class="config-item">
          <label>Method Used:</label>
          <code :class="method">{{ 
            method === 'query' ? 'Query (Visualization API)' : 
            method === 'api' ? 'Google Sheets API v4' : 'Full Fetch (Visualization)' 
          }}</code>
        </div>
      </div>
      
      <div class="query-section">
        <div class="query-toggle">
          <label class="toggle-label">
            <input type="checkbox" v-model="useQuery" />
            <span>Use Query Filter (recommended for large datasets)</span>
          </label>
        </div>
        
        <div v-if="useQuery" class="query-input">
          <label>SQL-like Query:</label>
          <textarea 
            v-model="customQuery" 
            rows="3" 
            placeholder="SELECT * WHERE B >= date '2026-02-01' AND B < date '2026-03-01'"
          ></textarea>
          <div class="query-help">
            <strong>Query Examples:</strong>
            <ul>
              <li><code>SELECT * WHERE B >= date '2026-02-01' AND B &lt; date '2026-03-01'</code> - February 2026 only</li>
              <li><code>SELECT * WHERE year(B) = 2026 AND month(B) = 2</code> - Alternative date filter</li>
              <li><code>SELECT A, B, C LIMIT 10</code> - First 10 rows, specific columns</li>
              <li><code>SELECT * ORDER BY B DESC LIMIT 5</code> - Last 5 games by date</li>
            </ul>
            <p class="note">Column letters: A=tournament_id, B=game_date, C=game_slot, D=bounty_value (adjust based on your sheet)</p>
          </div>
        </div>
      </div>
      
      <button @click="loadData" :disabled="isLoading" class="reload-btn">
        {{ isLoading ? 'Loading...' : 'Reload Data' }}
      </button>
    </section>

    <section class="poc-result">
      <h2>Result</h2>
      
      <div v-if="isLoading" class="loading">
        Loading data from Google Sheets...
      </div>
      
      <div v-else-if="error" class="error">
        <strong>Error:</strong> {{ error }}
        <div class="error-help">
          <p>If you see a CORS error, make sure:</p>
          <ul>
            <li>The spreadsheet is set to "Anyone with the link can view"</li>
            <li>Or the spreadsheet is published to the web</li>
          </ul>
        </div>
      </div>
      
      <div v-else-if="rawData" class="success">
        <div class="data-stats">
          <span v-if="rawData.rows !== undefined">
            <strong>{{ rawData.rows.length }}</strong> rows loaded
            <span v-if="rawData.query" class="query-badge">filtered by query</span>
            <span v-else class="full-fetch-badge">full dataset</span>
          </span>
          <span v-else-if="rawData.values">{{ rawData.values.length - 1 }} rows loaded (+ header)</span>
        </div>
        <div v-if="rawData.query" class="executed-query">
          <strong>Query executed:</strong>
          <code>{{ rawData.query }}</code>
        </div>
        <pre class="json-output">{{ JSON.stringify(rawData, null, 2) }}</pre>
      </div>
    </section>

    <section class="poc-instructions">
      <h2>Setup Instructions</h2>
      <div class="instructions">
        <h3>Query-Based Fetching (Recommended for Scalability)</h3>
        <p>The Google Visualization API supports SQL-like queries that filter data at the source. This is critical for large datasets - instead of fetching 100,000 rows and filtering client-side, you fetch only the rows you need.</p>
        <div class="query-syntax">
          <strong>Supported Query Syntax:</strong>
          <ul>
            <li><code>SELECT</code> - Choose columns: <code>SELECT A, B, C</code> or <code>SELECT *</code></li>
            <li><code>WHERE</code> - Filter rows: <code>WHERE A = 'value'</code>, <code>WHERE B > 100</code></li>
            <li><code>ORDER BY</code> - Sort: <code>ORDER BY B DESC</code></li>
            <li><code>LIMIT</code> - Restrict rows: <code>LIMIT 50</code></li>
            <li><code>GROUP BY</code> - Aggregate: <code>SELECT A, SUM(C) GROUP BY A</code></li>
            <li><strong>Date functions:</strong> <code>year(B)</code>, <code>month(B)</code>, <code>day(B)</code>, <code>date 'YYYY-MM-DD'</code></li>
          </ul>
        </div>

        <h3>Option A: CSV/Visualization Export (No API Key Required)</h3>
        <ol>
          <li>Open your Google Spreadsheet</li>
          <li>Go to <strong>File → Share → Publish to web</strong></li>
          <li>Select the sheets you want to publish</li>
          <li>Click "Publish"</li>
          <li>That's it! The CSV export method should now work</li>
        </ol>

        <h3>Option B: Google Sheets API v4 (Recommended for Production)</h3>
        <ol>
          <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
          <li>Create a new project (or select existing)</li>
          <li>Go to <strong>APIs & Services → Library</strong></li>
          <li>Search for "Google Sheets API" and enable it</li>
          <li>Go to <strong>APIs & Services → Credentials</strong></li>
          <li>Click <strong>Create Credentials → API Key</strong></li>
          <li>Click on the created key to configure restrictions:
            <ul>
              <li><strong>Application restrictions:</strong> HTTP referrers</li>
              <li><strong>Website restrictions:</strong> Add your domains (e.g., <code>localhost:*</code>, <code>pokeralliance.github.io/*</code>)</li>
              <li><strong>API restrictions:</strong> Restrict to "Google Sheets API" only</li>
            </ul>
          </li>
          <li>Copy the API key and add it to this file</li>
          <li>Make sure your spreadsheet is shared as "Anyone with the link can view"</li>
        </ol>
      </div>
    </section>
  </div>
</template>

<style scoped>
.poc-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #e0e0e0;
  background: #121212;
  min-height: 100vh;
}

.poc-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #333;
}

.poc-header h1 {
  color: #fff;
  margin: 0 0 0.5rem;
}

.poc-subtitle {
  color: #888;
  margin: 0;
}

.poc-config, .poc-result, .poc-instructions {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #333;
}

h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: #fff;
}

.config-grid {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.config-item {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.config-item label {
  min-width: 120px;
  color: #888;
}

.config-item code {
  background: #2a2a2a;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #4ade80;
}

.config-item code.csv {
  color: #facc15;
}

.reload-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.reload-btn:hover {
  background: #2563eb;
}

.reload-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.loading {
  color: #888;
  text-align: center;
  padding: 2rem;
}

.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  padding: 1rem;
  color: #f87171;
}

.error-help {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(239, 68, 68, 0.2);
  color: #888;
  font-size: 0.9rem;
}

.error-help ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.success .data-stats {
  margin-bottom: 1rem;
  color: #4ade80;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.query-badge {
  background: #7c3aed;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.full-fetch-badge {
  background: #475569;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.executed-query {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #1a1a2e;
  border-radius: 6px;
  border-left: 3px solid #7c3aed;
}

.executed-query strong {
  color: #a78bfa;
  margin-right: 0.5rem;
}

.executed-query code {
  color: #facc15;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.85rem;
}

.json-output {
  background: #0d0d0d;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.8rem;
  line-height: 1.4;
  max-height: 500px;
  overflow-y: auto;
  color: #d4d4d4;
}

.instructions {
  color: #ccc;
  line-height: 1.6;
}

.instructions h3 {
  color: #fff;
  margin: 1.5rem 0 0.75rem;
  font-size: 1rem;
}

.instructions h3:first-child {
  margin-top: 0;
}

.instructions ol {
  margin: 0;
  padding-left: 1.5rem;
}

.instructions li {
  margin-bottom: 0.5rem;
}

.instructions ul {
  margin: 0.5rem 0;
}

.instructions code {
  background: #2a2a2a;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.85em;
  color: #4ade80;
}

.instructions a {
  color: #3b82f6;
}

/* Query section styles */
.query-section {
  margin: 1.5rem 0;
  padding-top: 1rem;
  border-top: 1px solid #333;
}

.query-toggle {
  margin-bottom: 1rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #ccc;
}

.toggle-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
}

.query-input {
  margin-top: 1rem;
}

.query-input label {
  display: block;
  margin-bottom: 0.5rem;
  color: #888;
}

.query-input textarea {
  width: 100%;
  background: #0d0d0d;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.75rem;
  color: #4ade80;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.9rem;
  resize: vertical;
}

.query-input textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.query-help {
  margin-top: 1rem;
  padding: 1rem;
  background: #1a1a2e;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #aaa;
}

.query-help strong {
  color: #fff;
}

.query-help ul {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.query-help li {
  margin-bottom: 0.5rem;
}

.query-help code {
  background: #2a2a2a;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.8em;
  color: #facc15;
}

.query-help .note {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #333;
  font-style: italic;
  color: #888;
}

.config-item code.query {
  color: #a78bfa;
}

.query-syntax {
  background: #1a1a2e;
  padding: 1rem;
  border-radius: 6px;
  margin: 0.75rem 0 1.5rem;
  border-left: 3px solid #7c3aed;
}

.query-syntax strong {
  color: #a78bfa;
}

.query-syntax ul {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}

.query-syntax li {
  margin-bottom: 0.35rem;
}

.query-syntax code {
  background: #2a2a2a;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.8em;
  color: #facc15;
}
</style>
