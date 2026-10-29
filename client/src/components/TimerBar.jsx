import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function TimerBar({ onLogSaved }) {
  const [running, setRunning] = useState(false);
  const [stream, setStream] = useState('cava');
  const [seconds, setSeconds] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveDay, setSaveDay] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let interval = null;
    if (running) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running]);

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    if (running) {
      setRunning(false);
      setIsOpen(true);
    } else {
      setRunning(true);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(0);
    setIsOpen(false);
  };

  const handleSaveToDaily = async () => {
    if (seconds < 60) {
      handleReset();
      return;
    }
    setSaving(true);
    try {
      const hoursToAdd = Math.round((seconds / 3600) * 100) / 100;
      // Get existing log for today
      let existingHours = {};
      try {
        const res = await api.get(`/daily?start=${saveDay}&end=${saveDay}`);
        if (res && res.rows && res.rows.length > 0 && res.rows[0].logged) {
          existingHours = res.rows[0].hours || {};
        }
      } catch (e) {
        // use empty
      }
      
      const newHours = {
        ...existingHours,
        [stream]: Math.round(((existingHours[stream] || 0) + hoursToAdd) * 100) / 100
      };

      await api.put(`/daily/${saveDay}`, { hours: newHours });
      if (onLogSaved) onLogSaved();
      handleReset();
    } catch (err) {
      alert('Could not save session: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`timer-widget ${running ? 'is-running' : ''}`}>
      <div className="timer-pill" onClick={() => setIsOpen(!isOpen)}>
        <span className="timer-indicator" aria-hidden="true" />
        <span className="timer-label">{running ? 'STUDYING' : 'TIMER'}</span>
        <span className="timer-digits">{formatTime(seconds)}</span>
        <span className="timer-stream-badge">{stream.toUpperCase()}</span>
      </div>

      {isOpen && (
        <div className="timer-modal">
          <div className="timer-modal-header">
            <h3>Live Study Stopwatch (V2)</h3>
            <button className="btn-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="timer-modal-time">
            <h1>{formatTime(seconds)}</h1>
            <p className="timer-hours-calc">≈ {(seconds / 3600).toFixed(2)} hours</p>
          </div>
          <div className="timer-controls">
            <button
              className={`btn ${running ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleStartStop}
            >
              {running ? 'Pause Timer' : seconds > 0 ? 'Resume Timer' : 'Start Session'}
            </button>
            <button className="btn ghost" onClick={handleReset} disabled={seconds === 0 && !running}>
              Reset
            </button>
          </div>

          <div className="timer-options">
            <label>
              Study Stream:
              <select value={stream} onChange={(e) => setStream(e.target.value)} disabled={running}>
                <option value="cava">CAVA (Current Affairs)</option>
                <option value="pubad">PubAd Optional</option>
                <option value="mains">Mains Writing / Mocks</option>
                <option value="books">Books & Reading</option>
                <option value="uppsc">UPPSC Prelims</option>
                <option value="apfc">EPFO APFC</option>
                <option value="cat">CAT</option>
                <option value="ssc">SSC</option>
                <option value="other">Other Study</option>
              </select>
            </label>

            <label>
              Date to Log:
              <input
                type="date"
                value={saveDay}
                onChange={(e) => setSaveDay(e.target.value)}
              />
            </label>
          </div>

          {seconds >= 60 && !running && (
            <div className="timer-save-prompt">
              <p>Session ready to log into Daily Study record.</p>
              <button
                className="btn primary full-width"
                onClick={handleSaveToDaily}
                disabled={saving}
              >
                {saving ? 'Saving...' : `Save ${(seconds / 3600).toFixed(2)} h to ${saveDay}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
