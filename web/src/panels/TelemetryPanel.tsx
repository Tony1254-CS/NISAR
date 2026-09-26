import { useStore } from '../state/store';

export function TelemetryPanel() {
  const { reach, selectedDate, manifest } = useStore();

  if (!reach) return null;

  const headline = manifest?.metrics.find((m) => m.id === reach.headline_metric_id);
  const params = headline?.params;

  return (
    <div className="telemetry-panel">
      <div className="telemetry-header">
        <span>SAR OBSERVATION</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>L-BAND</span>
      </div>
      <div className="telemetry-data">
        <div className="telemetry-row">
          <span className="telemetry-label">SATELLITE:</span>
          <span className="telemetry-value highlight">NISAR</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">PRODUCT:</span>
          <span className="telemetry-value">L2 GCOV Provisional</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">REACH:</span>
          <span className="telemetry-value">{reach.name.toUpperCase()}</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">TRACK:</span>
          <span className="telemetry-value">
            {reach.track.relative_orbit} / {reach.track.direction} / F{reach.track.frame}
          </span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">POLARIZATION:</span>
          <span className="telemetry-value">HHHH (co-pol)</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">WAVELENGTH:</span>
          <span className="telemetry-value">~24 cm (L-band)</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">ACTIVE DATE:</span>
          <span className="telemetry-value highlight">{selectedDate || '—'}</span>
        </div>
        {params?.threshold_db_t0 != null && (
          <div className="telemetry-row">
            <span className="telemetry-label">THRESHOLD:</span>
            <span className="telemetry-value">
              {params.threshold_db_t0.toFixed(1)} dB (t0)
            </span>
          </div>
        )}
        <div className="telemetry-row" style={{ marginTop: '6px' }}>
          <span className="telemetry-label" style={{ fontSize: '0.62rem', color: 'var(--text-3)' }}>
            Showing pre-computed analysis results from the offline pipeline.
            Backscatter classification via Otsu thresholding on calibrated γ⁰ values.
          </span>
        </div>
      </div>
    </div>
  );
}
