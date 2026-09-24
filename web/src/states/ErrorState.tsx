interface ErrorStateProps {
  filename: string;
  onRetry: () => void;
}

export function ErrorState({ filename, onRetry }: ErrorStateProps) {
  return (
    <div style={{ padding: 'var(--s4)' }}>
      <p>Couldn't load {filename}.</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}
