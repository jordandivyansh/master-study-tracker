import React, { useState, useEffect } from 'react';

const INITIAL_COURSES = [
  {
    id: 'forum-igp',
    institute: 'ForumIAS',
    name: 'Interview Guidance Program (IGP) 2026',
    url: 'https://academy.forumias.com/interview-courses',
    lead: 'Ayush Sinha & Senior Mentors',
    type: 'DAF & 1-on-1 Sessions',
    location: 'Karol Bagh (Offline) & Online',
    price: '₹1,180',
    status: 'Registered',
    mockDate: '',
    notes: 'Attended Nov 11 offline orientation with Ayush Sinha. Group formation and DAF discussion.',
  },
  {
    id: 'forum-ca',
    institute: 'ForumIAS',
    name: 'Current Affairs 2026 for IGP',
    url: 'https://academy.forumias.com/event/ca2026igp',
    lead: 'ForumIAS Faculty',
    type: 'Current Affairs Special',
    location: 'Online',
    price: '₹1,500',
    status: 'Planned',
    mockDate: '',
    notes: 'Reminder set for 18th Nov on Google Calendar to register & pay ₹1,500.',
  },
  {
    id: 'smartworks',
    institute: 'Smartworks Labs',
    name: 'Interview Guidance Programme (Smartworks)',
    url: 'https://smartworklabs.in/interview-guidance-programme',
    lead: 'Anupam Sir',
    type: 'Mentorship & Profile Defense',
    location: 'Online & Karol Bagh',
    price: 'Free',
    status: 'Mock Scheduled',
    mockDate: '2026-11-13T12:00',
    notes: 'Registered. Online 1:1 session on Friday 13 Nov (daytime). Deep profile defense, tech/MBA pivot, and behavioral composure.',
  },
  {
    id: 'vajiram',
    institute: 'Vajiram & Ravi',
    name: 'Interview Guidance Program (IGP)',
    url: 'https://vajiramandravi.com/courses/interview-guidance-program/',
    lead: 'Ex-UPSC Board Members & Senior Bureaucrats',
    type: 'Mock Panels & DAF Analysis',
    location: 'Old Rajinder Nagar, Delhi',
    price: '₹600',
    status: 'Registered',
    mockDate: '',
    notes: 'Paid ₹600 & Registered. Premier mock simulation panel & comprehensive DAF questionnaire.',
  },
  {
    id: 'drishti-eng',
    institute: 'Drishti IAS',
    name: 'Interview Guidance Program (English)',
    url: 'https://www.drishtiias.com/interview-guidance/',
    lead: 'Dr. Vikas Divyakirti & Senior Board',
    type: 'Mock Panel & Video Analysis',
    location: 'Karol Bagh / Mukherjee Nagar',
    price: 'Free',
    status: 'Registered',
    mockDate: '',
    notes: 'Registered. Comprehensive video performance audit, posture analysis and DAF grilling.',
  },
  {
    id: 'nextias',
    institute: 'Next IAS',
    name: 'Interview Guidance Program (IGP)',
    url: 'https://www.nextias.com/classroom-courses/interview-guidance-program',
    lead: 'B. Singh Sir & Panel of Bureaucrats',
    type: 'DAF Dissection & Mock Panels',
    location: 'Pusa Road, Karol Bagh, Delhi',
    price: '₹2,000',
    status: 'Registered',
    mockDate: '',
    notes: 'Paid ₹2,000 & Registered. Strong on engineering/technical profile defense & mock panels.',
  },
  {
    id: 'pw-onlyias',
    institute: 'PW OnlyIAS',
    name: 'UPSC Interview Guidance Program 2026',
    url: 'https://www.pw.live/upsc/exams/upsc-interview-guidance-program-2026',
    lead: 'Sumit Rewri Sir & Expert Panel',
    type: 'DAF Review & Mock Interviews',
    location: 'Delhi (Offline & Online)',
    price: 'Free',
    status: 'Registered',
    mockDate: '',
    notes: 'Registered. DAF questionnaire, state-specific current issues, and 1-on-1 feedback.',
  },
  {
    id: 'insights',
    institute: 'InsightsIAS',
    name: 'UPSC Interview Guidance Program 2026',
    url: 'https://www.insightsonindia.com/2026/11/02/upsc-interview-guidance-program-2026-orientation-one-on-one-mock-interviews-insights-ias/',
    lead: 'Vinay Kumar GB Sir',
    type: 'Orientation & 1-on-1 Mocks',
    location: 'Delhi Centre / Online',
    price: 'Free',
    status: 'Registered',
    mockDate: '',
    notes: 'Registered. Psychological tuning, ethical clarity, and personalized feedback.',
  },
  {
    id: 'unacademy',
    institute: 'Unacademy',
    name: 'The Last Mile: Interview Guidance Program',
    url: 'https://unacademy.com/content/upsc/the-last-mile-interview-guidance-program/',
    lead: 'Retd. Ambassadors, Chief Secretaries, Top Faculty',
    type: 'Star Mock Panels & DAF Audit',
    location: 'Delhi & Online',
    price: 'Free',
    status: 'Registered',
    mockDate: '',
    notes: 'Registered. High-profile panel simulation and video recording review.',
  },
  {
    id: 'tathastu',
    institute: 'Tathastu ICS',
    name: 'Interview Guidance Program & Personal Mentorship',
    url: 'https://tathastuics.com/interview-guidance-program',
    lead: 'Dr. Manoj K. Sharma Sir',
    type: 'Personal 1-on-1 DAF Mentorship',
    location: 'Greater Noida & Delhi',
    price: '₹1,900',
    status: 'Mock Scheduled',
    mockDate: '2026-11-14T17:00',
    notes: 'Core mentor for 2+ years. In-person/Online meet on Sat 14 Nov around 5:00 PM; register/pay ₹1,900 post-meeting.',
  },
  {
    id: 'sarrthi-ias',
    institute: 'Sarrthi IAS',
    name: '1:1 Interview Guidance & DAF Mentorship',
    url: 'https://www.sarrthiias.com/',
    lead: 'Peeyush Kumar Sir & Senior Faculty',
    type: '1:1 Mock & Recorded Video Sessions',
    location: 'Online',
    price: 'Free',
    status: 'Mock Scheduled',
    mockDate: '2026-11-14T13:30',
    notes: 'Foundational & video sessions watched and completed. 1:1 Mock & DAF Mentorship with Peeyush Kumar Sir scheduled for Saturday 14 Nov @ 1:30 PM.',
  },
  {
    id: 'vignan-irs',
    institute: 'IRS Mentorship (Vignan Pattamatta)',
    name: '1:1 Mock, DAF & WhatsApp Guidance',
    url: 'https://web.whatsapp.com/',
    lead: 'Vignan Pattamatta, IRS C&IT (CSE 2013)',
    type: 'Daily 1:1 Mock & WhatsApp Mentorship',
    location: 'WhatsApp & Online Live',
    price: 'Free',
    status: 'Mock Scheduled',
    mockDate: 'Daily 10:30 AM',
    notes: 'Daily 1:1 online sessions with Vignan Sir at 10:30 AM. Continuous DAF refinement and probing.',
  },
  {
    id: 'lukmaan',
    institute: 'Lukmaan IAS',
    name: 'Interview Guidance Program (IGP) - Pub Ad & Ethics',
    url: 'https://lukmaanias.com/interview-guidance-program-igp/',
    lead: 'S. Ansari Sir & Senior Board Members',
    type: 'DAF Analysis, Pub Ad Optional & 1-on-1 Mocks',
    location: 'Pusa Road, Karol Bagh, Delhi',
    price: 'Free',
    status: 'Registered',
    mockDate: '',
    notes: 'Registered. Pub Ad Optional deep dive, administrative case studies, Ethics-DAF alignment.',
  },
  {
    id: 'pawan-kumar',
    institute: 'Pawan Kumar IAS',
    name: 'Interview Guidance Program - Public Administration & Governance',
    url: 'https://www.pavankumarias.com/',
    lead: 'Pawan Kumar Sir',
    type: '1-on-1 Pub Ad Optional Mentorship & Mock Interview',
    location: 'Old Rajinder Nagar / Karol Bagh, Delhi',
    price: 'Free',
    status: 'Registered',
    mockDate: '',
    notes: 'Registered. Pawan Kumar Sir specialized Pub Ad conceptual defense & administrative theories.',
  },
  {
    id: 'decode-civils',
    institute: 'Decode Civils',
    name: '1:1 DAF Session & Free Interview Resource',
    url: 'https://student.decodecivils.com/courses/',
    lead: "Anita Ma'am (Score 220, Rank-644) & Mentors",
    type: '1:1 DAF Session & Topper Guidance',
    location: 'Online Portal',
    price: 'Free',
    status: 'Completed',
    mockDate: '',
    notes: 'Registered. Enrolled in 1:1 DAF Session (starts 10 Nov) + Free Interview Resource with Anita Ma\'am. Foundational DAF sessions watched and completed.',
  },
  {
    id: 'vision-ias',
    institute: 'VisionIAS',
    name: 'Interview Guidance Program & Mock Interviews 2026',
    url: 'https://www.visionias.in/interview/',
    lead: 'Retd. Bureaucrats, Diplomats & Ex-UPSC Board Members',
    type: 'DAF Questionnaire & Panel Mock Simulation',
    location: 'Karol Bagh / Mukherjee Nagar, Delhi & Online',
    price: '₹500',
    status: 'Registered',
    mockDate: '',
    notes: 'Paid ₹500 & Registered. Comprehensive DAF questionnaire, state-specific analysis & multi-panel mock simulations.',
  },
  {
    id: 'studyiq',
    institute: 'StudyIQ IAS',
    name: 'UPSC Interview Guidance Program & Mock Interviews (Antim Pag / P2I)',
    url: 'https://www.studyiq.com/course-detail/interview-guidance-program',
    lead: 'Retired Senior Civil Servants & StudyIQ Expert Board',
    type: '1:1 Mock Interview & DAF Analysis',
    location: 'Delhi & Online',
    price: 'Free',
    status: 'Planned',
    mockDate: '',
    notes: 'Will officially visit Delhi/Karol Bagh centre before registering.',
  },
  {
    id: 'yt-framework',
    institute: 'Interview Masterclass',
    name: 'UPSC Interview Strategy & Cadence Masterclass',
    url: 'https://www.youtube.com/watch?v=uAJgX1RrQ3s',
    lead: 'Toppers & Senior Mentors',
    type: 'Video Masterclass',
    location: 'Digital Resource',
    price: 'Free',
    status: 'Completed',
    mockDate: '',
    notes: 'Pacing, body language, 3-sec pause, and avoiding argumentative traps.',
  },
];

const STATUSES = ['Planned', 'Registered', 'DAF Submitted', 'Mock Scheduled', 'Completed'];
const STORAGE_KEY = 'master_interview_courses_v7';

export default function InterviewHub() {
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_COURSES;
    try {
      const parsed = JSON.parse(saved);
      const parsedMap = new Map(parsed.map((c) => [c.id, c]));
      return INITIAL_COURSES.map((init) => {
        const userSaved = parsedMap.get(init.id);
        if (!userSaved) return init;
        return {
          ...init,
          price: userSaved.price || init.price,
          status: userSaved.status || init.status,
          notes: userSaved.notes || init.notes,
          mockDate: userSaved.mockDate || init.mockDate,
        };
      });
    } catch {
      return INITIAL_COURSES;
    }
  });
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' | 'playbook'

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    localStorage.setItem('master_interview_courses', JSON.stringify(courses));
  }, [courses]);

  const updateCourse = (id, field, value) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const cycleStatus = (id) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const curIdx = STATUSES.indexOf(c.status);
        const nextIdx = (curIdx + 1) % STATUSES.length;
        return { ...c, status: STATUSES[nextIdx] };
      })
    );
  };

  const stats = {
    total: courses.length,
    registered: courses.filter((c) => c.status !== 'Planned').length,
    mocks: courses.filter((c) => c.status === 'Mock Scheduled' || c.status === 'Completed').length,
    completed: courses.filter((c) => c.status === 'Completed').length,
  };

  const visibleCourses = courses.filter((c) => {
    if (filter === 'All') return true;
    if (filter === 'Registered') return c.status !== 'Planned';
    if (filter === 'Mock Scheduled') return c.status === 'Mock Scheduled';
    if (filter === 'Planned') return c.status === 'Planned';
    return true;
  });

  return (
    <div className="interview-hub-page">
      {/* Header */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: 'var(--serif)' }}>
              🎯 UPSC CSE 2026: Interview Guidance & DAF Tracker
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              Tracking institutional mock panels, DAF submissions, personal mentors, and master articulation playbooks.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn ${activeTab === 'tracker' ? 'primary' : 'ghost'}`}
              onClick={() => setActiveTab('tracker')}
            >
              📋 Course Tracker ({courses.length})
            </button>
            <button
              className={`btn ${activeTab === 'playbook' ? 'primary' : 'ghost'}`}
              onClick={() => setActiveTab('playbook')}
              style={{ background: activeTab === 'playbook' ? 'var(--gold)' : undefined, color: activeTab === 'playbook' ? '#000' : undefined }}
            >
              🎙️ Speech & DAF Playbook
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 18 }}>
          <div className="stat-card" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Programs</span>
            <strong style={{ display: 'block', fontSize: 20, color: 'var(--text)' }}>{stats.total}</strong>
          </div>
          <div className="stat-card" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active / Registered</span>
            <strong style={{ display: 'block', fontSize: 20, color: 'var(--gold)' }}>{stats.registered}</strong>
          </div>
          <div className="stat-card" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Mocks Scheduled</span>
            <strong style={{ display: 'block', fontSize: 20, color: '#38bdf8' }}>{stats.mocks}</strong>
          </div>
          <div className="stat-card" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</span>
            <strong style={{ display: 'block', fontSize: 20, color: '#10b981' }}>{stats.completed}</strong>
          </div>
        </div>
      </div>

      {activeTab === 'tracker' ? (
        <div className="panel">
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Registered', 'Mock Scheduled', 'Planned'].map((f) => (
                <button
                  key={f}
                  className={`btn ${filter === f ? 'primary' : 'ghost'}`}
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Showing {visibleCourses.length} of {courses.length} courses • Click status badge to cycle state
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 10px' }}>Institute & Course</th>
                  <th style={{ padding: '8px 10px' }}>Faculty / Format</th>
                  <th style={{ padding: '8px 10px' }}>Fee / Price</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px' }}>Mock / Date</th>
                  <th style={{ padding: '8px 10px' }}>Personal Strategy & Notes</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Portal Link</th>
                </tr>
              </thead>
              <tbody>
                {visibleCourses.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 10px', verticalAlign: 'top', width: '20%' }}>
                      <strong style={{ display: 'block', color: 'var(--text)', fontSize: 13.5 }}>{c.institute}</strong>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{c.name}</span>
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'top', width: '17%' }}>
                      <span style={{ display: 'block', color: 'var(--text)' }}>{c.lead}</span>
                      <span style={{ fontSize: 11, color: 'var(--gold)', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 6px', borderRadius: 4 }}>
                        {c.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'top', width: '12%' }}>
                      <input
                        type="text"
                        placeholder="Free"
                        value={c.price || 'Free'}
                        onChange={(e) => updateCourse(c.id, 'price', e.target.value)}
                        style={{
                          width: '100%',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--line)',
                          color: c.price && !c.price.toLowerCase().includes('free') ? 'var(--gold)' : '#10b981',
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'top', width: '11%' }}>
                      <button
                        onClick={() => cycleStatus(c.id)}
                        style={{
                          background:
                            c.status === 'Completed'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : c.status === 'Mock Scheduled'
                              ? 'rgba(56, 189, 248, 0.15)'
                              : c.status === 'Registered' || c.status === 'DAF Submitted'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(255, 255, 255, 0.05)',
                          color:
                            c.status === 'Completed'
                              ? '#10b981'
                              : c.status === 'Mock Scheduled'
                              ? '#38bdf8'
                              : c.status === 'Registered' || c.status === 'DAF Submitted'
                              ? '#f59e0b'
                              : 'var(--muted)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '3px 8px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title="Click to cycle status"
                      >
                        {c.status} ↻
                      </button>
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'top', width: '15%' }}>
                      <input
                        type="text"
                        placeholder="e.g. 25 Nov, 4 PM"
                        value={c.mockDate || ''}
                        onChange={(e) => updateCourse(c.id, 'mockDate', e.target.value)}
                        style={{
                          width: '100%',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--line)',
                          color: 'var(--text)',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                      <input
                        type="text"
                        placeholder="Add specific notes or focus area..."
                        value={c.notes || ''}
                        onChange={(e) => updateCourse(c.id, 'notes', e.target.value)}
                        style={{
                          width: '100%',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--line)',
                          color: 'var(--text)',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn ghost"
                        style={{ fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Open Portal ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PLAYBOOK TAB: Bulletproof DAF Answers & Vocabulary */
        <div className="panel" style={{ display: 'grid', gap: 20 }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: 18, borderRadius: 8 }}>
            <h2 style={{ fontSize: 17, color: 'var(--gold)', margin: '0 0 8px 0', fontFamily: 'var(--serif)' }}>
              🎙️ The Articulation Master Playbook: Resolving the 2 Big Questions
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              The UPSC Board will test your internal conviction, vocabulary precision, and unhurried cadence. 
              Here are your bulletproof frameworks designed specifically for your <strong>ABV-IIITM Gwalior (Dual Degree B.Tech + MBA in IT)</strong> background.
            </p>
          </div>

          {/* Question 1 */}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: 18 }}>
            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Core Probe 01</span>
            <h3 style={{ fontSize: 16, margin: '4px 0 12px 0', color: 'var(--text)' }}>
              "Why do you want to join the Civil Services after doing an Integrated B.Tech + MBA in IT?"
            </h3>
            
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 14, borderRadius: 6, borderLeft: '3px solid var(--gold)', marginBottom: 12 }}>
              <strong style={{ fontSize: 13, color: 'var(--gold)', display: 'block', marginBottom: 6 }}>Model Delivery (Cadence: 125 WPM, Calm & Grounded):</strong>
              <p style={{ fontSize: 13.5, color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
                <em>
                  "Sir, my education at ABV-IIITM Gwalior provided me with a dual lens—the analytical rigor of engineering and the systemic, resource-allocation perspective of management.<br /><br />
                  While corporate IT allows one to optimize solutions within market boundaries for specific clients, the Civil Services operates at the foundation of the nation itself. It offers the unique privilege of working on systemic scale, public policy execution, and direct citizen welfare where technological architecture can empower marginalized citizens through Digital Public Infrastructure.<br /><br />
                  I see civil administration not as an escape from my technology background, but as its highest-impact application—translating technical capability into inclusive public governance."
                </em>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: 10, borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <strong style={{ color: '#10b981', display: 'block', marginBottom: 4 }}>✓ High-Impact Vocabulary to Use</strong>
                <span style={{ color: '#cbd5e1' }}>Systemic scale, Digital Public Infrastructure (DPI), inclusive delivery, institutional architecture, resource stewardship, citizen-centric.</span>
              </div>
              <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: 10, borderRadius: 6, border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <strong style={{ color: '#f43f5e', display: 'block', marginBottom: 4 }}>✕ Phrases to Strictly Avoid</strong>
                <span style={{ color: '#cbd5e1' }}>"I wanted power and prestige", "Corporate life is boring/money-minded", "I wanted job security", "To serve the poor" (cliché without policy depth).</span>
              </div>
            </div>
          </div>

          {/* Question 2 */}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: 18 }}>
            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Core Probe 02</span>
            <h3 style={{ fontSize: 16, margin: '4px 0 12px 0', color: 'var(--text)' }}>
              "Why didn't you pursue a Software Engineering (SDE) / Big Tech job or stay in the corporate tech sector?"
            </h3>
            
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 14, borderRadius: 6, borderLeft: '3px solid #38bdf8', marginBottom: 12 }}>
              <strong style={{ fontSize: 13, color: '#38bdf8', display: 'block', marginBottom: 6 }}>Model Delivery (Cadence: 125 WPM, Zero Apology, High Dignity):</strong>
              <p style={{ fontSize: 13.5, color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
                <em>
                  "Sir, while I have immense respect for the tech sector and thoroughly enjoyed algorithmic problem-solving and competitive programming, my long-term career calling was always public systems.<br /><br />
                  A software engineering role is fundamentally product- and profit-centric, focusing on discrete codebases. In contrast, the challenges facing our districts—whether last-mile service delivery, public health logistics, educational access, or law enforcement—demand holistic leadership, constitutional empathy, and inter-departmental convergence.<br /><br />
                  I made a conscious, deliberate choice after graduation in 2023 to invest my full energy into the Civil Services, because I wanted my professional life to be anchored in public purpose and institutional building."
                </em>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: 10, borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <strong style={{ color: '#10b981', display: 'block', marginBottom: 4 }}>✓ Psychological Key</strong>
                <span style={{ color: '#cbd5e1' }}>Own your decision with pride. You didn't "fail to get a job"; you chose a deliberate, high-stakes national mission.</span>
              </div>
              <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: 10, borderRadius: 6, border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <strong style={{ color: '#f43f5e', display: 'block', marginBottom: 4 }}>✕ Defensiveness Trap</strong>
                <span style={{ color: '#cbd5e1' }}>Never speak negatively about the IT industry. Acknowledge its economic contribution, then pivot to your personal alignment with public governance.</span>
              </div>
            </div>
          </div>

          {/* Delivery & Pacing Protocol */}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: 18 }}>
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>The Physical Delivery Protocol</span>
            <h3 style={{ fontSize: 16, margin: '4px 0 12px 0', color: 'var(--text)' }}>
              Mastering the 125 WPM Cadence & Overcoming Fast Speech
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, fontSize: 13 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6, border: '1px solid var(--line)' }}>
                <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: 4 }}>1. The 3-Second Inhale</strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  When a board member finishes speaking, count silently: <em>"One... Two... Three..."</em> while taking a gentle breath. This resets heart rate and kills rushed reactionary speaking.
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6, border: '1px solid var(--line)' }}>
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: 4 }}>2. The Point-Wise Structure</strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  Begin with a framing phrase: <em>"Sir, I view this through three specific dimensions..."</em> Structuring answers mechanically forces your vocal pace to slow down.
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6, border: '1px solid var(--line)' }}>
                <strong style={{ color: '#10b981', display: 'block', marginBottom: 4 }}>3. Resonant Chest Voice</strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  Fast speech comes from shallow throat breathing. Speak from your lower abdomen. Lower pitch naturally commands authority and calms the room.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
