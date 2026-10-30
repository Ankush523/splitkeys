import type { StoryPack } from '../../../engine/pack';
import { validatePack } from '../../../engine/pack';
import lockedMeta from '../../../content/locked-study/meta.json';
import lockedScript from '../../../content/locked-study/script.json';
import testMeta from '../../../content/test-pack/meta.json';
import testScript from '../../../content/test-pack/script.json';

export type PackCatalog = {
  packs: StoryPack[];
  error?: string;
};

let catalog: PackCatalog | null = null;

function buildCatalog(): PackCatalog {
  const lockedStudy: StoryPack = {
    meta: lockedMeta as StoryPack['meta'],
    script: lockedScript as StoryPack['script'],
  };
  const testRoom: StoryPack = {
    meta: testMeta as StoryPack['meta'],
    script: testScript as StoryPack['script'],
  };
  const packs: StoryPack[] = [];
  const errors: string[] = [];
  for (const [label, pack] of [
    ['locked-study', lockedStudy],
    ['test-pack', testRoom],
  ] as const) {
    const err = validatePack(pack);
    if (err) errors.push(`${label}: ${err}`);
    else packs.push(pack);
  }
  if (!packs.length) {
    return { packs: [testRoom], error: errors.join('; ') || 'No valid packs' };
  }
  return errors.length ? { packs, error: errors.join('; ') } : { packs };
}

/** Lazy so a bad pack never crashes module load before ErrorBoundary mounts. */
export function getStoryPacks(): PackCatalog {
  if (!catalog) catalog = buildCatalog();
  return catalog;
}

export function getDefaultPack(): StoryPack {
  const { packs } = getStoryPacks();
  if (packs[0]) return packs[0];
  return {
    meta: testMeta as StoryPack['meta'],
    script: testScript as StoryPack['script'],
  };
}

export function packById(id: string): StoryPack | undefined {
  return getStoryPacks().packs.find(p => p.meta.id === id);
}
