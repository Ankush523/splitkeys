import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import type { StoryPack } from './pack.ts';
import type { GmView } from './runtime.ts';
import { Host, Seat, parse, type Msg } from './session.ts';

const here = dirname(fileURLToPath(import.meta.url));
const testPack: StoryPack = {
  meta: JSON.parse(readFileSync(join(here, '../content/test-pack/meta.json'), 'utf8')),
  script: JSON.parse(readFileSync(join(here, '../content/test-pack/script.json'), 'utf8')),
};

function network() {
  const queue: (() => void)[] = [];
  const nodes = new Map<string, { message(from: string, m: Msg): void }>();
  const net = (from: string) => ({
    send(to: string, m: Msg) {
      const text = JSON.stringify(m);
      queue.push(() => nodes.get(to)?.message(from, parse(text)!));
    },
  });
  const flush = () => {
    while (queue.length) queue.shift()!();
  };
  return { nodes, net, flush };
}

test('two players join, solve locks in order, and escape', () => {
  const { nodes, net, flush } = network();
  let gm: GmView | null = null;
  const host = new Host(
    net('gm'),
    testPack,
    { id: 'gm', name: 'Host' },
    v => {
      gm = v;
    },
    { durationMs: 600_000 },
  );
  nodes.set('gm', host);

  const seats = ['p0', 'p1'].map(id => {
    const s = new Seat(net(id), { id, name: id.toUpperCase() }, () => {});
    nodes.set(id, s);
    return s;
  });

  for (const id of ['p0', 'p1']) host.peerUp(id);
  seats.forEach(s => s.peerUp('gm'));
  flush();

  assert.equal(seats[0].rooms.get('gm')?.packTitle, 'Test Room');
  seats.forEach(s => s.join('gm'));
  flush();

  assert.equal(seats[0].assign?.roleName, 'Archivist');
  assert.equal(seats[1].assign?.roleName, 'Engineer');

  host.start();
  flush();
  host.beginPlay();
  flush();

  assert.equal(seats[0].view?.phase, 'active');
  assert.ok(seats[0].view!.clues.some(c => c.body.includes('1234')));
  assert.ok(seats[1].view!.clues.some(c => c.body.includes('5678')));
  assert.equal(seats[1].view!.locks.find(l => l.id === 'p_safe')?.status, 'locked');

  seats[0].submitCode('p_door', '0000');
  flush();
  assert.equal(gm!.checklist.find(c => c.id === 'p_door')?.solved, false);

  seats[0].submitCode('p_door', '1234');
  flush();
  assert.equal(gm!.checklist.find(c => c.id === 'p_door')?.solved, true);
  assert.equal(seats[1].view!.locks.find(l => l.id === 'p_safe')?.status, 'available');

  seats[1].submitCode('p_safe', '5678');
  flush();
  assert.equal(gm!.escaped, true);
  assert.equal(seats[0].view?.escaped, true);
  assert.equal(seats[1].view?.escaped, true);

  host.stop();
  host.close();
});

test('parse rejects malformed wire messages', () => {
  assert.equal(parse('not json'), null);
  assert.equal(parse('{}'), null);
  assert.deepEqual(parse('{"t":"hello"}'), { t: 'hello' });
});
