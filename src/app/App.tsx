import { useMemo, useState } from 'react';
import { useGameStore } from '../game/store/GameStore';
import { goodMap, goods } from '../game/data/goods';
import { vehicles } from '../game/data/world';
import { RelayTicker } from '../components/RelayTicker';
import { DebugPanel } from '../components/DebugPanel';
import '../styles/app.css';

type Screen = 'dashboard' | 'command' | 'locations' | 'storage' | 'convoys' | 'messages';

export function App() {
  const { state, metrics, now, actions } = useGameStore();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const connectedRoutes = useMemo(() => state.routes.filter((r) => state.locations.find((l) => l.id === r.destinationId)?.unlocked), [state]);

  return (
    <div className="app">
      <header className="topbar card">
        <div>Day {metrics.day}</div>
        <div>{metrics.isNight ? 'Night Phase' : 'Day Phase'}</div>
        <div>${state.resources.money}</div>
        <div>Storage {metrics.storageUsed}/{metrics.storageCap}</div>
        <div>People {state.resources.people}</div>
        <div>Power {metrics.powerUsed}/{metrics.powerCap}</div>
        <div>Gold {state.resources.gold}</div>
      </header>

      {screen === 'dashboard' && (
        <main className="screen card">
          <h2>CitizenOne Operations</h2>
          <p className="muted">Quiet network control. Morning prep, evening movement.</p>
          <div className="grid4">
            {(['command', 'locations', 'storage', 'convoys'] as Screen[]).map((s) => (
              <button key={s} className="big-btn" onClick={() => setScreen(s)}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </main>
      )}

      {screen === 'command' && (
        <main className="screen card">
          <h3>Command / Base Grid</h3>
          <div className="base-grid">
            {state.facilities.map((f) => (
              <button key={f.id} className={`tile ${f.unlocked ? '' : 'locked'}`} onClick={() => setSelectedFacility(f.id)}>
                <strong>{f.name}</strong>
                <span>{f.unlocked ? `L${f.level} · ${f.status}` : 'Locked'}</span>
              </button>
            ))}
            <div className="tile debris">Debris Plot<br />Clearable</div>
            <div className="tile debris">Blocked Plot</div>
            <div className="tile locked">Locked Plot</div>
          </div>
          <button onClick={() => setScreen('dashboard')}>Back</button>
        </main>
      )}

      {screen === 'locations' && (
        <main className="screen card">
          <h3>Locations / Route Web</h3>
          <div className="map">
            {connectedRoutes.map((r) => {
              const a = state.locations.find((l) => l.id === r.originId)!;
              const b = state.locations.find((l) => l.id === r.destinationId)!;
              return <div key={r.id} className="route" style={{ left: `${(a.x + b.x) / 2}%`, top: `${(a.y + b.y) / 2}%` }}>·</div>;
            })}
            {state.locations.map((l) => (
              <button key={l.id} className={`node ${l.unlocked ? '' : 'locked'}`} style={{ left: `${l.x}%`, top: `${l.y}%` }} onClick={() => setSelectedLocation(l.id)}>
                {l.name}
              </button>
            ))}
          </div>
          <button onClick={() => setScreen('dashboard')}>Back</button>
        </main>
      )}

      {screen === 'storage' && (
        <main className="screen card">
          <h3>Storage</h3>
          <div className="list">
            {goods.map((g) => (
              <div key={g.id} className="row">
                <span>{g.name}</span>
                <span>{state.goodsInventory[g.id] ?? 0}</span>
                <span>{g.category}</span>
                <span>size {g.cargoSize}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setScreen('dashboard')}>Back</button>
        </main>
      )}

      {screen === 'convoys' && (
        <main className="screen card">
          <h3>Convoys</h3>
          <p>Slots: {state.convoys.length}/{state.convoySlots} (locked {state.lockedConvoySlots})</p>
          {state.convoys.map((c) => (
            <article key={c.id} className="card convoy">
              <strong>{c.id} · {vehicles.find((v) => v.id === c.vehicleId)?.name}</strong>
              <span>Status: {c.status}</span>
              <span>ETA: {Math.max(0, Math.ceil((c.eta - now) / 60000))}m</span>
              <span>Fuel {c.fuel} · Battery {c.battery} · Armour {c.armour} · Tyres {c.tyres} · Ammo {c.ammo}</span>
              <small>{c.log[0]}</small>
            </article>
          ))}
          <button onClick={() => setScreen('dashboard')}>Back</button>
        </main>
      )}

      {screen === 'messages' && (
        <main className="screen card">
          <h3>Message Log</h3>
          <div className="list">
            {state.messages.map((m) => (
              <div key={m.id} className="row">
                <span>[{m.category}]</span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setScreen('dashboard')}>Back</button>
        </main>
      )}

      {selectedFacility && (() => {
        const f = state.facilities.find((x) => x.id === selectedFacility)!;
        return (
          <div className="modal">
            <div className="card">
              <h4>{f.name}</h4>
              <p>{f.description}</p>
              <p>Status: {f.status}</p>
              {!f.unlocked ? (
                <button onClick={() => actions.unlockFacility(f.id)}>Unlock</button>
              ) : (
                <>
                  <button onClick={() => actions.startUpgrade(f.id)}>Start Upgrade</button>
                  {f.id === 'manufacturing' && (
                    <>
                      <button onClick={() => actions.startProduction('manufacturing', 'plastic_parts')}>Produce Plastic Parts</button>
                      <button onClick={() => actions.startProduction('manufacturing', 'basic_electronics')}>Produce Basic Electronics</button>
                      <button onClick={() => actions.assistProduction('manufacturing')}>Tap Assist (-5m)</button>
                    </>
                  )}
                  {f.id === 'research_facility' && (
                    <>
                      <button onClick={() => actions.startResearch('convoy_slot', 'Convoy Slot Research')}>Research Convoy Slot</button>
                      <button onClick={() => actions.startResearch('facility:defence_facility', 'Defence Integration')}>Research Defence Integration</button>
                    </>
                  )}
                </>
              )}
              <button onClick={() => setSelectedFacility(null)}>Close</button>
            </div>
          </div>
        );
      })()}

      {selectedLocation && (() => {
        const l = state.locations.find((x) => x.id === selectedLocation)!;
        return (
          <div className="modal">
            <div className="card">
              <h4>{l.name}</h4>
              <p>{l.type} · {l.contactName} · {l.personality}</p>
              <p>{l.flavor}</p>
              <p>Reputation: {l.reputation}</p>
              <p>{actions.isLocationOpen(l.openHours) ? 'Open' : 'Closed'}</p>
              <h5>Market</h5>
              {Object.entries(l.market).slice(0, 5).map(([id, price]) => (
                <div key={id} className="row"><span>{goodMap[id]?.name ?? id}</span><span>${price}</span></div>
              ))}
              <h5>Missions</h5>
              {l.missions.map((m) => (
                <div key={m.id} className="row"><span>{goodMap[m.requestedGoodId]?.name} x{m.quantity}</span><span>${m.moneyReward}</span></div>
              ))}
              {state.routes.filter((r) => r.destinationId === l.id).map((r) => (
                <button key={r.id} onClick={() => actions.launchConvoy(r.id, 'plastic_parts', 2)}>Send convoy via {r.id}</button>
              ))}
              <button onClick={() => setSelectedLocation(null)}>Close</button>
            </div>
          </div>
        );
      })()}

      <RelayTicker onOpenLog={() => setScreen('messages')} />
      {state.debug.enabled && <DebugPanel />}
    </div>
  );
}
