import { useState } from 'react';
import { PageHeader, Panel } from '../components/ui.jsx';

const MILESTONES = [
  { name: '🏺 Ancient History', days: 'Day 02 (15 Nov)', mock: 'UPPSC Test 02 (08:30 AM)', scope: 'Harappan sites, Vedic literature, Buddhism/Jainism, Mauryas, Guptas, Inscriptions & Travellers.', completes: 'Day 02 (15 Nov)', color: '#e879f9', sheets: 'Sheets 1–3' },
  { name: '🏰 Medieval History', days: 'Day 03 (16 Nov)', mock: 'UPPSC Test 04 (08:30 AM)', scope: 'Delhi Sultanate admin terms, battle chronology, Mughals & Marathas succession, architecture.', completes: 'Day 03 (16 Nov)', color: '#f472b6', sheets: 'Sheets 1–3' },
  { name: '⚔️ Modern History', days: 'Day 04 (17 Nov)', mock: 'UPPSC Test 07 (13:00 PM)', scope: '1917–1947 chronology, 1857, early nationalism, British expansion, tribal/peasant revolts.', completes: 'Day 04 (17 Nov)', color: '#fb923c', sheets: 'Sheets 1–3' },
  { name: '🌍 Geography (Ind & World)', days: 'Day 05 (18 Nov)', mock: 'UPPSC Test 05 (13:00 PM)', scope: 'Rivers, lakes, chokepoints, agriculture, minerals, oceans, peaks, passes, climatology, census.', completes: 'Day 05 (18 Nov)', color: '#60a5fa', sheets: 'Sheets 1–4' },
  { name: '🌿 Environment & Ecology', days: 'Day 06 (19 Nov)', mock: 'UPPSC Test 06 (13:00 PM)', scope: 'Acts & wildlife projects, Ramsar sites, national parks, ISFR 2023 rankings, SDGs, pollution.', completes: 'Day 06 (19 Nov)', color: '#34d399', sheets: 'Sheets 1–3' },
  { name: '🏛️ UP Special (Complete)', days: 'Day 03 & Day 07 (20 Nov)', mock: 'UPPSC Test 09 (UP GK)', scope: 'ODOP, 75 districts, 18 divisions, UP Ramsar, UP budget 2026-27, expressways, agriculture.', completes: 'Day 07 (20 Nov)', color: '#facc15', sheets: 'Sheets 1–3' },
  { name: '📈 Indian Economy', days: 'Day 08 & Day 09 (22 Nov)', mock: 'UPPSC Test 03 (08:30 AM)', scope: 'National income, GDP/GVA, inflation indices, poverty committees, banking, external sector, schemes.', completes: 'Day 09 (22 Nov)', color: '#10b981', sheets: 'Sheets 1–3' },
  { name: '🔬 General Science', days: 'Day 10 (23 Nov)', mock: 'UPPSC Test 08 (13:00 PM)', scope: 'Biology (vitamins, organs, diseases), Chemistry (fuels, alloys), Physics (optics, sound, EM, space).', completes: 'Day 10 (23 Nov)', color: '#a78bfa', sheets: 'Sheets 1–3' },
  { name: '📝 Full-Length Mocks & Imtihaan', days: 'Days 11–21 (24 Nov–04 Dec)', mock: '6 FLTs + 3 Imtihaan', scope: '6 Full-Length Tests (FLT 1 to 6) + 3 Drishti Imtihaan Open PYQ Mocks under strict exam timings.', completes: 'Day 21 (04 Dec)', color: '#f43f5e', sheets: '17/17 Mocks' },
  { name: '🎯 The Finish Line (3-Day Recall)', days: 'Day 22 (05 Dec)', mock: 'Zero Mocks (Rest)', scope: 'High-speed sheet review of all core subjects, admit card & gear pack, early sleep by 10:00 PM.', completes: 'Day 22 (05 Dec)', color: '#10b981', sheets: 'D-Day 6 Dec' },
];

const PLAN_DAYS = [
  { day: 'Day 01', date: 'Sat, 14 Nov 2026', mock: '📝 Pending Mock: UPPSC Lakshya Test 01 (Polity)', sub1: 'Polity: Constitutional Bodies (Art 315–323, 148, 324, 280), UPPSC/SEC', sub2: 'Economy: National Income, GDP/GVA, CPI/WPI Base Years, Inflation, Schemes', deliverable: 'Polity Sheets 1–4 + Economy Sheet 1 + UP Budget Video + Lakshya MCQs 1–100', milestone: '⚡ Fresh Sprint Launch', isToday: true, tag: 'today mocks polity' },
  { day: 'Day 02', date: 'Sun, 15 Nov 2026', mock: '📝 UPPSC Test 02 | Ancient History (08:30 AM)', sub1: 'Ancient History: Harappan, Vedic, Buddhism, Jainism, Mauryas, Guptas', sub2: 'Special: Lakshya 500 MCQs (Q101–175)', deliverable: 'Ancient History Sheets 1–3', milestone: '🏁 ANCIENT HIST COMPLETE', tag: 'mocks history' },
  { day: 'Day 03', date: 'Mon, 16 Nov 2026', mock: '📝 Test 04 | Medieval (08:30 AM) + Test 09 | UP GK (14:00 PM)', sub1: 'Medieval History: Delhi Sultanate, Admin terms, Mughals & Marathas', sub2: 'UP Special: 75 Districts, 18 Divisions, ODOP Mapping, UP Ramsar Sites', deliverable: 'Medieval History Sheets 1–3 + UP Sheet 1 + Lakshya MCQs (Q176–250)', milestone: '🏁 MEDIEVAL HIST COMPLETE', tag: 'mocks history upspecial' },
  { day: 'Day 04', date: 'Tue, 17 Nov 2026', mock: '📝 UPPSC Test 07 | Modern History (13:00 PM)', sub1: 'Modern History: 1917–1947 Chronology, 1857 Revolt, Early Nationalism', sub2: 'Modern History: British Expansion, Wars & Treaties, Governors-General, Books', deliverable: 'Modern History Sheets 1–3 + Lakshya MCQs (Q251–325)', milestone: '🏁 MODERN HIST COMPLETE', tag: 'mocks history' },
  { day: 'Day 05', date: 'Wed, 18 Nov 2026', mock: '📝 UPPSC Test 05 | Geography (13:00 PM)', sub1: 'Geography: Rivers, Lakes, Canals, Chokepoints, Agriculture, Minerals', sub2: 'Geography: Oceans, Mountains, Climatology, Soils, Census 2011', deliverable: 'Geography Sheets 1–4 + Lakshya MCQs (Q326–400)', milestone: '🏁 GEOGRAPHY COMPLETE', tag: 'mocks geo' },
  { day: 'Day 06', date: 'Thu, 19 Nov 2026', mock: '📝 UPPSC Test 06 | Environment (13:00 PM)', sub1: 'Environment: Acts (EPA 1986, WPA 1972), Wildlife Projects, Treaties', sub2: 'Environment: National Parks, Biosphere Reserves, Ramsar Sites, ISFR, SDGs', deliverable: 'Environment Sheets 1–3 + Lakshya MCQs (Q401–500 Complete!)', milestone: '🏁 ENVIRONMENT COMPLETE', tag: 'mocks geo' },
  { day: 'Day 07', date: 'Fri, 20 Nov 2026', mock: '🔄 Analysis & Gap Remediation Day (Tests 02, 04, 05, 06, 07, 09)', sub1: 'Polity Consolidation: Articles 1–395 rapid quiz, Amendments, Judiciary', sub2: 'UP Special: UP Budget 2026-27 allocations, Expressways, Corridors', deliverable: 'UP Special Sheets 2 & 3', milestone: '🏁 UP SPECIAL COMPLETE', tag: 'polity upspecial' },
  { day: 'Day 08', date: 'Sat, 21 Nov 2026', mock: '📈 Economy Deep Sprint (Pre-Mock Mastery)', sub1: 'Economy: GDP/GVA, Factor Cost, National Income calculations', sub2: 'Economy: Banking (CRR, SLR, Repo), Union Budget figures', deliverable: 'Economy Sheets 1–3 Review', milestone: 'Pre-Mock Mastered', tag: 'economy' },
  { day: 'Day 09', date: 'Sun, 22 Nov 2026', mock: '📝 UPPSC Test 03 | Economy (08:30 AM)', sub1: 'Economy: Post-test analysis of Test 03 questions', sub2: 'Economy: Patching scheme launch years & ministry questions', deliverable: 'Economy Error Log', milestone: '🏁 ECONOMY COMPLETE', tag: 'mocks economy' },
  { day: 'Day 10', date: 'Mon, 23 Nov 2026', mock: '📝 UPPSC Test 08 | General Science (13:00 PM)', sub1: 'Science (Bio): Vitamins, Deficiency Diseases, Glands, Hormones, Pathogens', sub2: 'Science (Chem & Phy): Acids, Alloys, Fuels, Optics, Sound, EM Spectrum, ISRO', deliverable: 'Science Sheets 1–3', milestone: '🏁 SCIENCE (ALL) COMPLETE', tag: 'mocks science' },
  { day: 'Day 11', date: 'Tue, 24 Nov 2026', mock: '📝 Imtihaan 1 | Drishti Open Mock (PYQ Based) (13:00 PM)', sub1: 'PYQ Pattern Alignment: Past trends & exam-hall simulation', sub2: 'Weak area drill on recurring traps in History & Polity', deliverable: 'Imtihaan 1 Diagnostic Score', milestone: 'PYQ Rehearsal 1 Done', tag: 'mocks flt' },
  { day: 'Day 12', date: 'Wed, 25 Nov 2026', mock: '📝 UPPSC Test 10 | FLT 1 (Complete Syllabus) (13:00 PM)', sub1: 'FLT 1 Attempt: 150 Questions, 200 Marks under strict exam timing', sub2: 'Immediate mistake analysis across all 8 core subjects', deliverable: 'FLT 1 Mistake Log', milestone: 'FLT 1 Complete', tag: 'mocks flt' },
  { day: 'Day 13', date: 'Thu, 26 Nov 2026', mock: '📝 Imtihaan 2 | Drishti Open Mock (PYQ Based) (13:00 PM)', sub1: 'PYQ Pattern Alignment 2: Elimination technique polish', sub2: 'Assertion-reason question mastery', deliverable: 'Imtihaan 2 Diagnostic Score', milestone: 'PYQ Rehearsal 2 Done', tag: 'mocks flt' },
  { day: 'Day 14', date: 'Fri, 27 Nov 2026', mock: '📝 UPPSC Test 11 | FLT 2 (Complete Syllabus) (13:00 PM)', sub1: 'FLT 2 Attempt: Second full-length benchmark (Target: 100+ Net)', sub2: 'Cross-subject weak link identification', deliverable: 'FLT 2 Mistake Log', milestone: 'FLT 2 Complete', tag: 'mocks flt' },
  { day: 'Day 15', date: 'Sat, 28 Nov 2026', mock: '🔄 Consolidation Sprint 1: Polity + History', sub1: 'Polity Sheets 1–4: Articles, Parts, Schedules, Constitutional bodies', sub2: 'Modern History Sheets 1–3: 1857–1947 timeline, Congress sessions', deliverable: 'High-speed sheet review', milestone: 'Consolidation Done', tag: 'history polity' },
  { day: 'Day 16', date: 'Sun, 29 Nov 2026', mock: '🔄 Consolidation Sprint 2: Geography + Science', sub1: 'Geography Sheets 1–4: River tributaries, passes, straits, ISFR rankings', sub2: 'Science Sheets 1–3: Vitamins, diseases, chemical formulas, optics', deliverable: 'High-speed sheet review', milestone: 'Consolidation Done', tag: 'geo science' },
  { day: 'Day 17', date: 'Mon, 30 Nov 2026', mock: '📝 Imtihaan 3 | Drishti Open Mock (PYQ Based) (13:00 PM)', sub1: 'Final PYQ Open Rehearsal: Scoring benchmark under pressure', sub2: 'Immediate review of incorrect options', deliverable: 'Imtihaan 3 Diagnostic Score', milestone: '🏁 ALL 3 IMTIHAAN DONE', tag: 'mocks flt' },
  { day: 'Day 18', date: 'Tue, 01 Dec 2026', mock: '📝 UPPSC Test 13 | FLT 3 (Complete Syllabus) (13:00 PM)', sub1: 'FLT 3 Attempt: Accuracy calibration & reducing negative marking', sub2: '150-question endurance drill', deliverable: 'FLT 3 Mistake Log', milestone: 'FLT 3 Complete', tag: 'mocks flt' },
  { day: 'Day 19', date: 'Wed, 02 Dec 2026', mock: '📝 UPPSC Test 14 | FLT 4 (Complete Syllabus) (13:00 PM)', sub1: 'FLT 4 Attempt: Pacing drill (Round 1: 70 min, Round 2: 35 min, OMR: 15 min)', sub2: 'Final question selection calibration', deliverable: 'FLT 4 Mistake Log', milestone: 'FLT 4 Complete', tag: 'mocks flt' },
  { day: 'Day 20', date: 'Thu, 03 Dec 2026', mock: '📝 UPPSC Test 15 | FLT 5 (Complete Syllabus) (13:00 PM)', sub1: 'FINAL FACTUAL REVISION 1: Polity Sheets 1–4 (Articles, Writs, Bodies)', sub2: 'FINAL FACTUAL REVISION 1: Economy Sheets 1–3 (Schemes, Budget figures)', deliverable: 'FLT 5 + Recall 1 Done', milestone: 'Sprint Phase 1 Done', tag: 'mocks flt' },
  { day: 'Day 21', date: 'Fri, 04 Dec 2026', mock: '📝 UPPSC Test 17 | FLT 6 (Final Mock) (13:00 PM)', sub1: 'FINAL FACTUAL REVISION 2: Geography Sheets 1–4 (Rivers, passes, minerals)', sub2: 'FINAL FACTUAL REVISION 2: Environment & Science Sheets (Acts, ISFR, Vitamins)', deliverable: 'Final Mock Complete!', milestone: '🏁 ALL 17 MOCKS COMPLETE', tag: 'mocks flt' },
  { day: 'Day 22', date: 'Sat, 05 Dec 2026', mock: '🌿 Zero Mocks: Total Gear & Mental Quietude', sub1: 'FINAL FACTUAL REVISION 3: UP Special Sheets + Ancient & Medieval Sheets', sub2: 'FINAL FACTUAL REVISION 3: Rapid Current Affairs + Pack Admit Card & ID', deliverable: 'Early dinner • Restful sleep by 10:00 PM', milestone: '🏁 100% PREP COMPLETE', tag: 'history upspecial' },
  { day: 'D-DAY', date: 'Sun, 06 Dec 2026', mock: '🎯 UPPCS PRELIMS 2026 EXAMINATION (GS-I 09:30 AM | CSAT 02:30 PM)', sub1: 'Paper I (General Studies - Merit): 150 Qs / 200 Marks (Target: 105+ Net)', sub2: 'Paper II (CSAT - Qualifying Only): 100 Qs / 200 Marks (Need 33% = 66 M)', deliverable: 'Calm execution • Decisive elimination', milestone: '🚀 EXAM D-DAY', isDDay: true, tag: 'dday' },
];

export default function UPPSCPlan() {
  const [filter, setFilter] = useState('all');

  const filteredDays = PLAN_DAYS.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'today') return item.isToday;
    return item.tag.includes(filter);
  });

  return (
    <>
      <PageHeader
        title="🏛️ UPPSC Prelims 2026: 22-Day Master Roadmap & Lakshya Mock Integration"
        sub="14 Nov – 5 Dec 2026 • D-Day: Sunday 6 Dec 2026 • Fresh Baseline Start with 17 Calendar Mocks Synced"
        aside={
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/uppsc.html" target="_blank" rel="noreferrer" className="btn primary">
              Open Fullscreen View ↗
            </a>
          </div>
        }
      />

      {/* Progress & Countdown Banner */}
      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Current Sprint Position</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>Day 01 / 22 (Saturday, 14 Nov)</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Baseline Assumption</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>Fresh Start (0% Past Done)</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Google Calendar Mocks</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fb7185' }}>17 Lakshya Mocks (0 CSAT)</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>D-Day Exam</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>Sunday, 6 Dec 2026</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
          <div style={{ width: '5%', height: '100%', background: 'linear-gradient(90deg, #38bdf8, #10b981, #f59e0b)', borderRadius: '6px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
          <span>Day 01 Active Today (14 Nov)</span>
          <span>17 Calendar Mocks (Sectionals & FLTs)</span>
          <span>D-Day Exam (6 Dec)</span>
        </div>
      </Panel>

      {/* Subject Completion Matrix */}
      <Panel title="🏁 Subject Completion Milestone Matrix (Where Each Section Gets Completed)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {MILESTONES.map((m) => (
            <div
              key={m.name}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid #1e293d',
                borderTop: `3px solid ${m.color}`,
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '14px', color: '#fff' }}>{m.name}</strong>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>{m.days}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#fb7185', fontWeight: 700, marginBottom: '6px' }}>
                  {m.mock}
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.45, marginBottom: '10px' }}>{m.scope}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293d', paddingTop: '8px', marginTop: 'auto' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: m.color, background: `${m.color}15`, border: `1px solid ${m.color}40`, padding: '2px 8px', borderRadius: '4px' }}>
                  🏁 {m.completes}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{m.sheets}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Filter and Master Table */}
      <Panel title="📅 22-Day Master Schedule with Google Calendar Lakshya Mocks">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            { id: 'all', label: 'All 22 Days' },
            { id: 'today', label: 'Today (14 Nov)' },
            { id: 'mocks', label: 'Calendar Mocks' },
            { id: 'history', label: 'History' },
            { id: 'geo', label: 'Geography/Env' },
            { id: 'science', label: 'Science' },
            { id: 'flt', label: 'FLTs (Complete)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn ${filter === tab.id ? 'primary' : 'ghost'}`}
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Day & Date</th>
                <th style={{ width: '260px' }}>🎯 Google Calendar Lakshya Mock</th>
                <th>Subject & Topic Focus</th>
                <th>Sheets & Special Deliverables</th>
                <th>Section Completion</th>
              </tr>
            </thead>
            <tbody>
              {filteredDays.map((item) => (
                <tr
                  key={item.day}
                  style={{
                    background: item.isToday
                      ? 'rgba(56, 189, 248, 0.08)'
                      : item.isDDay
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'transparent',
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: item.isToday ? '#38bdf8' : item.isDDay ? '#f59e0b' : '#fff' }}>{item.day}</strong>
                      {item.isToday && (
                        <span style={{ background: '#38bdf8', color: '#000', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px' }}>
                          TODAY
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{item.date}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#fb7185', fontWeight: 700 }}>{item.mock}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px', color: '#cbd5e1' }}>{item.sub1}</div>
                    {item.sub2 && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{item.sub2}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.deliverable}</div>
                  </td>
                  <td>
                    {item.milestone ? (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: item.milestone.includes('🏁') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: item.milestone.includes('🏁') ? '#10b981' : '#f59e0b',
                          border: `1px solid ${item.milestone.includes('🏁') ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                          display: 'inline-block',
                        }}
                      >
                        {item.milestone}
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '11px' }}>–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
