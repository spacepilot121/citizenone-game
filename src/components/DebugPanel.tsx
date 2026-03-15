import { useGameStore } from '../game/store/GameStore';

type DebugPanelProps = {
  onClose?: () => void;
};

export function DebugPanel({ onClose }: DebugPanelProps) {
  const { actions } = useGameStore();
  return (
    <aside className="debug card">
      <div className="debug-header">
        <h4>Debug</h4>
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
      <div className="debug-grid">
        <button onClick={() => actions.debugAdvance(2)}>Advance 2 hours</button>
        <button onClick={() => actions.debugAdvance(8)}>Advance 8 hours</button>
        <button onClick={() => actions.debugAdvance(24 - new Date().getHours())}>Jump to next morning</button>
        <button onClick={actions.debugGrantMoney}>Grant money</button>
        <button onClick={actions.debugFillStorage}>Fill storage</button>
        <button onClick={actions.debugCompleteUpgrade}>Complete active upgrade</button>
        <button onClick={actions.debugCompleteResearch}>Complete active research</button>
        <button onClick={actions.debugTriggerEvent}>Trigger convoy event</button>
        <button onClick={actions.debugUnlockNextLocation}>Unlock next location</button>
        <button onClick={actions.debugForceMarketRefresh}>Force market refresh</button>
        <button onClick={actions.debugResetGame}>Reset game</button>
      </div>
    </aside>
  );
}
