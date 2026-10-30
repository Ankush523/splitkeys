/** Story pack shape loaded on the GM device only. */

export type PackMeta = {
  id: string;
  title: string;
  durationMinutes: number;
  minSeats: number;
  maxSeats: number;
  difficulty: 'normal' | 'hard';
  accent: string;
};

export type RoleDef = { id: string; name: string; seat: number };

export type ClueDef = {
  id: string;
  /** null = delivered as a shared beat when triggered (not used in test pack). */
  seat: number | null;
  title: string;
  body: string;
  kind: 'text' | 'image' | 'audio';
  assetId?: string;
};

export type PuzzleDef = {
  id: string;
  type: 'code' | 'sequence' | 'combine' | 'sync_dual';
  label: string;
  solution: string;
  dependsOn: string[];
  clueIds: string[];
};

export type ChapterDef = {
  id: string;
  title: string;
  puzzleIds: string[];
};

export type RoomScript = {
  briefing: string;
  roles: RoleDef[];
  chapters: ChapterDef[];
  puzzles: Record<string, PuzzleDef>;
  clues: Record<string, ClueDef>;
  finale: { requires: string[] };
};

export type StoryPack = { meta: PackMeta; script: RoomScript };

export function validatePack(pack: StoryPack): string | null {
  const { meta, script } = pack;
  if (!meta.id || !meta.title) return 'meta.id and meta.title required';
  if (meta.minSeats < 1 || meta.maxSeats < meta.minSeats) return 'invalid seat bounds';
  if (!script.chapters.length) return 'script needs at least one chapter';
  for (const ch of script.chapters) {
    for (const pid of ch.puzzleIds) {
      if (!script.puzzles[pid]) return `unknown puzzle ${pid}`;
    }
  }
  for (const p of Object.values(script.puzzles)) {
    for (const d of p.dependsOn) {
      if (!script.puzzles[d]) return `unknown dependency ${d}`;
    }
    for (const cid of p.clueIds) {
      if (!script.clues[cid]) return `unknown clue ${cid}`;
    }
  }
  for (const req of script.finale.requires) {
    if (!script.puzzles[req]) return `finale requires unknown puzzle ${req}`;
  }
  const seats = new Set(script.roles.map(r => r.seat));
  if (seats.size !== script.roles.length) return 'duplicate role seats';
  return null;
}
