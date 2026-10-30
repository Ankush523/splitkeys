# Split Keys

Offline escape room on phones — each player sees different clues; talk in real life; one GM phone runs the room. Built on [Offline Protocol](https://www.offlineprotocol.com/docs) (`@offline-protocol/mesh-sdk`).

**Pitch:** Escape room night without Wi‑Fi — your phones are the clues.

## Repo layout

| Path | Purpose |
| --- | --- |
| `engine/` | Pure TypeScript: story pack types, room runtime, GM/player session protocol (testable, no React) |
| `content/` | Story packs (`meta.json`, `script.json`, assets) — GM loads locally; never sent whole to players |
| `mobile/` | React Native app — GM control room + player Desk/Bag/Locks/Team, `@offline-protocol/mesh-sdk` 0.31 |
| `design-system/` | UI tokens (player + GM); see `design-system/split-keys/` |

## Mesh app id

Use a fixed developer-chosen id on all devices, e.g. `splitkeys` (not a portal `app_…` id).

## Licensing

Application code in this repo: **MIT-0** (see `LICENSE` when added).

Embedding `@offline-protocol/mesh-sdk` requires **AGPL-3.0-only** or a commercial license from Offline Protocol.

## Develop

```bash
npm install
npm test
cd mobile && npm install   # first time: native deps
npm run mobile:start       # Metro from repo root
```

**Run on devices (required for mesh):** use two or more physical phones. Simulators do not discover peers.

```bash
cd mobile && npm run ios    # or npm run android
```

### Play flow

1. **GM** → Host as GM → pick story poster → **Open briefing** when enough players joined → **Start timer**.
2. **Players** → Join nearby room → pick the GM poster → read briefing → **Desk / Locks** (talk IRL; request hints from GM phone).
3. **Win** when finale puzzles are solved before the clock; debrief shows hints used.

### Mesh

- Fixed `appId`: **`splitkeys`** on every install (see `mobile/src/session/bridge.ts`).
- Vendored nearby-room helper from [offline-app-examples `packages/mesh`](https://github.com/Offline-Protocol/offline-app-examples) — star topology, encrypted JSON `{ t: 'app', d: <engine Msg> }`.
- Android: BLE + Wi‑Fi Direct (auto-accept). iOS: BLE + local network when on shared Wi‑Fi.

### Content

- **`content/locked-study/`** — default room (4 puzzles, 2 chapters); copy is a **playtest skeleton**, not final 45‑min commercial script.
- **`content/test-pack/`** — 2-puzzle smoke room for engine tests.

## References

- [flush](https://github.com/mizanxali/flush) — host-authoritative engine + thin `net.ts`
- [offline-app-examples](https://github.com/Offline-Protocol/offline-app-examples) — `@offline-app-examples/mesh` nearby rooms
