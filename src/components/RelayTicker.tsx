import { useGameStore } from '../game/store/GameStore';

export function RelayTicker({ onOpenLog }: { onOpenLog: () => void }) {
  const { state } = useGameStore();
  const latest = state.messages[0];
  return (
    <button className="ticker" onClick={onOpenLog}>
      <strong>Relay:</strong> {latest?.text ?? 'No traffic'}
    </button>
  );
}
