const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Installing recharts in frontend...');
execSync('npm install recharts', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

// 1. Create ms-analytics query service
const influxQueryServicePath = path.join(__dirname, 'ms-analytics/src/services/influxQuery.service.js');
const influxQueryServiceCode = `const { InfluxDB } = require('@influxdata/influxdb-client');
require('dotenv').config();

const url = process.env.INFLUXDB_URL || 'http://influxdb:8086';
const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-auth-token';
const org = process.env.INFLUXDB_ORG || 'pair-programming';
const bucket = process.env.INFLUXDB_BUCKET || 'metrics';

const queryApi = new InfluxDB({ url, token }).getQueryApi(org);

class InfluxQueryService {
  async getAiSuggestionsStats() {
    const fluxQuery = \`
      from(bucket: "\${bucket}")
        |> range(start: -7d)
        |> filter(fn: (r) => r._measurement == "ai_suggestions")
        |> filter(fn: (r) => r._field == "confidence")
        |> group(columns: ["type"])
        |> count()
    \`;
    const results = [];
    return new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push({ type: o.type, count: o._value });
        },
        error(err) { reject(err); },
        complete() { resolve(results); },
      });
    });
  }
}

module.exports = new InfluxQueryService();`;

fs.mkdirSync(path.dirname(influxQueryServicePath), { recursive: true });
fs.writeFileSync(influxQueryServicePath, influxQueryServiceCode);

// 2. Update ms-analytics app.js
const appJsPath = path.join(__dirname, 'ms-analytics/src/app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

if (!appJsContent.includes('influxQueryService')) {
  appJsContent = appJsContent.replace(
    "const kafkaConsumer = require('./services/kafkaConsumer.service');",
    "const kafkaConsumer = require('./services/kafkaConsumer.service');\nconst influxQueryService = require('./services/influxQuery.service');\nconst cors = require('cors');"
  );
  
  appJsContent = appJsContent.replace("const app = express();", "const app = express();\napp.use(cors());\napp.use(express.json());");

  const apiCode = `
app.get('/api/analytics/ai-stats', async (req, res) => {
  try {
    const stats = await influxQueryService.getAiSuggestionsStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
`;
  appJsContent = appJsContent.replace(
    "app.get('/health', (req, res) => res.send('Analytics OK'));",
    "app.get('/health', (req, res) => res.send('Analytics OK'));\n" + apiCode
  );
  
  fs.writeFileSync(appJsPath, appJsContent);
}

// 3. Update api-gateway kong.yml to include ms-analytics
const kongYmlPath = path.join(__dirname, 'api-gateway/kong.yml');
let kongYml = fs.readFileSync(kongYmlPath, 'utf8');
if (!kongYml.includes('ms-analytics')) {
  const analyticsRoute = `
  - name: ms-analytics
    url: http://ms-analytics:4000
    routes:
      - name: analytics-route
        paths:
          - /api/analytics
`;
  kongYml = kongYml.replace('plugins:', analyticsRoute + '\nplugins:');
  fs.writeFileSync(kongYmlPath, kongYml);
}

// 4. Create frontend analytics service
const analyticsServicePath = path.join(__dirname, 'frontend/src/services/analytics.service.js');
const analyticsServiceCode = `import api from './api';

const analyticsService = {
  getAiStats: async () => {
    const res = await api.get('/analytics/ai-stats');
    return res.data;
  }
};

export default analyticsService;`;
fs.writeFileSync(analyticsServicePath, analyticsServiceCode);

// 5. Create Analytics Dashboard Page
const dashboardPagePath = path.join(__dirname, 'frontend/src/pages/AnalyticsDashboard.jsx');
const dashboardPageCode = `import { useState, useEffect } from 'react';
import analyticsService from '../services/analytics.service';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AnalyticsDashboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await analyticsService.getAiStats();
        setData(stats);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem', height: '400px' }}>
        <h3 style={{ marginBottom: '1rem' }}>AI Suggestions by Type</h3>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="type" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No data available to display.</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;`;
fs.writeFileSync(dashboardPagePath, dashboardPageCode);

// 6. Update App.jsx routing
const appJsxPath = path.join(__dirname, 'frontend/src/App.jsx');
let appJsx = fs.readFileSync(appJsxPath, 'utf8');
if (!appJsx.includes('AnalyticsDashboard')) {
  appJsx = appJsx.replace(
    "import Session from './pages/Session';",
    "import Session from './pages/Session';\nimport AnalyticsDashboard from './pages/AnalyticsDashboard';"
  );
  appJsx = appJsx.replace(
    "<Route path=\"/session/:id\" element={<ProtectedRoute><Session /></ProtectedRoute>} />",
    "<Route path=\"/session/:id\" element={<ProtectedRoute><Session /></ProtectedRoute>} />\n              <Route path=\"/analytics\" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />"
  );
  fs.writeFileSync(appJsxPath, appJsx);
}

// 7. Update Navbar
const navbarPath = path.join(__dirname, 'frontend/src/components/Navbar.jsx');
let navbar = fs.readFileSync(navbarPath, 'utf8');
if (!navbar.includes('/analytics')) {
  navbar = navbar.replace(
    '<span className="user-badge">{user.role}</span>',
    '<span className="user-badge">{user.role}</span>\n            <Link to="/analytics" style={{ color: "white", textDecoration: "none", marginRight: "1rem" }}>📊 Analytics</Link>'
  );
  fs.writeFileSync(navbarPath, navbar);
}

// 8. Update ms-analytics package.json to include cors if missing
const analyticsPkgPath = path.join(__dirname, 'ms-analytics/package.json');
let pkgStr = fs.readFileSync(analyticsPkgPath, 'utf8');
if (!pkgStr.includes('cors')) {
  const pkg = JSON.parse(pkgStr);
  pkg.dependencies['cors'] = '^2.8.5';
  fs.writeFileSync(analyticsPkgPath, JSON.stringify(pkg, null, 2));
  execSync('npm install', { cwd: path.join(__dirname, 'ms-analytics'), stdio: 'inherit' });
}

console.log('Phase 16 Dashboard Frontend Analytics setup complete');
