const sections = [['flow', 'One request, end to end'], ['data', 'Your data'], ['formulas', 'The calculations'], ['access', 'Accounts and backups'], ['files', 'Read the source'], ['running', 'Running the app']];
function Code({ children }) { return <figure className="code"><pre><code>{children}</code></pre></figure>; }

export default function Guide() {
  return <div className="guide">
    <aside className="guide-toc" aria-label="Guide sections"><p className="toc-title">On this page</p><ol>{sections.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol></aside>
    <article className="guide-body">
      <h1>How this app is built</h1>
      <p className="lede">The workbook-based Master Study Tracker, with a React interface and a Python backend that runs on PythonAnywhere.</p>
      <p>The daily log, weekly quotas, tests, CSE backlog and APFC course all use the new project’s data. This is the final tracker; the previous Organised, Simple and Beta addresses redirect here.</p>
      <h2 id="flow">1. One request, end to end</h2>
      <div className="flow" role="img" aria-label="React sends JSON to Django, which validates and stores account data in SQLite, calculates totals and returns JSON">
        <div className="flow-box"><strong>React</strong><span>Forms, tables and charts</span></div><div className="flow-arrow">JSON over HTTPS</div>
        <div className="flow-box"><strong>Django</strong><span>Sign-in, validation and calculations</span></div><div className="flow-arrow">SQL queries</div>
        <div className="flow-box db"><strong>SQLite</strong><span>Persistent account records</span></div>
      </div>
      <p>When you save a day, React sends a PUT request to <code>/api/daily/YYYY-MM-DD</code>. Django checks your session and CSRF token, validates the entered fields, saves the day and returns recalculated totals. React then replaces the matching row in its state.</p>
      <Code>{`PUT /api/daily/2026-10-25\n{ "hours": { "apfc": 3, "pubad": 2 }, "dsa": 1 }\n\n→ examStudy: 5\n→ studyPlusDsa: 6\n→ capStatus: "In cap"`}</Code>
      <h2 id="data">2. Your data</h2>
      <p>Each editable record has an owner, collection, stable ID and validated JSON data in SQLite. Collections correspond to settings, daily logs, weeks, tests, backlog, APFC modules, syllabus areas and course entries. A unique constraint prevents duplicate daily dates and duplicate test or course codes within one account.</p>
      <p>The original project used Express and MongoDB. This deployment preserves its screens and data contract while using Django and SQLite on the existing host. Node is needed to build React locally; it is not a running service on the host.</p>
      <h2 id="formulas">3. The calculations</h2>
      <ul><li><strong>Blank differs from zero.</strong> A blank hour field means unreported; zero records that you studied zero hours.</li>
        <li><strong>Weekly capacity:</strong> days × daily cap, minus the proportional DSA quota, then minus the buffer. Gym sits outside the study cap.</li>
        <li><strong>Tests:</strong> attempts and reviews have separate statuses. An attempted test keeps its review hours outstanding until reviewed.</li>
        <li><strong>Backlog:</strong> remaining units × hours per unit. CAVA rows can follow the lecture duration in Settings.</li>
        <li><strong>APFC:</strong> platform completion is separate from selected study hours and the full learning cycle.</li></ul>
      <p>Derived values are computed when read. The database stores your inputs rather than a second copy of totals. Daily logs are sorted and swept through the non-overlapping weekly periods; the aggregation visits each log once. Dates use YYYY-MM-DD strings, and the server uses India’s timezone for today.</p>
      <h2 id="access">4. Accounts and backups</h2>
      <p>The existing account works here. Every study-data request checks that you are signed in and limits access to your own rows. Changes also require a CSRF token. Production sessions use secure cookies over HTTPS.</p>
      <p>Settings → Download backup exports all eight collections as JSON. Restore validates the complete file before replacing your final-tracker records inside a database transaction. Keep the backup private. Older Study Studio workspace exports use a different format and are not accepted as final-tracker backups.</p>
      <p>This tracker starts from the new project’s data. Previous tracker records are retained separately on the host and in a private deployment snapshot; they are not counted in this tracker.</p>
      <h2 id="files">5. Read the source</h2>
      <div className="table-wrap"><table className="data"><thead><tr><th>File</th><th>Responsibility</th></tr></thead><tbody>
        <tr><td><code>client/src/pages/</code></td><td>The study screens</td></tr><tr><td><code>client/src/api.js</code></td><td>JSON requests, CSRF and session expiry</td></tr>
        <tr><td><code>backend/master/models.py</code></td><td>Account-owned records and uniqueness</td></tr><tr><td><code>backend/master/schema.py</code></td><td>Editable fields and input checks</td></tr>
        <tr><td><code>backend/master/calc.py</code></td><td>Workbook calculations</td></tr><tr><td><code>backend/master/views.py</code></td><td>HTTP endpoints, authentication and backups</td></tr>
        <tr><td><code>backend/master/seed_data/</code></td><td>The new project’s starting plan</td></tr><tr><td><code>deploy/</code></td><td>Verified release packaging and reversible deployment</td></tr>
      </tbody></table></div>
      <h2 id="running">6. Running the app</h2>
      <p>Double-click <code>start.command</code> for local use, or open the hosted tracker on your computer or phone. Both need a sign-in. Local and hosted databases are separate; use a final-tracker JSON backup to transfer data when needed.</p>
      <Code>{`npm run build\n.venv/bin/python backend/manage.py test master\n.venv/bin/python scripts/check_parity.py\n.venv/bin/python backend/manage.py runserver 127.0.0.1:8000`}</Code>
    </article>
  </div>;
}
