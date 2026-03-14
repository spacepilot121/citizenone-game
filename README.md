# CitizenOne Web Prototype

CitizenOne is a browser-first, mobile portrait strategy/management prototype built with **React + TypeScript + Vite**.

## Features in this prototype

- Mobile-first portrait UI optimized for quick iPhone Safari sessions.
- Real-time ticking simulation while the tab is open.
- Local save with `localStorage` and deterministic catch-up simulation on reload.
- Day/night phase from local time (day = management, evening/night = convoy focus).
- Core resources: money, storage cap, people, electricity cap, gold.
- Base facilities with unlock + upgrades + production + assist taps.
- Goods tree (25 goods) with recipes for higher tiers.
- Locations spider-web map with locked nodes visible.
- Route familiarity/stability progression and risk.
- Convoys with travel, ETA, delivery, return flow, and events.
- Daily market refresh and timed missions.
- Persistent relay ticker + message log categories.
- Development debug panel with all required controls.

## Project structure

```text
src/
  app/
  components/
  game/
    data/
    models/
    store/
    systems/
  styles/
  utils/
```

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL. Use a mobile viewport in devtools or real iPhone Safari.

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages deployment

1. Build static files:
   ```bash
   npm run build
   ```
2. Deploy `dist/` to GitHub Pages (Actions or `gh-pages` branch).
3. `vite.config.ts` uses `base: './'` so static hosting from subpaths works.

## Save + time simulation notes

- Save key: `citizenone.save.v1`.
- State stores `firstSaveAt` and `lastTickAt`.
- On load, the app runs a simulation tick immediately with current local time (plus debug offset).
- While open, simulation ticks every 10 seconds.
- On each tick, systems process completed production, upgrades, research, convoy movement, daily transitions, and market refreshes.

## Debug panel controls

- Advance 2 hours
- Advance 8 hours
- Jump to next morning
- Grant money
- Fill storage
- Complete active upgrade
- Complete active research
- Trigger convoy event
- Unlock next location
- Force market refresh

These are visible only when debug mode is enabled in state.
