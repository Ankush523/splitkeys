import type { PackMeta, PuzzleDef, RoomScript, StoryPack } from './pack.ts';

export type Phase = 'lobby' | 'briefing' | 'active' | 'won' | 'lost';

export type SeatRuntime = {
  id: string;
  name: string;
  roleId: string;
  connected: boolean;
  clues: string[];
  /** Ad-hoc hint copy pushed by the GM (not in the script file). */
  hintNotes: { id: string; title: string; body: string; kind: 'hint' }[];
  bag: string[];
  hintsUsed: number;
  hintRequested: string | null;
};

export type RoomRuntime = {
  phase: Phase;
  seats: (SeatRuntime | null)[];
  solved: string[];
  /** Puzzle id -> wrong attempts this session (for GM "stuck" signal). */
  attempts: Record<string, number>;
  chapterIndex: number;
  startedAt: number | null;
  durationMs: number;
  hintsUsed: number;
};

export type LockStatus = 'locked' | 'available' | 'solved';

export type LockView = {
  id: string;
  label: string;
  type: PuzzleDef['type'];
  status: LockStatus;
};

export type PlayerView = {
  epoch: string;
  v: number;
  phase: Phase;
  packTitle: string;
  briefing: string;
  chapterTitle: string;
  roleName: string;
  seat: number;
  clues: { id: string; title: string; body: string; kind: string }[];
  bag: string[];
  locks: LockView[];
  team: { seat: number; name: string; roleName: string }[];
  timerMsLeft: number | null;
  hintsUsed: number;
  escaped: boolean;
};

export type GmSeatTile = {
  seat: number;
  name: string;
  roleName: string;
  connected: boolean;
  hintsUsed: number;
  stuck: boolean;
  hintRequested: string | null;
};

export type GmView = {
  epoch: string;
  v: number;
  phase: Phase;
  packTitle: string;
  chapterTitle: string;
  checklist: { id: string; label: string; solved: boolean }[];
  seats: GmSeatTile[];
  timerMsLeft: number | null;
  hintsUsed: number;
  escaped: boolean;
};

export const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export function newRoom(meta: PackMeta): RoomRuntime {
  const seats: (SeatRuntime | null)[] = Array.from({ length: meta.maxSeats }, () => null);
  return {
    phase: 'lobby',
    seats,
    solved: [],
    attempts: {},
    chapterIndex: 0,
    startedAt: null,
    durationMs: meta.durationMinutes * 60 * 1000,
    hintsUsed: 0,
  };
}

function depsMet(script: RoomScript, solved: string[], puzzle: PuzzleDef): boolean {
  return puzzle.dependsOn.every(d => solved.includes(d));
}

export function puzzleStatus(
  script: RoomScript,
  runtime: RoomRuntime,
  puzzleId: string,
): LockStatus {
  if (runtime.solved.includes(puzzleId)) return 'solved';
  const p = script.puzzles[puzzleId];
  if (!p) return 'locked';
  if (!depsMet(script, runtime.solved, p)) return 'locked';
  return 'available';
}

export function locksForSeat(
  script: RoomScript,
  runtime: RoomRuntime,
  _seat: number,
): LockView[] {
  const chapter = script.chapters[runtime.chapterIndex];
  if (!chapter) return [];
  return chapter.puzzleIds.map(id => {
    const p = script.puzzles[id]!;
    return {
      id: p.id,
      label: p.label,
      type: p.type,
      status: puzzleStatus(script, runtime, id),
    };
  });
}

function roleForSeat(script: RoomScript, seat: number): { roleId: string; roleName: string } {
  const role = script.roles.find(r => r.seat === seat);
  return role
    ? { roleId: role.id, roleName: role.name }
    : { roleId: 'guest', roleName: 'Guest' };
}

function cluesForSeat(script: RoomScript, runtime: RoomRuntime, seat: number) {
  const seatState = runtime.seats[seat];
  if (!seatState) return [];
  const scripted = seatState.clues
    .map(id => script.clues[id])
    .filter(Boolean)
    .map(c => ({ id: c.id, title: c.title, body: c.body, kind: c.kind }));
  return [...scripted, ...seatState.hintNotes];
}

export function timerMsLeft(runtime: RoomRuntime, now = Date.now()): number | null {
  if (runtime.startedAt === null || runtime.phase === 'won' || runtime.phase === 'lost') {
    return runtime.phase === 'active' ? 0 : null;
  }
  return Math.max(0, runtime.durationMs - (now - runtime.startedAt));
}

export function tickTimer(runtime: RoomRuntime, now = Date.now()): RoomRuntime {
  if (runtime.phase !== 'active' || runtime.startedAt === null) return runtime;
  if (timerMsLeft(runtime, now) === 0) {
    return { ...runtime, phase: 'lost' };
  }
  return runtime;
}

/** Push clue ids for puzzles that are available and not yet delivered to that seat. */
export function deliverCluesForSeat(
  script: RoomScript,
  runtime: RoomRuntime,
  seat: number,
): RoomRuntime {
  const seatState = runtime.seats[seat];
  if (!seatState) return runtime;
  const next = { ...runtime, seats: [...runtime.seats] };
  const s = { ...seatState, clues: [...seatState.clues] };
  next.seats[seat] = s;

  const chapter = script.chapters[runtime.chapterIndex];
  if (!chapter) return next;

  for (const pid of chapter.puzzleIds) {
    const p = script.puzzles[pid]!;
    for (const cid of p.clueIds) {
      const clue = script.clues[cid]!;
      if (clue.seat !== null && clue.seat !== seat) continue;
      if (s.clues.includes(cid)) continue;
      s.clues.push(cid);
    }
  }
  return next;
}

export function deliverAllClues(script: RoomScript, runtime: RoomRuntime): RoomRuntime {
  let r = runtime;
  for (let i = 0; i < r.seats.length; i++) {
    if (r.seats[i]) r = deliverCluesForSeat(script, r, i);
  }
  return r;
}

export function allFinaleSolved(script: RoomScript, runtime: RoomRuntime): boolean {
  return script.finale.requires.every(id => runtime.solved.includes(id));
}

export function submitCode(
  pack: StoryPack,
  runtime: RoomRuntime,
  seat: number,
  puzzleId: string,
  code: string,
): { runtime: RoomRuntime; ok: boolean; message: string } {
  const { script } = pack;
  const seatState = runtime.seats[seat];
  if (!seatState) return { runtime, ok: false, message: 'not_seated' };
  if (runtime.phase !== 'active') return { runtime, ok: false, message: 'not_active' };

  const p = script.puzzles[puzzleId];
  if (!p || p.type !== 'code') return { runtime, ok: false, message: 'unknown_lock' };
  const status = puzzleStatus(script, runtime, puzzleId);
  if (status === 'solved') return { runtime, ok: false, message: 'already_solved' };
  if (status === 'locked') return { runtime, ok: false, message: 'locked' };

  const normalized = code.trim();
  if (normalized !== p.solution) {
    const attempts = { ...runtime.attempts, [puzzleId]: (runtime.attempts[puzzleId] ?? 0) + 1 };
    return { runtime: { ...runtime, attempts }, ok: false, message: 'wrong' };
  }

  let next: RoomRuntime = {
    ...runtime,
    solved: [...runtime.solved, puzzleId],
    attempts: runtime.attempts,
  };
  next = tryAdvanceChapter(script, next);
  next = deliverAllClues(script, next);
  if (allFinaleSolved(script, next)) {
    next = { ...next, phase: 'won' };
  }
  return { runtime: next, ok: true, message: 'unlocked' };
}

function chapterComplete(script: RoomScript, runtime: RoomRuntime): boolean {
  const ch = script.chapters[runtime.chapterIndex];
  if (!ch) return false;
  return ch.puzzleIds.every(id => runtime.solved.includes(id));
}

export function tryAdvanceChapter(script: RoomScript, runtime: RoomRuntime): RoomRuntime {
  if (!chapterComplete(script, runtime)) return runtime;
  if (runtime.chapterIndex >= script.chapters.length - 1) return runtime;
  return { ...runtime, chapterIndex: runtime.chapterIndex + 1 };
}

export function playerView(
  pack: StoryPack,
  runtime: RoomRuntime,
  epoch: string,
  v: number,
  seat: number,
  now = Date.now(),
): PlayerView | null {
  const seatState = runtime.seats[seat];
  if (!seatState) return null;
  const { roleName } = roleForSeat(pack.script, seat);
  const chapter = pack.script.chapters[runtime.chapterIndex];
  return {
    epoch,
    v,
    phase: runtime.phase,
    packTitle: pack.meta.title,
    briefing: pack.script.briefing,
    chapterTitle: chapter?.title ?? '',
    roleName,
    seat,
    clues: cluesForSeat(pack.script, runtime, seat),
    bag: [...seatState.bag],
    locks: locksForSeat(pack.script, runtime, seat),
    team: runtime.seats
      .map((s, i) => {
        if (!s) return null;
        const { roleName: rn } = roleForSeat(pack.script, i);
        return { seat: i, name: s.name, roleName: rn };
      })
      .filter(Boolean) as PlayerView['team'],
    timerMsLeft: runtime.phase === 'active' ? timerMsLeft(runtime, now) : null,
    hintsUsed: runtime.hintsUsed,
    escaped: runtime.phase === 'won',
  };
}

export function gmView(
  pack: StoryPack,
  runtime: RoomRuntime,
  epoch: string,
  v: number,
  now = Date.now(),
): GmView {
  const chapter = pack.script.chapters[runtime.chapterIndex];
  const puzzleIds = chapter?.puzzleIds ?? Object.keys(pack.script.puzzles);
  return {
    epoch,
    v,
    phase: runtime.phase,
    packTitle: pack.meta.title,
    chapterTitle: chapter?.title ?? '',
    checklist: puzzleIds.map(id => ({
      id,
      label: pack.script.puzzles[id]!.label,
      solved: runtime.solved.includes(id),
    })),
    seats: runtime.seats
      .map((s, seat) => {
        if (!s) return null;
        const { roleName } = roleForSeat(pack.script, seat);
        const stuck = Object.entries(runtime.attempts).some(([, n]) => n >= 3);
        return {
          seat,
          name: s.name,
          roleName,
          connected: s.connected,
          hintsUsed: s.hintsUsed,
          stuck,
          hintRequested: s.hintRequested,
        };
      })
      .filter(Boolean) as GmSeatTile[],
    timerMsLeft: runtime.phase === 'active' ? timerMsLeft(runtime, now) : null,
    hintsUsed: runtime.hintsUsed,
    escaped: runtime.phase === 'won',
  };
}
