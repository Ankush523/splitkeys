import type { StoryPack } from '../../../engine/pack';
import type { GmView } from '../../../engine/runtime';
import { Host, Seat, type Me, type Msg, type Send } from '../../../engine/session';

export const APP_ID = 'splitkeys';

export function wireMsg(data: unknown): Msg | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Msg;
  return typeof m.t === 'string' ? m : null;
}

export function meshSend(send: (peerId: string, data: unknown) => Promise<void>): Send {
  return {
    send(to, msg) {
      void send(to, msg).catch(err => console.warn('[splitkeys] send failed', msg.t, err));
    },
  };
}

export type GmBridge = {
  host: Host;
  onMessage: (from: string, data: unknown) => void;
  onPeerJoined: (peerId: string) => void;
  onPeerLeft: (peerId: string) => void;
  dispose: () => void;
};

export function createGmBridge(
  send: Send,
  pack: StoryPack,
  me: Me,
  onChange: (view: GmView) => void,
  peerIds: string[] = [],
): GmBridge {
  const host = new Host(send, pack, me, onChange, {}, peerIds);
  return {
    host,
    onMessage(from, data) {
      const msg = wireMsg(data);
      if (msg) host.message(from, msg);
    },
    onPeerJoined(peerId) {
      host.peerUp(peerId);
    },
    onPeerLeft(peerId) {
      host.peerDown(peerId);
    },
    dispose() {
      host.stop();
    },
  };
}

export type PlayerBridge = {
  seat: Seat;
  onMessage: (from: string, data: unknown) => void;
  onPeerJoined: (peerId: string) => void;
  onPeerLeft: (peerId: string) => void;
};

export function createPlayerBridge(
  send: Send,
  me: Me,
  onChange: () => void,
  peerIds: string[] = [],
): PlayerBridge {
  const seat = new Seat(send, me, onChange, peerIds);
  return {
    seat,
    onMessage(from, data) {
      const msg = wireMsg(data);
      if (msg) seat.message(from, msg);
    },
    onPeerJoined(peerId) {
      seat.peerUp(peerId);
    },
    onPeerLeft(peerId) {
      seat.peerDown(peerId);
    },
  };
}
