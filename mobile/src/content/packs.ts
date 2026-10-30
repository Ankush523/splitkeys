import type { StoryPack } from '../../../engine/pack.ts';
import { validatePack } from '../../../engine/pack.ts';
import lockedMeta from '../../../content/locked-study/meta.json';
import lockedScript from '../../../content/locked-study/script.json';
import testMeta from '../../../content/test-pack/meta.json';
import testScript from '../../../content/test-pack/script.json';

const lockedStudy: StoryPack = {
  meta: lockedMeta as StoryPack['meta'],
  script: lockedScript as StoryPack['script'],
};

const testRoom: StoryPack = {
  meta: testMeta as StoryPack['meta'],
  script: testScript as StoryPack['script'],
};

function assertPack(pack: StoryPack, label: string) {
  const err = validatePack(pack);
  if (err) throw new Error(`${label}: ${err}`);
}

assertPack(lockedStudy, 'locked-study');
assertPack(testRoom, 'test-pack');

/** Playable story packs bundled on the GM device. */
export const STORY_PACKS: StoryPack[] = [lockedStudy, testRoom];

export const DEFAULT_PACK = lockedStudy;

export function packById(id: string): StoryPack | undefined {
  return STORY_PACKS.find(p => p.meta.id === id);
}
