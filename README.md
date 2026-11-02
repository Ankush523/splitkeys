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
cd mobile && npm install
cd mobile && npm run ios:pods   # once before first iOS build (installs CocoaPods deps)
```

**Run on devices (required for mesh):** simulators do not discover peers. You can playtest the full story with **two phones** (see below).

```bash
# Terminal 1 — Metro (repo root OR mobile/)
npm run mobile:start
# or: cd mobile && npm start

# Terminal 2 — install to device
cd mobile && npm run ios
```

**iOS signing:** Bundle ID is `com.splitkeys.app`. Open `mobile/ios/SplitKeys.xcworkspace` in Xcode → target **SplitKeys** → **Signing & Capabilities** → select your team.

**Rebrand note:** The app was scaffolded from another RN project; icons and name are now **Split Keys**. Delete any old **Flush** install on your phone before testing (different bundle id).

### Play flow

1. **GM** → Host as GM → pick story poster → **Open briefing** when enough players joined → **Start timer**.
2. **Players** → Join nearby room → pick the GM poster → read briefing → **Desk / Locks** (talk IRL; request hints from GM phone).
3. **Win** when finale puzzles are solved before the clock; debrief shows hints used.

### Two-phone playtest (full room)

With only two devices, one phone is **GM + seated player**, the other **joins as the second player**:

1. Start Metro (`npm run mobile:start`).
2. **Phone A:** Host as GM → **Take a seat on this phone** (lobby).
3. **Phone B:** Join nearby room → pick the GM’s room.
4. **Phone A:** When it shows 2 seated, **Open briefing** → **Start timer**.
5. **Phone A:** Use **GM table** / **My clues** to switch between the control room and your private clues. Compare aloud with Phone B — clues for missing roles are split between the two of you.

Keep Bluetooth on and stay within a few metres. Android may need `adb reverse tcp:8081 tcp:8081` if Metro is on your laptop.

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
