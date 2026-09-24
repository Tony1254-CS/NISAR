interface InconclusiveProps {
  failingChecks?: string[];
  noPairReason?: string;
  hasPair: boolean;
}

export function Inconclusive({ failingChecks, noPairReason, hasPair }: InconclusiveProps) {
  return (
    <div>
      {hasPair ? (
        <h1>Result inconclusive: {failingChecks?.join(', ')}</h1>
      ) : (
        <button disabled={false} style={{ opacity: 0.5 }}>Match the water: {noPairReason}</button>
      )}
    </div>
  );
}
