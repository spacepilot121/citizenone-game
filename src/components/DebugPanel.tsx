import { useGameStore } from '../game/store/GameStore';

export function DebugPanel() {
  const { actions } = useGameStore();
  return (
    <aside className="debug card">
      <h4>Debug</h4>
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
      </div>
    </aside>
  );
}
