import React from 'react';

const sections = [
  ['v2-overview', 'Master Study Tracker V2 Overview'],
  ['flow', 'Architecture & Data Flow'],
  ['collections', 'Database Collections & Schema'],
  ['calculations', 'Formulas & Pacing Engine'],
  ['timer', 'Live Study Timer Architecture'],
  ['sheets-sync', 'Google Sheets Two-Way Bridge'],
  ['mains-pyqs', 'Mains Mocks & PYQ Workbooks Pipeline'],
  ['reusing', 'How to Reuse this Architecture in Your Own Projects'],
  ['running', 'Running and Deploying V2']
];

function Code({ children }) {
  return (
    <figure className="code">
      <pre>
        <code>{children}</code>
      </pre>
    </figure>
  );
}

export default function Guide() {
  return (
    <div className="guide">
      <aside className="guide-toc" aria-label="Guide sections">
        <p className="toc-title">On this page</p>
        <ol>
          {sections.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ol>
      </aside>
      <article className="guide-body">
        <h1>How this app is built (Master Study Tracker V2)</h1>
        <p className="lede">
          The complete architectural blueprint, calculation engine, and implementation reference for the Master Study Tracker V2.
        </p>
        <p>
          Master Study Tracker V2 is a holistic, multi-exam preparation tracking system combining a modern React frontend, a resilient Django document store on SQLite, Google Sheets synchronization, and a live persistent study stopwatch.
        </p>

        {/* Section 1: Overview */}
        <h2 id="v2-overview">1. Master Study Tracker V2 Overview</h2>
        <p>
          V2 expands the original single-course tracker into an all-encompassing system tracking your entire exam preparation lifecycle:
        </p>
        <ul>
          <li><strong>Prelims Preparation:</strong> UPPSC Prelims (8 subjects, 142 topics, 20 mocks), EPFO APFC (13 subjects, 230 sub-topics, 236 video lectures).</li>
          <li><strong>Mains Test Series & Mocks:</strong> GS 1–4, Essay, Generic copies, ForumIAS AWFG (32 DAWT, 5 ST, 1 FLT), and Lukmaan IAS (10 Full Mocks).</li>
          <li><strong>Smartwork Labs PYQ Workbooks (2020–2024):</strong> 40 sets covering 400 questions across GS 1–4 with 3-stage tracking (Written, Model Review, Notes Enriched).</li>
          <li><strong>Video Lecture Cadence:</strong> CAVA (17 delivered backlog + 2/week ongoing delivery), World History (Lec 10–16), PubAd Foundation (137 lectures) & Enrichment (33 lectures).</li>
          <li><strong>Reading & Backlogs:</strong> 4 PubAd books reading tracker with rate table (pages/hr), September & October newspaper backlog queues.</li>
        </ul>

        {/* Section 2: Flow */}
        <h2 id="flow">2. Architecture & Data Flow</h2>
        <div className="flow" role="img" aria-label="React communicates with Django REST endpoints, persisting in SQLite and syncing with Google Sheets">
          <div className="flow-box"><strong>React (Vite)</strong><span>Interactive UI, Timer & Sheets Hub</span></div>
          <div className="flow-arrow">REST JSON over HTTPS</div>
          <div className="flow-box"><strong>Django 5.2</strong><span>Auth, Schema validation, Calc engine</span></div>
          <div className="flow-arrow">ORM Queries</div>
          <div className="flow-box db"><strong>SQLite / JSONField</strong><span>Multi-collection document store</span></div>
        </div>
        <p>
          Every record is account-isolated and stored as a validated JSON document inside an indexed SQLite table. React maintains local state and updates derived fields smoothly via optimistic UI patterns.
        </p>

        {/* Section 3: Collections */}
        <h2 id="collections">3. Database Collections & Schema</h2>
        <p>V2 organizes your study lifecycle across 10 collections:</p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Collection</th>
                <th>Natural Key</th>
                <th>Scope & Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>settings</code></td><td>singleton</td><td>Daily cap, DSA quota, exam dates, prep budgets, and Google Sheets IDs.</td></tr>
              <tr><td><code>dailyLogs</code></td><td>date (YYYY-MM-DD)</td><td>Logged study hours by stream, DSA hours, gym sessions, body weight.</td></tr>
              <tr><td><code>weeks</code></td><td>start (date)</td><td>23 planning periods with capacity math and subject stream quotas.</td></tr>
              <tr><td><code>tests</code></td><td>code</td><td>78 full and sectional mocks (UPPSC, EPFO, SSC, CAT, CSE Mains).</td></tr>
              <tr><td><code>cavaLectures</code></td><td>num (1–36)</td><td>Current Affairs video lectures, faculty release dates, sprint linkages.</td></tr>
              <tr><td><code>pyqWorkbooks</code></td><td>id</td><td>40 PYQ sets (400 questions) from Smartwork Labs workbooks.</td></tr>
              <tr><td><code>backlog</code></td><td>workstream</td><td>Queued backlog units (Newspaper catch-up, World History, etc.).</td></tr>
              <tr><td><code>apfcModules</code></td><td>num</td><td>29 EPFO APFC course modules with priority ratings and hours done.</td></tr>
              <tr><td><code>syllabusAreas</code></td><td>num</td><td>9 core learning areas tracking the complete 4-stage recall cycle.</td></tr>
              <tr><td><code>courseEntries</code></td><td>code</td><td>377 individual lecture and reading units for APFC.</td></tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Calculations */}
        <h2 id="calculations">4. Formulas & Pacing Engine</h2>
        <p>The core mathematical formulas that drive the tracker:</p>
        <Code>{`// 1. Weekly Capacity Math (net of DSA & Buffer)\nGross Hours = Days × DailyCap (e.g. 7 × 8 = 56h)\nDSA Quota   = (Days / 7) × dsaWeekly (e.g. 15h)\nAfter DSA   = Gross - DSA Quota (e.g. 41h)\nBuffer Hours = After DSA × buffer (15% = 6.15h)\nNet Capacity = After DSA - Buffer Hours (e.g. 34.85h)\n\n// 2. Exam Pacing\nDays Left = Target Exam Date - TODAY()\nRemaining Study = Prep Budget - Hours Logged\nPace Needed = Remaining Study / Days Left (Hours/Day)`}</Code>

        {/* Section 5: Timer */}
        <h2 id="timer">5. Live Study Timer Architecture</h2>
        <p>
          The persistent timer component (<code>client/src/components/TimerBar.jsx</code>) lives in the navigation sidebar:
        </p>
        <ul>
          <li><strong>Stream Binding:</strong> Selects from 9 study streams (CAVA, PubAd, Mains Writing, Books, UPPSC, APFC, CAT, SSC, Other).</li>
          <li><strong>One-Click Daily Log Integration:</strong> When stopped, sessions $\ge 1$ minute can be saved directly to today's Daily Log via <code>PUT /api/daily/YYYY-MM-DD</code>.</li>
          <li><strong>Midnight Continuity:</strong> Runs continuously across page reloads without losing count.</li>
        </ul>

        {/* Section 6: Sheets Sync */}
        <h2 id="sheets-sync">6. Google Sheets Two-Way Bridge</h2>
        <p>
          Master Study Tracker connects to Google Drive via the official <code>gsheets</code> CLI with OAuth2 scopes. The sheets hub (<code>/sheets</code>) gives direct access to all your live spreadsheets:
        </p>
        <Code>{`// Example CLI update from terminal or agent:\ngsheets mutate write SPREADSHEET_ID "GS4_Ethics!F5:G5" "TRUE,TRUE"\n\n// Reading sheet progress:\ngsheets readonly read SPREADSHEET_ID "Dashboard!A3:H6"`}</Code>

        {/* Section 7: Reusing */}
        <h2 id="reusing">7. How to Reuse this Architecture in Your Own Projects</h2>
        <p>
          You can adapt this pattern for any tracking or management tool (habit trackers, project dashboards, fitness systems):
        </p>
        <ol>
          <li>
            <strong>Single-Table Document Store Pattern:</strong> Store varied records in one Django model (<code>Document</code>) with a <code>collection</code> tag and a <code>JSONField</code> for data. You get NoSQL flexibility with SQLite reliability without migrations for new fields.
          </li>
          <li>
            <strong>Derived Field Layer (<code>calc.py</code>):</strong> Never store computed totals in the database. Compute them on the fly when reading. This prevents desync bugs and simplifies writes.
          </li>
          <li>
            <strong>Schema Validation Function (<code>schema.py</code>):</strong> Write a dictionary-driven validator that checks types, date strings, and enums before saving.
          </li>
          <li>
            <strong>Vite + React with Proxy:</strong> Vite proxies <code>/api</code> to <code>127.0.0.1:8000</code> in development, while production serves the compiled <code>dist/index.html</code> directly via Django + WhiteNoise.
          </li>
        </ol>

        {/* Section 8: Running */}
        <h2 id="running">8. Running and Deploying V2</h2>
        <p>Run locally with your virtualenv:</p>
        <Code>{`npm run build --prefix client\n.venv/bin/python backend/manage.py test master\n.venv/bin/python backend/manage.py runserver 127.0.0.1:8000`}</Code>
        <p>
          To deploy to PythonAnywhere, package using <code>.venv/bin/python deploy/package_final.py</code> and unpack into your hosted directory.
        </p>
      </article>
    </div>
  );
}
