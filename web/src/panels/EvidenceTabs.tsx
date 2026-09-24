import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import type { QCCheck } from '../data/types';

type TabId = 'detect' | 'investigate' | 'challenge' | 'explain' | 'field';

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: 'detect', label: 'Detect', hint: 'what the radar measured' },
  { id: 'investigate', label: 'Investigate', hint: 'do other sources agree' },
  { id: 'challenge', label: 'Challenge', hint: 'try to break the finding' },
  { id: 'explain', label: 'Explain', hint: 'the finding, in a sentence' },
  { id: 'field', label: 'Field', hint: 'ground truth, add your own' },
];

function formatDate(d: string) {
  if (d.length !== 8) return d;
  const dt = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00Z`);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// Rough deg->km conversion for a small bbox -- fine for "how big is this
// AOI", not a survey-grade distance.
function bboxExtentKm(bbox: number[]): { widthKm: number; heightKm: number } {
  const [w, s, e, n] = bbox;
  const midLat = (s + n) / 2;
  const kmPerDegLat = 111.0;
  const kmPerDegLon = 111.0 * Math.cos((midLat * Math.PI) / 180);
  return { widthKm: (e - w) * kmPerDegLon, heightKm: (n - s) * kmPerDegLat };
}

function findCheck(checks: QCCheck[] | undefined, id: string): QCCheck | null {
  return checks?.find((c) => c.id === id) ?? null;
}

// A row in an instrument readout -- label, value, terse note. No cards, no
// rounded gradients: this is meant to read like a log line, not a widget.
function Reading({ label, value, note, dim }: { label: string; value: string; note?: string; dim?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--s3)', padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ flex: '0 0 42%', color: 'var(--text-3)', fontSize: '0.82rem' }}>{label}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-num)', color: dim ? 'var(--text-3)' : 'var(--text)', fontSize: '0.95rem' }}>
          {value}
        </div>
        {note && <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>{note}</div>}
      </div>
    </div>
  );
}

const VERDICT_MARK: Record<string, string> = {
  PASS: '+', INFO: '+', WARN: '~', FAIL: 'x', NOT_EVALUATED: '.',
};
const VERDICT_COLOR: Record<string, string> = {
  PASS: 'var(--pass)', INFO: 'var(--pass)', WARN: 'var(--warn)', FAIL: 'var(--fail)', NOT_EVALUATED: 'var(--text-3)',
};
const VERDICT_WORD: Record<string, string> = {
  PASS: 'supports', INFO: 'supports', WARN: 'flagged', FAIL: 'fails', NOT_EVALUATED: 'not run',
};

function CheckRow({ label, check, fallbackDetail }: { label: string; check: QCCheck | null; fallbackDetail?: string }) {
  const status = check?.status ?? 'NOT_EVALUATED';
  const mark = VERDICT_MARK[status] ?? '.';
  const color = VERDICT_COLOR[status] ?? 'var(--text-3)';
  const word = VERDICT_WORD[status] ?? 'not run';
  const detail = check?.explanation ?? fallbackDetail ?? '';
  const value = check?.value != null ? `${check.value} ${check.unit ?? ''}`.trim() : null;
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--s3)' }}>
        <span style={{ fontSize: '0.92rem' }}>
          <span style={{ fontFamily: 'var(--font-num)', color, marginRight: 8 }}>[{mark}]</span>
          {label}
        </span>
        <span style={{ color, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {word}
        </span>
      </div>
      {value && <div style={{ fontFamily: 'var(--font-num)', fontSize: '0.85rem', color: 'var(--text-2)', marginTop: 4, paddingLeft: 26 }}>{value}</div>}
      {check?.rule && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', paddingLeft: 26 }}>{check.rule}</div>}
      {detail && <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: 3, paddingLeft: 26 }}>{detail}</div>}
    </div>
  );
}

function DetectPanel() {
  const { manifest, reach } = useStore();
  const headline = manifest?.metrics.find((m) => m.id === reach?.headline_metric_id);
  const accretion = manifest?.metrics.find((m) => m.id === 'accretion_area');
  const params = headline?.params;
  const thresholdShift =
    params?.threshold_db_t0 != null && params?.threshold_db_t1 != null
      ? Math.abs(params.threshold_db_t1 - params.threshold_db_t0)
      : null;
  const changedHa = (headline?.value ?? 0) + (accretion?.value ?? 0);
  const extent = reach ? bboxExtentKm(reach.bbox) : null;

  return (
    <div>
      <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', maxWidth: 520 }}>
        Dark pixels are weak radar return. Open water reflects the signal away from the sensor instead
        of back to it, so it reads dark. Land, sand, and vegetation scatter more of it back, so they
        read bright.
      </p>
      <Reading label="Threshold shift, t0→t1" value={thresholdShift != null ? `${thresholdShift.toFixed(2)} dB` : '—'} note="each date's water/land split is fit independently; a bigger shift means less stable split" />
      <Reading label="Changed area" value={`${(changedHa / 100).toFixed(1)} km²`} />
      <Reading label="Reach extent" value={extent ? `${extent.widthKm.toFixed(1)} × ${extent.heightKm.toFixed(1)} km` : '—'} />
      <Reading label="Noise floor" value="not evaluated" dim note="spread of change on known-stable land — not computed in this build, shown as missing rather than guessed" />
      <Reading label="Median filter / MMU / HAND cutoff" value={`${params?.median_filter ?? '—'}px / ${params?.mmu_px ?? '—'}px / ${params?.hand_max_m ?? '—'}m`} />
    </div>
  );
}

function InvestigatePanel() {
  const { qc } = useStore();
  return (
    <div>
      <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', maxWidth: 520 }}>
        Each line below checks the radar finding against something that has nothing to do with radar.
        <strong> Not run</strong> is left out of the score — it is not the same as contradicting it.
      </p>
      <CheckRow label="NISAR L-band radar (primary measurement)" check={{ id: 'primary', status: 'PASS' } as QCCheck} />
      <CheckRow label="OPERA DSWx-S1, independent radar product" check={findCheck(qc?.checks, 'dswx_agreement')} />
      <CheckRow label="River stage consistency" check={findCheck(qc?.checks, 'stage_match')} />
      <CheckRow label="Persistence in a later pass" check={findCheck(qc?.checks, 'persistence')} />
      <CheckRow label="Rainfall anomaly, IMERG" check={null} fallbackDetail="not wired up yet — the rain-strip pipeline currently emits a placeholder" />
      <CheckRow label="Vegetation response, optical NDVI" check={null} fallbackDetail="not wired up yet — no optical fetch implemented" />
    </div>
  );
}

function ChallengePanel() {
  const { qc } = useStore();
  return (
    <div>
      <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', maxWidth: 520 }}>
        These checks exist to fail. Each shows the value it was judged on and the rule used — none of
        it is softened for the demo.
      </p>
      <CheckRow label="Signal above noise" check={null} fallbackDetail="no noise-floor estimate exists yet in this build" />
      <CheckRow label="Scene alignment" check={findCheck(qc?.checks, 'alignment')} />
      <CheckRow label="Threshold sensitivity, ±1dB" check={findCheck(qc?.checks, 'threshold_sensitivity')} />
      <CheckRow label="RFI / interference" check={findCheck(qc?.checks, 'rfi')} />
      <CheckRow label="Order-of-magnitude plausibility" check={findCheck(qc?.checks, 'plausibility')} />
      <CheckRow label="Incidence geometry" check={null} fallbackDetail="needs a second track at a different look angle; this reach has one track" />
      <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: 'var(--s3)' }}>
        Plausibility is the one that actually fails. That single failure is the entire reason this
        reach reads INCONCLUSIVE instead of a clean number.
      </p>
    </div>
  );
}

function ExplainPanel() {
  const { reach, manifest } = useStore();
  if (!reach || !manifest) return null;
  const headline = manifest.metrics.find((m) => m.id === reach.headline_metric_id);
  const accretion = manifest.metrics.find((m) => m.id === 'accretion_area');
  const pair = reach.primary_pair;

  const text = [
    `Between ${formatDate(pair.t0)} and ${formatDate(pair.t1)}, NISAR L-band radar over the ${reach.name} showed `,
    `${headline?.value.toLocaleString()} ha where land became water`,
    headline?.low != null && headline?.high != null
      ? ` (${headline.low.toLocaleString()}–${headline.high.toLocaleString()} ha across ±1dB threshold perturbation)`
      : '',
    `, and ${accretion?.value.toLocaleString() ?? '—'} ha where water became land. `,
    `Reads ${reach.verdict}: ${reach.verdict_reasons[0]}`,
  ].join('');

  return (
    <div>
      <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--text)', borderLeft: '2px solid var(--water)', paddingLeft: 'var(--s3)' }}>
        {text}
      </p>
      {reach.verdict_reasons.length > 1 && (
        <ul style={{ fontSize: '0.85rem', color: 'var(--text-2)', paddingLeft: 'var(--s4)' }}>
          {reach.verdict_reasons.slice(1).map((r, i) => (
            <li key={i} style={{ marginBottom: 'var(--s1)' }}>{r}</li>
          ))}
        </ul>
      )}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 'var(--s4)' }}>
        Fixed template, filled from manifest.json and reach.json directly. Nothing here is phrased by
        a language model and no number in it can drift from the bundle.
      </p>
    </div>
  );
}

interface FieldNote {
  text: string;
  photo: string | null;
  timestamp: string;
}

function FieldPanel() {
  const { reach, manifest } = useStore();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const storageKey = reach ? `srt-field-notes-${reach.reach_id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setNotes(raw ? JSON.parse(raw) : []);
    } catch {
      setNotes([]);
    }
  }, [storageKey]);

  const addNote = () => {
    if (!storageKey || !text.trim()) return;
    const next = [...notes, { text: text.trim(), photo, timestamp: new Date().toISOString() }];
    setNotes(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // storage full or unavailable -- note still shows for this session
    }
    setText('');
    setPhoto(null);
  };

  const onFile = (file: File | null) => {
    if (!file) return setPhoto(null);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const headline = manifest?.metrics.find((m) => m.id === reach?.headline_metric_id);
  const dbValue = headline?.params?.threshold_db_t0 ?? -20;

  const playTone = () => {
    if (playing) return;
    setPlaying(true);
    const ctx = audioCtxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const freq = 200 + Math.abs(dbValue) * 15;
    const pulseCount = 5;
    const pulseMs = 90;
    const gapMs = 80;
    let t = ctx.currentTime;
    for (let i = 0; i < pulseCount; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, t);
      osc.start(t);
      osc.stop(t + pulseMs / 1000);
      t += (pulseMs + gapMs) / 1000;
    }
    setTimeout(() => setPlaying(false), (pulseMs + gapMs) * pulseCount);
  };

  return (
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
        Notes live in this browser's local storage, on this device. Nothing here is uploaded or mixed
        with the satellite record.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Standing water on the road, about knee deep"
        rows={3}
        style={{
          width: '100%', boxSizing: 'border-box', background: 'var(--bg)', color: 'var(--text)',
          border: '1px solid var(--line-strong)', borderRadius: 'var(--r)', padding: 'var(--s2)',
          fontFamily: 'var(--font-text)', marginTop: 'var(--s2)', marginBottom: 'var(--s2)',
        }}
      />
      <div style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'center', marginBottom: 'var(--s4)' }}>
        <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} style={{ fontSize: '0.8rem', color: 'var(--text-2)' }} />
        <button
          onClick={addNote}
          disabled={!text.trim()}
          style={{
            background: 'transparent', color: 'var(--water)', border: '1px solid var(--water)', borderRadius: 'var(--r)',
            padding: '6px 14px', cursor: text.trim() ? 'pointer' : 'not-allowed', opacity: text.trim() ? 1 : 0.5, fontWeight: 600,
          }}
        >
          Log observation
        </button>
      </div>

      {notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 'var(--s4)' }}>
          {notes.map((n, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--line)', padding: '8px 0' }}>
              <div style={{ fontSize: '0.88rem' }}>{n.text}</div>
              {n.photo && <img src={n.photo} alt="field evidence" style={{ maxWidth: '100%', marginTop: 'var(--s1)', borderRadius: 'var(--r)' }} />}
              <div style={{ fontFamily: 'var(--font-num)', fontSize: '0.72rem', color: 'var(--text-3)' }}>{new Date(n.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', borderTop: '1px solid var(--line)', paddingTop: 'var(--s3)' }}>
        The t0 threshold, {dbValue.toFixed(1)} dB, mapped to five pulses. Same value, same pattern, every
        time — for anyone who'd rather listen to the measurement than read it.
      </p>
      <button
        onClick={playTone}
        disabled={playing}
        style={{
          background: 'transparent', border: '1px solid var(--water)', color: 'var(--water)',
          borderRadius: 'var(--r)', padding: '6px 16px', cursor: playing ? 'default' : 'pointer',
        }}
      >
        {playing ? 'playing…' : '▶ play'}
      </button>
    </div>
  );
}

const PANELS: Record<TabId, () => JSX.Element | null> = {
  detect: DetectPanel,
  investigate: InvestigatePanel,
  challenge: ChallengePanel,
  explain: ExplainPanel,
  field: FieldPanel,
};

export function EvidenceTabs() {
  const [open, setOpen] = useState<TabId | null>(null);
  const { reach, manifest, qc } = useStore();
  const ready = useMemo(() => Boolean(reach && manifest && qc), [reach, manifest, qc]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!ready) return null;

  const Panel = open ? PANELS[open] : null;
  const activeTab = open ? TABS.find((t) => t.id === open) : null;

  return (
    <div style={{ marginTop: 'var(--s4)' }}>
      <h3 style={{ borderBottom: '1px solid var(--line)', paddingBottom: 'var(--s2)', margin: '0 0 var(--s2)' }}>
        Evidence
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setOpen(t.id)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              background: 'transparent', border: 'none', borderBottom: '1px solid var(--line)',
              color: 'var(--text)', padding: '10px 2px', cursor: 'pointer', textAlign: 'left',
              fontSize: '0.95rem',
            }}
          >
            <span>{t.label}</span>
            <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>{t.hint} →</span>
          </button>
        ))}
      </div>

      {Panel && activeTab && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(6,8,10,0.7)', zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--s5)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(640px, 100%)', maxHeight: '85vh', overflowY: 'auto',
              background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r)',
              padding: 'var(--s5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--s4)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {activeTab.hint}
                </div>
                <h2 style={{ margin: '2px 0 0' }}>{activeTab.label}</h2>
              </div>
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <Panel />
            <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s5)', paddingTop: 'var(--s3)', borderTop: '1px solid var(--line)' }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOpen(t.id)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0',
                    color: t.id === open ? 'var(--water)' : 'var(--text-3)',
                    fontWeight: t.id === open ? 700 : 400, fontSize: '0.8rem',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
