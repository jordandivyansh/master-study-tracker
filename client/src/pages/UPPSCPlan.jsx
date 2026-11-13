import { useState, useEffect } from 'react';
import { PageHeader, Panel } from '../components/ui.jsx';

const MILESTONES = [
  { name: '🏛️ Indian Polity', days: 'Days 01–05 + Day 17', scope: 'Articles, Parts, Schedules, Local Govt, FRs, DPSP, Judiciary, Parliament, Executive, Bodies.', completes: 'Day 05 (15 Nov)', color: '#38bdf8', sheets: 'Sheets 1–4', status: 'In Progress' },
  { name: '📈 Indian Economy', days: 'Days 01–05 + 18, 21', scope: 'Welfare Schemes, Union & UP Budget, Poverty, Unemployment, GDP/GVA, Inflation, Banking, Infra.', completes: 'Day 05 (15 Nov)', color: '#10b981', sheets: 'Sheets 1–3', status: 'In Progress' },
  { name: '🌿 Environment & Ecology', days: 'Days 06–08', scope: 'Acts, Wildlife Projects, Conventions/COPs, Ramsar Sites, National Parks, ISFR 2023, SDGs, Pollution.', completes: 'Day 08 (18 Nov)', color: '#34d399', sheets: 'Sheets 1–3', status: 'Upcoming' },
  { name: '🌍 Geography (Ind & World)', days: 'Days 06–11 + Day 19', scope: 'Rivers, Lakes, Chokepoints, Agriculture, Minerals, Oceans, Peaks, Passes, Deserts, Census, Climate, Winds, Soil.', completes: 'Day 11 (21 Nov)', color: '#60a5fa', sheets: 'Sheets 1–4', status: 'Upcoming' },
  { name: '⚔️ Modern Indian History', days: 'Days 09–11 + Day 20', scope: '1917–1947 Chronologies, Revolutionary Orgs, Wars/Treaties, 1857, Early Nationalism, Peasant Revolts, Reform, Books.', completes: 'Day 11 (21 Nov)', color: '#fb923c', sheets: 'Sheets 1–3', status: 'Upcoming' },
  { name: '🏺 Ancient Indian History', days: 'Days 12–13', scope: 'Harappan & Prehistoric Sites, Archaeological Cultures, Buddhism & Jainism, Rulers, Inscriptions, Foreign Travellers.', completes: 'Day 13 (23 Nov)', color: '#e879f9', sheets: 'Sheets 1–3', status: 'Upcoming' },
  { name: '🏰 Medieval Indian History', days: 'Days 14–15', scope: 'Delhi Sultanate Admin Terms, Battles in Sequence, Mughal & Maratha Succession, Temples & Indo-Islamic Architecture.', completes: 'Day 15 (25 Nov)', color: '#f472b6', sheets: 'Sheets 1–3', status: 'Upcoming' },
  { name: '🔬 General Science (All)', days: 'Days 12–16', scope: 'Bio (Vitamins, Organs, Diseases) by Day 14; Chem (Fuels, Alloys) by Day 15; Physics (Optics, Sound, EM) by Day 16.', completes: 'Day 16 (26 Nov)', color: '#a78bfa', sheets: 'Sheets 1–3', status: 'Upcoming' },
  { name: '🏛️ UP Special (Complete)', days: 'Days 16–18', scope: 'ODOP & ODOC, UP Census & Divisions, UP Ramsar Sites, Forest Report, UP Budget 2026-27, Expressways, Agriculture.', completes: 'Day 17 (27 Nov)', color: '#facc15', sheets: 'Sheets 1–3', status: 'Upcoming' },
  { name: '📊 CSAT (Paper II)', days: 'Days 18–21', scope: 'Reading Comprehension, Interpersonal Skills, Elementary Mathematics, Reasoning & Decision Making.', completes: 'Day 21 (01 Dec)', color: '#38bdf8', sheets: 'Sets 1–4', status: 'Upcoming' },
  { name: '📝 Full Mock Rehearsal', days: 'Day 22 (02 Dec)', scope: 'Single full dress rehearsal under timed exam conditions (GS + CSAT) with instant mistake classification.', completes: 'Day 22 (02 Dec)', color: '#f43f5e', sheets: 'Full Rehearsal', status: 'Upcoming' },
  { name: '🎯 The Finish Line (3-Day Recall)', days: 'Days 23–25 (03–05 Dec)', scope: 'Day 23: Polity/Eco/Modern • Day 24: Geo/Env/Science • Day 25: UP/Ancient/Medieval/CA.', completes: 'Day 25 (05 Dec)', color: '#10b981', sheets: 'Final Sheets', status: 'D-Day 6 Dec' },
];

const PLAN_DAYS = [
  { day: 'Day 01', date: 'Wed, 11 Nov 2026', sub1: 'Polity: Articles, Parts & Schedules, Amendments (1–106)', sub2: 'Economy: Major Welfare Schemes Chronology', deliverable: 'Polity Sheet 1 + Economy Sheet 1', milestone: '', done: true, tag: 'polity economy' },
  { day: 'Day 02', date: 'Thu, 12 Nov 2026', sub1: 'Polity: Local Govt (73rd/74th), Preamble, FRs, Writs, DPSP', sub2: 'Economy: Union & UP Budget, Economic Survey Indicators', deliverable: 'Polity Sheet 2 + Economy Sheet 2', milestone: '', done: true, tag: 'polity economy' },
  { day: 'Day 03', date: 'Fri, 13 Nov 2026', sub1: 'Polity: Parliament, State Legis., Union & State Executive', sub2: 'Economy: Unemployment types & Poverty Committees (MPI)', deliverable: 'Polity Sheet 3 + Economy Sheet 3', milestone: '', done: true, tag: 'polity economy' },
  { day: 'Day 04', date: 'Sat, 14 Nov 2026', sub1: 'Polity: Constitutional Bodies (Art 315–323, 148, 324, 280), UPPSC/SEC', sub2: 'Economy: National Income, GDP/GVA, CPI/WPI Base Years, Inflation', deliverable: 'Polity Sheet 4 + UP Budget Video + Lakshya MCQs (Q1–100) + Mock', milestone: '⚡ Today (Active)', isToday: true, tag: 'polity economy today' },
  { day: 'Day 05', date: 'Sun, 15 Nov 2026', sub1: 'Polity: Judiciary (SC/HC), Basic Structure, Landmark Judgments', sub2: 'Economy: External Sector, BOP, Forex, Banking, Industrial Policy', deliverable: 'Polity Sheets 1–4 Final Review + Economy Sheets 1–3 Final Review', milestone: '🏁 POLITY & ECONOMY COMPLETE', tag: 'polity economy' },
  { day: 'Day 06', date: 'Mon, 16 Nov 2026', sub1: 'Geography: Indian Rivers, Lakes, Waterfalls, Canals, Chokepoints', sub2: 'Environment: Acts Chronology (EPA, WPA), Wildlife Projects, Treaties', deliverable: 'Geography Sheet 1 + Environment Sheet 1', milestone: '', tag: 'geo env' },
  { day: 'Day 07', date: 'Tue, 17 Nov 2026', sub1: 'Geography: Agriculture, Crops, Seasons, Minerals & Critical Belts', sub2: 'Environment: National Parks, Biosphere Reserves, Ramsar Sites (UP 10)', deliverable: 'Geography Sheet 2 + Environment Sheet 2', milestone: '', tag: 'geo env' },
  { day: 'Day 08', date: 'Wed, 18 Nov 2026', sub1: 'Geography: Oceans, Currents, Peaks, Passes, Deserts, Volcanoes', sub2: 'Environment: ISFR 2023, Ecological Concepts, SDGs, Pollution & GHGs', deliverable: 'Geography Sheet 3 + Environment Sheet 3', milestone: '🏁 ENVIRONMENT COMPLETE', tag: 'geo env' },
  { day: 'Day 09', date: 'Thu, 19 Nov 2026', sub1: 'Geography: Census 2011 (India & UP), Population, Capitals, Borders', sub2: 'Modern History: 1917–1947 Chronology, Revolutionary & Left Orgs', deliverable: 'Geography Sheet 4 + Modern History Sheet 1', milestone: '', tag: 'geo history' },
  { day: 'Day 10', date: 'Fri, 20 Nov 2026', sub1: 'Geography: Climatology, Pressure Belts, Winds, Vegetation, Grasslands', sub2: 'Modern History: British Expansion, Wars & Treaties, Governors-General', deliverable: 'Modern History Sheet 2', milestone: '', tag: 'geo history' },
  { day: 'Day 11', date: 'Sat, 21 Nov 2026', sub1: 'Geography: Atmosphere Layers, Tribes (India/World), Indian Soils', sub2: 'Modern History: Tribal/Peasant Revolts, Social Reforms, Historical Books', deliverable: 'Modern History Sheet 3', milestone: '🏁 GEO & MODERN HIST COMPLETE', tag: 'geo history' },
  { day: 'Day 12', date: 'Sun, 22 Nov 2026', sub1: 'Science (Bio): Vitamins, Nutrition, Human Digestive & Circulatory', sub2: 'Ancient History: Harappan & Prehistoric Sites, Vedic Literature', deliverable: 'Science Sheet 1 (Bio) + Ancient History Sheet 1', milestone: '', tag: 'science history' },
  { day: 'Day 13', date: 'Mon, 23 Nov 2026', sub1: 'Science (Bio): Organs, Glands, Hormones, Enzymes, Genetics, DNA', sub2: 'Ancient History: Buddhism, Jainism, Mauryan/Gupta Rulers, Travellers', deliverable: 'Ancient History Sheets 2 & 3', milestone: '🏁 ANCIENT HIST COMPLETE', tag: 'science history' },
  { day: 'Day 14', date: 'Tue, 24 Nov 2026', sub1: 'Science (Bio): Diseases (Bacterial/Viral), Pathogens, Vectors, Plants', sub2: 'Medieval History: Delhi Sultanate, Admin Terms, Chronology of Battles', deliverable: 'Medieval History Sheet 1', milestone: '🏁 BIOLOGY COMPLETE', tag: 'science history' },
  { day: 'Day 15', date: 'Wed, 25 Nov 2026', sub1: 'Science (Chem): Everyday Chemistry, Acids/Bases, Alloys, Fuels', sub2: 'Medieval History: Mughal Empire, Maratha Peshwas, Architecture', deliverable: 'Science Sheet 2 (Chem) + Medieval History Sheets 2 & 3', milestone: '🏁 CHEM & MEDIEVAL COMPLETE', tag: 'science history' },
  { day: 'Day 16', date: 'Thu, 26 Nov 2026', sub1: 'Science (Physics): Optics, Sound, EM Spectrum, ISRO & Space', sub2: 'UP Special: ODOP/ODOC Mapping, 75 Districts, 18 Divisions, Forests', deliverable: 'Science Sheet 3 (Physics) + UP Special Sheet 1', milestone: '🏁 FULL SCIENCE COMPLETE', tag: 'science upspecial' },
  { day: 'Day 17', date: 'Fri, 27 Nov 2026', sub1: 'Revise Polity: Comprehensive Polity Sheets 1–4 Drill', sub2: 'UP Special: UP Budget 2026-27, Agriculture, Expressways, Corridors', deliverable: 'UP Special Sheets 2 & 3', milestone: '🏁 UP SPECIAL COMPLETE', tag: 'polity upspecial' },
  { day: 'Day 18', date: 'Sat, 28 Nov 2026', sub1: 'Revise Economy: Comprehensive Economy Sheets 1–3 Drill', sub2: 'CSAT: Reading Comprehension (Eng/Hindi) & Interpersonal Skills', deliverable: 'CSAT Practice Set 1', milestone: '', tag: 'economy csat' },
  { day: 'Day 19', date: 'Sun, 29 Nov 2026', sub1: 'Revise Geography: Comprehensive Geo Sheets 1–4 & Atlas Drill', sub2: 'CSAT: Elementary Mathematics (Number System, Arithmetic)', deliverable: 'CSAT Practice Set 2', milestone: '', tag: 'geo csat' },
  { day: 'Day 20', date: 'Mon, 30 Nov 2026', sub1: 'Revise Modern Hist: Modern Sheets 1–3 & Sessions/Presidents Drill', sub2: 'CSAT: Reasoning, Logic, Coding-Decoding, Decision Making', deliverable: 'CSAT Practice Set 3', milestone: '', tag: 'history csat' },
  { day: 'Day 21', date: 'Tue, 01 Dec 2026', sub1: 'Revise Economy: Macro Numbers, Poverty/Banking Final Check', sub2: 'CSAT: Algebra, Geometry, Statistics & Full CSAT Rehearsal', deliverable: 'Full CSAT Paper II Diagnostic (> 66% Qualifying)', milestone: '🏁 CSAT COMPLETE', tag: 'economy csat' },
  { day: 'Day 22', date: 'Wed, 02 Dec 2026', sub1: 'MOCK TEST: Full-Length GS Paper I (150 Qs, Timed 09:30–11:30 AM)', sub2: 'MOCK TEST: Full-Length CSAT Paper II (100 Qs, Timed 02:30–04:30 PM)', deliverable: 'Mistake Analysis Log & Immediate Sheet Patching', milestone: '🏁 FULL MOCK COMPLETE', isMock: true, tag: 'final' },
  { day: 'Day 23', date: 'Thu, 03 Dec 2026', sub1: 'FINAL FACTUAL REVISION 1: Indian Polity (Sheets 1–4)', sub2: 'FINAL FACTUAL REVISION 1: Economy (Sheets 1–3) + Modern History (Sheets 1–3)', deliverable: 'High-speed Sheet Flipping Only • Zero Fresh Learning', milestone: 'Sprint Phase 1 Done', isFinal: true, tag: 'final' },
  { day: 'Day 24', date: 'Fri, 04 Dec 2026', sub1: 'FINAL FACTUAL REVISION 2: Geography (Sheets 1–4)', sub2: 'FINAL FACTUAL REVISION 2: Environment (Sheets 1–3) + Science (Sheets 1–3)', deliverable: 'Fast Recall & Memory Retrieval Drills', milestone: 'Sprint Phase 2 Done', isFinal: true, tag: 'final' },
  { day: 'Day 25', date: 'Sat, 05 Dec 2026', sub1: 'FINAL FACTUAL REVISION 3: UP Special (Sheets 1–3) + Ancient/Medieval', sub2: 'FINAL FACTUAL REVISION 3: Rapid Current Affairs + Admit Card Pack', deliverable: 'Total Rest by 10:00 PM • Mental Quietude', milestone: '🏁 100% PREP COMPLETE', isFinal: true, tag: 'final' },
  { day: 'D-DAY', date: 'Sun, 06 Dec 2026', sub1: '🎯 UPPCS PRELIMS 2026: GS Paper I (09:30 AM – 11:30 AM, 150 Qs / 200 M)', sub2: '🎯 UPPCS PRELIMS 2026: CSAT Paper II (02:30 PM – 04:30 PM, 100 Qs)', deliverable: 'Execution Day: Steady Composure & Decisive Elimination', milestone: '🚀 EXAM D-DAY', isDDay: true, tag: 'dday' },
];

export default function UPPSCPlan() {
  const [filter, setFilter] = useState('all');
  const [checks, setChecks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mst_uppsc_plan_checklist_v1') || '{}');
    } catch {
      return {};
    }
  });

  const toggleCheck = (id) => {
    setChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('mst_uppsc_plan_checklist_v1', JSON.stringify(next));
      return next;
    });
  };

  const filteredDays = PLAN_DAYS.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'today') return item.isToday;
    return item.tag.includes(filter);
  });

  return (
    <>
      <PageHeader
        title="🏛️ UPPSC Prelims 2026: 25-Day Master Execution & Subject Completion Roadmap"
        sub="11 Nov – 5 Dec 2026 • D-Day: Sunday 6 December 2026 • Calibrated from IAS PCS Pathshala Checklist"
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
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Current Milestone</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>Day 04 / 25 (Saturday, 14 Nov)</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Countdown to Exam</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>22 Days Remaining</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>D-Day Target</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>Sunday, 6 Dec 2026</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
          <div style={{ width: '16%', height: '100%', background: 'linear-gradient(90deg, #10b981, #38bdf8, #f59e0b)', borderRadius: '6px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
          <span>Day 01–03 Completed</span>
          <span>Day 04 Active Today</span>
          <span>Exam: 6 Dec</span>
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
      <Panel title="📅 25-Day Chronological Master Checklist">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            { id: 'all', label: 'All 25 Days' },
            { id: 'today', label: 'Today (Day 04)' },
            { id: 'polity', label: 'Polity' },
            { id: 'economy', label: 'Economy' },
            { id: 'geo', label: 'Geography' },
            { id: 'history', label: 'History' },
            { id: 'science', label: 'Science' },
            { id: 'upspecial', label: 'UP Special' },
            { id: 'final', label: 'Final Sprint' },
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
                <th>Subject 1 Focus</th>
                <th>Subject 2 Focus</th>
                <th>Recall, Sheet & Special Deliverables</th>
                <th>Section Milestone</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Done</th>
              </tr>
            </thead>
            <tbody>
              {filteredDays.map((item) => {
                const isChecked = !!checks[item.day];
                return (
                  <tr
                    key={item.day}
                    style={{
                      background: item.isToday
                        ? 'rgba(56, 189, 248, 0.08)'
                        : item.isDDay
                        ? 'rgba(245, 158, 11, 0.08)'
                        : item.done
                        ? 'rgba(16, 185, 129, 0.03)'
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
                      <div style={{ fontSize: '12.5px', color: '#cbd5e1' }}>{item.sub1}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', color: '#cbd5e1' }}>{item.sub2}</div>
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
                    <td style={{ textAlign: 'center' }}>
                      {item.done ? (
                        <span style={{ color: '#10b981', fontWeight: 800, fontSize: '12px' }}>✓</span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(item.day)}
                          style={{ cursor: 'pointer', accentColor: '#10b981', width: '16px', height: '16px' }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
