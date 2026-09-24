import { useStore } from '../state/store';

export function MatchWaterButton() {
  const { reach, compare, setCompare } = useStore();

  if (!reach?.primary_pair) return null;

  const { t0, t1 } = reach.primary_pair;
  
  const handleMatch = () => {
    setCompare({ active: true, t0, t1 });
  };

  if (compare.active) {
    return (
      <button onClick={() => setCompare({ active: false, t0: null, t1: null })}>
        Exit Compare
      </button>
    );
  }

  return (
    <button 
      onClick={handleMatch}
      style={{
        background: 'var(--water)',
        color: 'var(--bg)',
        border: 'none',
        padding: 'var(--s2) var(--s4)',
        borderRadius: 'var(--r)',
        cursor: 'pointer',
        fontWeight: 500
      }}
    >
      Match the water
    </button>
  );
}
