import { useGameStore } from '../game/store/GameStore';

export function RelayTicker({ onOpenLog }: { onOpenLog: () => void }) {
  const { state } = useGameStore();
  const latest = state.messages[0];
  return (
    <button className="ticker" onClick={onOpenLog}>
      <span className="ticker-track">
        <span className="ticker-item"><strong>Relay:</strong> {latest?.text ?? 'No traffic'}</span>
      </span>
    </button>
  );
}
