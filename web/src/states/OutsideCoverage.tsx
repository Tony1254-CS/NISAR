interface OutsideCoverageProps {
  onFlyBack: () => void;
}

export function OutsideCoverage({ onFlyBack }: OutsideCoverageProps) {
  return (
    <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'var(--panel)', padding: 'var(--s2) var(--s4)' }}>
      No processed radar here. Processed reaches: <button onClick={onFlyBack}>Jamuna Kazipur ↗</button>
    </div>
  );
}
