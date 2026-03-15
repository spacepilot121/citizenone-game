import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../game/store/GameStore';
import { goodMap, goods } from '../game/data/goods';
import { unlockCosts } from '../game/data/facilities';
import { vehicles } from '../game/data/world';
import { routeRisk } from '../game/systems/simulation';
import { RelayTicker } from '../components/RelayTicker';
import { DebugPanel } from '../components/DebugPanel';
import '../styles/app.css';

type Screen = 'dashboard' | 'command' | 'locations' | 'storage' | 'convoys' | 'messages';

function formatGameClock(now: number): string {
  return new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number): string {
  const safeMs = Math.max(0, ms);
  const totalMinutes = Math.ceil(safeMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function minutesBetween(startAt: number, endAt: number): string {
  return formatDuration(endAt - startAt);
}

function estimateProductionDuration(level: number): string {
  const minutes = Math.min(95, Math.max(30, 90 - level * 8));
  return formatDuration(minutes * 60 * 1000);
}

function formatResourceCost(cost: { money?: number; goods?: Array<{ goodId: string; amount: number }> }): string {
  const parts: string[] = [];
  if (cost.money) parts.push(`$${cost.money}`);
  if (cost.goods?.length) {
    parts.push(
      ...cost.goods.map(({ goodId, amount }) => `${amount}x ${goodMap[goodId]?.name ?? goodId}`)
    );
  }
  return parts.length ? parts.join(' · ') : 'No resources required';
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatOpenHours([start, end]: [number, number]): string {
  return `${formatHour(start)}-${formatHour(end)}`;
}

export function App() {
  const { state, metrics, now, actions } = useGameStore();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [convoyVehicleId, setConvoyVehicleId] = useState(vehicles[0].id);
  const [convoyGoodId, setConvoyGoodId] = useState('plastic_parts');
  const [convoyAmount, setConvoyAmount] = useState(2);
  const [isShaking, setIsShaking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [highlightGoodId, setHighlightGoodId] = useState<string | null>(null);
  const [highlightResource, setHighlightResource] = useState<'money' | 'gold' | null>(null);

  const connectedRoutes = useMemo(() => state.routes.filter((r) => state.locations.find((l) => l.id === r.destinationId)?.unlocked), [state]);

  const selectedConvoyVehicle = vehicles.find((v) => v.id === convoyVehicleId) ?? vehicles[0];
  const stockedGoods = goods.filter((g) => (state.goodsInventory[g.id] ?? 0) > 0);

  function triggerFeedback(message: string, opts?: { goodId?: string; resource?: 'money' | 'gold' }) {
    setFeedback(message);
    setIsShaking(true);
    setHighlightGoodId(opts?.goodId ?? null);
    setHighlightResource(opts?.resource ?? null);
    window.setTimeout(() => {
      setFeedback(null);
      setIsShaking(false);
      setHighlightGoodId(null);
      setHighlightResource(null);
    }, 1300);
  }

  useEffect(() => {
    if (!stockedGoods.length) return;
    if (!stockedGoods.some((g) => g.id === convoyGoodId)) {
      setConvoyGoodId(stockedGoods[0].id);
    }
  }, [convoyGoodId, stockedGoods]);

  return (
    <div className="app">
      <header className="topbar card">
        <div>Day {metrics.day}</div>
        <div>{metrics.isNight ? 'Night Phase' : 'Day Phase'}</div>
        <div>Clock {formatGameClock(now)}</div>
        <div className={highlightResource === 'money' ? 'resource-alert' : ''}>${state.resources.money}</div>
        <div>Storage {metrics.storageUsed}/{metrics.storageCap}</div>
        <div>People {state.resources.people}</div>
        <div>Power {metrics.powerUsed}/{metrics.powerCap}</div>
        <div className={highlightResource === 'gold' ? 'resource-alert' : ''}>Gold {state.resources.gold}</div>
      </header>

      <RelayTicker onOpenLog={() => setScreen('messages')} />

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
            {goods.filter((g) => (state.goodsInventory[g.id] ?? 0) > 0).map((g) => (
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
          <p>Slots in use: {state.convoys.length}/{state.convoySlots}</p>
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
        const productionRemaining = f.production ? formatDuration(f.production.endsAt - now) : null;
        const productionTotal = f.production ? minutesBetween(f.production.startedAt, f.production.endsAt) : null;
        const upgradeRemaining = f.upgradeEndsAt ? formatDuration(f.upgradeEndsAt - now) : null;
        const upgradeTotal = f.upgradeEndsAt ? formatDuration((2 + f.level) * 60 * 60 * 1000) : null;
        const estimatedUpgradeDuration = formatDuration((2 + f.level) * 60 * 60 * 1000);
        const isBusy = Boolean(f.production || f.upgradeEndsAt);
        const canTapAssist = Boolean(f.production || f.upgradeEndsAt);
        const activeTimer = upgradeRemaining ?? productionRemaining;
        const estimatedProductionDuration = estimateProductionDuration(f.level);
        const upgradeCost = 60 + f.level * 40;
        const unlockCost = unlockCosts[f.id];
        const plasticPartsCost = goodMap.plastic_parts.recipe ?? [];
        const basicElectronicsCost = goodMap.basic_electronics.recipe ?? [];

        return (
          <div className="modal">
            <div className="card">
              <h4>{f.name}</h4>
              <p>{f.description}</p>
              <p>Status: {f.status}</p>
              {f.production && (
                <div className="info-block">
                  <strong>Build in progress</strong>
                  <p>{goodMap[f.production.goodId]?.name ?? f.production.goodId} · {f.production.quantity} units</p>
                  <p>Total build time: {productionTotal}</p>
                  <p>Time remaining: {productionRemaining}</p>
                </div>
              )}
              {f.upgradeEndsAt && (
                <div className="info-block">
                  <strong>Upgrade in progress</strong>
                  <p>Total upgrade time: {upgradeTotal}</p>
                  <p>Time remaining: {upgradeRemaining}</p>
                </div>
              )}
              {!f.unlocked ? (
                <button
                  onClick={() => {
                    if (unlockCost?.money && state.resources.money < unlockCost.money) {
                      triggerFeedback('Not enough money to unlock this facility.', { resource: 'money' });
                      return;
                    }
                    actions.unlockFacility(f.id);
                  }}
                >
                  Unlock ({formatResourceCost({ money: unlockCost?.money, goods: [] })})
                </button>
              ) : (
                <>
                  <button
                    className={`action-btn ${isBusy ? 'action-btn--busy' : 'action-btn--ready'}`}
                    onClick={() => {
                      if (isBusy) {
                        triggerFeedback('Facility is busy right now.');
                        return;
                      }
                      if (state.resources.money < upgradeCost) {
                        triggerFeedback('Not enough money for upgrade.', { resource: 'money' });
                        return;
                      }
                      actions.startUpgrade(f.id);
                    }}
                    disabled={isBusy}
                  >
                    {isBusy ? `Upgrade Busy (${activeTimer})` : `Start Upgrade (${formatResourceCost({ money: upgradeCost })} · ${estimatedUpgradeDuration})`}
                  </button>
                  {f.id === 'manufacturing' && (
                    <>
                      <button
                        className={`action-btn ${isBusy ? 'action-btn--busy' : 'action-btn--ready'}`}
                        onClick={() => {
                          if (isBusy) {
                            triggerFeedback('Manufacturing is busy right now.');
                            return;
                          }
                          const missing = plasticPartsCost.find((c) => (state.goodsInventory[c.goodId] ?? 0) < c.amount);
                          if (missing) {
                            triggerFeedback(`Missing ${goodMap[missing.goodId]?.name}.`, { goodId: missing.goodId });
                            return;
                          }
                          actions.startProduction('manufacturing', 'plastic_parts');
                        }}
                        disabled={isBusy}
                      >
                        {isBusy ? `Manufacturing Busy (${activeTimer})` : `Produce Plastic Parts (${formatResourceCost({ goods: plasticPartsCost })} · ${estimatedProductionDuration})`}
                      </button>
                      <button
                        className={`action-btn ${isBusy ? 'action-btn--busy' : 'action-btn--ready'}`}
                        onClick={() => {
                          if (isBusy) {
                            triggerFeedback('Manufacturing is busy right now.');
                            return;
                          }
                          const missing = basicElectronicsCost.find((c) => (state.goodsInventory[c.goodId] ?? 0) < c.amount);
                          if (missing) {
                            triggerFeedback(`Missing ${goodMap[missing.goodId]?.name}.`, { goodId: missing.goodId });
                            return;
                          }
                          actions.startProduction('manufacturing', 'basic_electronics');
                        }}
                        disabled={isBusy}
                      >
                        {isBusy ? `Manufacturing Busy (${activeTimer})` : `Produce Basic Electronics (${formatResourceCost({ goods: basicElectronicsCost })} · ${estimatedProductionDuration})`}
                      </button>
                      <button className={`assist-btn ${!canTapAssist ? 'assist-btn--disabled' : ''}`} onClick={() => actions.assistProduction('manufacturing')} disabled={!canTapAssist}>Tap Assist (-5m)</button>
                    </>
                  )}
                  {f.id !== 'manufacturing' && (
                    <button className={`assist-btn ${!canTapAssist ? 'assist-btn--disabled' : ''}`} onClick={() => actions.assistProduction(f.id)} disabled={!canTapAssist}>Tap Assist (-5m)</button>
                  )}
                  {f.id === 'research_facility' && (
                    <>
                      <button onClick={() => {
                        if (state.resources.gold < 1) {
                          triggerFeedback('Need 1 gold to start research.', { resource: 'gold' });
                          return;
                        }
                        actions.startResearch('convoy_slot', 'Convoy Slot Research');
                      }}>Research Convoy Slot</button>
                      <button onClick={() => {
                        if (state.resources.gold < 1) {
                          triggerFeedback('Need 1 gold to start research.', { resource: 'gold' });
                          return;
                        }
                        actions.startResearch('facility:defence_facility', 'Defence Integration');
                      }}>Research Defence Integration</button>
                    </>
                  )}
                </>
              )}
              {feedback && <p className="feedback-warning">{feedback}</p>}
              <button onClick={() => setSelectedFacility(null)}>Close</button>
            </div>
          </div>
        );
      })()}

      {selectedLocation && (() => {
        const l = state.locations.find((x) => x.id === selectedLocation)!;
        const routesToLocation = state.routes.filter((r) => r.destinationId === l.id);
        const locationOpenNow = actions.isLocationOpen(l.openHours);
        const locationHours = formatOpenHours(l.openHours);
        return (
          <div className="modal">
            <div className="card">
              <h4>{l.name}</h4>
              <p>{l.type} · {l.contactName} · {l.personality}</p>
              <p>{l.flavor}</p>
              <p>Reputation: {l.reputation}</p>
              <p>{locationOpenNow ? `Open now · Hours ${locationHours}` : `Closed right now (time-locked) · Hours ${locationHours}`}</p>
              <h5>Market</h5>
              {Object.entries(l.market).slice(0, 5).map(([id, price]) => (
                <div key={id} className="row"><span>{goodMap[id]?.name ?? id}</span><span>${price}</span></div>
              ))}
              <h5>Missions</h5>
              {l.missions.map((m) => (
                <div key={m.id} className="row">
                  <span>{goodMap[m.requestedGoodId]?.name} x{m.quantity}</span>
                  <span>${m.moneyReward}</span>
                </div>
              ))}

              <h5>Dispatch convoy</h5>
              <label className="input-stack">
                <span>Convoy vehicle</span>
                <select value={convoyVehicleId} onChange={(e) => setConvoyVehicleId(e.target.value)}>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} (cargo {v.cargoCapacity})</option>
                  ))}
                </select>
              </label>
              <label className={`input-stack ${highlightGoodId ? 'resource-alert' : ''}`}>
                <span>Cargo</span>
                <select value={convoyGoodId} onChange={(e) => setConvoyGoodId(e.target.value)}>
                  {stockedGoods.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} · in storage {state.goodsInventory[g.id] ?? 0}</option>
                  ))}
                </select>
              </label>
              <label className="input-stack">
                <span>Amount</span>
                <input
                  type="number"
                  min={1}
                  value={convoyAmount}
                  onChange={(e) => setConvoyAmount(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>

              {routesToLocation.length === 0 ? <p className="muted">No route to this location yet.</p> : routesToLocation.map((r) => {
                const travelMs = r.distance * 7 * 60 * 1000;
                const risk = routeRisk(r);
                return (
                  <div key={r.id} className="info-block">
                    <strong>Route {r.id} preview</strong>
                    <p>Destination: {l.name}</p>
                    <p>Travel time (one-way): {formatDuration(travelMs)}</p>
                    <p>Risk factor: {(risk * 100).toFixed(1)}%</p>
                    <p>Vehicle: {selectedConvoyVehicle.name} · Cargo cap {selectedConvoyVehicle.cargoCapacity}</p>
                    <button
                      className={isShaking ? 'shake-on-fail' : ''}
                      onClick={() => {
                        if (state.convoys.length >= state.convoySlots) {
                          triggerFeedback('No convoy slots available.');
                          return;
                        }
                        if (!actions.isLocationOpen(l.openHours)) {
                          triggerFeedback(`Location is closed right now (open ${locationHours}).`);
                          return;
                        }
                        if (!stockedGoods.length) {
                          triggerFeedback('No stock available for dispatch.');
                          return;
                        }
                        const inStock = state.goodsInventory[convoyGoodId] ?? 0;
                        if (inStock < convoyAmount) {
                          triggerFeedback(`Need ${convoyAmount}, only ${inStock} in stock.`, { goodId: convoyGoodId });
                          return;
                        }
                        actions.launchConvoy(r.id, convoyGoodId, convoyAmount, convoyVehicleId);
                      }}
                    >
                      Send {selectedConvoyVehicle.name}
                    </button>
                  </div>
                );
              })}
              {!locationOpenNow && <p className="muted">Dispatch is time-locked until this location opens ({locationHours}).</p>}
              {feedback && <p className="feedback-warning">{feedback}</p>}
              {highlightGoodId && <p className="feedback-highlight">Missing: {goodMap[highlightGoodId]?.name ?? highlightGoodId}</p>}
              <button onClick={() => setSelectedLocation(null)}>Close</button>
            </div>
          </div>
        );
      })()}
      {state.debug.enabled && <DebugPanel />}
    </div>
  );
}
