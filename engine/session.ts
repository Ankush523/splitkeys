import type { StoryPack } from './pack.ts';
import { validatePack } from './pack.ts';
import {
  DEFAULT_DURATION_MS,
  deliverAllClues,
  gmView,
  newRoom,
  playerView,
  submitCode,
  tickTimer,
  type GmView,
  type PlayerView,
  type RoomRuntime,
} from './runtime.ts';

export type RoomInfo = {
  packTitle: string;
  seated: number;
  maxSeats: number;
  phase: RoomRuntime['phase'];
};

export type Msg =
  | ({ t: 'room' } & RoomInfo)
  | { t: 'hello' }
  | { t: 'join'; name: string }
  | { t: 'full' }
  | { t: 'assign'; seat: number; roleId: string; roleName: string }
  | { t: 'state'; view: PlayerView }
  | { t: 'submit_code'; puzzleId: string; code: string }
  | { t: 'hint_request'; puzzleId: string }
  | { t: 'hint'; puzzleId: string; title: string; body: string }
  | { t: 'closed' };

export interface Send {
  send(to: string, msg: Msg): void;
}

export type Me = { id: string; name: string };

export type HostConfig = {
  /** Wall-clock limit; defaults from pack meta. */
  durationMs?: number;
};

const cleanName = (x: unknown, max = 20) =>
  (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, max) : '') || 'Player';

export function parse(content: string): Msg | null {
  try {
    const m = JSON.parse(content) as Msg;
    return m && typeof m === 'object' && typeof m.t === 'string' ? m : null;
  } catch {
    return null;
  }
}

function firstOpenSeat(runtime: RoomRuntime): number {
  return runtime.seats.findIndex(s => s === null);
}

function seatOf(runtime: RoomRuntime, peerId: string): number {
  return runtime.seats.findIndex(s => s?.id === peerId);
}

/** GM device: holds the full story pack and authoritative runtime. */
export class Host {
  readonly pack: StoryPack;
  runtime: RoomRuntime;
  view!: GmView;
  private v = 0;
  private readonly epoch = Math.random().toString(36).slice(2);
  private readonly peers = new Set<string>();
  private timer?: ReturnType<typeof setInterval>;
  private readonly net: Send;
  private readonly me: Me;
  private readonly onChange: (v: GmView) => void;

  constructor(
    net: Send,
    pack: StoryPack,
    me: Me,
    onChange: (v: GmView) => void,
    cfg: HostConfig = {},
    peers: Iterable<string> = [],
  ) {
    this.net = net;
    this.me = me;
    this.onChange = onChange;
    const err = validatePack(pack);
    if (err) throw new Error(err);
    this.pack = pack;
    this.runtime = newRoom(pack.meta);
    if (cfg.durationMs !== undefined) {
      this.runtime = { ...this.runtime, durationMs: cfg.durationMs };
    } else if (!pack.meta.durationMinutes) {
      this.runtime = { ...this.runtime, durationMs: DEFAULT_DURATION_MS };
    }
    this.push();
    for (const p of peers) this.peerUp(p);
  }

  private info(): Msg {
    return {
      t: 'room',
      packTitle: this.pack.meta.title,
      seated: this.runtime.seats.filter(Boolean).length,
      maxSeats: this.pack.meta.maxSeats,
      phase: this.runtime.phase,
    };
  }

  peerUp(id: string) {
    this.peers.add(id);
    const i = seatOf(this.runtime, id);
    if (i < 0) {
      this.net.send(id, this.info());
      return;
    }
    this.runtime.seats[i] = { ...this.runtime.seats[i]!, connected: true };
    this.push();
  }

  peerDown(id: string) {
    this.peers.delete(id);
    const i = seatOf(this.runtime, id);
    if (i < 0) return;
    this.runtime.seats[i] = { ...this.runtime.seats[i]!, connected: false };
    this.push();
  }

  message(from: string, m: Msg) {
    switch (m.t) {
      case 'hello':
        if (seatOf(this.runtime, from) < 0) this.net.send(from, this.info());
        else this.push();
        return;
      case 'join': {
        const existing = seatOf(this.runtime, from);
        if (existing >= 0) {
          this.runtime.seats[existing] = {
            ...this.runtime.seats[existing]!,
            connected: true,
            name: cleanName(m.name),
          };
          return this.push();
        }
        if (this.runtime.phase !== 'lobby') {
          this.net.send(from, { t: 'full' });
          return;
        }
        const seat = firstOpenSeat(this.runtime);
        if (seat < 0 || this.runtime.seats.filter(Boolean).length >= this.pack.meta.maxSeats) {
          this.net.send(from, { t: 'full' });
          return;
        }
        const role = this.pack.script.roles.find(r => r.seat === seat);
        const roleId = role?.id ?? 'guest';
        const roleName = role?.name ?? 'Guest';
        const next = [...this.runtime.seats];
        next[seat] = {
          id: from,
          name: cleanName(m.name),
          roleId,
          connected: true,
          clues: [],
          hintNotes: [],
          bag: [],
          hintsUsed: 0,
          hintRequested: null,
        };
        this.runtime = { ...this.runtime, seats: next };
        this.net.send(from, { t: 'assign', seat, roleId, roleName });
        for (const p of this.peers) {
          if (p !== from && seatOf(this.runtime, p) < 0) this.net.send(p, this.info());
        }
        return this.push();
      }
      case 'submit_code': {
        const seat = seatOf(this.runtime, from);
        if (seat < 0) return;
        const result = submitCode(this.pack, this.runtime, seat, m.puzzleId, m.code);
        this.runtime = result.runtime;
        return this.push();
      }
      case 'hint_request': {
        const seat = seatOf(this.runtime, from);
        if (seat < 0) return;
        const next = [...this.runtime.seats];
        next[seat] = { ...next[seat]!, hintRequested: m.puzzleId };
        this.runtime = { ...this.runtime, seats: next };
        return this.push();
      }
      default:
        return;
    }
  }

  /** Opens the story briefing and delivers starting clues; timer not started yet. */
  start() {
    if (this.runtime.phase !== 'lobby') return;
    const seated = this.runtime.seats.filter(Boolean).length;
    if (seated < this.pack.meta.minSeats) return;
    this.runtime = {
      ...this.runtime,
      phase: 'briefing',
      startedAt: null,
    };
    this.runtime = deliverAllClues(this.pack.script, this.runtime);
    this.push();
  }

  /** GM starts the clock after the table briefing. */
  beginPlay() {
    if (this.runtime.phase !== 'briefing') return;
    this.runtime = {
      ...this.runtime,
      phase: 'active',
      startedAt: Date.now(),
    };
    this.startTimer();
    this.push();
  }

  private startTimer() {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = setInterval(() => {
      const next = tickTimer(this.runtime);
      if (next !== this.runtime) {
        this.runtime = next;
        this.push();
        if (next.phase === 'lost' && this.timer !== undefined) clearInterval(this.timer);
      }
    }, 1000);
  }

  stop() {
    if (this.timer !== undefined) clearInterval(this.timer);
  }

  close() {
    this.stop();
    for (const s of this.runtime.seats) {
      if (s && s.id !== this.me.id) this.net.send(s.id, { t: 'closed' });
    }
  }

  /** GM sends a hint to one seat; clears their hint request flag. */
  sendHint(seatIndex: number, puzzleId: string, title: string, body: string) {
    const s = this.runtime.seats[seatIndex];
    if (!s) return;
    const note = {
      id: `hint-${Date.now()}`,
      title,
      body,
      kind: 'hint' as const,
    };
    const next = [...this.runtime.seats];
    next[seatIndex] = {
      ...s,
      hintNotes: [...s.hintNotes, note],
      hintsUsed: s.hintsUsed + 1,
      hintRequested: s.hintRequested === puzzleId ? null : s.hintRequested,
    };
    this.runtime = {
      ...this.runtime,
      seats: next,
      hintsUsed: this.runtime.hintsUsed + 1,
    };
    this.net.send(s.id, { t: 'hint', puzzleId, title, body });
    this.push();
  }

  private push() {
    this.v++;
    this.view = gmView(this.pack, this.runtime, this.epoch, this.v);
    this.onChange(this.view);
    for (let i = 0; i < this.runtime.seats.length; i++) {
      const s = this.runtime.seats[i];
      if (!s || s.id === this.me.id || !this.peers.has(s.id)) continue;
      const view = playerView(this.pack, this.runtime, this.epoch, this.v, i);
      if (view) this.net.send(s.id, { t: 'state', view });
    }
  }
}

/** Player device: no story pack, only the latest PlayerView. */
export class Seat {
  readonly rooms = new Map<string, RoomInfo>();
  host: string | null = null;
  view: PlayerView | null = null;
  assign: { seat: number; roleId: string; roleName: string } | null = null;
  hostLost = false;
  full = false;
  closed = false;
  private readonly net: Send;
  private readonly me: Me;
  private readonly onChange: () => void;

  constructor(net: Send, me: Me, onChange: () => void, peers: Iterable<string> = []) {
    this.net = net;
    this.me = me;
    this.onChange = onChange;
    for (const p of peers) this.peerUp(p);
  }

  peerUp(id: string) {
    if (id === this.host) {
      this.hostLost = false;
      this.net.send(id, { t: 'join', name: this.me.name });
      this.onChange();
    } else {
      this.net.send(id, { t: 'hello' });
    }
  }

  peerDown(id: string) {
    if (id === this.host) this.hostLost = true;
    else this.rooms.delete(id);
    this.onChange();
  }

  message(from: string, m: Msg) {
    if (m.t === 'room') {
      this.rooms.set(from, {
        packTitle: m.packTitle,
        seated: m.seated,
        maxSeats: m.maxSeats,
        phase: m.phase,
      });
    } else if (m.t === 'assign') {
      this.assign = { seat: m.seat, roleId: m.roleId, roleName: m.roleName };
    } else if ((m.t === 'full' || m.t === 'closed') && from === this.host) {
      this.full = m.t === 'full';
      this.closed = m.t === 'closed';
      this.rooms.delete(from);
      this.host = null;
      this.view = null;
      this.assign = null;
    } else if (m.t === 'state' && from === this.host) {
      const cur = this.view;
      if (cur && cur.epoch === m.view.epoch && cur.v >= m.view.v) return;
      this.view = m.view;
      this.hostLost = false;
    } else if (m.t === 'hint' && from === this.host) {
      const cur = this.view;
      const extra = {
        id: `hint-${m.puzzleId}-${Date.now()}`,
        title: m.title,
        body: m.body,
        kind: 'hint' as const,
      };
      if (cur) {
        this.view = {
          ...cur,
          clues: [...cur.clues, extra],
          hintsUsed: cur.hintsUsed + 1,
        };
      }
    } else {
      return;
    }
    this.onChange();
  }

  join(host: string) {
    this.host = host;
    this.full = this.closed = false;
    this.view = null;
    this.assign = null;
    this.net.send(host, { t: 'join', name: this.me.name });
    this.onChange();
  }

  submitCode(puzzleId: string, code: string) {
    if (this.host) this.net.send(this.host, { t: 'submit_code', puzzleId, code });
  }

  hintRequest(puzzleId: string) {
    if (this.host) this.net.send(this.host, { t: 'hint_request', puzzleId });
  }

  leave() {
    this.host = null;
    this.view = null;
    this.assign = null;
    this.onChange();
  }
}
