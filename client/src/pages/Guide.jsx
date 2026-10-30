import React from 'react';

const sections = [
  ['v2-overview', '1. Master Study Tracker V2 Overview'],
  ['project-tree', '2. Project Directory Tree Explained'],
  ['code-files', '3. Every Code File & Component Deep-Dive'],
  ['syntax-patterns', '4. Code Syntax & Technical Patterns'],
  ['themes-engine', '5. Theme Selector Engine (6 Themes)'],
  ['public-view', '6. Public Read-Only View Architecture'],
  ['charts-engine', '7. Vector Visualizations & Chart Engine'],
  ['sheets-sync', '8. Google Sheets Two-Way Sync Protocol'],
  ['deployment', '9. Multi-Platform Deployment Pipeline'],
  ['api-ref', '10. Complete REST API Reference']
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
        <h1>Master Developer & Architecture Guide (V2 Zero-to-Hero)</h1>
        <p className="lede">
          The comprehensive, basic-to-advanced architectural blueprint, directory walkthrough, code syntax reference, deployment pipeline, and REST API specification for Master Study Tracker V2.
        </p>

        {/* Section 1: Overview */}
        <h2 id="v2-overview">1. Master Study Tracker V2 Overview</h2>
        <p>
          Master Study Tracker V2 is a holistic, multi-exam preparation operating system designed to eliminate cognitive fatigue and maintain strict daily pacing across complex preparation streams:
        </p>
        <ul>
          <li><strong>Prelims Preparation:</strong> UPPSC Prelims (8 subjects, 142 topics, 20 mocks), EPFO APFC (13 subjects, 230 sub-topics, 236 video lectures).</li>
          <li><strong>Mains Test Series & Mocks:</strong> GS 1–4, Essay, Generic copies, ForumIAS AWFG (32 DAWT, 5 ST, 1 FLT), and Lukmaan IAS (10 Full Mocks).</li>
          <li><strong>Smartwork Labs PYQ Workbooks (2020–2024):</strong> 20 sets covering 395 questions across GS 1–4 with 3-stage tracking (Written, Model Review, Notes Enriched).</li>
          <li><strong>Video Lecture Cadence:</strong> CAVA (Current Affairs Video Analysis, 36 lectures scheduled and delivered via Google Sheets), World History (Lec 10–16), PubAd Foundation (137 lectures) & Enrichment (33 lectures).</li>
          <li><strong>Reading & Backlogs:</strong> 4 PubAd books reading tracker with rate table (pages/hr), September & October newspaper backlog queues.</li>
          <li><strong>Cognitive Protection:</strong> Strict daily capacity ceiling (8h/day study + DSA) with a 15% buffer to safeguard against mental burnout.</li>
        </ul>

        {/* Section 2: Directory Tree */}
        <h2 id="project-tree">2. Project Directory Tree Explained</h2>
        <p>A complete breakdown of every directory and file in the codebase:</p>
        <Code>{`master-study-tracker/
├── backend/                             # Django 5.2 Application Root
│   ├── config/                          # Project configuration & settings
│   │   ├── __init__.py                  # Marks package directory
│   │   ├── settings.py                  # Database, WhiteNoise, Security, CSRF, Static config
│   │   ├── urls.py                      # Master URL routing table (REST API + SPA catch-all)
│   │   └── wsgi.py                      # WSGI entry point for PythonAnywhere & Gunicorn
│   ├── master/                          # Primary business application
│   │   ├── calc.py                      # Pure functional formulas (capacities, pacing, derivations)
│   │   ├── models.py                    # Document model (SQLite + JSONField document store)
│   │   ├── schema.py                    # JSON schema validators & natural key extractors
│   │   ├── sheets_sync.py               # Bidirectional Google Sheets sync engine (CLI + Webhook)
│   │   ├── storage.py                   # Data access layer, seeding utilities, document queries
│   │   ├── tests.py                     # Automated unit and integration test suite
│   │   ├── views.py                     # REST API views, Auth, Public endpoint, Dashboard handler
│   │   ├── management/commands/         # Custom Django management commands
│   │   │   └── sync_sheets.py           # CLI command: python manage.py sync_sheets
│   │   └── seed_data/                   # Default bootstrap JSON datasets for cold starts
│   ├── db.sqlite3                       # Local production SQLite database
│   ├── manage.py                        # Django administration command wrapper
│   └── staticfiles/                     # Collected production assets (served via WhiteNoise)
├── client/                              # Modern React SPA (Vite + JSX)
│   ├── index.html                       # HTML5 entry template
│   ├── package.json                     # Frontend dependencies & npm run scripts
│   ├── vite.config.js                   # Vite bundler config with /api proxy to Django
│   └── src/                             # Source code
│       ├── main.jsx                     # React DOM bootstrap & theme initializer
│       ├── App.jsx                      # App shell, navigation router, public routing gate
│       ├── Auth.jsx                     # Authentication forms (Sign In / Register)
│       ├── api.js                       # HTTP client wrapper with CSRF token handling
│       ├── format.js                    # Formatting helpers (dates, hours, currencies, percentages)
│       ├── hooks.js                     # Custom React hooks (useResource, useTimer)
│       ├── styles.css                   # Complete design system & 6 theme token palettes
│       ├── components/                  # Reusable UI widgets
│       │   ├── ThemeSelector.jsx        # Compact & visual grid theme switcher
│       │   ├── TimerBar.jsx             # Persistent sidebar stopwatch with auto-logging
│       │   ├── charts.jsx               # Vector SVG charts (ExamRail, Trajectory, Donut, Rings)
│       │   └── ui.jsx                   # Panels, PageHeaders, Tags, Notices, Loaders
│       └── pages/                       # Application Views
│           ├── Dashboard.jsx            # Authenticated analytics command center
│           ├── PublicView.jsx           # Shareable read-only dashboard for public visitors
│           ├── Daily.jsx                # Daily log editor & retrospective timeline
│           ├── Weekly.jsx               # 23-week capacity and quota management
│           ├── Tests.jsx                # Mock test schedule, scores, and reviews
│           ├── CavaTracker.jsx          # CAVA Current Affairs video lecture pipeline
│           ├── PyqWorkbooks.jsx         # Smartwork Labs GS1-4 question workbooks
│           ├── Backlog.jsx              # Newspaper & syllabus backlog queues
│           ├── Apfc.jsx                 # EPFO APFC 13-subject syllabus coverage
│           ├── GoogleSheetsSync.jsx     # Google Sheets two-way sync management console
│           ├── Settings.jsx             # System configuration, themes, and backup/restore
│           └── Guide.jsx                # This comprehensive interactive developer manual
├── scripts/
│   └── deploy_pipeline.py               # Automated 1-command deployment across GitHub, Vercel & PA
├── .env                                 # Secrets & API credentials (git-ignored)
└── GUIDE_ZERO_TO_HERO.md                # Comprehensive root markdown guide`}</Code>

        {/* Section 3: Code Files */}
        <h2 id="code-files">3. Every Code File & Component Deep-Dive</h2>
        <p>Detailed analysis of core backend and frontend code files:</p>

        <h3>Backend Architecture</h3>
        <ul>
          <li>
            <strong><code>backend/master/models.py</code>:</strong> Contains the <code>Document</code> model. Instead of dozens of rigid relational tables, records are stored in a flexible <code>data = models.JSONField()</code> with indexed <code>collection</code> (e.g. <code>cavaLectures</code>), <code>natural_key</code> (unique identifier within collection), and foreign key <code>owner</code>.
          </li>
          <li>
            <strong><code>backend/master/calc.py</code>:</strong> Pure functional computational engine. Calculates weekly capacities, study versus DSA hours, pacing against daily caps, and test overdue flags. Never mutates input records; always returns derived dicts.
          </li>
          <li>
            <strong><code>backend/master/sheets_sync.py</code>:</strong> Implements bidirectional sync between SQLite documents and Google Spreadsheets. Supports both the local <code>gsheets</code> CLI tool and the cloud Google Apps Script Webhook API.
          </li>
          <li>
            <strong><code>backend/master/views.py</code>:</strong> Handles session authentication, schema validation, CSRF tokens, and REST responses. Includes <code>public_dashboard_view</code> which securely exposes read-only data without requiring a login session.
          </li>
        </ul>

        <h3>Frontend Architecture</h3>
        <ul>
          <li>
            <strong><code>client/src/App.jsx</code>:</strong> The central routing orchestrator. Checks if the incoming route is <code>/public</code>; if so, renders <code>&lt;PublicView /&gt;</code> without requiring authentication. For authenticated sessions, renders the sidebar, persistent timer, theme toggle, and main routes.
          </li>
          <li>
            <strong><code>client/src/components/ThemeSelector.jsx</code>:</strong> Provides 6 curated visual environments (System, Studio Dark, Clean Light, Midnight OLED, Forest Emerald, Warm Amber). Reads/writes to <code>localStorage</code> and toggles <code>data-theme</code> on <code>&lt;html&gt;</code> with zero flash.
          </li>
          <li>
            <strong><code>client/src/components/charts.jsx</code>:</strong> Pure SVG visual charts without external heavy charting libraries. Includes <code>StreamDonut</code> (radial time distribution), <code>TrajectoryAreaChart</code> (14-day study + DSA trend against cap), <code>RadialProgressRing</code>, and <code>ExamRail</code>.
          </li>
          <li>
            <strong><code>client/src/pages/PublicView.jsx</code>:</strong> Dedicated read-only view. Allows friends, mentors, or peers to inspect preparation consistency, CAVA lectures, PYQ questions, and test scores with zero edit permissions.
          </li>
        </ul>

        {/* Section 4: Syntax & Patterns */}
        <h2 id="syntax-patterns">4. Code Syntax & Technical Patterns</h2>

        <h3>1. The Document Store Pattern in Django</h3>
        <p>
          Traditional relational models require schema migrations for every added column. Master Study Tracker uses a hybrid document store:
        </p>
        <Code>{`class Document(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    collection = models.CharField(max_length=32, db_index=True)
    natural_key = models.CharField(max_length=128, db_index=True)
    uid = models.CharField(max_length=24, unique=True, default=generate_uid)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['owner', 'collection', 'natural_key'], name='unique_doc_per_user')
        ]`}</Code>

        <h3>2. Pure Functional Calculations</h3>
        <p>
          By keeping calculations stateless and pure, formulas are deterministic, fully unit-testable, and free of concurrency bugs:
        </p>
        <Code>{`def week_capacity(w, s):
    days = days_between(w['start'], w['end']) + 1
    gross = days * s['dailyCap']
    dsa = (days / 7) * s['dsaWeekly']
    after = max(0, gross - dsa)
    buffer = after * s['buffer']
    capacity = after - buffer
    planned = sum_or_null([(w.get('quotas') or {}).get(k) for k in STREAM_KEYS]) or 0
    spare = capacity - planned
    return dict(gross=gross, capacity=capacity, planned=planned, unallocated=spare)`}</Code>

        {/* Section 5: Themes */}
        <h2 id="themes-engine">5. Theme Selector Engine (6 Themes)</h2>
        <p>
          Theme switching is executed via CSS custom properties scoped to <code>[data-theme="..."]</code>:
        </p>
        <ul>
          <li><strong>🌓 System Default:</strong> Automatically follows OS dark/light mode preference.</li>
          <li><strong>🌌 Studio Dark:</strong> Navy slate (<code>#0c1322</code>) with classic gold (<code>#e5b93b</code>) accents.</li>
          <li><strong>☀️ Clean Light:</strong> Crisp academic paper (<code>#f4f6fa</code>) with dark ink typography.</li>
          <li><strong>🌑 Midnight OLED:</strong> Pitch black (<code>#000000</code>) for OLED battery savings and zero eye strain.</li>
          <li><strong>🌲 Forest Emerald:</strong> Deep pine (<code>#06140e</code>) with calming mint (<code>#34d399</code>) and gold.</li>
          <li><strong>☕ Warm Amber:</strong> Rich sepia night focus (<code>#140f0c</code>) with honey amber (<code>#f59e0b</code>).</li>
        </ul>

        {/* Section 6: Public View */}
        <h2 id="public-view">6. Public Read-Only View Architecture</h2>
        <p>
          The public tracker allows sharing progress transparently without compromising security:
        </p>
        <ul>
          <li><strong>Unauthenticated Endpoint:</strong> <code>GET /api/public/</code> returns sanitized prep data (excluding passwords, auth cookies, or webhook tokens).</li>
          <li><strong>Zero Mutation Risk:</strong> In <code>client/src/pages/PublicView.jsx</code>, all inputs, delete actions, and edit buttons are removed. Only read-only presentation cards are rendered.</li>
          <li><strong>One-Click Shareable URL:</strong> Built-in clipboard button to share <code>https://studytrack-dk.vercel.app/public</code> instantly.</li>
        </ul>

        {/* Section 7: Charts */}
        <h2 id="charts-engine">7. Vector Visualizations & Chart Engine</h2>
        <p>
          Instead of importing bulky charting dependencies, all visualizations are generated using mathematical SVG coordinate mapping:
        </p>
        <Code>{`// Coordinate Mapping Formula:
const y = (val) => Height - padding.bottom - (val / maxVal) * (Height - padding.top - padding.bottom);
const x = (index) => padding.left + (index / (numPoints - 1)) * (Width - padding.left - padding.right);`}</Code>

        {/* Section 8: Google Sheets */}
        <h2 id="sheets-sync">8. Google Sheets Two-Way Sync Protocol</h2>
        <p>
          Data synchronizes bidirectionally between Google Sheets and Django:
        </p>
        <Code>{`1. Local Sync: CLI gsheets mutate write / read
2. Cloud Sync (PythonAnywhere / Vercel):
   POST https://script.google.com/macros/s/AKfycbzOjzm-rDTKIfNzs8s3jpM7_6qETPrgBCBEddwylmSnV59yWAAwyovQC4C1P27l1uOR/exec
   Payload: { action: "read_batch" | "write_cells", ranges: [...] }`}</Code>

        {/* Section 9: Deployment */}
        <h2 id="deployment">9. Multi-Platform Deployment Pipeline</h2>
        <p>
          Running <code>python3 scripts/deploy_pipeline.py "your message"</code> automatically coordinates:
        </p>
        <ol>
          <li>Compiles React production bundle via <code>npm run build</code> into <code>client/dist/</code>.</li>
          <li>Collects static assets via <code>manage.py collectstatic --noinput</code>.</li>
          <li>Pushes commits to GitHub (<code>main</code>), instantly triggering Vercel edge deployment.</li>
          <li>Calls PythonAnywhere REST API to upload modified backend & client files and reload the live WSGI web app.</li>
        </ol>

        {/* Section 10: API Reference */}
        <h2 id="api-ref">10. Complete REST API Reference</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Auth</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/public/</code></td><td>None</td><td>Sanitized public dashboard and study metrics for read-only view.</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/session/</code></td><td>None</td><td>Returns auth status, active username, and CSRF token.</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/login/</code></td><td>None</td><td>Authenticates user session with username and password.</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/logout/</code></td><td>Required</td><td>Terminates authenticated session and clears session cookie.</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/dashboard/</code></td><td>Required</td><td>Full calculation summary, today log, streak, and recent logs.</td></tr>
              <tr><td><code>GET, PUT, DEL</code></td><td><code>/api/daily/[YYYY-MM-DD]/</code></td><td>Required</td><td>Read, record, or clear daily study and DSA hours.</td></tr>
              <tr><td><code>GET, PUT</code></td><td><code>/api/settings/</code></td><td>Required</td><td>Get or update system preferences (daily cap, exams, buffer).</td></tr>
              <tr><td><code>GET, POST</code></td><td><code>/api/:resource/</code></td><td>Required</td><td>Collection queries (weeks, tests, cava, pyqs, backlog, apfc).</td></tr>
              <tr><td><code>PATCH, DEL</code></td><td><code>/api/:resource/:uid/</code></td><td>Required</td><td>Modify or delete a specific document by its 24-character UID.</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/sheets/sync/</code></td><td>Required</td><td>Trigger bidirectional Google Sheets synchronization.</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/backup/</code></td><td>Required</td><td>Export full JSON snapshot of all 10 document collections.</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/restore/</code></td><td>Required</td><td>Idempotently restores database from an uploaded JSON backup.</td></tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
